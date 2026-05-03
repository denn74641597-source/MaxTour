import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseClient } from '../client';

export interface InterestEntry {
  id: string;
  user_id: string;
  tour_id: string;
  created_at: string;
  tour?: {
    id: string;
    title: string;
    slug: string;
    country?: string;
    city?: string;
  } | null;
  profile?: {
    full_name?: string;
    phone?: string;
    telegram_username?: string;
    avatar_url?: string;
  } | null;
}

export interface TourAnalyticsRow {
  tour: {
    id: string;
    title: string;
    slug: string;
    country: string;
    city: string | null;
  };
  interests: number;
  calls: number;
  telegram: number;
}

interface InterestQueryRow {
  id: string;
  user_id: string;
  tour_id: string;
  created_at: string;
  tour?:
    | { id: string; title: string; slug: string; country?: string; city?: string }
    | Array<{ id: string; title: string; slug: string; country?: string; city?: string }>
    | null;
  profile?:
    | {
        full_name?: string;
        phone?: string;
        telegram_username?: string;
        avatar_url?: string;
      }
    | Array<{
        full_name?: string;
        phone?: string;
        telegram_username?: string;
        avatar_url?: string;
      }>
    | null;
}

interface AgencyAnalyticsRpcRow {
  tour_id: string;
  title: string;
  slug: string;
  country: string;
  city: string | null;
  interests: number | string;
  calls: number | string;
  telegram: number | string;
}

interface TourIdentityRow {
  id: string;
  title: string;
  slug: string;
  country: string;
  city: string | null;
}

export async function getInterestsByAgency(
  agencyId: string,
  client?: SupabaseClient
): Promise<InterestEntry[]> {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('favorites')
    .select(
      'id, user_id, tour_id, created_at, tour:tours!inner(id, title, slug, country, city, agency_id), profile:profiles(full_name, phone, telegram_username, avatar_url)'
    )
    .eq('tour.agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error) return [];

  return (data ?? []).map((item) => {
    const row = item as InterestQueryRow;
    return {
      id: row.id,
      user_id: row.user_id,
      tour_id: row.tour_id,
      created_at: row.created_at,
      tour: Array.isArray(row.tour) ? row.tour[0] : row.tour ?? null,
      profile: Array.isArray(row.profile) ? row.profile[0] : row.profile ?? null,
    };
  });
}

export async function getAgencyAnalytics(
  agencyId: string,
  client?: SupabaseClient
): Promise<TourAnalyticsRow[]> {
  const supabase = resolveSupabaseClient(client);

  const rpc = await supabase.rpc('get_agency_analytics', {
    agency_id_input: agencyId,
  });

  if (!rpc.error && Array.isArray(rpc.data)) {
    return rpc.data.map((item) => {
      const row = item as AgencyAnalyticsRpcRow;
      return {
        tour: {
          id: row.tour_id,
          title: row.title,
          slug: row.slug,
          country: row.country,
          city: row.city,
        },
        interests: Number(row.interests) || 0,
        calls: Number(row.calls) || 0,
        telegram: Number(row.telegram) || 0,
      };
    });
  }

  const { data: tours } = await supabase
    .from('tours')
    .select('id, title, slug, country, city')
    .eq('agency_id', agencyId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (!tours || tours.length === 0) return [];
  const tourIds = tours.map((tour) => (tour as TourIdentityRow).id);

  const [{ data: favorites }, { data: calls }] = await Promise.all([
    supabase.from('favorites').select('tour_id').in('tour_id', tourIds),
    supabase.from('call_tracking').select('tour_id, type').eq('agency_id', agencyId),
  ]);

  const interestMap = new Map<string, number>();
  for (const item of favorites ?? []) {
    if (!item.tour_id) continue;
    interestMap.set(item.tour_id, (interestMap.get(item.tour_id) ?? 0) + 1);
  }

  const callMap = new Map<string, number>();
  const telegramMap = new Map<string, number>();
  for (const item of calls ?? []) {
    if (!item.tour_id) continue;
    if (item.type === 'call') {
      callMap.set(item.tour_id, (callMap.get(item.tour_id) ?? 0) + 1);
    } else if (item.type === 'telegram') {
      telegramMap.set(item.tour_id, (telegramMap.get(item.tour_id) ?? 0) + 1);
    }
  }

  return tours.map((item) => {
    const tour = item as TourIdentityRow;
    return {
      tour,
      interests: interestMap.get(tour.id) ?? 0,
      calls: callMap.get(tour.id) ?? 0,
      telegram: telegramMap.get(tour.id) ?? 0,
    };
  });
}
