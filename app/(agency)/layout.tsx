import { DashboardNav, DashboardMenuTrigger } from '@/components/shared/dashboard-nav';
import { AppHeader } from '@/components/shared/app-header';
import { BottomNav } from '@/components/shared/bottom-nav';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { requireRole } from '@/features/auth/helpers';

function AgencyLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole('agency_manager', 'admin');
  if (!profile) redirect('/');

  return (
    <div className="min-h-screen flex flex-col">
      <div className="md:hidden sticky top-0 z-50">
        <AppHeader rightSlot={<DashboardMenuTrigger type="agency" />} />
      </div>
      <div className="flex-1 flex flex-col md:flex-row">
        <DashboardNav type="agency" />
        <main className="flex-1 p-4 md:p-6 lg:p-8 xl:p-10 max-w-full xl:max-w-7xl 2xl:max-w-[88rem] bg-background pb-24 md:pb-6">
          <Suspense fallback={<AgencyLoadingFallback />}>
            {children}
          </Suspense>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
