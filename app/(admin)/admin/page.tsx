import { getAdminStats } from '@/features/admin/queries';
import { AdminDashboardContent } from './admin-dashboard-content';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return <AdminDashboardContent stats={stats} />;
}
