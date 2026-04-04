import { getMyAgency } from '@/features/agencies/queries';
import { getInterestsByAgency } from '@/features/interests/queries';
import { getLeadsByAgency } from '@/features/leads/queries';
import { InterestsContent } from './interests-content';
import { redirect } from 'next/navigation';

export default async function AgencyInterestsPage() {
  const agency = await getMyAgency();
  if (!agency) redirect('/agency/profile');

  const [interests, leads] = await Promise.all([
    getInterestsByAgency(agency.id),
    getLeadsByAgency(agency.id),
  ]);

  return <InterestsContent interests={interests} leads={leads} />;
}
