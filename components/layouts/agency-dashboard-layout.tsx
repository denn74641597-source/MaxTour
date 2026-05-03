import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AgencyWorkspaceTopbar, DashboardNav, DashboardMenuTrigger } from '@/components/shared/dashboard-nav';
import { AppHeader } from '@/components/shared/app-header';

function AgencyLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export function AgencyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.14),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#f6f9fc_36%,#f4f7fa_100%)]">
      <div className="md:hidden sticky top-0 z-50">
        <AppHeader rightSlot={<DashboardMenuTrigger type="agency" />} />
      </div>
      <div className="agency-shell flex flex-1 flex-col md:flex-row">
        <DashboardNav type="agency" />
        <main className="flex-1 px-4 pb-8 pt-4 md:px-6 md:pt-5 lg:px-8 xl:px-10">
          <AgencyWorkspaceTopbar />
          <Suspense fallback={<AgencyLoadingFallback />}>
            <div className="mt-4 md:mt-5">
              {children}
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
