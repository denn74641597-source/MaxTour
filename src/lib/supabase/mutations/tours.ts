import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseClient } from '../client';

const lastViewCountAt = new Map<string, number>();
const VIEW_COUNT_THROTTLE_MS = 45_000;

function createSessionId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `web-${Date.now().toString(36)}-${rand}`;
}

function createNonce(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createSignature(): string {
  return `${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)}`;
}

export async function registerFeaturedImpressionByTour(
  tourId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = resolveSupabaseClient(client);
  await supabase.rpc('register_featured_impression_by_tour_v1', {
    p_tour_id: tourId,
    p_session_id: createSessionId(),
    p_nonce: createNonce(),
    p_signature: createSignature(),
  });
}

export async function registerFeaturedClickByTour(
  tourId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = resolveSupabaseClient(client);
  await supabase.rpc('register_featured_click_by_tour_v1', {
    p_tour_id: tourId,
    p_session_id: createSessionId(),
    p_nonce: createNonce(),
    p_signature: createSignature(),
  });
}

export async function incrementTourViewCount(
  tourId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = resolveSupabaseClient(client);
  const now = Date.now();
  const last = lastViewCountAt.get(tourId) ?? 0;
  if (now - last < VIEW_COUNT_THROTTLE_MS) return;
  lastViewCountAt.set(tourId, now);

  const { error } = await supabase.rpc('increment_view_count', {
    tour_id_input: tourId,
  });

  if (!error) return;

  const { data } = await supabase
    .from('tours')
    .select('view_count')
    .eq('id', tourId)
    .single();

  if (!data) return;
  await supabase
    .from('tours')
    .update({ view_count: Number(data.view_count || 0) + 1 })
    .eq('id', tourId);
}

export async function trackCallClick(
  tourId: string,
  agencyId: string,
  type: 'call' | 'telegram',
  userId?: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = resolveSupabaseClient(client);
  await supabase.from('call_tracking').insert({
    tour_id: tourId,
    agency_id: agencyId,
    type,
    user_id: userId || null,
  });
}

export async function createTour(
  payload: Record<string, unknown>,
  client?: SupabaseClient
) {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('tours')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTour(
  tourId: string,
  payload: Record<string, unknown>,
  client?: SupabaseClient
) {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('tours')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', tourId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function translateTour(
  tourId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = resolveSupabaseClient(client);
  const { error } = await supabase.functions.invoke('translate-tour', {
    body: { tour_id: tourId },
  });

  if (error) {
    console.warn('translate-tour invocation failed:', error);
  }
}

export async function deleteTour(
  tourId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = resolveSupabaseClient(client);
  const { error } = await supabase.from('tours').delete().eq('id', tourId);
  if (error) throw error;
}
