import { AgencyDashboardLayout } from '@/components/layouts';
import { redirect } from 'next/navigation';
import { requireRole } from '@/features/auth/helpers';

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole('agency_manager', 'admin');
  if (!profile) redirect('/');

  return <AgencyDashboardLayout>{children}</AgencyDashboardLayout>;
}
