'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Coins,
  FileWarning,
  Layers3,
  LifeBuoy,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Star,
  User,
  Users,
} from 'lucide-react';
import type { AdminDashboardData } from '@/features/admin/queries';
import { PageTitle, SectionShell } from '@/components/shared-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface AdminDashboardContentProps {
  data: AdminDashboardData | null;
  errorMessage?: string;
}

type MetricKey =
  | 'totalUsers'
  | 'totalAgencies'
  | 'totalTours'
  | 'pendingModerationItems'
  | 'pendingVerificationRequests'
  | 'newLeads7d'
  | 'activePromotions'
  | 'activeSubscriptions';

const EMPTY_TEXT = 'Not available';

function formatCount(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return EMPTY_TEXT;
  return value.toLocaleString();
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return EMPTY_TEXT;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_TEXT;
  return date.toLocaleString();
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return EMPTY_TEXT;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_TEXT;
  return date.toLocaleDateString();
}

function endsSoonBadge(isoDate: string | null | undefined) {
  if (!isoDate) return null;
  const end = new Date(isoDate).getTime();
  if (Number.isNaN(end)) return null;
  const days = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return <Badge variant="destructive">Expired</Badge>;
  if (days <= 3) return <Badge variant="destructive">{days}d left</Badge>;
  if (days <= 7) return <Badge variant="secondary">{days}d left</Badge>;
  return <Badge variant="outline">{days}d left</Badge>;
}

