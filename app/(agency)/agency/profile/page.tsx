import { getMyAgency } from '@/features/agencies/queries';
import { AgencyProfileContent } from './profile-content';

export default async function AgencyProfilePage() {
  const agency = await getMyAgency();
  return <AgencyProfileContent initialAgency={agency} />;
}
