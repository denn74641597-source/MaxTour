import { createAdminClient } from '@/lib/supabase/server';
import type { TourInterest } from '@/types';

/** Fetch interests (favorites) for an agency with tour & profile info */
export async function getInterestsByAgency(agencyId: string): Promise<TourInterest[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('tour_interests')
    .select('*, tour:tours(id, title, slug, country, city), profile:profiles(full_name, phone, telegram_username, avatar_url)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getInterestsByAgency error:', error);
    return [];
  }
  return data ?? [];
}

/** Get analytics data: per-tour interest, call, and telegram counts */
export async function getAgencyAnalytics(agencyId: string) {
  const supabase = await createAdminClient();

  // Get all published tours for this agency
  const { data: tours } = await supabase
    .from('tours')
    .select('id, title, slug, country, city')
    .eq('agency_id', agencyId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (!tours || tours.length === 0) return [];

  const tourIds = tours.map((t) => t.id);

  // Count favorites per tour (= qiziqish / interest)
  const { data: favCounts } = await supabase
    .from('favorites')
    .select('tour_id')
    .in('tour_id', tourIds);

  // Count call clicks per tour
  const { data: callCounts } = await supabase
    .from('call_tracking')
    .select('tour_id, type')
    .eq('agency_id', agencyId);

  // Count per tour
  const countByTour = (items: { tour_id: string | null }[] | null, tourId: string) =>
    items?.filter((i) => i.tour_id === tourId).length ?? 0;

  const countByTourAndType = (items: { tour_id: string | null; type?: string }[] | null, tourId: string, type: string) =>
    items?.filter((i) => i.tour_id === tourId && (i as any).type === type).length ?? 0;

  return tours.map((tour) => ({
    tour,
    interests: countByTour(favCounts, tour.id),
    calls: countByTourAndType(callCounts, tour.id, 'call'),
    telegram: countByTourAndType(callCounts, tour.id, 'telegram'),
  }));
}
