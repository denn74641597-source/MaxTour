import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseClient } from '../client';
import type { SearchToursPublicParams } from '../../../types';

const TOUR_CARD_SELECT =
  'id, slug, title, title_uz, title_ru, cover_image_url, price, old_price, currency, tour_type, region, city, country, district, destinations, is_featured' as const;

const TOUR_CATALOG_SELECT =
  'id, slug, title, title_uz, title_ru, cover_image_url, price, old_price, currency, tour_type, region, city, country, district, destinations, agency_id, duration_days, duration_nights, created_at, agency:agencies!agency_id(name, slug, logo_url, is_verified)' as const;

const HOMEPAGE_TOUR_SELECT =
  'id, slug, title, title_uz, title_ru, cover_image_url, price, old_price, currency, tour_type, region, city, country, district, destinations, is_featured, agency_id, category, view_count, agency:agencies(id, name, slug, logo_url, is_verified, is_approved)' as const;

let sessionIdCache: string | null = null;

interface PromotionIdRow {
  tour_id?: string | null;
}

export interface TourFilters {
  search?: string;
  country?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  departureFrom?: string;
  departureTo?: string;
  transport?: string;
  meal?: string;
  visaFree?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'newest' | 'popular';
  limit?: number;
}

export interface ToursPageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextCursorCreatedAt: string | null;
  nextCursorId: string | null;
}

function getRuntimeSessionId(): string {
  if (!sessionIdCache) {
    const rand = Math.random().toString(36).slice(2, 10);
    sessionIdCache = `web-${Date.now().toString(36)}-${rand}`;
  }
  return sessionIdCache;
}

