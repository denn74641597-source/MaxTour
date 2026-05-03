import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseClient } from '../client';
import type { PromotionTierRow } from '../../../types';

interface PromotionTierDedupRow {
  placement: string;
  days: number;
}

interface PromotionActivityRow {
  status?: string | null;
  is_active?: boolean | null;
  ends_at?: string | null;
}

export async function getMaxCoinBalance(
  agencyId: string,
  client?: SupabaseClient
): Promise<number> {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('agencies')
    .select('maxcoin_balance')
    .eq('id', agencyId)
    .single();

  if (error || !data) return 0;
  return Number(data.maxcoin_balance ?? 0);
}

export async function getMaxCoinTransactions(
  agencyId: string,
  client?: SupabaseClient
) {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('maxcoin_transactions')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return [];
  return data ?? [];
}

export async function getPromotionTiers(
  client?: SupabaseClient
): Promise<PromotionTierRow[]> {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('promotion_tiers')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return [];
  const seen = new Set<string>();

  return (data ?? []).filter((item) => {
    const tier = item as PromotionTierDedupRow;
    const key = `${tier.placement}_${tier.days}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }) as PromotionTierRow[];
}

export async function getActivePromotions(
  agencyId: string,
  client?: SupabaseClient
) {
  const supabase = resolveSupabaseClient(client);
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('tour_promotions')
    .select('*, tour:tours(id, title, slug, cover_image_url)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return [];
  return (data ?? []).filter((item) => {
    const promotion = item as PromotionActivityRow;
    if (promotion.status === 'waitlist') return true;
    if (promotion.status && promotion.status !== 'active') return false;
    return promotion.is_active === true && typeof promotion.ends_at === 'string' && promotion.ends_at >= nowIso;
  });
}
