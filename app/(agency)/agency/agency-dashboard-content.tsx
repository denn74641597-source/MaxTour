'use client';

import Image from 'next/image';
import { MapPin, Users, Eye, Plus, Settings, Bell, Star, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { placeholderImage } from '@/lib/utils';

interface AgencyDashboardContentProps {
  data: {
    agency: any;
    activeTours: number;
    totalLeads: number;
    recentLeads: any[];
    featuredTours: number;
    profileViews: number;
    subscription: any;
    isProfileComplete: boolean;
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

  const sub = data.subscription as any;
  const planName = sub?.plan?.name;
  const endDate = sub?.end_date ? new Date(sub.end_date) : null;
  const daysLeft = endDate ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  // Format lead time ago
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} ${t.agency.timeMinAgo}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ${t.agency.timeHourAgo}`;
    const days = Math.floor(hrs / 24);
    return `${days} ${t.agency.timeDayAgo}`;
  };

  const statCards = [
    {
      icon: <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center"><MapPin className="h-5 w-5 text-indigo-600" /></div>,
      label: t.agency.activeTours,
      value: data.activeTours,
      color: 'text-emerald-500',
    },
    {
      icon: <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center"><Eye className="h-5 w-5 text-violet-600" /></div>,
      label: t.agency.totalViews,
      value: data.profileViews,
      color: 'text-emerald-500',
    },
    {
      icon: <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center"><Users className="h-5 w-5 text-sky-600" /></div>,
      label: t.agency.totalLeads,
      value: data.totalLeads,
      color: data.totalLeads > 0 ? 'text-emerald-500' : 'text-red-500',
    },
  ];

  return (
    <div className="space-y-6 pb-6">


      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0">
            {data.agency.logo_url ? (
              <Image src={data.agency.logo_url} alt={data.agency.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm">{data.agency.name?.charAt(0)?.toUpperCase() ?? 'A'}</span>
            )}
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">{data.agency.name}</h1>
            <p className="text-xs text-muted-foreground">{t.agency.welcomeBack}</p>
          </div>
        </div>
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Profile Completion Banner */}
      {!data.isProfileComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-800">{t.agency.profileIncompleteTitle}</h3>
              <p className="text-xs text-amber-700 mt-0.5">{t.agency.profileIncompleteHint}</p>
              <Link href="/agency/profile">
                <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700 text-white">
                  {t.agency.goToProfile}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards — stacked */}
      <div className="space-y-3">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-surface rounded-[1.5rem] shadow-ambient p-4">
            <div className="flex items-center justify-between mb-1">
              {stat.icon}
              <span className={`text-xs font-semibold ${stat.color}`}>
                {stat.color.includes('emerald') ? '+' : '-'}{Math.floor(Math.random() * 15 + 1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Subscription Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-3 right-3 opacity-20">
          <Star className="h-16 w-16" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center">
              <Star className="h-2.5 w-2.5 text-white" />
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">{t.agency.premiumPlan}</span>
          </div>
          <h3 className="text-lg font-bold">{t.agency.subscriptionActive}</h3>
          <p className="text-xs text-white/70 mt-0.5">
            {endDate
              ? `${t.agency.renewsIn} ${daysLeft} ${t.agency.days} • ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : planName ?? t.common.free
            }
          </p>
          <Link href="/agency/subscription">
            <button className="mt-3 w-full bg-card text-indigo-700 dark:text-indigo-300 font-bold text-sm py-2.5 rounded-xl hover:bg-surface transition-colors">
              {t.agency.upgrade}
            </button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-base font-bold text-foreground mb-4">{t.agency.quickActions}</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href={data.isProfileComplete ? '/agency/tours/new' : '/agency/profile'} className={`flex flex-col items-center gap-2 py-5 bg-surface rounded-[1.5rem] shadow-ambient hover:shadow-ambient-lg transition-all ${!data.isProfileComplete ? 'opacity-60' : ''}`}>
            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
              <Plus className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="text-xs font-semibold text-foreground">{t.agency.addTour}</span>
          </Link>
          <Link href="/agency/tours" className="flex flex-col items-center gap-2 py-5 bg-surface rounded-[1.5rem] shadow-ambient hover:shadow-ambient-lg transition-all">
            <div className="h-12 w-12 rounded-full bg-violet-50 flex items-center justify-center">
              <Settings className="h-5 w-5 text-violet-600" />
            </div>
            <span className="text-xs font-semibold text-foreground">{t.agency.manageTours}</span>
          </Link>
          <Link href="/agency/leads" className="flex flex-col items-center gap-2 py-5 bg-surface rounded-[1.5rem] shadow-ambient hover:shadow-ambient-lg transition-all">
            <div className="h-12 w-12 rounded-full bg-sky-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-sky-600" />
            </div>
            <span className="text-xs font-semibold text-foreground">{t.agency.viewLeads}</span>
          </Link>
        </div>
      </section>

      {/* Recent Leads */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">{t.agency.recentLeads}</h2>
          {data.recentLeads.length > 0 && (
            <Link href="/agency/leads" className="text-xs font-semibold text-indigo-600 hover:underline">
              {t.agency.seeAll}
            </Link>
          )}
        </div>
        {data.recentLeads.length > 0 ? (
          <div className="space-y-2.5">
            {data.recentLeads.map((lead: any) => (
              <div key={lead.id} className="flex items-center gap-3 bg-surface rounded-[1.5rem] shadow-ambient p-3.5">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{lead.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{lead.tour?.title ?? 'Tour'}</p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={lead.status} />
                  <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(lead.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface rounded-[1.5rem] shadow-ambient p-6 text-center">
            <p className="text-sm text-muted-foreground">{t.agency.noLeadsYet}</p>
          </div>
        )}
      </section>
    </div>
  );
}
