import { notFound } from 'next/navigation';
import { getAdminTourById } from '@/features/admin/queries';
import { AdminTourDetailContent } from './admin-tour-detail-content';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminTourDetailPage({ params }: Props) {
  const { id } = await params;
  const tour = await getAdminTourById(id);
  if (!tour) notFound();
  return <AdminTourDetailContent tour={tour as unknown as import('@/types').Tour} />;
}
