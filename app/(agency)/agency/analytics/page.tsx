import { getMyAgency } from '@/features/agencies/queries';
import { getAgencyAnalytics } from '@/features/interests/queries';
import { AnalyticsContent } from './analytics-content';
import { redirect } from 'next/navigation';

export default async function AgencyAnalyticsPage() {
  const agency = await getMyAgency();
  if (!agency) redirect('/agency/profile');

  const analytics = await getAgencyAnalytics(agency.id);

  return <AnalyticsContent analytics={analytics} />;
}
