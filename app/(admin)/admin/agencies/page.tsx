import { getAllAgencies } from '@/features/admin/queries';
import { AdminAgenciesContent } from './admin-agencies-content';

export const dynamic = 'force-dynamic';

export default async function AdminAgenciesPage() {
  const agencies = await getAllAgencies();
  return <AdminAgenciesContent agencies={agencies} />;
}
