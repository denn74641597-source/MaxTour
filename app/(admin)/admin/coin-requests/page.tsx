import { getCoinRequests } from '@/features/admin/queries';
import { AdminCoinRequestsContent } from './admin-coin-requests-content';

export const dynamic = 'force-dynamic';

export default async function AdminCoinRequestsPage() {
  const requests = await getCoinRequests();
  return <AdminCoinRequestsContent requests={requests} />;
}
