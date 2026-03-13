import { getFeaturedItems } from '@/features/admin/queries';
import { AdminFeaturedContent } from './admin-featured-content';

export default async function AdminFeaturedPage() {
  const items = await getFeaturedItems();
  return <AdminFeaturedContent items={items} />;
}
