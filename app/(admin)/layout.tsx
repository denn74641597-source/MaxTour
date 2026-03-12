import { DashboardNav } from '@/components/shared/dashboard-nav';

export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <DashboardNav type="admin" />
      <main className="flex-1 p-4 md:p-6 max-w-5xl">{children}</main>
    </div>
  );
}
