import { redirect } from 'next/navigation';
import { getMyAgency } from '@/features/agencies/queries';
import { getAgencyAnalytics } from '@/features/interests/queries';
import { createAdminClient } from '@/lib/supabase/server';
import {
  AnalyticsContent,
  type AnalyticsTourRow,
  type CallEventRow,
  type FavoriteEventRow,
  type LeadEventRow,
  type MaxCoinTxRow,
  type PromotionEventRow,
} from './analytics-content';

export default async function AgencyAnalyticsPage() {
  const agency = await getMyAgency();
  if (!agency) redirect('/agency/profile');

  let loadError: string | null = null;

  let analytics: Awaited<ReturnType<typeof getAgencyAnalytics>> = [];
  let tours: AnalyticsTourRow[] = [];
  let leads: LeadEventRow[] = [];
  let favorites: FavoriteEventRow[] = [];
  let callTracking: CallEventRow[] = [];
  let promotions: PromotionEventRow[] = [];
  let transactions: MaxCoinTxRow[] = [];
  let followersCount = 0;

  try {
    const admin = await createAdminClient();

    const [analyticsData, { data: toursData, error: toursError }] = await Promise.all([
      getAgencyAnalytics(agency.id),
      admin
        .from('tours')
        .select('id, title, slug, country, city, status, view_count, created_at')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false }),
    ]);

    if (toursError) throw toursError;

    analytics = analyticsData ?? [];
    tours = (toursData ?? []) as AnalyticsTourRow[];

    const tourIds = tours.map((tour) => tour.id);

    const favoritesPromise = tourIds.length
      ? admin
          .from('favorites')
          .select('id, user_id, tour_id, created_at')
          .in('tour_id', tourIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null });

    const [
      { data: leadsData, error: leadsError },
      { data: favoritesData, error: favoritesError },
      { data: callsData, error: callsError },
      { data: promotionsData, error: promotionsError },
      { data: txData, error: txError },
      { count: followers, error: followersError },
    ] = await Promise.all([
      admin
        .from('leads')
        .select('id, tour_id, created_at')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false }),
      favoritesPromise,
      admin
        .from('call_tracking')
        .select('id, tour_id, type, created_at')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false }),
      admin
        .from('tour_promotions')
        .select('*')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false }),
      admin
        .from('maxcoin_transactions')
        .select('id, amount, type, created_at, tour_id')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false })
        .limit(200),
      admin
        .from('agency_follows')
        .select('id', { count: 'exact', head: true })
        .eq('agency_id', agency.id),
    ]);

    if (leadsError) throw leadsError;
    if (favoritesError) throw favoritesError;
    if (callsError) throw callsError;
    if (promotionsError) throw promotionsError;
    if (txError) throw txError;
    if (followersError) throw followersError;

    leads = (leadsData ?? []) as LeadEventRow[];
    favorites = (favoritesData ?? []) as FavoriteEventRow[];
    callTracking = (callsData ?? []) as CallEventRow[];
    promotions = (promotionsData ?? []) as PromotionEventRow[];
    transactions = (txData ?? []) as MaxCoinTxRow[];
    followersCount = followers ?? 0;
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Failed to load analytics';
  }

  return (
    <AnalyticsContent
      analytics={analytics}
      totalRequests={leads.length}
      tours={tours}
      leads={leads}
      favorites={favorites}
      callTracking={callTracking}
      promotions={promotions}
      transactions={transactions}
      profileViews={agency.profile_views ?? 0}
      avgRating={agency.avg_rating}
      reviewCount={agency.review_count}
      followersCount={followersCount}
      loadError={loadError}
    />
  );
}
