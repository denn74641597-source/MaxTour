import { FirstVisitSplash } from '@/components/shared/first-visit-splash';
import { PullToRefresh } from '@/components/shared/pull-to-refresh';
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
        <div className="min-h-screen">
          <PublicStickyHeader />
          <main className="mx-auto w-full max-w-[1480px] px-4 pb-8 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
            {children}
          </main>
        </div>
      </PullToRefresh>
    </FirstVisitSplash>
  );
}

