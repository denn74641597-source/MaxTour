import { AdminSidebar } from './admin-sidebar';

export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-64">
        {children}
      </main>
    </div>
  );
}
