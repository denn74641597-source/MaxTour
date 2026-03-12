import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Agency, Review } from '@/types';

/** Fetch a single agency by slug */
export async function getAgencyBySlug(slug: string): Promise<Agency | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('slug', slug)
    .eq('is_approved', true)
    .single();

  if (error) {
    console.error('getAgencyBySlug error:', error);
    return null;
  }
  return data;
}

/** Fetch verified/approved agencies */
export async function getVerifiedAgencies(limit = 10): Promise<Agency[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('is_approved', true)
    .eq('is_verified', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getVerifiedAgencies error:', error);
    return [];
  }
  return data ?? [];
}

/** Fetch reviews for an agency */
export async function getAgencyReviews(agencyId: string): Promise<Review[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profile:profiles(full_name, avatar_url)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('getAgencyReviews error:', error);
    return [];
  }
  return data ?? [];
}
