import { createServerSupabaseClient, createPublicSupabaseClient } from '@/lib/supabase/server';
import { notifySystemError } from '@/lib/telegram/admin-bot';
import { withTTLCache } from '@/lib/cache';
import { cache } from 'react';
import type { Tour, TourFilters } from '@/types';

/* ─── Reusable narrow-select constants for list / card queries ─── */

/** Fields consumed by the compact TourCard component (search results, similar tours) */
const TOUR_CARD_SELECT = 'id, slug, title, cover_image_url, price, old_price, currency, tour_type, region, city, country, district, destinations, is_featured' as const;

/** Fields consumed by TourCardCatalog — adds agency join, duration, hotel stars, etc. */
const TOUR_CATALOG_SELECT = 'id, slug, title, cover_image_url, price, old_price, currency, tour_type, region, city, country, district, destinations, is_featured, agency_id, category, duration_days, duration_nights, hotels, hotel_stars, departure_date, view_count, agency:agencies(id, name, slug, logo_url, is_verified, is_approved)' as const;

/** Fields for agency-page tour cards — no agency join needed since agency is already known */
const TOUR_AGENCY_LIST_SELECT = 'id, slug, title, cover_image_url, price, old_price, currency, tour_type, region, city, country, district, destinations, is_featured, duration_days, duration_nights, hotels, hotel_stars' as const;

/** Narrow select for homepage tour cards — only the fields card components actually read */
const HOMEPAGE_TOUR_SELECT = 'id, slug, title, cover_image_url, price, old_price, currency, tour_type, region, city, country, district, destinations, is_featured, agency_id, category, view_count, agency:agencies(id, name, slug, logo_url, is_verified, is_approved)' as const;

/** Fetch published tours with optional filters */
export async function getTours(filters?: TourFilters): Promise<Tour[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('tours')
    .select(TOUR_CATALOG_SELECT)
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
    await notifySystemError({ source: 'Query: getTours', message: error.message });
    return [];
  }
  return (data ?? []) as unknown as Tour[];
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
    .maybeSingle();

  if (error) {
    console.error('getTourBySlug error:', error);
    await notifySystemError({ source: 'Query: getTourBySlug', message: error.message, extra: `Slug: ${slug}` });
    return null;
  }
  return data;
});

/** Fetch featured tours */
export async function getFeaturedTours(): Promise<Tour[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tours')
    .select(TOUR_CATALOG_SELECT)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) {
    console.error('getFeaturedTours error:', error);
    await notifySystemError({ source: 'Query: getFeaturedTours', message: error.message });
    return [];
  }
  return (data ?? []) as unknown as Tour[];
}

/** Fetch tours by agency */
export async function getToursByAgency(agencyId: string): Promise<Tour[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tours')
    .select(TOUR_AGENCY_LIST_SELECT)
    .eq('agency_id', agencyId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getToursByAgency error:', error);
    await notifySystemError({ source: 'Query: getToursByAgency', message: error.message, extra: `Agency: ${agencyId}` });
    return [];
  }
  return (data ?? []) as unknown as Tour[];
}

/** Fetch similar tours (same country, different tour) */
export async function getSimilarTours(tour: Tour, limit = 4): Promise<Tour[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tours')
    .select(TOUR_CARD_SELECT)
    .eq('status', 'published')
    .eq('country', tour.country)
    .neq('id', tour.id)
    .limit(limit);

  if (error) {
    console.error('getSimilarTours error:', error);
    await notifySystemError({ source: 'Query: getSimilarTours', message: error.message });
    return [];
  }
  return (data ?? []) as unknown as Tour[];
}

/** Fetch most popular tours by view_count (for "Mashhur joylar") */
export async function getPopularTours(limit = 10): Promise<Tour[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tours')
    .select(TOUR_CATALOG_SELECT)
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) {
    // Fallback: view_count column may not exist yet, use featured + newest
    const { data: fallback } = await supabase
      .from('tours')
      .select(TOUR_CATALOG_SELECT)
      .eq('status', 'published')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    return (fallback ?? []) as unknown as Tour[];
  }
  return (data ?? []) as unknown as Tour[];
}

