import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getMyAgency, isAgencyProfileComplete } from '@/features/agencies/queries';
import { getMaxCoinBalance } from '@/features/maxcoin/queries';
import { AgencyDashboardContent } from './agency-dashboard-content';

async function getAgencyDashboardData() {
  const agency = await getMyAgency();
  if (!agency) return null;

  const supabase = await createServerSupabaseClient();
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  
  const [toursRes, leadsRes, leadsAllCountRes, viewsRes, activeToursList, maxCoinBalance] = await Promise.all([
    supabase.from('tours').select('id', { count: 'exact', head: true }).eq('agency_id', agency.id).eq('status', 'published'),
    supabase.from('leads').select('*, tour:tours(title)').eq('agency_id', agency.id).order('created_at', { ascending: false }).gte('created_at', twentyFourHoursAgo).limit(5),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('agency_id', agency.id),
    supabase.from('tours').select('view_count').eq('agency_id', agency.id).eq('status', 'published'),
    supabase.from('tours').select('id, title, cover_image_url, price, currency, country, city').eq('agency_id', agency.id).eq('status', 'published').limit(20),
    getMaxCoinBalance(agency.id),
  ]);

  const totalViews = (viewsRes.data ?? []).reduce((sum, t) => {
    const value = typeof t.view_count === 'number' ? t.view_count : 0;
    return sum + value;
  }, 0);

  return {
    agency,
    activeTours: toursRes.count ?? 0,
    totalLeads: leadsAllCountRes.count ?? 0,
    recentLeads: leadsRes.data ?? [],
    totalViews,
    activeToursList: activeToursList.data ?? [],
    maxCoinBalance,
    isProfileComplete: isAgencyProfileComplete(agency),
  };
}

export default async function AgencyDashboardPage() {
  const data = await getAgencyDashboardData();
  return <AgencyDashboardContent data={data} />;
}
