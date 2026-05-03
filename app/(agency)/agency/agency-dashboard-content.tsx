'use client';

import Image from 'next/image';
import { MapPin, Users, Eye, Plus, Settings, Bell, AlertTriangle, Building2, Coins } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { placeholderImage } from '@/lib/utils';

type DashboardAgency = {
  name: string;
  logo_url: string | null;
};

type DashboardLead = {
  id: string;
  full_name: string;
  status: string;
  created_at: string;
  tour?: { title: string | null } | null;
};

type ActiveTourPromo = {
  id: string;
  title: string;
  cover_image_url: string | null;
  price: number;
  currency?: string | null;
  country?: string | null;
  city?: string | null;
};

interface AgencyDashboardContentProps {
  data: {
    agency: DashboardAgency;
    activeTours: number;
    totalLeads: number;
    recentLeads: DashboardLead[];
    totalViews: number;
    activeToursList: ActiveTourPromo[];
    maxCoinBalance: number;
    isProfileComplete: boolean;
  } | null;
}

export function AgencyDashboardContent({ data }: AgencyDashboardContentProps) {
  const { t } = useTranslation();

  const randomTour = data?.activeToursList.length
    ? data.activeToursList[
      Math.abs((data.agency.name ?? '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % data.activeToursList.length
    ]
    : null;

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

  // Format lead time ago
  const timeAgo = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="market-section flex items-center justify-between p-4 md:p-5">
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
        <div className="market-section border border-amber-200 bg-amber-50 p-4">
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

      {/* Stat Cards — horizontal compact row */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="market-section p-4 text-center">
          <MapPin className="h-4 w-4 text-indigo-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{data.activeTours}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{t.agency.activeTours}</p>
        </div>
        <div className="market-section p-4 text-center">
          <Eye className="h-4 w-4 text-violet-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{data.totalViews}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{t.agency.totalViews}</p>
        </div>
        <div className="market-section p-4 text-center">
          <Users className="h-4 w-4 text-sky-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{data.totalLeads}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{t.agency.totalLeads}</p>
        </div>
      </div>

      {/* MaxCoin Balance + Tour Promotion */}
      <div className="relative overflow-hidden rounded-[1.7rem] bg-[linear-gradient(130deg,#0d5f8d,#0f7fa7,#127097)] p-5 text-white shadow-[0_28px_52px_-30px_rgba(15,23,42,0.75)]">
        <div className="absolute top-2 right-2 opacity-20">
          <Coins className="h-14 w-14" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{t.agency.maxCoinBalance}</p>
              <p className="text-2xl font-bold">{data.maxCoinBalance.toLocaleString()} MC</p>
            </div>
            <Link href="/agency/advertising">
              <button className="bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
                {t.maxcoin.buyCoins}
              </button>
            </Link>
          </div>
          {randomTour ? (
            <div className="bg-black/15 backdrop-blur rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 shrink-0">
                  <Image
                    src={randomTour.cover_image_url || placeholderImage(96, 96, randomTour.title)}
                    alt={randomTour.title}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{randomTour.title}</p>
                  <p className="text-[10px] opacity-80">{t.agency.promoteTourHint}</p>
                </div>
              </div>
              <Link href="/agency/advertising">
                <button className="mt-2 w-full bg-white text-indigo-700 font-bold text-xs py-2 rounded-lg hover:bg-white/90 transition-colors">
                  {t.agency.promoteTour}
                </button>
              </Link>
            </div>
          ) : (
            <p className="text-xs opacity-70">{t.agency.noActiveToursToPush}</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-base font-bold text-foreground mb-4">{t.agency.quickActions}</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Link href={data.isProfileComplete ? '/agency/tours/new' : '/agency/profile'} className={`market-section flex flex-col items-center gap-2 py-5 transition-all hover:-translate-y-0.5 ${!data.isProfileComplete ? 'opacity-60' : ''}`}>
            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
              <Plus className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="text-xs font-semibold text-foreground">{t.agency.addTour}</span>
          </Link>
          <Link href="/agency/tours" className="market-section flex flex-col items-center gap-2 py-5 transition-all hover:-translate-y-0.5">
            <div className="h-12 w-12 rounded-full bg-violet-50 flex items-center justify-center">
              <Settings className="h-5 w-5 text-violet-600" />
            </div>
            <span className="text-xs font-semibold text-foreground">{t.agency.manageTours}</span>
          </Link>
          <Link href="/agency/leads" className="market-section flex flex-col items-center gap-2 py-5 transition-all hover:-translate-y-0.5">
            <div className="h-12 w-12 rounded-full bg-sky-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-sky-600" />
            </div>
            <span className="text-xs font-semibold text-foreground">{t.agency.viewLeads}</span>
          </Link>
          <Link href="/agency/profile" className="market-section flex flex-col items-center gap-2 py-5 transition-all hover:-translate-y-0.5">
            <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-foreground">{t.agency.editProfile}</span>
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
            {data.recentLeads.map((lead) => (
              <div key={lead.id} className="market-section flex items-center gap-3 p-3.5">
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
          <div className="market-section p-6 text-center">
            <p className="text-sm text-muted-foreground">{t.agency.noLeadsYet}</p>
          </div>
        )}
      </section>
    </div>
  );
}
