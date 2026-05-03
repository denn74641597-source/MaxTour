import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseClient } from '../client';

const SUBSCRIPTIONS_ENABLED = false;

export async function getMyVerificationRequests(
  agencyId: string,
  client?: SupabaseClient
) {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getSubscriptionPlans(client?: SupabaseClient) {
  if (!SUBSCRIPTIONS_ENABLED) return [];
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price_monthly', { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function getCurrentSubscription(
  agencyId: string,
  client?: SupabaseClient
) {
  if (!SUBSCRIPTIONS_ENABLED) return null;
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('agency_subscriptions')
    .select('*, plan:subscription_plans(*)')
    .eq('agency_id', agencyId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
}
