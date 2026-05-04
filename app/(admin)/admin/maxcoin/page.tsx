import { getAdminPromotionsMaxcoinPanelData } from '@/features/admin/queries';
import { AdminCoinRequestsContent } from '../coin-requests/admin-coin-requests-content';

export const dynamic = 'force-dynamic';

export default async function AdminMaxcoinPage() {
  try {
    const payload = await getAdminPromotionsMaxcoinPanelData();
    return <AdminCoinRequestsContent payload={payload} viewMode="maxcoin" />;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown promotions loading error';
    return <AdminCoinRequestsContent payload={null} errorMessage={message} viewMode="maxcoin" />;
  }
}
