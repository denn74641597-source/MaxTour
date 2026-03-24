'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import type { PromotionPlacement } from '@/types';

/** Purchase MaxCoins (simulate — in production this would be after payment confirmation) */
export async function purchaseMaxCoins(agencyId: string, packageId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Verify ownership
  const { data: agency } = await supabase
    .from('agencies')
    .select('id, owner_id')
    .eq('id', agencyId)
    .eq('owner_id', user.id)
    .single();
  if (!agency) return { error: 'Agency not found' };

  // Get package
  const admin = await createAdminClient();
  const { data: pkg } = await admin
    .from('maxcoin_packages')
    .select('*')
    .eq('id', packageId)
    .single();
  if (!pkg) return { error: 'Package not found' };

  const totalCoins = pkg.coins + pkg.bonus_coins;

  // Credit coins
  const { error: balanceError } = await admin
    .from('agencies')
    .update({ maxcoin_balance: (await getBalance(admin, agencyId)) + totalCoins })
    .eq('id', agencyId);
  if (balanceError) return { error: balanceError.message };

  // Record transaction
  await admin.from('maxcoin_transactions').insert({
    agency_id: agencyId,
    amount: totalCoins,
    type: 'purchase',
    description: `${pkg.coins} MC + ${pkg.bonus_coins} bonus sotib olindi`,
  });

  return { success: true, newBalance: (await getBalance(admin, agencyId)) };
}

/** Promote a tour to a placement (featured / hot_deals / hot_tours) */
export async function promoteTour(agencyId: string, tourId: string, placement: PromotionPlacement, days: number) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Verify ownership
  const { data: agency } = await supabase
    .from('agencies')
    .select('id, owner_id')
    .eq('id', agencyId)
    .eq('owner_id', user.id)
    .single();
  if (!agency) return { error: 'Agency not found' };

  // Verify tour belongs to agency
  const { data: tour } = await supabase
    .from('tours')
    .select('id')
    .eq('id', tourId)
    .eq('agency_id', agencyId)
    .single();
  if (!tour) return { error: 'Tour not found' };

  const admin = await createAdminClient();

  // Get pricing
  const { data: pricing } = await admin
    .from('promotion_pricing')
    .select('*')
    .eq('placement', placement)
    .single();
  if (!pricing) return { error: 'Pricing not found' };

  if (days < pricing.min_days || days > pricing.max_days) {
    return { error: `Days must be between ${pricing.min_days} and ${pricing.max_days}` };
  }

  const totalCost = pricing.cost_per_day * days;
  const balance = await getBalance(admin, agencyId);

  if (balance < totalCost) {
    return { error: 'Insufficient MaxCoin balance', required: totalCost, current: balance };
  }

  // Check for existing active promotion
  const { data: existing } = await admin
    .from('tour_promotions')
    .select('id')
    .eq('tour_id', tourId)
    .eq('placement', placement)
    .eq('is_active', true)
    .gte('ends_at', new Date().toISOString())
    .single();

  if (existing) return { error: 'Tour already has active promotion for this placement' };

  const now = new Date();
  const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  // Debit coins
  const { error: balanceError } = await admin
    .from('agencies')
    .update({ maxcoin_balance: balance - totalCost })
    .eq('id', agencyId);
  if (balanceError) return { error: balanceError.message };

  // Create promotion
  const { error: promoError } = await admin.from('tour_promotions').insert({
    tour_id: tourId,
    agency_id: agencyId,
    placement,
    cost_coins: totalCost,
    starts_at: now.toISOString(),
    ends_at: endsAt.toISOString(),
  });
  if (promoError) return { error: promoError.message };

  // Record transaction
  const typeMap: Record<PromotionPlacement, string> = {
    featured: 'spend_featured',
    hot_deals: 'spend_hot_deals',
    hot_tours: 'spend_hot_tours',
  };
  await admin.from('maxcoin_transactions').insert({
    agency_id: agencyId,
    amount: -totalCost,
    type: typeMap[placement],
    description: `${placement} uchun ${days} kunlik reklama`,
    tour_id: tourId,
  });

  return { success: true, newBalance: balance - totalCost };
}

async function getBalance(client: Awaited<ReturnType<typeof createAdminClient>>, agencyId: string): Promise<number> {
  const { data } = await client
    .from('agencies')
    .select('maxcoin_balance')
    .eq('id', agencyId)
    .single();
  return (data as { maxcoin_balance: number } | null)?.maxcoin_balance ?? 0;
}
