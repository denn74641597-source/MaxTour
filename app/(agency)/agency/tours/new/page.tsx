import { getMyAgency, isAgencyProfileComplete } from '@/features/agencies/queries';
import { redirect } from 'next/navigation';
import { NewTourContent } from './new-tour-content';

export default async function NewTourPage() {
  const agency = await getMyAgency();
  if (!agency) redirect('/agency');

  if (!isAgencyProfileComplete(agency)) {
    redirect('/agency/profile');
  }

  return <NewTourContent />;
}
