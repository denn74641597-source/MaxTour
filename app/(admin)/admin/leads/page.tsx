import { getAdminLeadsPanelData } from '@/features/admin/queries';
import { AdminLeadsContent } from './admin-leads-content';

export default async function AdminLeadsPage() {
  const payload = await getAdminLeadsPanelData();
  return <AdminLeadsContent payload={payload} />;
}
