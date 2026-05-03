import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseClient } from '../client';

export async function getLeadsByAgency(
  agencyId: string,
  client?: SupabaseClient
) {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('leads')
    .select('*, tour:tours(id, title, slug, cover_image_url, country, city)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data ?? [];
}
