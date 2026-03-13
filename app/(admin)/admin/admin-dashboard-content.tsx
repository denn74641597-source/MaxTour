'use client';

import { Building2, MapPin, Users, CreditCard } from 'lucide-react';
import { DashboardStatCard } from '@/components/shared/dashboard-stat-card';
import { useTranslation } from '@/lib/i18n';

interface AdminDashboardContentProps {
  stats: {
    totalAgencies: number;
    totalTours: number;
    totalLeads: number;
    activeSubscriptions: number;
  };
}

export function AdminDashboardContent({ stats }: AdminDashboardContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t.admin.dashboard}</h1>
        <p className="text-sm text-muted-foreground">{t.admin.platformOverview}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DashboardStatCard title={t.admin.totalAgencies} value={stats.totalAgencies} icon={Building2} />
        <DashboardStatCard title={t.admin.totalTours} value={stats.totalTours} icon={MapPin} />
        <DashboardStatCard title={t.admin.totalLeads} value={stats.totalLeads} icon={Users} />
        <DashboardStatCard
          title={t.admin.activeSubscriptions}
          value={stats.activeSubscriptions}
          icon={CreditCard}
        />
      </div>
    </div>
  );
}
