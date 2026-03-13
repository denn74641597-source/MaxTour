'use client';

import { MapPin, Users, Star, CreditCard } from 'lucide-react';
import { DashboardStatCard } from '@/components/shared/dashboard-stat-card';
import { SectionHeader } from '@/components/shared/section-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

interface AgencyDashboardContentProps {
  data: {
    agency: any;
    activeTours: number;
    totalLeads: number;
    recentLeads: any[];
    featuredTours: number;
    subscription: any;
  } | null;
}

export function AgencyDashboardContent({ data }: AgencyDashboardContentProps) {
  const { t } = useTranslation();

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">{t.agency.agencyDashboard}</h1>
        <p className="text-muted-foreground">{t.agency.noAgencyFound}</p>
        <Link href="/agency/profile">
          <Button>{t.agency.setupAgency}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t.agency.dashboard}</h1>
        <p className="text-sm text-muted-foreground">{t.agency.welcomeBack}, {data.agency.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <DashboardStatCard title={t.agency.activeTours} value={data.activeTours} icon={MapPin} />
        <DashboardStatCard title={t.agency.totalLeads} value={data.totalLeads} icon={Users} />
        <DashboardStatCard title={t.agency.featuredTours} value={data.featuredTours} icon={Star} />
        <DashboardStatCard
          title={t.agency.subscription}
          value={(data.subscription as any)?.plan?.name ?? t.common.free}
          icon={CreditCard}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/agency/tours/new">
          <Button size="sm">{t.agency.newTour}</Button>
        </Link>
        <Link href="/agency/leads">
          <Button variant="outline" size="sm">{t.agency.viewLeads}</Button>
        </Link>
        <Link href="/agency/profile">
          <Button variant="outline" size="sm">{t.agency.editProfile}</Button>
        </Link>
      </div>

      {/* Recent Leads */}
      <section>
        <SectionHeader title={t.agency.recentLeads} />
        {data.recentLeads.length > 0 ? (
          <div className="space-y-2">
            {data.recentLeads.map((lead: any) => (
              <Card key={lead.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{lead.full_name}</p>
                    <p className="text-xs text-muted-foreground">{lead.tour?.title ?? 'Tour'}</p>
                  </div>
                  <StatusBadge status={lead.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t.agency.noLeadsYet}</p>
        )}
      </section>
    </div>
  );
}
