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

  // Category filter — keyword-based search across title & descriptions
  if (filters?.category) {
    const CATEGORY_KEYWORDS: Record<string, string[]> = {
      Beach: ['plyaj', 'плаж', 'пляж', 'dengiz', 'море', 'beach', 'ocean', 'okean', 'океан', 'maldiv', 'мальдив', 'bali', 'бали', 'antalya', 'анталья', 'resort', 'курорт', 'qirg\'oq', 'берег', 'orol', 'остров'],
      Umrah: ['umra', 'умра', 'hajj', 'хадж', 'makka', 'мекка', 'madina', 'медина', 'saudiya', 'саудов', 'ziyorat', 'паломничество', 'haj'],
      Family: ['oilaviy', 'семейн', 'family', 'bolalar', 'дети', 'детск', 'oila', 'семья', 'kids', 'children'],
      Honeymoon: ['asal oyi', 'медовый', 'honeymoon', 'romantik', 'романтик', 'romantic', 'yangi turmush', 'свадеб', 'молодожён'],
      Budget: ['arzon', 'бюджет', 'budget', 'cheap', 'tejamkor', 'эконом', 'aksiya', 'акция', 'chegirma', 'скидк', 'дёшев', 'дешёв'],
      Premium: ['premium', 'премиум', 'luxury', 'люкс', 'hashamatli', 'роскош', 'vip', 'deluxe', 'делюкс', 'business', 'бизнес'],
      Adventure: ['sarguzasht', 'приключен', 'adventure', 'extreme', 'ekstrim', 'экстрим', 'trekking', 'треккинг', 'safari', 'сафари', 'hiking', 'поход'],
      Cultural: ['madaniy', 'культур', 'cultural', 'tarixiy', 'историч', 'muzey', 'музей', 'heritage', 'history', 'история'],
    };

    if (filters.category === 'Visa-free') {
      query = query.eq('visa_required', false);
    } else {
      const keywords = CATEGORY_KEYWORDS[filters.category];
      if (keywords?.length) {
        const conditions = keywords
          .flatMap((kw) => [
            `title.ilike.%${kw}%`,
            `short_description.ilike.%${kw}%`,
            `full_description.ilike.%${kw}%`,
          ])
          .join(',');
        query = query.or(conditions);
      }
    }
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
