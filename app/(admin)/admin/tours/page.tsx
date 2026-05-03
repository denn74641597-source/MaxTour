import { getAdminToursPanelData } from '@/features/admin/queries';
import { AdminToursContent } from './admin-tours-content';

export const dynamic = 'force-dynamic';

export default async function AdminToursPage() {
  const payload = await getAdminToursPanelData();
  return <AdminToursContent payload={payload} />;
}
