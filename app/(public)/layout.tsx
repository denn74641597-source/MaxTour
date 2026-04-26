import { FirstVisitSplash } from '@/components/shared/first-visit-splash';
import { PullToRefresh } from '@/components/shared/pull-to-refresh';
import { PublicDesktopSidebar } from '@/components/shared/public-desktop-sidebar';
import { PublicStickyHeader } from '@/components/shared/public-sticky-header';

export const revalidate = 60;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirstVisitSplash>
      <PullToRefresh>
        <div className="lg:flex lg:items-start">
          <PublicDesktopSidebar />
          <div className="flex-1 min-w-0 lg:flex lg:flex-col lg:min-h-screen">
            <PublicStickyHeader />
            <main className="flex-1 mx-auto w-full max-w-2xl md:max-w-3xl lg:max-w-none lg:px-8 xl:px-12 lg:py-2 px-4 pb-8">
              {children}
            </main>
          </div>
        </div>
      </PullToRefresh>
    </FirstVisitSplash>
  );
}

