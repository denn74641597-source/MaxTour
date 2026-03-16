import { getMyAgency } from '@/features/agencies/queries';
import { getAgencyTourLimit } from '@/features/agencies/queries';
import { redirect } from 'next/navigation';
import { NewTourContent } from './new-tour-content';

export default async function NewTourPage() {
  const agency = await getMyAgency();
  if (!agency) redirect('/agency');

  const tourLimit = await getAgencyTourLimit(agency.id);

  return <NewTourContent tourLimit={tourLimit} />;
}
