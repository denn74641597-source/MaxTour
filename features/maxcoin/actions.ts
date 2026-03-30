'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { notifyCoinRequest } from '@/lib/telegram/admin-bot';
import type { PromotionPlacement } from '@/types';

const COIN_PRICE_UZS = 15000; // UZS per coin

/** Submit a coin purchase request (pending admin approval) */
export async function purchaseMaxCoins(agencyId: string, coins: number) {
  if (coins < 5 || coins > 200) return { error: 'Invalid coin amount' };

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: agency } = await supabase
    .from('agencies')
    .select('id, name, owner_id, phone, telegram_username')
    .eq('id', agencyId)
    .eq('owner_id', user.id)
    .single();
  if (!agency) return { error: 'Agency not found' };

  const priceUzs = coins * COIN_PRICE_UZS;

  const admin = await createAdminClient();
  const { data: inserted, error } = await admin.from('coin_requests').insert({
    agency_id: agencyId,
    coins,
    price_uzs: priceUzs,
    status: 'pending',
  }).select('id').single();
  if (error) return { error: error.message };

  // Notify admin via Telegram bot
  try {
    await notifyCoinRequest(
      inserted.id,
      (agency as { id: string; name: string }).name || 'Noma\'lum',
      coins,
      priceUzs,
      (agency as Record<string, string | null>).phone,
      (agency as Record<string, string | null>).telegram_username
    );
  } catch (err) {
    console.error('Bot notify error:', err);
  }

  return { success: true, pending: true };
}

/** Get coin price in UZS */
export async function getCoinPriceUzs() {
  return COIN_PRICE_UZS;
}

/** Promote a tour using a fixed pricing tier */
export async function promoteTour(agencyId: string, tourId: string, tierId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: agency } = await supabase
    .from('agencies')
    .select('id, owner_id')
    .eq('id', agencyId)
    .eq('owner_id', user.id)
    .single();
  if (!agency) return { error: 'Agency not found' };

  const { data: tour } = await supabase
    .from('tours')
    .select('id')
    .eq('id', tourId)
    .eq('agency_id', agencyId)
    .single();
  if (!tour) return { error: 'Tour not found' };

  const admin = await createAdminClient();

  const { data: tier } = await admin
    .from('promotion_tiers')
    .select('*')
    .eq('id', tierId)
    .single();
  if (!tier) return { error: 'Tier not found' };

  const balance = await getBalance(admin, agencyId);
  if (balance < tier.coins) {
    return { error: 'Insufficient MaxCoin balance', required: tier.coins, current: balance };
  }

  // Check for existing active promotion
  const { data: existing } = await admin
    .from('tour_promotions')
    .select('id')
    .eq('tour_id', tourId)
    .eq('placement', tier.placement)
    .eq('is_active', true)
    .gte('ends_at', new Date().toISOString())
    .single();
  if (existing) return { error: 'Tour already has active promotion for this placement' };

  const now = new Date();
  const endsAt = new Date(now.getTime() + tier.days * 24 * 60 * 60 * 1000);

  const { error: balanceError } = await admin
    .from('agencies')
    .update({ maxcoin_balance: balance - tier.coins })
    .eq('id', agencyId);
  if (balanceError) return { error: balanceError.message };

  const { error: promoError } = await admin.from('tour_promotions').insert({
    tour_id: tourId,
    agency_id: agencyId,
    placement: tier.placement,
    cost_coins: tier.coins,
    starts_at: now.toISOString(),
    ends_at: endsAt.toISOString(),
  });
  if (promoError) return { error: promoError.message };

  const typeMap: Record<PromotionPlacement, string> = {
    featured: 'spend_featured',
    hot_deals: 'spend_hot_deals',
    hot_tours: 'spend_hot_tours',
  };
  await admin.from('maxcoin_transactions').insert({
    agency_id: agencyId,
    amount: -tier.coins,
    type: typeMap[tier.placement as PromotionPlacement],
    description: `${tier.placement} uchun ${tier.days} kunlik reklama`,
    tour_id: tourId,
  });

  return { success: true, newBalance: balance - tier.coins };
}

async function getBalance(client: Awaited<ReturnType<typeof createAdminClient>>, agencyId: string): Promise<number> {
  const { data } = await client
    .from('agencies')
    .select('maxcoin_balance')
    .eq('id', agencyId)
    .single();
  return (data as { maxcoin_balance: number } | null)?.maxcoin_balance ?? 0;
}
