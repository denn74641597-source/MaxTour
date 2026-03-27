import { DashboardNav } from '@/components/shared/dashboard-nav';
import { AppHeader } from '@/components/shared/app-header';
import { BottomNav } from '@/components/shared/bottom-nav';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function AgencyLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="md:hidden">
        <AppHeader />
      </div>
      <div className="flex-1 flex flex-col md:flex-row">
        <DashboardNav type="agency" />
        <main className="flex-1 p-4 md:p-6 max-w-4xl bg-background pb-24 md:pb-6">
          <Suspense fallback={<AgencyLoadingFallback />}>
            {children}
          </Suspense>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
