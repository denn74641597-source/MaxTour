import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getMyAgency } from '@/features/agencies/queries';
import { AgencyDashboardContent } from './agency-dashboard-content';

async function getAgencyDashboardData() {
  const agency = await getMyAgency();
  if (!agency) return null;

  const supabase = await createServerSupabaseClient();
  const [toursRes, leadsRes, featuredRes, subRes] = await Promise.all([
    supabase.from('tours').select('id', { count: 'exact', head: true }).eq('agency_id', agency.id).eq('status', 'published'),
    supabase.from('leads').select('*, tour:tours(title)').eq('agency_id', agency.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('tours').select('id', { count: 'exact', head: true }).eq('agency_id', agency.id).eq('is_featured', true),
    supabase.from('agency_subscriptions').select('*, plan:subscription_plans(name)').eq('agency_id', agency.id).eq('status', 'active').limit(1).single(),
  ]);

  return {
    agency,
    activeTours: toursRes.count ?? 0,
    totalLeads: leadsRes.data?.length ?? 0,
    recentLeads: leadsRes.data ?? [],
    featuredTours: featuredRes.count ?? 0,
    subscription: subRes.data,
  };
}

export default async function AgencyDashboardPage() {
  const data = await getAgencyDashboardData();
  return <AgencyDashboardContent data={data} />;
}
