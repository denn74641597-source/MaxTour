import { getMyAgency } from '@/features/agencies/queries';
import { getMyVerificationRequests } from '@/features/verification/actions';
import { VerificationContent } from './verification-content';
import { redirect } from 'next/navigation';

export default async function VerificationPage() {
  const agency = await getMyAgency();
  if (!agency) redirect('/agency/profile');

  const requests = await getMyVerificationRequests(agency.id);

  return <VerificationContent agency={agency} requests={requests} />;
}
