import { getAdminDashboardData } from '@/features/admin/queries';
import { AdminDashboardContent } from './admin-dashboard-content';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  try {
    const data = await getAdminDashboardData();
    return <AdminDashboardContent data={data} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown dashboard error';
    return <AdminDashboardContent data={null} errorMessage={message} />;
  }
}
