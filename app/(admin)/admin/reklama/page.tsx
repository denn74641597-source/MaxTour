import { getAdminPromotionsMaxcoinPanelData } from '@/features/admin/queries';
import { AdminFeaturedContent } from '../featured/admin-featured-content';

export const dynamic = 'force-dynamic';

export default async function AdminReklamaPage() {
  try {
    const payload = await getAdminPromotionsMaxcoinPanelData();
    return <AdminFeaturedContent payload={payload} viewMode="reklama" />;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown featured promotions loading error';
    return <AdminFeaturedContent payload={null} errorMessage={message} viewMode="reklama" />;
  }
}
