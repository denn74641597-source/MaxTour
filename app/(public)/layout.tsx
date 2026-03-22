import { AppHeader } from '@/components/shared/app-header';
import { BottomNav } from '@/components/shared/bottom-nav';

export const revalidate = 60;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 mx-auto w-full max-w-2xl pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
