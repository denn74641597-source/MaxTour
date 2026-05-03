'use client';

import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/app/(admin)/admin-sidebar';

export function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-[272px]">
        {children}
      </main>
    </div>
  );
}
