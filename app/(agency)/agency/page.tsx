import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getMyAgency, getAgencyTourLimit, isAgencyProfileComplete } from '@/features/agencies/queries';
import { getInterestsByAgency, getAgencyAnalytics } from '@/features/interests/queries';
import { getMaxCoinBalance, getActivePromotions } from '@/features/maxcoin/queries';
import { getMyVerificationRequests } from '@/features/verification/actions';
import {
  AgencyDashboardContent,
  type ActiveTourPromo,
  type AgencyDashboardViewModel,
  type DashboardLead,
} from './agency-dashboard-content';

const DASHBOARD_RECENT_LEADS_HOURS = 48;

type RecentLeadRow = {
  id: string;
  full_name: string;
  status: string;
  created_at: string;
  tour: { title: string | null } | { title: string | null }[] | null;
};

type ActiveTourRow = {
  id: string;
  title: string;
  cover_image_url: string | null;
  price: number | null;
  currency: string | null;
  country: string | null;
  city: string | null;
};

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function mapRecentLeads(rows: RecentLeadRow[] | null): DashboardLead[] {
  if (!rows) return [];
  return rows.map((lead) => {
    const tour = firstOrNull(lead.tour);
    return {
      id: lead.id,
      full_name: lead.full_name,
      status: lead.status,
      created_at: lead.created_at,
      tour_title: tour?.title ?? null,
    };
  });
}

function mapActiveTours(rows: ActiveTourRow[] | null): ActiveTourPromo[] {
  if (!rows) return [];
  return rows.map((tour) => ({
    id: tour.id,
    title: tour.title,
    cover_image_url: tour.cover_image_url,
    price: typeof tour.price === 'number' ? tour.price : null,
    currency: tour.currency ?? null,
    country: tour.country ?? null,
    city: tour.city ?? null,
  }));
}

async function getAgencyDashboardViewModel(): Promise<AgencyDashboardViewModel> {
  try {
    const agency = await getMyAgency();
    if (!agency) return { status: 'missing_agency' };

    const supabase = await createServerSupabaseClient();
    const recentCutoff = new Date(Date.now() - DASHBOARD_RECENT_LEADS_HOURS * 60 * 60 * 1000).toISOString();

    const [
      activeToursCountRes,
      allToursViewsRes,
      recentLeadsRes,
      totalLeadsCountRes,
      activeToursListRes,
      maxCoinBalance,
      interests,
      activePromotions,
      analyticsRows,
      verificationRequests,
      planSummary,
    ] = await Promise.all([
      supabase.from('tours').select('id', { count: 'exact', head: true }).eq('agency_id', agency.id).eq('status', 'published'),
      supabase.from('tours').select('id, view_count').eq('agency_id', agency.id),
      supabase
        .from('leads')
        .select('id, full_name, status, created_at, tour:tours(title)')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false })
        .gte('created_at', recentCutoff)
        .limit(5),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('agency_id', agency.id),
      supabase
        .from('tours')
        .select('id, title, cover_image_url, price, currency, country, city')
        .eq('agency_id', agency.id)
        .eq('status', 'published')
        .limit(20),
      getMaxCoinBalance(agency.id),
      getInterestsByAgency(agency.id),
      getActivePromotions(agency.id),
      getAgencyAnalytics(agency.id),
      getMyVerificationRequests(agency.id),
      getAgencyTourLimit(agency.id).catch(() => null),
    ]);

    const totalViews = (allToursViewsRes.data ?? []).reduce((sum, row) => {
      const count = typeof row.view_count === 'number' ? row.view_count : 0;
      return sum + count;
    }, 0);

    const analyticsTotals = (analyticsRows ?? []).reduce(
      (acc, row) => ({
        totalInterests: acc.totalInterests + row.interests,
        totalCalls: acc.totalCalls + row.calls,
        totalTelegram: acc.totalTelegram + row.telegram,
        trackedTours: acc.trackedTours + 1,
      }),
      { totalInterests: 0, totalCalls: 0, totalTelegram: 0, trackedTours: 0 }
    );

    const latestVerification = verificationRequests[0]
      ? {
          status: verificationRequests[0].status,
          created_at: verificationRequests[0].created_at,
        }
      : null;

    return {
      status: 'ready',
      agency: {
        id: agency.id,
        name: agency.name,
        logo_url: agency.logo_url,
        is_verified: agency.is_verified,
        is_approved: agency.is_approved,
      },
      activeTours: activeToursCountRes.count ?? 0,
      totalTours: allToursViewsRes.data?.length ?? 0,
      totalLeads: totalLeadsCountRes.count ?? 0,
      recentLeads: mapRecentLeads((recentLeadsRes.data as RecentLeadRow[] | null) ?? null),
      recentLeadsWindowCount: recentLeadsRes.data?.length ?? 0,
      totalViews,
      activeToursList: mapActiveTours((activeToursListRes.data as ActiveTourRow[] | null) ?? null),
      maxCoinBalance,
      isProfileComplete: isAgencyProfileComplete(agency),
      interestsCount: interests.length,
      activePromotionsCount: activePromotions.length,
      analytics: analyticsTotals,
      latestVerification,
      planSummary: planSummary
        ? {
            planName: planSummary.planName,
            maxTours: planSummary.maxTours,
            currentTours: planSummary.currentTours,
            canCreate: planSummary.canCreate,
          }
        : null,
    };
  } catch (error) {
    console.error('Agency dashboard load failed:', error);
    return { status: 'error' };
  }
}

export default async function AgencyDashboardPage() {
  const viewModel = await getAgencyDashboardViewModel();
  return <AgencyDashboardContent viewModel={viewModel} />;
}
