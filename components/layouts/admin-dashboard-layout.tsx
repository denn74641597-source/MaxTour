'use client';

import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/app/(admin)/admin-sidebar';
import { AdminTopbar } from '@/app/(admin)/admin-topbar';
import { AdminRuntimeLocalizer } from '@/features/admin/i18n/runtime-localizer';

export function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return (
      <div data-admin-root>
        <AdminRuntimeLocalizer />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50" data-admin-root>
      <AdminRuntimeLocalizer />
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-[272px]">
        <AdminTopbar />
        {children}
      </main>
    </div>
  );
}