function StatusPill({ label, tone }: { label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const toneClass = {
    good: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    warn: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    bad: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
    neutral: 'bg-slate-200/70 text-slate-700 border-slate-300/70',
  }[tone];

  return <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', toneClass)}>{label}</span>;
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'neutral',
  onClick,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
  onClick: () => void;
}) {
  const toneClass = {
    neutral: 'from-slate-500/10 to-slate-500/5 border-slate-200',
    good: 'from-emerald-500/10 to-emerald-500/5 border-emerald-200/80',
    warn: 'from-amber-500/10 to-amber-500/5 border-amber-200/80',
    bad: 'from-rose-500/10 to-rose-500/5 border-rose-200/80',
  }[tone];

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative rounded-3xl border bg-gradient-to-b p-5 text-left transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70',
        'hover:-translate-y-0.5 hover:shadow-[0_20px_32px_-28px_rgba(15,23,42,0.8)]',
        toneClass,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{formatCount(value)}</p>
        </div>
        <span className="rounded-2xl border border-white/70 bg-white/90 p-2.5 text-slate-600 shadow-sm transition-colors group-hover:text-slate-900">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="text-xs text-slate-500">{subtitle}</p>
      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sky-700 opacity-0 transition-opacity group-hover:opacity-100">
        View details <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

export function AdminDashboardContent({ data, errorMessage }: AdminDashboardContentProps) {
  const router = useRouter();
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null);

  const generatedAtText = useMemo(() => formatDateTime(data?.generatedAt), [data?.generatedAt]);

  if (errorMessage || !data) {
    return (
      <div className="p-6">
        <Card className="border-rose-200 bg-rose-50/60">
          <CardHeader>
            <CardTitle className="text-rose-900">Dashboard failed to load</CardTitle>
            <CardDescription className="text-rose-700">
              {errorMessage ?? 'Unknown dashboard loading error.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Button onClick={() => router.refresh()}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Refresh Dashboard
            </Button>
            <Link href="/admin/settings" className="text-sm text-rose-700 underline underline-offset-4">
              Check admin configuration
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metricDetails: Record<MetricKey, { title: string; description: string; body: React.ReactNode; linkHref: string; linkLabel: string }> = {
    totalUsers: {
      title: 'Total Users',
      description: 'Role distribution across all registered profiles.',
      body: (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">Users</p><p className="text-lg font-bold">{formatCount(data.breakdowns.usersByRole.user)}</p></CardContent></Card>
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">Agency Managers</p><p className="text-lg font-bold">{formatCount(data.breakdowns.usersByRole.agency_manager)}</p></CardContent></Card>
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">Admins</p><p className="text-lg font-bold">{formatCount(data.breakdowns.usersByRole.admin)}</p></CardContent></Card>
          </div>
        </div>
      ),
      linkHref: '/admin/users',
      linkLabel: 'Open Users',
    },
    totalAgencies: {
      title: 'Total Agencies',
      description: 'Approval and verification state of agency accounts.',
      body: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">Approved</p><p className="text-lg font-bold">{formatCount(data.breakdowns.agencies.approved)}</p></CardContent></Card>
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">Pending Approval</p><p className="text-lg font-bold">{formatCount(data.breakdowns.agencies.pending)}</p></CardContent></Card>
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">Verified</p><p className="text-lg font-bold">{formatCount(data.breakdowns.agencies.verified)}</p></CardContent></Card>
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">With Active Subscription</p><p className="text-lg font-bold">{formatCount(data.breakdowns.agencies.withActiveSubscription)}</p></CardContent></Card>
          </div>
        </div>
      ),
      linkHref: '/admin/agencies',
      linkLabel: 'Open Agencies',
    },
    totalTours: {
      title: 'Total Tours',
      description: 'Tour lifecycle by moderation status.',
      body: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">Draft</p><p className="text-lg font-bold">{formatCount(data.breakdowns.toursByStatus.draft)}</p></CardContent></Card>
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">Pending</p><p className="text-lg font-bold">{formatCount(data.breakdowns.toursByStatus.pending)}</p></CardContent></Card>
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">Published</p><p className="text-lg font-bold">{formatCount(data.breakdowns.toursByStatus.published)}</p></CardContent></Card>
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">Archived</p><p className="text-lg font-bold">{formatCount(data.breakdowns.toursByStatus.archived)}</p></CardContent></Card>
          </div>
        </div>
      ),
      linkHref: '/admin/tours',
      linkLabel: 'Open Tours',
    },
    pendingModerationItems: {
      title: 'Pending Moderation',
      description: 'All items currently waiting for admin action.',
      body: (
        <div className="space-y-2">
          {data.actionCenter.map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
              <Badge variant={item.count > 0 ? 'secondary' : 'outline'}>{formatCount(item.count)}</Badge>
            </div>
          ))}
        </div>
      ),
      linkHref: '/admin/tours',
      linkLabel: 'Review Queue',
    },
    pendingVerificationRequests: {
      title: 'Pending Verification',
      description: 'Agency verification submissions waiting review.',
      body: (
        <div className="space-y-2">
          {data.recent.verificationQueue.length === 0 ? (
            <p className="text-sm text-slate-500">No pending verification requests.</p>
          ) : (
            data.recent.verificationQueue.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">{item.agency_name ?? 'Unknown agency'}</p>
                <p className="text-xs text-slate-500">{formatDateTime(item.created_at)}</p>
              </div>
            ))
          )}
        </div>
      ),
      linkHref: '/admin/verification',
      linkLabel: 'Open Verification',
    },
    newLeads7d: {
      title: 'New Leads (7d)',
      description: 'Lead flow and conversion pipeline snapshot.',
      body: (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">New</p><p className="text-lg font-bold">{formatCount(data.breakdowns.leadsByStatus.new)}</p></CardContent></Card>
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">Contacted</p><p className="text-lg font-bold">{formatCount(data.breakdowns.leadsByStatus.contacted)}</p></CardContent></Card>
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">Won</p><p className="text-lg font-bold">{formatCount(data.breakdowns.leadsByStatus.won)}</p></CardContent></Card>
          </div>
          <Separator />
          <div className="space-y-2">
            {data.recent.leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-900">{lead.full_name}</p>
                  <p className="text-xs text-slate-500">{lead.tour_title ?? 'Tour not linked'} · {lead.agency_name ?? 'Agency unknown'}</p>
                </div>
                <StatusPill
                  label={lead.status}
                  tone={lead.status === 'won' ? 'good' : lead.status === 'lost' ? 'bad' : lead.status === 'new' ? 'warn' : 'neutral'}
                />
              </div>
            ))}
          </div>
        </div>
      ),
      linkHref: '/admin/leads',
      linkLabel: 'Open Leads',
    },
    activePromotions: {
      title: 'Active Promotions / MaxCoin',
      description: 'Featured placements and coin transaction activity.',
      body: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">Active Placements</p><p className="text-lg font-bold">{formatCount(data.summary.activePromotions)}</p></CardContent></Card>
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">Expiring in 7d</p><p className="text-lg font-bold">{formatCount(data.summary.expiringPromotions7d)}</p></CardContent></Card>
          </div>
          <Card size="sm">
            <CardContent className="py-3">
              <p className="text-xs text-slate-500">MaxCoin Transactions (7d)</p>
              <p className="text-lg font-bold">{formatCount(data.summary.maxCoinActivity7d)}</p>
            </CardContent>
          </Card>
        </div>
      ),
      linkHref: '/admin/coin-requests',
      linkLabel: 'Open MaxCoin',
    },
    activeSubscriptions: {
      title: 'Active Subscriptions',
      description: 'Subscription footprint and near-term expiry risk.',
      body: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">Active Agencies</p><p className="text-lg font-bold">{formatCount(data.summary.activeSubscriptions)}</p></CardContent></Card>
            <Card size="sm"><CardContent className="py-3"><p className="text-xs text-slate-500">Estimated Plan Sum</p><p className="text-lg font-bold">{data.summary.estimatedMonthlyRevenue == null ? EMPTY_TEXT : formatCount(data.summary.estimatedMonthlyRevenue)}</p></CardContent></Card>
          </div>
          {data.quality.expiringSubscriptions.length === 0 ? (
            <p className="text-sm text-slate-500">No active subscriptions expiring in the next 14 days.</p>
          ) : (
            <div className="space-y-2">
              {data.quality.expiringSubscriptions.slice(0, 4).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{sub.agency_name ?? 'Unknown agency'}</p>
                    <p className="text-xs text-slate-500">{sub.plan_name ?? 'Unknown plan'} · {formatShortDate(sub.ends_at)}</p>
                  </div>
                  {endsSoonBadge(sub.ends_at)}
                </div>
              ))}
            </div>
          )}
        </div>
      ),
      linkHref: '/admin/subscriptions',
      linkLabel: 'Open Subscriptions',
    },
  };

  const selectedMetricDetails = selectedMetric ? metricDetails[selectedMetric] : null;

  const kpiCards: Array<{
    key: MetricKey;
    title: string;
    value: number;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: 'neutral' | 'good' | 'warn' | 'bad';
  }> = [
    {
      key: 'totalUsers',
      title: 'Total Users',
      value: data.summary.totalUsers,
      subtitle: 'profiles table',
      icon: Users,
      tone: 'neutral',
    },
    {
      key: 'totalAgencies',
      title: 'Total Agencies',
      value: data.summary.totalAgencies,
      subtitle: `${data.breakdowns.agencies.pending} pending approval`,
      icon: Building2,
      tone: data.breakdowns.agencies.pending > 0 ? 'warn' : 'good',
    },
    {
      key: 'totalTours',
      title: 'Total Tours',
      value: data.summary.totalTours,
      subtitle: `${data.breakdowns.toursByStatus.pending} pending moderation`,
      icon: MapPin,
      tone: data.breakdowns.toursByStatus.pending > 0 ? 'warn' : 'neutral',
    },
    {
      key: 'pendingModerationItems',
      title: 'Pending Moderation',
      value: data.summary.pendingModerationItems,
      subtitle: 'Combined admin queue',
      icon: AlertTriangle,
      tone: data.summary.pendingModerationItems > 0 ? 'bad' : 'good',
    },
    {
      key: 'pendingVerificationRequests',
      title: 'Verification Queue',
      value: data.summary.pendingVerificationRequests,
      subtitle: 'verification_requests pending',
      icon: ShieldCheck,
      tone: data.summary.pendingVerificationRequests > 0 ? 'warn' : 'good',
    },
    {
      key: 'newLeads7d',
      title: 'New Leads (7d)',
      value: data.summary.newLeads7d,
      subtitle: 'Recent inquiry volume',
      icon: User,
      tone: data.summary.newLeads7d > 0 ? 'good' : 'neutral',
    },
    {
      key: 'activePromotions',
      title: 'Active Promotions',
      value: data.summary.activePromotions,
      subtitle: `${data.summary.expiringPromotions7d} expiring in 7 days`,
      icon: Star,
      tone: data.summary.expiringPromotions7d > 0 ? 'warn' : 'good',
    },
    {
      key: 'activeSubscriptions',
      title: 'Active Subscriptions',
      value: data.summary.activeSubscriptions,
      subtitle: data.summary.estimatedMonthlyRevenue == null ? 'Revenue not available' : 'Plan-based indicator',
      icon: Layers3,
      tone: data.summary.activeSubscriptions > 0 ? 'good' : 'neutral',
    },
  ];

  return (
    <div className="space-y-6 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_24px_36px_-30px_rgba(15,23,42,0.65)] backdrop-blur">
        <PageTitle title="Dashboard" subtitle="Marketplace operational overview" />
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-7 px-2.5 text-xs">
            <CalendarClock className="mr-1 h-3.5 w-3.5" />
            Last updated: {generatedAtText}
          </Badge>
          <Button variant="outline" onClick={() => router.refresh()}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <SectionShell className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card) => (
            <KpiCard
              key={card.key}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              icon={card.icon}
              tone={card.tone}
              onClick={() => setSelectedMetric(card.key)}
            />
          ))}
        </div>
      </SectionShell>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
        <SectionShell className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-amber-600" />
                Action Center
              </CardTitle>
              <CardDescription>Items requiring immediate admin attention.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.actionCenter.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'group flex items-center justify-between rounded-2xl border p-3 transition-all hover:border-slate-300 hover:bg-slate-50',
                    item.count > 0 && item.severity === 'high' && 'border-rose-200 bg-rose-50/40',
                    item.count > 0 && item.severity === 'medium' && 'border-amber-200 bg-amber-50/40',
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.count > 0 ? 'secondary' : 'outline'}>{formatCount(item.count)}</Badge>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-slate-700" />
                Recent Operational Activity
              </CardTitle>
              <CardDescription>Latest marketplace events from real admin data tables.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">Latest Tours</p>
                  <Link href="/admin/tours" className="text-xs text-sky-700 hover:underline">Open Tours</Link>
                </div>
                <div className="space-y-2">
                  {data.recent.tours.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500">No recent tour records.</p>
                  ) : (
                    data.recent.tours.slice(0, 5).map((tour) => (
                      <Link key={tour.id} href={`/admin/tours/${tour.id}`} className="block rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium text-slate-900">{tour.title}</p>
                          <StatusPill
                            label={tour.status}
                            tone={tour.status === 'pending' ? 'warn' : tour.status === 'published' ? 'good' : 'neutral'}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {tour.agency_name ?? 'Unknown agency'} · {formatDateTime(tour.created_at)}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">Latest Agencies</p>
                  <Link href="/admin/agencies" className="text-xs text-sky-700 hover:underline">Open Agencies</Link>
                </div>
                <div className="space-y-2">
                  {data.recent.agencies.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500">No recent agency records.</p>
                  ) : (
                    data.recent.agencies.slice(0, 5).map((agency) => (
                      <Link key={agency.id} href="/admin/agencies" className="block rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium text-slate-900">{agency.name}</p>
                          <div className="flex items-center gap-1.5">
                            <StatusPill label={agency.is_approved ? 'Approved' : 'Pending'} tone={agency.is_approved ? 'good' : 'warn'} />
                            {agency.is_verified ? <StatusPill label="Verified" tone="good" /> : null}
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {(agency.city || agency.country) ? `${agency.city ?? ''}${agency.city && agency.country ? ', ' : ''}${agency.country ?? ''} · ` : ''}
                          {formatDateTime(agency.created_at)}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">Recent Leads</p>
                  <Link href="/admin/leads" className="text-xs text-sky-700 hover:underline">Open Leads</Link>
                </div>
                <div className="space-y-2">
                  {data.recent.leads.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500">No recent leads.</p>
                  ) : (
                    data.recent.leads.slice(0, 5).map((lead) => (
                      <Link key={lead.id} href="/admin/leads" className="block rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium text-slate-900">{lead.full_name}</p>
                          <StatusPill
                            label={lead.status}
                            tone={lead.status === 'won' ? 'good' : lead.status === 'lost' ? 'bad' : lead.status === 'new' ? 'warn' : 'neutral'}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {lead.tour_title ?? 'Tour unknown'} · {lead.agency_name ?? 'Agency unknown'} · {formatDateTime(lead.created_at)}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionShell>

        <SectionShell className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                Marketplace Health
              </CardTitle>
              <CardDescription>Status distribution across tours, leads, and agency quality.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Tours by status</p>
                <div className="space-y-2">
                  {Object.entries(data.breakdowns.toursByStatus).map(([status, count]) => {
                    const total = Math.max(data.summary.totalTours, 1);
                    const width = Math.max((count / total) * 100, count > 0 ? 8 : 0);
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span className="capitalize">{status}</span>
                          <span>{formatCount(count)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-slate-700/80 transition-all" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Agency quality</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border border-slate-200 p-2.5"><p className="text-xs text-slate-500">Approved</p><p className="font-semibold">{formatCount(data.breakdowns.agencies.approved)}</p></div>
                  <div className="rounded-xl border border-slate-200 p-2.5"><p className="text-xs text-slate-500">Pending</p><p className="font-semibold">{formatCount(data.breakdowns.agencies.pending)}</p></div>
                  <div className="rounded-xl border border-slate-200 p-2.5"><p className="text-xs text-slate-500">Verified</p><p className="font-semibold">{formatCount(data.breakdowns.agencies.verified)}</p></div>
                  <div className="rounded-xl border border-slate-200 p-2.5"><p className="text-xs text-slate-500">With Subscription</p><p className="font-semibold">{formatCount(data.breakdowns.agencies.withActiveSubscription)}</p></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-700" />
                Marketplace Quality Signals
              </CardTitle>
              <CardDescription>Most viewed tours and listings with missing critical content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Top viewed tours</p>
                <div className="space-y-2">
                  {data.quality.topViewedTours.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500">No view_count data available.</p>
                  ) : (
                    data.quality.topViewedTours.slice(0, 5).map((tour) => (
                      <Link key={tour.id} href={`/admin/tours/${tour.id}`} className="block rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium text-slate-900">{tour.title}</p>
                          <Badge variant="outline">{formatCount(tour.view_count)} views</Badge>
                        </div>
                        <p className="text-xs text-slate-500">{tour.agency_name ?? 'Unknown agency'}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Incomplete listings</p>
                <div className="space-y-2">
                  {data.quality.incompleteTours.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-3 text-xs text-emerald-700">
                      No incomplete listings detected by current quality rules.
                    </p>
                  ) : (
                    data.quality.incompleteTours.slice(0, 5).map((tour) => (
                      <Link key={tour.id} href={`/admin/tours/${tour.id}`} className="block rounded-xl border border-amber-200 bg-amber-50/40 p-2.5 hover:bg-amber-50">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-slate-900">{tour.title}</p>
                          <Badge variant="secondary">{tour.issues.length} issues</Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">{tour.issues.join(' · ')}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-slate-700" />
                Expiry Watch
              </CardTitle>
              <CardDescription>Promotions and subscriptions expiring soon.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Promotions (7 days)</p>
                  <Link href="/admin/featured" className="text-xs text-sky-700 hover:underline">Open Promotions</Link>
                </div>
                {data.quality.expiringPromotions.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500">No promotions expiring in next 7 days.</p>
                ) : (
                  <div className="space-y-2">
                    {data.quality.expiringPromotions.slice(0, 4).map((promotion) => (
                      <Link key={promotion.id} href="/admin/featured" className="block rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {promotion.tour_title ?? promotion.agency_name ?? 'Promotion item'}
                          </p>
                          {endsSoonBadge(promotion.ends_at)}
                        </div>
                        <p className="text-xs text-slate-500">{promotion.placement_type ?? 'placement unknown'}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Subscriptions (14 days)</p>
                  <Link href="/admin/subscriptions" className="text-xs text-sky-700 hover:underline">Open Subscriptions</Link>
                </div>
                {data.quality.expiringSubscriptions.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500">No active subscriptions expiring in next 14 days.</p>
                ) : (
                  <div className="space-y-2">
                    {data.quality.expiringSubscriptions.slice(0, 4).map((sub) => (
                      <Link key={sub.id} href="/admin/subscriptions" className="block rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-slate-900">{sub.agency_name ?? 'Unknown agency'}</p>
                          {endsSoonBadge(sub.ends_at)}
                        </div>
                        <p className="text-xs text-slate-500">{sub.plan_name ?? 'Unknown plan'} · {formatShortDate(sub.ends_at)}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </SectionShell>
      </div>

      {(data.warnings.length > 0 || data.unavailable.length > 0) && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <FileWarning className="h-4 w-4" />
              Dashboard Data Notes
            </CardTitle>
            <CardDescription className="text-amber-700">
              Some optional widgets may be partial based on current table availability and query responses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-amber-800">
            {data.unavailable.length > 0 ? (
              <p>
                <strong>Unavailable sources:</strong> {data.unavailable.join(', ')}
              </p>
            ) : null}
            {data.warnings.slice(0, 8).map((warning) => (
              <p key={warning}>• {warning}</p>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(selectedMetricDetails)} onOpenChange={(open) => !open && setSelectedMetric(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMetricDetails?.title}</DialogTitle>
            <DialogDescription>{selectedMetricDetails?.description}</DialogDescription>
          </DialogHeader>
          <div>{selectedMetricDetails?.body}</div>
          <DialogFooter>
            {selectedMetricDetails ? (
              <Link href={selectedMetricDetails.linkHref}>
                <Button>
                  {selectedMetricDetails.linkLabel}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" disabled>
                <LifeBuoy className="mr-1 h-4 w-4" />
                No metric selected
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
