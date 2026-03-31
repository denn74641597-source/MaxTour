import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notifySystemError } from '@/lib/telegram/admin-bot';
import type { Agency, Review } from '@/types';

/** Narrow select for homepage agency cards — only the fields card components actually read */
const HOMEPAGE_AGENCY_SELECT = 'id, name, slug, logo_url, is_verified, is_approved, avg_rating, review_count' as const;

/**
 * Get the current user's agency (cached per request via React.cache).
 * Deduplicates auth + agency lookup across server components in the same render.
 */
export const getMyAgency = cache(async (): Promise<Agency | null> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('agencies')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  return data;
});

/** Check if agency profile is complete enough to create tours */
export function isAgencyProfileComplete(agency: Agency): boolean {
  return !!(
    agency.name &&
    agency.description &&
    agency.phone &&
    agency.logo_url &&
    agency.address &&
    agency.city &&
    agency.inn &&
    agency.responsible_person
  );
}

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
    await notifySystemError({ source: 'Query: getAgencyBySlug', message: error.message, extra: `Slug: ${slug}` });
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
    await notifySystemError({ source: 'Query: getVerifiedAgencies', message: error.message });
    return [];
  }
  return data ?? [];
}

/** Fetch followers count for an agency */
export async function getAgencyFollowersCount(agencyId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { count, error } = await supabase
    .from('agency_follows')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId);

  if (error) {
    console.error('getAgencyFollowersCount error:', error);
    await notifySystemError({ source: 'Query: getAgencyFollowersCount', message: error.message, extra: `Agency: ${agencyId}` });
    return 0;
  }
  return count ?? 0;
}

/** Fetch top-rated agencies (by avg_rating or review count) */
export async function getTopRatedAgencies(limit = 10): Promise<Agency[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('is_approved', true)
    .order('avg_rating', { ascending: false })
    .order('review_count', { ascending: false })
    .gt('review_count', 0)
    .limit(limit);

  if (error) {
    console.error('getTopRatedAgencies error:', error);
    await notifySystemError({ source: 'Query: getTopRatedAgencies', message: error.message });
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
    await notifySystemError({ source: 'Query: getAgencyReviews', message: error.message, extra: `Agency: ${agencyId}` });
    return [];
  }
  return data ?? [];
}

export interface TourLimitInfo {
  planName: string;
  maxTours: number;
  currentTours: number;
  canCreate: boolean;
}

/** Get tour limit info for the current user's agency */
export async function getAgencyTourLimit(agencyId: string): Promise<TourLimitInfo> {
  const supabase = await createServerSupabaseClient();

  // Get active subscription with plan
  const { data: sub } = await supabase
    .from('agency_subscriptions')
    .select('*, plan:subscription_plans(name, max_active_tours)')
    .eq('agency_id', agencyId)
    .eq('status', 'active')
    .limit(1)
    .single();

  const planName = (sub?.plan as any)?.name ?? 'Start';
  const maxTours = (sub?.plan as any)?.max_active_tours ?? 5;

  // Count current month's tours (not archived)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count } = await supabase
    .from('tours')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .gte('created_at', monthStart)
    .neq('status', 'archived');

  const currentTours = count ?? 0;

  return {
    planName,
    maxTours,
    currentTours,
    canCreate: currentTours < maxTours,
  };
}

/* ─── Homepage-specific narrow queries ─── */

/** Homepage verified agencies — narrow select */
export async function getHomeVerifiedAgencies(limit = 6): Promise<Agency[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('agencies')
    .select(HOMEPAGE_AGENCY_SELECT)
    .eq('is_approved', true)
    .eq('is_verified', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getHomeVerifiedAgencies error:', error);
    await notifySystemError({ source: 'Query: getHomeVerifiedAgencies', message: error.message });
    return [];
  }
  return (data ?? []) as unknown as Agency[];
}

/** Homepage top-rated agencies — narrow select */
export async function getHomeTopRatedAgencies(limit = 6): Promise<Agency[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('agencies')
    .select(HOMEPAGE_AGENCY_SELECT)
    .eq('is_approved', true)
    .order('avg_rating', { ascending: false })
    .order('review_count', { ascending: false })
    .gt('review_count', 0)
    .limit(limit);

  if (error) {
    console.error('getHomeTopRatedAgencies error:', error);
    await notifySystemError({ source: 'Query: getHomeTopRatedAgencies', message: error.message });
    return [];
  }
  return (data ?? []) as unknown as Agency[];
}
