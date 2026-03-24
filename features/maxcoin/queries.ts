'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import type { PromotionPlacement } from '@/types';

export async function getMaxCoinBalance(agencyId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('agencies')
    .select('maxcoin_balance')
    .eq('id', agencyId)
    .single();
  return (data as { maxcoin_balance: number } | null)?.maxcoin_balance ?? 0;
}

export async function getMaxCoinTransactions(agencyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('maxcoin_transactions')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function getPromotionTiers() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('promotion_tiers')
    .select('*')
    .order('sort_order', { ascending: true });
  return data ?? [];
}

export async function getActivePromotions(agencyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('tour_promotions')
    .select('*, tour:tours(id, title, slug, cover_image_url)')
    .eq('agency_id', agencyId)
    .eq('is_active', true)
    .gte('ends_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getMyPromotionHistory(agencyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('tour_promotions')
    .select('*, tour:tours(id, title, slug, cover_image_url)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(50);
  return data ?? [];
}
