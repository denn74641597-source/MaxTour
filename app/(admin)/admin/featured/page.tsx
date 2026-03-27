import { getFeaturedItems } from '@/features/admin/queries';
import { AdminFeaturedContent } from './admin-featured-content';

export const dynamic = 'force-dynamic';

export default async function AdminFeaturedPage() {
  const items = await getFeaturedItems();
  return <AdminFeaturedContent items={items} />;
}