function createPromoNonce(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createPromoSignature(): string {
  return `${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)}`;
}

function applyBoundedLimit(limit: number | undefined, max: number): number {
  const safe = Number.isFinite(limit) ? Number(limit) : max;
  if (safe < 1) return 1;
  if (safe > max) return max;
  return Math.floor(safe);
}

function normalizeSearchTerm(value: string): string {
  return value
    .trim()
    .replace(/[,%()"]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

function toIlikePattern(value: string): string {
  const normalized = normalizeSearchTerm(value);
  if (!normalized) return '';
  const escaped = normalized.replace(/[\\%_]/g, '\\$&');
  return `%${escaped}%`;
}

function hasSearchPathFilters(filters?: TourFilters): boolean {
  return Boolean(
    filters?.search?.trim() || filters?.city?.trim() || filters?.country?.trim()
  );
}

function normalizeSortBy(
  sortBy: TourFilters['sortBy']
): SearchToursPublicParams['p_sort_by'] {
  switch (sortBy) {
    case 'price_asc':
    case 'price_desc':
    case 'date_asc':
    case 'date_desc':
    case 'popular':
      return sortBy;
    default:
      return 'newest';
  }
}

function castRows<T>(rows: unknown): T[] {
  if (!Array.isArray(rows)) return [];
  return rows as T[];
}

export async function getFeaturedTours<T = Record<string, unknown>>(
  limit = 10,
  client?: SupabaseClient
): Promise<T[]> {
  const supabase = resolveSupabaseClient(client);
  const safeLimit = applyBoundedLimit(limit, 10);
  const now = new Date().toISOString();

  const fair = await supabase
    .rpc('get_featured_premium_tours_v1', {
      p_limit: safeLimit,
      p_session_id: getRuntimeSessionId(),
    })
    .select(HOMEPAGE_TOUR_SELECT);

  if (!fair.error && fair.data) {
    return castRows<T>(fair.data);
  }

  const { data: promos } = await supabase
    .from('tour_promotions')
    .select('tour_id, cost_coins, created_at')
    .eq('placement', 'featured')
    .eq('is_active', true)
    .eq('status', 'active')
    .gte('ends_at', now)
    .order('cost_coins', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  const tourIds = (promos ?? [])
    .map((row) => (row as PromotionIdRow).tour_id)
    .filter((tourId): tourId is string => Boolean(tourId));
  if (tourIds.length === 0) return [];

  const { data } = await supabase
    .from('tours')
    .select(HOMEPAGE_TOUR_SELECT)
    .eq('status', 'published')
    .in('id', tourIds);

  return castRows<T>(data);
}

export async function getHotTours<T = Record<string, unknown>>(
  limit = 20,
  client?: SupabaseClient
): Promise<T[]> {
  const supabase = resolveSupabaseClient(client);
  const safeLimit = applyBoundedLimit(limit, 20);

  const fair = await supabase
    .rpc('get_fair_promoted_tours_v1', {
      p_placement: 'hot_tours',
      p_limit: safeLimit,
      p_session_id: getRuntimeSessionId(),
    })
    .select(HOMEPAGE_TOUR_SELECT);

  if (!fair.error && fair.data) return castRows<T>(fair.data);

  const ranked = await supabase
    .rpc('get_hot_tours_ranked', { p_limit: safeLimit })
    .select(HOMEPAGE_TOUR_SELECT);

  if (ranked.error) return [];
  return castRows<T>(ranked.data);
}

export async function getRecommendedTours<T = Record<string, unknown>>(
  limit = 12,
  client?: SupabaseClient
): Promise<T[]> {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .rpc('get_recommended_tours', { p_limit: limit })
    .select(HOMEPAGE_TOUR_SELECT);

  if (error) return [];
  return castRows<T>(data);
}

export async function getSponsoredTours<T = Record<string, unknown>>(
  placement: 'hot_deals' | 'hot_tours' = 'hot_deals',
  limit = 20,
  client?: SupabaseClient
): Promise<T[]> {
  const supabase = resolveSupabaseClient(client);
  const safeLimit = applyBoundedLimit(limit, 20);

  const fair = await supabase
    .rpc('get_fair_promoted_tours_v1', {
      p_placement: placement,
      p_limit: safeLimit,
      p_session_id: getRuntimeSessionId(),
    })
    .select(HOMEPAGE_TOUR_SELECT);

  if (!fair.error && fair.data) return castRows<T>(fair.data);

  const fallback = await supabase
    .rpc('get_sponsored_tours', { p_placement: placement, p_limit: safeLimit })
    .select(HOMEPAGE_TOUR_SELECT);

  if (fallback.error) return [];
  return castRows<T>(fallback.data);
}

export async function getPromotedTours<T = Record<string, unknown>>(
  placement: 'featured' | 'hot_deals' | 'hot_tours',
  limit = 20,
  client?: SupabaseClient
): Promise<T[]> {
  const supabase = resolveSupabaseClient(client);
  const safeLimit = applyBoundedLimit(limit, 20);

  const fair = await supabase
    .rpc('get_fair_promoted_tours_v1', {
      p_placement: placement,
      p_limit: safeLimit,
      p_session_id: getRuntimeSessionId(),
    })
    .select(HOMEPAGE_TOUR_SELECT);

  if (!fair.error && fair.data) return castRows<T>(fair.data);

  const now = new Date().toISOString();
  const { data: promos } = await supabase
    .from('tour_promotions')
    .select('tour_id, created_at')
    .eq('placement', placement)
    .eq('is_active', true)
    .eq('status', 'active')
    .gte('ends_at', now)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  const tourIds = (promos ?? [])
    .map((row) => (row as PromotionIdRow).tour_id)
    .filter((tourId): tourId is string => Boolean(tourId));
  if (tourIds.length === 0) return [];

  const { data } = await supabase
    .from('tours')
    .select(HOMEPAGE_TOUR_SELECT)
    .eq('status', 'published')
    .in('id', tourIds);

  return castRows<T>(data);
}

export async function getInternationalTours<T = Record<string, unknown>>(
  limit = 12,
  client?: SupabaseClient
): Promise<T[]> {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .rpc('get_tours_by_engagement', {
      p_tour_type: 'international',
      p_limit: limit,
    })
    .select(HOMEPAGE_TOUR_SELECT);

  if (error) return [];
  return castRows<T>(data);
}

export async function getDomesticTours<T = Record<string, unknown>>(
  limit = 12,
  client?: SupabaseClient
): Promise<T[]> {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .rpc('get_tours_by_engagement', {
      p_tour_type: 'domestic',
      p_limit: limit,
    })
    .select(HOMEPAGE_TOUR_SELECT);

  if (error) return [];
  return castRows<T>(data);
}

export async function getRecentTours<T = Record<string, unknown>>(
  limit = 6,
  client?: SupabaseClient
): Promise<T[]> {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('tours')
    .select(HOMEPAGE_TOUR_SELECT)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return castRows<T>(data);
}

export async function getPopularTours<T = Record<string, unknown>>(
  limit = 10,
  client?: SupabaseClient
): Promise<T[]> {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('tours')
    .select(HOMEPAGE_TOUR_SELECT)
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return castRows<T>(data);
}

export async function getPromotedTourIds(
  client?: SupabaseClient
): Promise<Record<string, string[]>> {
  const supabase = resolveSupabaseClient(client);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('tour_promotions')
    .select('tour_id, placement')
    .eq('is_active', true)
    .gte('ends_at', now);

  if (error) return {};

  const buckets: Record<string, string[]> = {};
  for (const row of data ?? []) {
    if (!row.placement || !row.tour_id) continue;
    if (!buckets[row.placement]) buckets[row.placement] = [];
    buckets[row.placement].push(row.tour_id);
  }
  return buckets;
}

export async function getTourBySlug<T = Record<string, unknown>>(
  slug: string,
  client?: SupabaseClient
): Promise<T | null> {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('tours')
    .select(
      '*, agency:agencies(id, name, slug, logo_url, is_verified, is_approved, phone, telegram_username), images:tour_images(*)'
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) return null;
  return (data ?? null) as T | null;
}

export async function getTours<T = Record<string, unknown>>(
  filters?: TourFilters,
  client?: SupabaseClient
): Promise<T[]> {
  const supabase = resolveSupabaseClient(client);

  if (hasSearchPathFilters(filters)) {
    const rpcParams: SearchToursPublicParams = {
      p_search_pattern: filters?.search ? toIlikePattern(filters.search) || null : null,
      p_city_pattern: filters?.city ? toIlikePattern(filters.city) || null : null,
      p_country_pattern: filters?.country ? toIlikePattern(filters.country) || null : null,
      p_min_price: filters?.minPrice ?? null,
      p_max_price: filters?.maxPrice ?? null,
      p_visa_free: filters?.visaFree ?? null,
      p_transport_type: filters?.transport ?? null,
      p_meal_type: filters?.meal ?? null,
      p_category_pattern: filters?.category ? toIlikePattern(filters.category) || null : null,
      p_sort_by: normalizeSortBy(filters?.sortBy),
      p_limit: applyBoundedLimit(filters?.limit || 50, 50),
      p_page: 0,
      p_cursor_created_at: null,
      p_cursor_id: null,
      p_use_keyset: false,
    };

    const rpc = await supabase
      .rpc('search_tours_public_v1', rpcParams)
      .select(TOUR_CARD_SELECT);

    if (!rpc.error) return castRows<T>(rpc.data);
  }

  let query = supabase.from('tours').select(TOUR_CARD_SELECT).eq('status', 'published');

  if (filters?.search) {
    const searchPattern = toIlikePattern(filters.search);
    if (searchPattern) {
      query = query.or(
        `title.ilike.${searchPattern},short_description.ilike.${searchPattern},country.ilike.${searchPattern},city.ilike.${searchPattern},region.ilike.${searchPattern}`
      );
    }
  }

  if (filters?.country) query = query.eq('country', filters.country);
  if (filters?.city) query = query.eq('city', filters.city);
  if (filters?.minPrice != null) query = query.gte('price', filters.minPrice);
  if (filters?.maxPrice != null) query = query.lte('price', filters.maxPrice);
  if (filters?.transport) query = query.eq('transport_type', filters.transport);
  if (filters?.meal) query = query.eq('meal_type', filters.meal);
  if (filters?.visaFree) query = query.eq('visa_required', false);
  if (filters?.departureFrom) query = query.gte('departure_date', filters.departureFrom);
  if (filters?.departureTo) query = query.lte('departure_date', filters.departureTo);
  if (filters?.category) query = query.eq('category', filters.category);

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
      query = query
        .order('is_featured', { ascending: false })
        .order('view_count', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query.limit(filters?.limit ?? 50);
  if (error) return [];
  return castRows<T>(data);
}

export async function getToursPage<T = Record<string, unknown>>(
  page: number,
  pageSize: number,
  filters?: TourFilters,
  cursorCreatedAt?: string | null,
  cursorId?: string | null,
  client?: SupabaseClient
): Promise<ToursPageResult<T>> {
  const supabase = resolveSupabaseClient(client);
  const safePage = Math.max(0, Math.floor(page));
  const safePageSize = applyBoundedLimit(pageSize, 50);
  const useNewestKeyset = normalizeSortBy(filters?.sortBy) === 'newest';

  if (hasSearchPathFilters(filters)) {
    const rpcLimit = useNewestKeyset ? safePageSize + 1 : safePageSize;
    const rpcParams: SearchToursPublicParams = {
      p_search_pattern: filters?.search ? toIlikePattern(filters.search) || null : null,
      p_city_pattern: filters?.city ? toIlikePattern(filters.city) || null : null,
      p_country_pattern: filters?.country ? toIlikePattern(filters.country) || null : null,
      p_min_price: filters?.minPrice ?? null,
      p_max_price: filters?.maxPrice ?? null,
      p_visa_free: filters?.visaFree ?? null,
      p_transport_type: filters?.transport ?? null,
      p_meal_type: filters?.meal ?? null,
      p_category_pattern: filters?.category ? toIlikePattern(filters.category) || null : null,
      p_sort_by: normalizeSortBy(filters?.sortBy),
      p_limit: rpcLimit,
      p_page: useNewestKeyset ? 0 : safePage,
      p_cursor_created_at: useNewestKeyset ? cursorCreatedAt ?? null : null,
      p_cursor_id: useNewestKeyset ? cursorId ?? null : null,
      p_use_keyset: useNewestKeyset,
    };

    const rpc = await supabase
      .rpc('search_tours_public_v1', rpcParams)
      .select(TOUR_CATALOG_SELECT);

    if (!rpc.error) {
      const rows = castRows<T & { created_at?: string; id?: string }>(rpc.data);
      if (!useNewestKeyset) {
        return {
          items: rows as T[],
          page: safePage,
          pageSize: safePageSize,
          hasMore: rows.length === safePageSize,
          nextCursorCreatedAt: null,
          nextCursorId: null,
        };
      }

      const hasMore = rows.length > safePageSize;
      const items = hasMore ? rows.slice(0, safePageSize) : rows;
      const next = hasMore ? items[items.length - 1] : null;
      return {
        items: items as T[],
        page: safePage,
        pageSize: safePageSize,
        hasMore,
        nextCursorCreatedAt: next?.created_at ?? null,
        nextCursorId: next?.id ?? null,
      };
    }
  }

  const items = await getTours<T>(filters, supabase);
  return {
    items: items.slice(0, safePageSize),
    page: safePage,
    pageSize: safePageSize,
    hasMore: items.length > safePageSize,
    nextCursorCreatedAt: null,
    nextCursorId: null,
  };
}

export async function getToursByAgency<T = Record<string, unknown>>(
  agencyId: string,
  client?: SupabaseClient
): Promise<T[]> {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('tours')
    .select(TOUR_CATALOG_SELECT)
    .eq('agency_id', agencyId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) return [];
  return castRows<T>(data);
}

export async function registerFeaturedImpressionByTour(
  tourId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = resolveSupabaseClient(client);
  await supabase.rpc('register_featured_impression_by_tour_v1', {
    p_tour_id: tourId,
    p_session_id: getRuntimeSessionId(),
    p_nonce: createPromoNonce(),
    p_signature: createPromoSignature(),
  });
}

export async function registerFeaturedClickByTour(
  tourId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = resolveSupabaseClient(client);
  await supabase.rpc('register_featured_click_by_tour_v1', {
    p_tour_id: tourId,
    p_session_id: getRuntimeSessionId(),
    p_nonce: createPromoNonce(),
    p_signature: createPromoSignature(),
  });
}
