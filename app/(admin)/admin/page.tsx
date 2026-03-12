import { Building2, MapPin, Users, CreditCard } from 'lucide-react';
import { DashboardStatCard } from '@/components/shared/dashboard-stat-card';
import { getAdminStats } from '@/features/admin/queries';

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DashboardStatCard title="Total Agencies" value={stats.totalAgencies} icon={Building2} />
        <DashboardStatCard title="Total Tours" value={stats.totalTours} icon={MapPin} />
        <DashboardStatCard title="Total Leads" value={stats.totalLeads} icon={Users} />
        <DashboardStatCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={CreditCard}
        />
      </div>
    </div>
  );
}
