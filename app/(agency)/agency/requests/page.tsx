import { getMyAgency } from '@/features/agencies/queries';
import { getInterestsByAgency } from '@/features/interests/queries';
import { getLeadsByAgency } from '@/features/leads/queries';
import { RequestsContent } from './requests-content';
import { redirect } from 'next/navigation';

export default async function AgencyRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const agency = await getMyAgency();
  if (!agency) redirect('/agency/profile');

  const resolvedSearchParams = await searchParams;
  const initialTab = resolvedSearchParams?.tab === 'interests' ? 'interests' : 'leads';

  const [interests, leads] = await Promise.all([
    getInterestsByAgency(agency.id),
    getLeadsByAgency(agency.id),
  ]);

  return <RequestsContent interests={interests} leads={leads} initialTab={initialTab} />;
}
