import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cache } from 'react';
import type { Tour, TourFilters } from '@/types';

/** Fetch published tours with optional filters */
export async function getTours(filters?: TourFilters): Promise<Tour[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('tours')
    .select('*, agency:agencies(id, name, slug, logo_url, is_verified, is_approved)')
    .eq('status', 'published');

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%,country.ilike.%${filters.search}%,city.ilike.%${filters.search}%,region.ilike.%${filters.search}%`
    );
  }
  if (filters?.country) query = query.eq('country', filters.country);
  if (filters?.city) query = query.eq('city', filters.city);
  if (filters?.minPrice) query = query.gte('price', filters.minPrice);
  if (filters?.maxPrice) query = query.lte('price', filters.maxPrice);
  if (filters?.transport) query = query.eq('transport_type', filters.transport);
  if (filters?.meal) query = query.eq('meal_type', filters.meal);
  if (filters?.visaFree) query = query.eq('visa_required', false);
  if (filters?.departureFrom) query = query.gte('departure_date', filters.departureFrom);
  if (filters?.departureTo) query = query.lte('departure_date', filters.departureTo);

  // Category filter — use category column first, fallback to keyword search
  if (filters?.category) {
    // Try direct category column match first
    query = query.eq('category', filters.category);
  }

  // Sorting
  switch (filters?.sortBy) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'date_asc':
      query = query.order('departure_date', { ascending: true });
      break;
    case 'date_desc':
      query = query.order('departure_date', { ascending: false });
      break;
    case 'popular':
      query = query.order('is_featured', { ascending: false }).order('seats_total', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query.limit(filters?.limit ?? 50);
  if (error) {
    console.error('getTours error:', error);
    return [];
  }
  return data ?? [];
}

/** Fetch a single tour by slug (deduplicated per request) */
export const getTourBySlug = cache(async (slug: string): Promise<Tour | null> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tours')
    .select(
      '*, agency:agencies(id, name, slug, logo_url, is_verified, is_approved, phone, telegram_username), images:tour_images(id, image_url, sort_order)'
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    console.error('getTourBySlug error:', error);
    return null;
  }
  return data;
});

/** Fetch featured tours */
export async function getFeaturedTours(): Promise<Tour[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tours')
    .select('*, agency:agencies(id, name, slug, logo_url, is_verified, is_approved)')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) {
    console.error('getFeaturedTours error:', error);
    return [];
  }
  return data ?? [];
}

/** Fetch tours by agency */
export async function getToursByAgency(agencyId: string): Promise<Tour[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .eq('agency_id', agencyId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getToursByAgency error:', error);
    return [];
  }
  return data ?? [];
}

/** Fetch similar tours (same country, different tour) */
export async function getSimilarTours(tour: Tour, limit = 4): Promise<Tour[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tours')
    .select('*, agency:agencies(id, name, slug, logo_url, is_verified, is_approved)')
    .eq('status', 'published')
    .eq('country', tour.country)
    .neq('id', tour.id)
    .limit(limit);

  if (error) {
    console.error('getSimilarTours error:', error);
    return [];
  }
  return data ?? [];
}

/** Fetch most popular tours by view_count (for "Mashhur joylar") */
export async function getPopularTours(limit = 10): Promise<Tour[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tours')
    .select('*, agency:agencies(id, name, slug, logo_url, is_verified, is_approved)')
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) {
    // Fallback: view_count column may not exist yet, use featured + newest
    const { data: fallback } = await supabase
      .from('tours')
      .select('*, agency:agencies(id, name, slug, logo_url, is_verified, is_approved)')
      .eq('status', 'published')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    return fallback ?? [];
  }
  return data ?? [];
}

/** Fetch tours by category */
export async function getToursByCategory(category: string, limit = 20): Promise<Tour[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tours')
    .select('*, agency:agencies(id, name, slug, logo_url, is_verified, is_approved)')
    .eq('status', 'published')
    .eq('category', category)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getToursByCategory error:', error);
    return [];
  }
  return data ?? [];
}

/** Increment tour view count */
export async function incrementTourViewCount(tourId: string): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    // Try RPC function first (faster, atomic)
    const { error: rpcError } = await supabase.rpc('increment_view_count', { tour_id_input: tourId });
    if (rpcError) {
      // Fallback: direct update if RPC doesn't exist
      const { data } = await supabase
        .from('tours')
        .select('view_count')
        .eq('id', tourId)
        .single();
      if (data) {
        await supabase
          .from('tours')
          .update({ view_count: (data.view_count ?? 0) + 1 })
          .eq('id', tourId);
      }
    }
  } catch {
    // Silently fail — view_count column may not exist yet
  }
}

/** Fetch IDs of tours with an active 'featured' promotion (for star badge display) */
export async function getActivePromotedTourIds(): Promise<string[]> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('tour_promotions')
    .select('tour_id')
    .eq('placement', 'featured')
    .eq('is_active', true)
    .gte('ends_at', now);
  return (data ?? []).map(p => p.tour_id);
}

/** Fetch all active promotion tour IDs grouped by placement */
export async function getActivePromotionsByType(): Promise<{ featured: string[]; hotDeals: string[]; hotTours: string[] }> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('tour_promotions')
    .select('tour_id, placement')
    .eq('is_active', true)
    .gte('ends_at', now);
  const result = { featured: [] as string[], hotDeals: [] as string[], hotTours: [] as string[] };
  for (const p of data ?? []) {
    if (p.placement === 'featured') result.featured.push(p.tour_id);
    else if (p.placement === 'hot_deals') result.hotDeals.push(p.tour_id);
    else if (p.placement === 'hot_tours') result.hotTours.push(p.tour_id);
  }
  return result;
}

/** Fetch promoted tours for a given placement (featured / hot_deals / hot_tours) */
export async function getPromotedTours(placement: string, limit = 50): Promise<Tour[]> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  // Get active promotion tour IDs
  const { data: promos } = await supabase
    .from('tour_promotions')
    .select('tour_id')
    .eq('placement', placement)
    .eq('is_active', true)
    .gte('ends_at', now)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!promos || promos.length === 0) return [];

  const tourIds = promos.map(p => p.tour_id);

  const { data, error } = await supabase
    .from('tours')
    .select('*, agency:agencies(id, name, slug, logo_url, is_verified, is_approved)')
    .eq('status', 'published')
    .in('id', tourIds);

  if (error) {
    console.error('getPromotedTours error:', error);
    return [];
  }
  return data ?? [];
}
