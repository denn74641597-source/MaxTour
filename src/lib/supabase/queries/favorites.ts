import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseClient } from '../client';

const FAV_TOUR_SELECT =
  'tour_id, created_at, tour:tours(id, slug, title, title_uz, title_ru, cover_image_url, price, old_price, currency, tour_type, region, city, country, district, destinations, is_featured, agency_id, agency:agencies(id, name, slug, logo_url, is_verified, is_approved))' as const;

const AGENCY_CARD_SELECT =
  'id, name, slug, logo_url, city, country, is_verified, is_approved' as const;

interface FavoriteTourRow<T> {
  tour?: T | null;
  created_at?: string;
  tour_id?: string;
}

interface FollowAgencyRow {
  agency_id: string;
  created_at?: string;
}

interface AgencyIdentityRow {
  id: string;
}

export interface CursorPageParam {
  page: number;
  cursorCreatedAt?: string | null;
  cursorId?: string | null;
}

export interface CursorPageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextCursorCreatedAt?: string | null;
  nextCursorId?: string | null;
}

function normalizePageParam(pageOrParam: number | CursorPageParam): CursorPageParam {
  if (typeof pageOrParam === 'number') {
    return { page: pageOrParam, cursorCreatedAt: null, cursorId: null };
  }

  return {
    page: pageOrParam.page,
    cursorCreatedAt: pageOrParam.cursorCreatedAt ?? null,
    cursorId: pageOrParam.cursorId ?? null,
  };
}

export async function getFavoriteToursPage<T = Record<string, unknown>>(
  userId: string,
  pageOrParam: number | CursorPageParam,
  pageSize: number,
  client?: SupabaseClient
): Promise<CursorPageResult<T>> {
  const supabase = resolveSupabaseClient(client);
  const { page, cursorCreatedAt, cursorId } = normalizePageParam(pageOrParam);

  let query = supabase
    .from('favorites')
    .select(FAV_TOUR_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('tour_id', { ascending: false });

  if (cursorCreatedAt && cursorId) {
    query = query.or(
      `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},tour_id.lt.${cursorId})`
    );
  }

  const { data, error } = await query.limit(pageSize + 1);
  if (error) {
    return {
      items: [],
      page,
      pageSize,
      hasMore: false,
      nextCursorCreatedAt: null,
      nextCursorId: null,
    };
  }

  const rows = data ?? [];
  const hasMore = rows.length > pageSize;
  const slice = hasMore ? rows.slice(0, pageSize) : rows;
  const items = slice
    .map((row) => (row as FavoriteTourRow<T>).tour)
    .filter(Boolean) as T[];
  const nextCursorCreatedAt = hasMore
    ? ((slice[slice.length - 1] as { created_at?: string }).created_at ?? null)
    : null;
  const nextCursorId = hasMore
    ? ((slice[slice.length - 1] as { tour_id?: string }).tour_id ?? null)
    : null;

  return {
    items,
    page,
    pageSize,
    hasMore,
    nextCursorCreatedAt,
    nextCursorId,
  };
}

export async function getFollowedAgenciesPage<T = Record<string, unknown>>(
  userId: string,
  pageOrParam: number | CursorPageParam,
  pageSize: number,
  client?: SupabaseClient
): Promise<CursorPageResult<T>> {
  const supabase = resolveSupabaseClient(client);
  const { page, cursorCreatedAt, cursorId } = normalizePageParam(pageOrParam);

  let followsQuery = supabase
    .from('agency_follows')
    .select('agency_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('agency_id', { ascending: false });

  if (cursorCreatedAt && cursorId) {
    followsQuery = followsQuery.or(
      `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},agency_id.lt.${cursorId})`
    );
  }

  const { data: followRows, error: followError } = await followsQuery.limit(
    pageSize + 1
  );

  if (followError) {
    return {
      items: [],
      page,
      pageSize,
      hasMore: false,
      nextCursorCreatedAt: null,
      nextCursorId: null,
    };
  }

  const rows = followRows ?? [];
  const hasMore = rows.length > pageSize;
  const slice = hasMore ? rows.slice(0, pageSize) : rows;
  const ids = slice.map((row) => (row as FollowAgencyRow).agency_id);

  if (ids.length === 0) {
    return {
      items: [],
      page,
      pageSize,
      hasMore: false,
      nextCursorCreatedAt: null,
      nextCursorId: null,
    };
  }

  const { data: agencies, error: agencyError } = await supabase
    .from('agencies')
    .select(AGENCY_CARD_SELECT)
    .in('id', ids)
    .eq('is_approved', true);

  if (agencyError) {
    return {
      items: [],
      page,
      pageSize,
      hasMore: false,
      nextCursorCreatedAt: null,
      nextCursorId: null,
    };
  }

  const order = new Map<string, number>(ids.map((id, index) => [id, index]));
  const items = (agencies ?? [])
    .slice()
    .sort(
      (a, b) =>
        (order.get((a as AgencyIdentityRow).id) ?? Number.MAX_SAFE_INTEGER) -
        (order.get((b as AgencyIdentityRow).id) ?? Number.MAX_SAFE_INTEGER)
    ) as T[];

  const nextCursorCreatedAt = hasMore
    ? ((slice[slice.length - 1] as { created_at?: string }).created_at ?? null)
    : null;
  const nextCursorId = hasMore
    ? ((slice[slice.length - 1] as { agency_id?: string }).agency_id ?? null)
    : null;

  return {
    items,
    page,
    pageSize,
    hasMore,
    nextCursorCreatedAt,
    nextCursorId,
  };
}

export async function getSuggestedAgenciesPage<T = Record<string, unknown>>(
  pageOrParam: number | CursorPageParam,
  pageSize: number,
  client?: SupabaseClient
): Promise<CursorPageResult<T>> {
  const supabase = resolveSupabaseClient(client);
  const { page, cursorCreatedAt, cursorId } = normalizePageParam(pageOrParam);

  let query = supabase
    .from('agencies')
    .select(`${AGENCY_CARD_SELECT}, created_at`)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (cursorCreatedAt && cursorId) {
    query = query.or(
      `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`
    );
  }

  const { data, error } = await query.limit(pageSize + 1);
  if (error) {
    return {
      items: [],
      page,
      pageSize,
      hasMore: false,
      nextCursorCreatedAt: null,
      nextCursorId: null,
    };
  }

  const rows = (data ?? []) as Array<{ id: string; created_at?: string }>;
  const hasMore = rows.length > pageSize;
  const slice = hasMore ? rows.slice(0, pageSize) : rows;
  const nextCursorCreatedAt = hasMore
    ? (slice[slice.length - 1]?.created_at ?? null)
    : null;
  const nextCursorId = hasMore ? slice[slice.length - 1]?.id ?? null : null;

  return {
    items: slice as T[],
    page,
    pageSize,
    hasMore,
    nextCursorCreatedAt,
    nextCursorId,
  };
}

export async function checkIsFavorite(
  userId: string,
  tourId: string,
  client?: SupabaseClient
): Promise<boolean> {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('tour_id', tourId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

export async function getUserFavoriteIds(
  userId: string,
  client?: SupabaseClient
): Promise<string[]> {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('favorites')
    .select('tour_id')
    .eq('user_id', userId);

  if (error) return [];
  return (data ?? [])
    .map((row) => (row as { tour_id?: string }).tour_id)
    .filter((tourId): tourId is string => Boolean(tourId));
}
