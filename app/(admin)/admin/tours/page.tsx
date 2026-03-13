import { getAllTours } from '@/features/admin/queries';
import { AdminToursContent } from './admin-tours-content';

export default async function AdminToursPage() {
  const tours = await getAllTours();
  return <AdminToursContent tours={tours} />;
}
