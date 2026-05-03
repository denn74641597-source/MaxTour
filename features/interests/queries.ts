import { createAdminClient } from '@/lib/supabase/server';
import { notifySystemError } from '@/lib/telegram/admin-bot';

/** Fetch favorites for an agency — which users added which agency tours to favorites */
export async function getInterestsByAgency(agencyId: string) {
  const supabase = await createAdminClient();

  // Get all tours for this agency
  const { data: tours, error: toursError } = await supabase
    .from('tours')
    .select('id')
    .eq('agency_id', agencyId);

  if (toursError || !tours || tours.length === 0) {
    if (toursError) {
      console.error('getInterestsByAgency tours error:', toursError);
      await notifySystemError({ source: 'Query: getInterestsByAgency', message: toursError.message, extra: `Agency: ${agencyId}` });
    }
    return [];
  }

  const tourIds = tours.map((t) => t.id);

  const { data, error } = await supabase
    .from('favorites')
    .select('*, tour:tours(id, title, slug, country, city, cover_image_url), profile:profiles(full_name, phone, telegram_username, avatar_url)')
    .in('tour_id', tourIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getInterestsByAgency error:', error);
    await notifySystemError({ source: 'Query: getInterestsByAgency', message: error.message, extra: `Agency: ${agencyId}` });
    return [];
  }
  return data ?? [];
}

/** Get analytics data: per-tour interest, call, and telegram counts */
export async function getAgencyAnalytics(agencyId: string) {
  const supabase = await createAdminClient();

  // Preferred path: aggregate via RPC (mobile parity, single round-trip).
  const rpc = await supabase.rpc('get_agency_analytics', { agency_id_input: agencyId });
  if (!rpc.error && Array.isArray(rpc.data)) {
    return (rpc.data as {
      tour_id: string;
      title: string;
      slug: string;
      country: string;
      city: string | null;
      interests: number | string;
      calls: number | string;
      telegram: number | string;
    }[]).map((row) => ({
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
    }));
  }

  // Fallback path: calculate from tables when RPC is unavailable.
  const { data: tours } = await supabase
    .from('tours')
    .select('id, title, slug, country, city')
    .eq('agency_id', agencyId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (!tours || tours.length === 0) return [];

  const tourIds = tours.map((t) => t.id);

  const [{ data: favCounts }, { data: callCounts }] = await Promise.all([
    supabase.from('favorites').select('tour_id').in('tour_id', tourIds),
    supabase.from('call_tracking').select('tour_id, type').eq('agency_id', agencyId),
  ]);

  const interestsMap = new Map<string, number>();
  for (const row of (favCounts ?? []) as { tour_id: string | null }[]) {
    if (!row.tour_id) continue;
    interestsMap.set(row.tour_id, (interestsMap.get(row.tour_id) ?? 0) + 1);
  }

  const callsMap = new Map<string, number>();
  const telegramMap = new Map<string, number>();
  for (const row of (callCounts ?? []) as { tour_id: string | null; type?: string }[]) {
    if (!row.tour_id) continue;
    if (row.type === 'call') {
      callsMap.set(row.tour_id, (callsMap.get(row.tour_id) ?? 0) + 1);
    } else if (row.type === 'telegram') {
      telegramMap.set(row.tour_id, (telegramMap.get(row.tour_id) ?? 0) + 1);
    }
  }

  return tours.map((tour) => ({
    tour,
    interests: interestsMap.get(tour.id) ?? 0,
    calls: callsMap.get(tour.id) ?? 0,
    telegram: telegramMap.get(tour.id) ?? 0,
  }));
}
