'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Coins,
  Eye,
  FileCheck2,
  Layers3,
  MapPin,
  Megaphone,
  Plus,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { GlassCard } from '@/components/pioneerui/glass-card';
import { GlowCard } from '@/components/pioneerui/glow-card';
import { useTranslation } from '@/lib/i18n';
import { placeholderImage } from '@/lib/utils';

type DashboardAgency = {
  id: string;
  name: string;
  logo_url: string | null;
  is_verified: boolean;
  is_approved: boolean;
};

export type DashboardLead = {
  id: string;
  full_name: string;
  status: string;
  created_at: string;
  tour_title: string | null;
};

export type ActiveTourPromo = {
  id: string;
  title: string;
  cover_image_url: string | null;
  price: number | null;
  currency: string | null;
  country: string | null;
  city: string | null;
};

type VerificationSummary = {
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

type PlanSummary = {
  planName: string;
  maxTours: number;
  currentTours: number;
  canCreate: boolean;
};

type ReadyDashboardViewModel = {
  status: 'ready';
  agency: DashboardAgency;
  activeTours: number;
  totalTours: number;
  totalLeads: number;
  recentLeads: DashboardLead[];
  recentLeadsWindowCount: number;
  totalViews: number;
  activeToursList: ActiveTourPromo[];
  maxCoinBalance: number;
  isProfileComplete: boolean;
  interestsCount: number;
  activePromotionsCount: number;
  analytics: {
    totalInterests: number;
    totalCalls: number;
    totalTelegram: number;
    trackedTours: number;
  };
  latestVerification: VerificationSummary | null;
  planSummary: PlanSummary | null;
};

export type AgencyDashboardViewModel =
  | { status: 'missing_agency' }
  | { status: 'error' }
  | ReadyDashboardViewModel;

interface AgencyDashboardContentProps {
  viewModel: AgencyDashboardViewModel;
}

function StatTile({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <Card className="border border-border/60 bg-white/90 shadow-[0_24px_40px_-34px_rgba(15,23,42,0.65)]">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatCurrency(value: number | null, currency: string | null) {
  if (typeof value !== 'number') return '—';
  return `${value.toLocaleString()} ${currency ?? 'UZS'}`;
}

export function AgencyDashboardContent({ viewModel }: AgencyDashboardContentProps) {
  const { t } = useTranslation();

  if (viewModel.status === 'missing_agency') {
    return (
      <Card className="border border-border/60 bg-white/95 shadow-[0_24px_44px_-36px_rgba(15,23,42,0.68)]">
        <CardHeader>
          <CardTitle className="text-xl">{t.agency.agencyDashboard}</CardTitle>
          <CardDescription>{t.agency.noAgencyFound}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/agency/profile">
            <Button>{t.agency.setupAgency}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (viewModel.status === 'error') {
    return (
      <Card className="border border-red-200 bg-red-50/80 shadow-[0_24px_44px_-36px_rgba(153,27,27,0.45)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <ShieldAlert className="h-5 w-5" />
            {t.agency.dashboardErrorTitle}
          </CardTitle>
          <CardDescription className="text-red-700">{t.agency.dashboardErrorHint}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/agency">
            <Button variant="destructive">{t.agency.loadErrorAction}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const data = viewModel;
  const randomTour = data.activeToursList.length
    ? data.activeToursList[
        Math.abs((data.agency.name ?? '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) %
          data.activeToursList.length
      ]
    : null;

  const verificationLabel = data.latestVerification
    ? data.latestVerification.status === 'pending'
      ? t.verification.pending
      : data.latestVerification.status === 'approved'
        ? t.verification.approved
        : t.verification.rejected
    : t.agency.verificationNotSubmitted;

  return (
    <div className="space-y-6 pb-10">
      <GlowCard className="rounded-[2rem]">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200/75 bg-[linear-gradient(120deg,#0b4f6f,#12648a,#0f7f95)] text-white shadow-[0_36px_70px_-40px_rgba(15,23,42,0.9)]">
          <div className="grid gap-5 p-5 md:p-7 xl:grid-cols-[1.35fr_1fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/40 bg-white/20">
                  {data.agency.logo_url ? (
                    <Image
                      src={data.agency.logo_url}
                      alt={data.agency.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold">
                      {data.agency.name?.charAt(0)?.toUpperCase() ?? 'A'}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-semibold tracking-tight">{data.agency.name}</h1>
                  <p className="text-sm text-sky-100">{t.agency.overviewSubtitle}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/16 text-white">
                  <Bell className="h-3 w-3" />
                  {t.agency.welcomeBack}
                </Badge>
                <Badge className={data.agency.is_approved ? 'bg-blue-600/75 text-white' : 'bg-white/15 text-white'}>
                  {data.agency.is_approved ? <CheckCircle2 className="h-3 w-3" /> : <FileCheck2 className="h-3 w-3" />}
                  {data.agency.is_approved ? t.verification.approvedBadgeYes : t.verification.approvedBadgeNo}
                </Badge>
                <Badge className={data.agency.is_verified ? 'bg-emerald-600/75 text-white' : 'bg-white/15 text-white'}>
                  {data.agency.is_verified ? <Sparkles className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                  {data.agency.is_verified ? t.verification.verifiedBadgeYes : t.verification.verifiedBadgeNo}
                </Badge>
              </div>
            </div>

            <GlassCard className="border-white/35 bg-white/10">
              <div className="grid gap-2 p-4">
                <Link href={data.isProfileComplete ? '/agency/tours/new' : '/agency/profile'}>
                  <Button className="h-10 w-full justify-between bg-white text-slate-900 hover:bg-slate-100">
                    <span>{t.agency.addTour}</span>
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/agency/requests">
                  <Button variant="secondary" className="h-10 w-full justify-between bg-white/14 text-white hover:bg-white/20">
                    <span>{t.agency.viewLeads}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/agency/verification">
                  <Button variant="secondary" className="h-10 w-full justify-between bg-white/14 text-white hover:bg-white/20">
                    <span>{t.verification.title}</span>
                    <FileCheck2 className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/agency/advertising">
                  <Button variant="secondary" className="h-10 w-full justify-between bg-white/14 text-white hover:bg-white/20">
                    <span>{t.nav.advertising}</span>
                    <Megaphone className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
      </GlowCard>

      {!data.isProfileComplete && (
        <Card className="border border-amber-200 bg-amber-50">
          <CardContent className="flex gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900">{t.agency.profileIncompleteTitle}</p>
              <p className="mt-1 text-xs text-amber-800">{t.agency.profileIncompleteHint}</p>
              <Link href="/agency/profile" className="mt-2 inline-block">
                <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-700">
                  {t.agency.goToProfile}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t.nav.overview}</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatTile icon={<MapPin className="h-5 w-5" />} value={data.activeTours} label={t.agency.activeTours} />
          <StatTile icon={<Eye className="h-5 w-5" />} value={data.totalViews} label={t.agency.totalViews} />
          <StatTile icon={<Users className="h-5 w-5" />} value={data.totalLeads} label={t.agency.totalLeads} />
          <StatTile icon={<Bell className="h-5 w-5" />} value={data.recentLeadsWindowCount} label={t.agency.requestsLast48h} />
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <Card className="border border-border/60 bg-white/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers3 className="h-4 w-4 text-primary" />
              {t.nav.tours}
            </CardTitle>
            <CardDescription>{t.agency.manageTours}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-100/75 p-3">
                <p className="text-xs text-muted-foreground">{t.statusLabels.published}</p>
                <p className="text-lg font-bold">{data.activeTours}</p>
              </div>
              <div className="rounded-xl bg-slate-100/75 p-3">
                <p className="text-xs text-muted-foreground">{t.analytics.total}</p>
                <p className="text-lg font-bold">{data.totalTours}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/agency/tours/new">
                <Button className="w-full">{t.agency.addTour}</Button>
              </Link>
              <Link href="/agency/tours">
                <Button variant="outline" className="w-full">
                  {t.agency.manageTours}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-white/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              {t.nav.requests}
            </CardTitle>
            <CardDescription>{t.leadsPage.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-100/75 p-3">
                <p className="text-xs text-muted-foreground">{t.leadsPage.title}</p>
                <p className="text-lg font-bold">{data.totalLeads}</p>
              </div>
              <div className="rounded-xl bg-slate-100/75 p-3">
                <p className="text-xs text-muted-foreground">{t.nav.interested}</p>
                <p className="text-lg font-bold">{data.interestsCount}</p>
              </div>
            </div>
            <Link href="/agency/requests">
              <Button variant="outline" className="w-full justify-between">
                {t.agency.viewLeads}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-white/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-primary" />
              {t.verification.title}
            </CardTitle>
            <CardDescription>{t.agency.verificationStatusLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-xl bg-slate-100/75 p-3">
              <p className="text-xs text-muted-foreground">{t.common.status}</p>
              <p className="text-lg font-bold">{verificationLabel}</p>
              {data.latestVerification && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.agency.verificationLastRequestLabel}: {formatDate(data.latestVerification.created_at)}
                </p>
              )}
            </div>
            <Link href="/agency/verification">
              <Button variant="outline" className="w-full justify-between">
                {t.verification.title}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <GlowCard className="rounded-3xl xl:col-span-1">
          <div className="overflow-hidden rounded-3xl border border-indigo-200 bg-[linear-gradient(130deg,#1e3a8a,#2563eb,#0284c7)] text-white">
            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-blue-100">{t.agency.maxCoinBalance}</p>
                  <p className="mt-1 text-2xl font-bold">{data.maxCoinBalance.toLocaleString()} MC</p>
                </div>
                <Coins className="h-8 w-8 text-blue-100/80" />
              </div>
              <div className="rounded-2xl bg-black/20 p-3">
                <p className="text-xs text-blue-100">{t.maxcoin.activePromotions}</p>
                <p className="text-xl font-semibold">{data.activePromotionsCount}</p>
              </div>
              <div className="space-y-2 rounded-2xl bg-black/20 p-3">
                {randomTour ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Image
                        src={randomTour.cover_image_url ?? placeholderImage(72, 72, randomTour.title)}
                        alt={randomTour.title}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{randomTour.title}</p>
                        <p className="truncate text-xs text-blue-100">{formatCurrency(randomTour.price, randomTour.currency)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-100">{t.agency.promoteTourHint}</p>
                  </>
                ) : (
                  <p className="text-xs text-blue-100">{t.agency.noActiveToursToPush}</p>
                )}
              </div>
              <Link href="/agency/advertising">
                <Button className="w-full bg-white text-slate-900 hover:bg-slate-100">{t.nav.advertising}</Button>
              </Link>
            </div>
          </div>
        </GlowCard>

        <Card className="border border-border/60 bg-white/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              {t.analytics.title}
            </CardTitle>
            <CardDescription>{t.analytics.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-100/75 p-3">
                <p className="text-xs text-muted-foreground">{t.analytics.interests}</p>
                <p className="text-lg font-bold">{data.analytics.totalInterests}</p>
              </div>
              <div className="rounded-xl bg-slate-100/75 p-3">
                <p className="text-xs text-muted-foreground">{t.analytics.calls}</p>
                <p className="text-lg font-bold">{data.analytics.totalCalls}</p>
              </div>
              <div className="rounded-xl bg-slate-100/75 p-3">
                <p className="text-xs text-muted-foreground">{t.analytics.telegram}</p>
                <p className="text-lg font-bold">{data.analytics.totalTelegram}</p>
              </div>
              <div className="rounded-xl bg-slate-100/75 p-3">
                <p className="text-xs text-muted-foreground">{t.agency.trackedToursLabel}</p>
                <p className="text-lg font-bold">{data.analytics.trackedTours}</p>
              </div>
            </div>
            <Link href="/agency/analytics">
              <Button variant="outline" className="w-full justify-between">
                {t.analytics.title}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-white/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              {t.subscriptionPage.currentPlan}
            </CardTitle>
            <CardDescription>{t.agency.subscription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {data.planSummary ? (
              <>
                <div className="rounded-xl bg-slate-100/75 p-3">
                  <p className="text-xs text-muted-foreground">{t.subscriptionPage.currentPlan}</p>
                  <p className="text-lg font-bold">{data.planSummary.planName}</p>
                </div>
                <div className="rounded-xl bg-slate-100/75 p-3">
                  <p className="text-xs text-muted-foreground">{t.agency.planUsageLabel}</p>
                  <p className="text-lg font-bold">
                    {data.planSummary.currentTours}/{data.planSummary.maxTours}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.max(data.planSummary.maxTours - data.planSummary.currentTours, 0)} {t.agency.planRemainingLabel}
                  </p>
                </div>
                <Badge variant={data.planSummary.canCreate ? 'secondary' : 'destructive'}>
                  {data.planSummary.canCreate ? t.statusLabels.active : t.statusLabels.expired}
                </Badge>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t.analytics.noData}</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t.agency.recentLeads}</h2>
            <p className="text-xs text-muted-foreground">{t.agency.recentLeadsSubtitle}</p>
          </div>
          <Link href="/agency/requests" className="text-xs font-semibold text-primary hover:underline">
            {t.agency.seeAll}
          </Link>
        </div>

        {data.recentLeads.length === 0 ? (
          <Card className="border border-border/60 bg-white/90">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">{t.agency.noLeadsYet}</CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {data.recentLeads.map((lead) => (
              <Card key={lead.id} className="border border-border/60 bg-white/95">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                    <Users className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{lead.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{lead.tour_title ?? t.nav.tours}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <StatusBadge status={lead.status} />
                    <p className="text-xs text-muted-foreground">{formatDate(lead.created_at)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
