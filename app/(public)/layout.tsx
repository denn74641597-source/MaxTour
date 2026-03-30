import { AppHeader } from '@/components/shared/app-header';
import { BottomNav } from '@/components/shared/bottom-nav';
import { PullToRefresh } from '@/components/shared/pull-to-refresh';

export const revalidate = 60;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PullToRefresh>
      <AppHeader />
      <main className="flex-1 mx-auto w-full max-w-2xl pb-24">{children}</main>
      <BottomNav />
    </PullToRefresh>
  );
}
