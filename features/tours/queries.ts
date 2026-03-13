import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cache } from 'react';
import type { Tour, TourFilters } from '@/types';

/** Fetch published tours with optional filters */
export async function getTours(filters?: TourFilters): Promise<Tour[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('tours')
    .select('*, agency:agencies(id, name, slug, logo_url, is_verified)')
    .eq('status', 'published');

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%,country.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
    );
  }
  if (filters?.country) query = query.eq('country', filters.country);
  if (filters?.city) query = query.eq('city', filters.city);
  if (filters?.minPrice) query = query.gte('price', filters.minPrice);
  if (filters?.maxPrice) query = query.lte('price', filters.maxPrice);
  if (filters?.transport) query = query.eq('transport_type', filters.transport);
  if (filters?.meal) query = query.eq('meal_type', filters.meal);
  if (filters?.visaFree) query = query.eq('visa_required', false);

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
      '*, agency:agencies(id, name, slug, logo_url, is_verified, phone, telegram_username), images:tour_images(id, image_url, sort_order)'
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
    .select('*, agency:agencies(id, name, slug, logo_url, is_verified)')
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
    .select('*, agency:agencies(id, name, slug, logo_url, is_verified)')
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
