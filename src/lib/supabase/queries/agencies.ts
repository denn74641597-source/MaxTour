import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseClient } from '../client';
import type { AgencyRow } from '../../../types';

export async function getVerifiedAgencies(
  limit = 6,
  client?: SupabaseClient
): Promise<AgencyRow[]> {
  const supabase = resolveSupabaseClient(client);

  const rpc = await supabase
    .rpc('get_verified_agencies_ranked', { p_limit: limit })
    .select(
      'id, name, slug, logo_url, city, country, is_verified, is_approved, avg_rating, review_count'
    );

  if (!rpc.error) return (rpc.data ?? []) as AgencyRow[];

  const fallback = await supabase
    .from('agencies')
    .select(
      'id, name, slug, logo_url, city, country, is_verified, is_approved, avg_rating, review_count'
    )
    .eq('is_verified', true)
    .eq('is_approved', true)
    .order('avg_rating', { ascending: false, nullsFirst: false })
    .order('review_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  return (fallback.data ?? []) as AgencyRow[];
}

export async function getTopRatedAgencies(
  limit = 6,
  client?: SupabaseClient
): Promise<AgencyRow[]> {
  const supabase = resolveSupabaseClient(client);

  const { data, error } = await supabase
    .from('agencies')
    .select(
      'id, name, slug, logo_url, city, country, is_verified, is_approved, avg_rating, review_count'
    )
    .eq('is_approved', true)
    .gt('review_count', 0)
    .order('avg_rating', { ascending: false, nullsFirst: false })
    .order('review_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as AgencyRow[];
}

export async function getAgencyBySlug(
  slug: string,
  client?: SupabaseClient
): Promise<AgencyRow | null> {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('slug', slug)
    .eq('is_approved', true)
    .maybeSingle();

  if (error) return null;
  return (data ?? null) as AgencyRow | null;
}

export async function getAgencyByOwnerId(
  ownerId: string,
  client?: SupabaseClient
): Promise<AgencyRow | null> {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error) return null;
  return (data ?? null) as AgencyRow | null;
}

export async function getAgencyFollowersCount(
  agencyId: string,
  client?: SupabaseClient
): Promise<number> {
  const supabase = resolveSupabaseClient(client);
  const { count, error } = await supabase
    .from('agency_follows')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', agencyId);

  if (error) return 0;
  return count ?? 0;
}

export async function checkIsFollowing(
  userId: string,
  agencyId: string,
  client?: SupabaseClient
): Promise<boolean> {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('agency_follows')
    .select('id')
    .eq('user_id', userId)
    .eq('agency_id', agencyId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

export async function getAgencyTours(
  agencyId: string,
  client?: SupabaseClient
) {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('tours')
    .select('*, images:tour_images(*)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getAgencyLeadsCount(
  agencyId: string,
  client?: SupabaseClient
): Promise<number> {
  const supabase = resolveSupabaseClient(client);
  const { count, error } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', agencyId);

  if (error) return 0;
  return count ?? 0;
}

export async function getAgencyTotalViews(
  agencyId: string,
  client?: SupabaseClient
): Promise<number> {
  const supabase = resolveSupabaseClient(client);

  const rpc = await supabase.rpc('get_agency_total_views', {
    agency_id_input: agencyId,
  });

  if (!rpc.error && rpc.data != null) {
    const parsed = Number(rpc.data);
    if (Number.isFinite(parsed)) return parsed;
  }

  const { data, error } = await supabase
    .from('tours')
    .select('view_count')
    .eq('agency_id', agencyId);

  if (error) return 0;
  return (data ?? []).reduce(
    (sum, row) => sum + Number(row.view_count || 0),
    0
  );
}

export async function getAgencyReviews(
  agencyId: string,
  client?: SupabaseClient
) {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profile:profiles(full_name, avatar_url)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return [];
  return data ?? [];
}
