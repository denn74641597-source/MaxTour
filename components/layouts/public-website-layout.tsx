import { FirstVisitSplash } from '@/components/shared/first-visit-splash';
import { PullToRefresh } from '@/components/shared/pull-to-refresh';
import { PublicStickyHeader } from '@/components/shared/public-sticky-header';
import { BottomNav } from '@/components/shared/bottom-nav';

export function PublicWebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirstVisitSplash>
      <PullToRefresh>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.18),_transparent_36%),linear-gradient(180deg,#f8fbff_0%,#f6f8fb_36%,#f4f6f9_100%)]">
          <PublicStickyHeader />
          <main className="mx-auto w-full max-w-[1480px] px-4 pb-24 pt-6 md:px-6 md:pt-8 lg:px-8 xl:px-10 2xl:px-12">
            <div className="public-page-shell">{children}</div>
          </main>
          <BottomNav />
        </div>
      </PullToRefresh>
    </FirstVisitSplash>
  );
}
