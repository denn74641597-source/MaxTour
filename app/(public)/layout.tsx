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
          <main className="mx-auto w-full max-w-2xl px-4 pb-8 md:max-w-3xl lg:max-w-5xl lg:px-8 xl:max-w-6xl xl:px-12">
            {children}
          </main>
        </div>
      </PullToRefresh>
    </FirstVisitSplash>
  );
}

