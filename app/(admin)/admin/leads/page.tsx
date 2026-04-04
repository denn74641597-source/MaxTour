import { getAllLeads } from '@/features/admin/queries';
import { AdminLeadsContent } from './admin-leads-content';

export default async function AdminLeadsPage() {
  const leads = await getAllLeads();
  return <AdminLeadsContent leads={leads} />;
}