/** Fetch tours by category */
export async function getToursByCategory(category: string, limit = 20): Promise<Tour[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tours')
    .select(TOUR_CATALOG_SELECT)
    .eq('status', 'published')
    .eq('category', category)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getToursByCategory error:', error);
    await notifySystemError({ source: 'Query: getToursByCategory', message: error.message, extra: `Category: ${category}` });
    return [];
  }
  return (data ?? []) as unknown as Tour[];
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
    .select(TOUR_CATALOG_SELECT)
    .eq('status', 'published')
    .in('id', tourIds);

  if (error) {
    console.error('getPromotedTours error:', error);
    await notifySystemError({ source: 'Query: getPromotedTours', message: error.message, extra: `Placement: ${placement}` });
    return [];
  }
  return (data ?? []) as unknown as Tour[];
}

/* ─── Homepage-specific narrow queries ─── */

/** Homepage featured tours — narrow select, cached 60s. Falls back to published tours. */
export async function getHomeFeaturedTours(): Promise<Tour[]> {
  return withTTLCache('home:featured-tours', async () => {
    const supabase = createPublicSupabaseClient();

    // Try featured tours first
    const { data, error } = await supabase
      .from('tours')
      .select(HOMEPAGE_TOUR_SELECT)
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      console.error('getHomeFeaturedTours error:', error);
      await notifySystemError({ source: 'Query: getHomeFeaturedTours', message: error.message });
    }

    if (data && data.length > 0) {
      return data as unknown as Tour[];
    }

    // Fallback: show newest published tours
    const { data: fallback } = await supabase
      .from('tours')
      .select(HOMEPAGE_TOUR_SELECT)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(8);

    return (fallback ?? []) as unknown as Tour[];
  }, 60);
}

/** Homepage popular tours — narrow select, cached 60s */
export async function getHomePopularTours(limit = 10): Promise<Tour[]> {
  return withTTLCache(`home:popular-tours:${limit}`, async () => {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from('tours')
      .select(HOMEPAGE_TOUR_SELECT)
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      const { data: fallback } = await supabase
        .from('tours')
        .select(HOMEPAGE_TOUR_SELECT)
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      return (fallback ?? []) as unknown as Tour[];
    }
    return (data ?? []) as unknown as Tour[];
  }, 60);
}

/** Homepage promoted tours — narrow select, cached 60s. Falls back to published tours. */
export async function getHomePromotedTours(placement: string, limit = 20): Promise<Tour[]> {
  return withTTLCache(`home:promoted-tours:${placement}:${limit}`, async () => {
    const supabase = createPublicSupabaseClient();
    const now = new Date().toISOString();

    const { data: promos } = await supabase
      .from('tour_promotions')
      .select('tour_id')
      .eq('placement', placement)
      .eq('is_active', true)
      .gte('ends_at', now)
      .order('created_at', { ascending: false })
      .limit(limit) as { data: { tour_id: string }[] | null };

    if (promos && promos.length > 0) {
      const tourIds = promos.map(p => p.tour_id);

      const { data, error } = await supabase
        .from('tours')
        .select(HOMEPAGE_TOUR_SELECT)
        .eq('status', 'published')
        .in('id', tourIds);

      if (!error && data && data.length > 0) {
        return data as unknown as Tour[];
      }

      if (error) {
        console.error('getHomePromotedTours error:', error);
        await notifySystemError({ source: 'Query: getHomePromotedTours', message: error.message, extra: `Placement: ${placement}` });
      }
    }

    // Fallback: show recent published tours
    const { data: fallback } = await supabase
      .from('tours')
      .select(HOMEPAGE_TOUR_SELECT)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 12));

    return (fallback ?? []) as unknown as Tour[];
  }, 60);
}
