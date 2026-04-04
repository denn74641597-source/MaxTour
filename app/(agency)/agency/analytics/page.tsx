import { getMyAgency } from '@/features/agencies/queries';
import { getAgencyAnalytics } from '@/features/interests/queries';
import { AnalyticsContent } from './analytics-content';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function AgencyAnalyticsPage() {
  const agency = await getMyAgency();
  if (!agency) redirect('/agency/profile');

  const supabase = await createServerSupabaseClient();
  const [analytics, leadsCountRes] = await Promise.all([
    getAgencyAnalytics(agency.id),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('agency_id', agency.id),
  ]);

  return <AnalyticsContent analytics={analytics} totalRequests={leadsCountRes.count ?? 0} />;
}
