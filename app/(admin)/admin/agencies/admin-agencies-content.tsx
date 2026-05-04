'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowUpDown,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleSlash,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageTitle, SectionShell } from '@/components/shared-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getAdminAgencyDetailAction, updateAgencyApprovalAction } from '@/features/admin/actions';
import type {
  AdminAgencyDetailPayload,
  AdminAgencyListRow,
  AdminAgencyTourPreview,
  AdminVerificationStatus,
} from '@/features/admin/types';
import { useDebouncedValue } from '@/features/admin/use-debounced-value';
import { approveVerificationAction, rejectVerificationAction } from '@/features/verification/actions';
import { cn, formatDate, formatNumber } from '@/lib/utils';

const AGENCIES_PAGE_SIZE = 60;

interface AdminAgenciesContentProps {
  agencies: AdminAgencyListRow[];
  generatedAt: string;
  loadError?: string;
}

type ApprovalFilter = 'all' | 'approved' | 'pending_approval';
type VerificationFilter = 'all' | 'verified' | 'pending' | 'rejected' | 'not_requested';
type HasToursFilter = 'all' | 'has_tours' | 'no_tours';
type ActivityFilter = 'all' | 'active_30d' | 'quiet_30d' | 'dormant_90d';
type SortOption = 'newest' | 'oldest' | 'most_tours' | 'pending_verification' | 'most_active';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

function normalize(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().trim();
}

function safeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return value;
  } catch {
    return null;
  }
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return 'Not available';
  return parsed.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getActivityBucket(lastActivityAt: string | null): ActivityFilter {
  if (!lastActivityAt) return 'dormant_90d';
  const ms = new Date(lastActivityAt).getTime();
  if (!Number.isFinite(ms)) return 'dormant_90d';
  const age = Date.now() - ms;
  if (age <= THIRTY_DAYS_MS) return 'active_30d';
  if (age <= NINETY_DAYS_MS) return 'quiet_30d';
  return 'dormant_90d';
}

function formatRelativeActivity(lastActivityAt: string | null): string {
  if (!lastActivityAt) return 'No activity';
  const ms = new Date(lastActivityAt).getTime();
  if (!Number.isFinite(ms)) return 'No activity';
  const delta = Date.now() - ms;
  const hours = Math.floor(delta / (60 * 60 * 1000));
  if (hours < 1) return 'Active now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function verificationTone(status: AdminVerificationStatus | null): string {
  if (status === 'pending') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'approved') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'rejected') return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function verificationLabel(status: AdminVerificationStatus | null): string {
  if (status === 'pending') return 'Pending verification';
  if (status === 'approved') return 'Verification approved';
  if (status === 'rejected') return 'Verification rejected';
  return 'Not requested';
}

function AgencyAvatar({ name, logoUrl, className }: { name: string; logoUrl?: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  const safeUrl = safeImageUrl(logoUrl);

  return (
    <div className={cn('relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-slate-100', className)}>
      {safeUrl && !failed ? (
        <img
          src={safeUrl}
          alt={`${name} logo`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-sm font-semibold text-slate-500">{name.slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const toneClasses: Record<NonNullable<typeof tone>, string> = {
    default: 'border-slate-200',
    success: 'border-emerald-200',
    warning: 'border-amber-200',
    danger: 'border-rose-200',
    info: 'border-sky-200',
  };

  return (
    <Card className={cn('rounded-2xl border bg-white py-4', toneClasses[tone ?? 'default'])}>
      <CardContent className="space-y-1 px-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
        <p className="text-2xl font-semibold text-slate-900">{formatNumber(value)}</p>
      </CardContent>
    </Card>
  );
}

export function AdminAgenciesContent({ agencies, generatedAt, loadError }: AdminAgenciesContentProps) {
  const router = useRouter();

  const [lastUpdatedAt, setLastUpdatedAt] = useState(generatedAt);
  const [search, setSearch] = useState('');
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>('all');
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [hasToursFilter, setHasToursFilter] = useState<HasToursFilter>('all');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);

  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'verification' | 'tours' | 'leads' | 'operations'>('overview');
  const [detailCache, setDetailCache] = useState<Record<string, AdminAgencyDetailPayload>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [approvalIntent, setApprovalIntent] = useState<{ agency: AdminAgencyListRow; nextApproved: boolean } | null>(null);
  const [verificationIntent, setVerificationIntent] = useState<{
    agency: AdminAgencyListRow;
    requestId: string;
    action: 'approve' | 'reject';
  } | null>(null);
  const [verificationRejectNote, setVerificationRejectNote] = useState('');
  const [processingActionKey, setProcessingActionKey] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 250);

  useEffect(() => {
    setLastUpdatedAt(generatedAt);
  }, [generatedAt]);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const agency of agencies) {
      if (agency.city) set.add(agency.city);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [agencies]);

  const subscriptionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const agency of agencies) {
      if (agency.subscription?.status) set.add(agency.subscription.status);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [agencies]);

  const filteredAgencies = useMemo(() => {
    const searchQuery = normalize(debouncedSearch);

    const withFilters = agencies.filter((agency) => {
      const haystack = [
        agency.name,
        agency.slug,
        agency.phone,
        agency.telegram_username,
        agency.city,
        agency.country,
        agency.owner?.full_name,
        agency.owner?.email,
        agency.owner?.phone,
      ]
        .map((value) => normalize(value))
        .join(' ');

      if (searchQuery && !haystack.includes(searchQuery)) {
        return false;
      }

      if (approvalFilter === 'approved' && !agency.is_approved) return false;
      if (approvalFilter === 'pending_approval' && agency.is_approved) return false;

      if (verificationFilter === 'verified' && !agency.is_verified) return false;
      if (verificationFilter === 'pending' && agency.verification.latestStatus !== 'pending') return false;
      if (verificationFilter === 'rejected' && agency.verification.latestStatus !== 'rejected') return false;
      if (verificationFilter === 'not_requested' && agency.verification.latestStatus !== null) return false;

      if (subscriptionFilter === 'none' && agency.subscription) return false;
      if (subscriptionFilter !== 'all' && subscriptionFilter !== 'none' && agency.subscription?.status !== subscriptionFilter) {
        return false;
      }

      if (cityFilter !== 'all' && agency.city !== cityFilter) return false;

      if (hasToursFilter === 'has_tours' && agency.stats.totalTours <= 0) return false;
      if (hasToursFilter === 'no_tours' && agency.stats.totalTours > 0) return false;

      if (activityFilter !== 'all' && getActivityBucket(agency.stats.lastActivityAt) !== activityFilter) return false;

      if (createdFrom) {
        const created = new Date(agency.created_at).getTime();
        const fromMs = new Date(`${createdFrom}T00:00:00`).getTime();
        if (Number.isFinite(created) && Number.isFinite(fromMs) && created < fromMs) return false;
      }

      if (createdTo) {
        const created = new Date(agency.created_at).getTime();
        const toMs = new Date(`${createdTo}T23:59:59`).getTime();
        if (Number.isFinite(created) && Number.isFinite(toMs) && created > toMs) return false;
      }

      return true;
    });

    return [...withFilters].sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'most_tours') return b.stats.totalTours - a.stats.totalTours;
      if (sortBy === 'pending_verification') {
        const aRank = a.verification.latestStatus === 'pending' ? 0 : 1;
        const bRank = b.verification.latestStatus === 'pending' ? 0 : 1;
        if (aRank !== bRank) return aRank - bRank;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'most_active') {
        return new Date(b.stats.lastActivityAt ?? 0).getTime() - new Date(a.stats.lastActivityAt ?? 0).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [
    agencies,
    debouncedSearch,
    approvalFilter,
    verificationFilter,
    subscriptionFilter,
    cityFilter,
    hasToursFilter,
    activityFilter,
    createdFrom,
    createdTo,
    sortBy,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    activityFilter,
    approvalFilter,
    cityFilter,
    createdFrom,
    createdTo,
    debouncedSearch,
    hasToursFilter,
    sortBy,
    subscriptionFilter,
    verificationFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredAgencies.length / AGENCIES_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const visibleAgencies = useMemo(() => {
    const startIndex = (safePage - 1) * AGENCIES_PAGE_SIZE;
    return filteredAgencies.slice(startIndex, startIndex + AGENCIES_PAGE_SIZE);
  }, [filteredAgencies, safePage]);

  const selectedAgency = useMemo(
    () => agencies.find((agency) => agency.id === selectedAgencyId) ?? null,
    [agencies, selectedAgencyId]
  );

  const selectedDetail = selectedAgencyId ? detailCache[selectedAgencyId] : undefined;

  const overviewStats = useMemo(() => {
    const total = agencies.length;
    const pendingVerification = agencies.filter((agency) => agency.verification.latestStatus === 'pending').length;
    const verified = agencies.filter((agency) => agency.is_verified).length;
    const restricted = agencies.filter((agency) => !agency.is_approved || agency.verification.latestStatus === 'rejected').length;
    const activeTours = agencies.filter((agency) => agency.stats.publishedTours > 0).length;
    const missingData = agencies.filter((agency) => agency.stats.missingFieldCount > 0).length;

    return {
      total,
      pendingVerification,
      verified,
      restricted,
      activeTours,
      missingData,
    };
  }, [agencies]);

  async function openAgencyDetail(agency: AdminAgencyListRow, tab: 'overview' | 'verification' | 'tours' | 'leads' | 'operations' = 'overview') {
    setSelectedAgencyId(agency.id);
    setSelectedTab(tab);
    setDetailError(null);

    if (detailCache[agency.id]) return;

    setDetailLoadingId(agency.id);
    const result = await getAdminAgencyDetailAction(agency.id);
    setDetailLoadingId(null);

    if (result.error || !result.data) {
      setDetailError(result.error ?? 'Unable to load agency details.');
      return;
    }

    setDetailCache((current) => ({
      ...current,
      [agency.id]: result.data,
    }));
  }

  function resetFilters() {
    setSearch('');
    setApprovalFilter('all');
    setVerificationFilter('all');
    setSubscriptionFilter('all');
    setCityFilter('all');
    setHasToursFilter('all');
    setActivityFilter('all');
    setCreatedFrom('');
    setCreatedTo('');
    setSortBy('newest');
  }

  async function executeApprovalAction() {
    if (!approvalIntent) return;

    const { agency, nextApproved } = approvalIntent;
    const actionKey = `approval:${agency.id}`;
    setProcessingActionKey(actionKey);

    const result = await updateAgencyApprovalAction(agency.id, nextApproved);

    setProcessingActionKey(null);
    setApprovalIntent(null);

    if (result.error) {
      toast.error('Could not update agency approval status.');
      return;
    }

    toast.success(nextApproved ? 'Agency approved.' : 'Agency rejected.');
    setDetailCache((current) => {
      const next = { ...current };
      delete next[agency.id];
      return next;
    });
    setLastUpdatedAt(new Date().toISOString());
    router.refresh();
  }

  async function executeVerificationAction() {
    if (!verificationIntent) return;

    const { agency, requestId, action } = verificationIntent;
    const actionKey = `verification:${agency.id}:${requestId}`;
    setProcessingActionKey(actionKey);

    const result =
      action === 'approve'
        ? await approveVerificationAction(requestId, agency.id)
        : await rejectVerificationAction(requestId, agency.id, verificationRejectNote.trim() || undefined);

    setProcessingActionKey(null);
    setVerificationIntent(null);
    setVerificationRejectNote('');

    if (result.error) {
      toast.error('Could not update verification request.');
      return;
    }

    toast.success(action === 'approve' ? 'Verification approved.' : 'Verification rejected.');
    setDetailCache((current) => {
      const next = { ...current };
      delete next[agency.id];
      return next;
    });
    setLastUpdatedAt(new Date().toISOString());
    router.refresh();
  }

  async function copyValue(value: string | null | undefined, label: string) {
    if (!value) {
      toast.error(`${label} is not available.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`);
    }
  }

  const isActionBusy = processingActionKey !== null;

  return (
    <SectionShell className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle
          title="Agencies"
          subtitle="Agency onboarding, verification, performance, and moderation overview"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLastUpdatedAt(new Date().toISOString());
              router.refresh();
            }}
          >
            <RefreshCw />
            Refresh
          </Button>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
            Last updated: <span className="font-medium text-slate-900">{formatDateTime(lastUpdatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard title="Total Agencies" value={overviewStats.total} tone="default" />
        <MetricCard title="Pending Verification" value={overviewStats.pendingVerification} tone="warning" />
        <MetricCard title="Verified" value={overviewStats.verified} tone="success" />
        <MetricCard title="Rejected / Not Approved" value={overviewStats.restricted} tone="danger" />
        <MetricCard title="With Active Tours" value={overviewStats.activeTours} tone="info" />
        <MetricCard title="Missing Profile Data" value={overviewStats.missingData} tone="warning" />
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white py-3">
        <CardContent className="space-y-3 px-4">
          <div className="grid gap-2 xl:grid-cols-[1.3fr_repeat(6,minmax(0,1fr))]">
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, manager, phone, email, city..."
                className="h-9 pl-8"
              />
            </div>

            <Select value={approvalFilter} onValueChange={(value) => setApprovalFilter(value as ApprovalFilter)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Approval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending_approval">Pending approval</SelectItem>
              </SelectContent>
            </Select>

            <Select value={verificationFilter} onValueChange={(value) => setVerificationFilter(value as VerificationFilter)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All verification</SelectItem>
                <SelectItem value="verified">Verified badge</SelectItem>
                <SelectItem value="pending">Pending request</SelectItem>
                <SelectItem value="rejected">Rejected request</SelectItem>
                <SelectItem value="not_requested">No request</SelectItem>
              </SelectContent>
            </Select>

            <Select value={subscriptionFilter} onValueChange={(value) => setSubscriptionFilter(value ?? 'all')}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Subscription" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subscriptions</SelectItem>
                <SelectItem value="none">No subscription</SelectItem>
                {subscriptionOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={(value) => setCityFilter(value ?? 'all')}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {cityOptions.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={activityFilter} onValueChange={(value) => setActivityFilter(value as ActivityFilter)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All activity</SelectItem>
                <SelectItem value="active_30d">Active (30d)</SelectItem>
                <SelectItem value="quiet_30d">Quiet (31-90d)</SelectItem>
                <SelectItem value="dormant_90d">Dormant (90d+)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={hasToursFilter} onValueChange={(value) => setHasToursFilter(value as HasToursFilter)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Tours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any tours</SelectItem>
                <SelectItem value="has_tours">Has tours</SelectItem>
                <SelectItem value="no_tours">No tours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
            <Input
              type="date"
              value={createdFrom}
              onChange={(event) => setCreatedFrom(event.target.value)}
              className="h-9"
              aria-label="Created from"
            />
            <Input
              type="date"
              value={createdTo}
              onChange={(event) => setCreatedTo(event.target.value)}
              className="h-9"
              aria-label="Created to"
            />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="h-9 w-full">
                <ArrowUpDown />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="most_tours">Most tours</SelectItem>
                <SelectItem value="pending_verification">Pending verification first</SelectItem>
                <SelectItem value="most_active">Most active</SelectItem>
              </SelectContent>
            </Select>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Showing <span className="font-semibold text-slate-900">{visibleAgencies.length}</span> of{' '}
              <span className="font-semibold text-slate-900">{agencies.length}</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-1.5 py-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-12 text-center text-xs font-medium text-slate-700">
                {safePage}/{totalPages}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={safePage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {loadError && agencies.length === 0 ? (
        <Card className="rounded-2xl border border-rose-200 bg-rose-50 py-4">
          <CardContent className="flex items-center justify-between gap-3 px-5">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">{loadError}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.refresh()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border border-slate-200 bg-white py-2">
        <CardContent className="px-2">
          {filteredAgencies.length === 0 ? (
            <div className="flex min-h-[340px] flex-col items-center justify-center gap-2 text-center">
              <CircleSlash className="h-10 w-10 text-slate-300" />
              <h3 className="text-base font-semibold text-slate-800">No agencies match the current filters</h3>
              <p className="max-w-md text-sm text-slate-500">Try adjusting search terms or filter values to surface more agencies.</p>
              <Button variant="outline" size="sm" onClick={resetFilters}>Reset filters</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Agency</th>
                    <th className="px-3 py-3">Contact</th>
                    <th className="px-3 py-3">Location</th>
                    <th className="px-3 py-3">Verification</th>
                    <th className="px-3 py-3">Subscription</th>
                    <th className="px-3 py-3">Metrics</th>
                    <th className="px-3 py-3">Created</th>
                    <th className="px-3 py-3">Last activity</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAgencies.map((agency) => {
                    const pendingRequest = agency.verification.latestStatus === 'pending';

                    return (
                      <tr
                        key={agency.id}
                        className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
                        onClick={() => openAgencyDetail(agency)}
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <AgencyAvatar name={agency.name} logoUrl={agency.logo_url} />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">{agency.name}</p>
                              <p className="truncate text-xs text-slate-500">/{agency.slug}</p>
                              <div className="mt-1 flex items-center gap-1.5">
                                {agency.is_approved ? (
                                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Approved</Badge>
                                ) : (
                                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Pending approval</Badge>
                                )}
                                {agency.stats.missingFieldCount > 0 ? (
                                  <button
                                    type="button"
                                    className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openAgencyDetail(agency, 'operations');
                                    }}
                                  >
                                    {agency.stats.missingFieldCount} missing
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <div className="space-y-1 text-xs text-slate-600">
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400" />
                              {agency.phone ?? 'Not provided'}
                            </p>
                            <p className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-slate-400" />
                              {agency.owner?.email ?? 'Not provided'}
                            </p>
                            <p className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-slate-400" />
                              {agency.owner?.full_name ?? 'Not provided'}
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <p className="text-sm font-medium text-slate-800">
                            {agency.city ? `${agency.city}, ${agency.country}` : agency.country}
                          </p>
                          <p className="text-xs text-slate-500">{agency.address ?? 'Address not provided'}</p>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <div className="space-y-1.5">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openAgencyDetail(agency, 'verification');
                              }}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium',
                                verificationTone(agency.verification.latestStatus)
                              )}
                            >
                              {agency.verification.latestStatus === 'pending' ? <Clock3 className="h-3 w-3" /> : null}
                              {agency.verification.latestStatus === 'approved' ? <ShieldCheck className="h-3 w-3" /> : null}
                              {agency.verification.latestStatus === 'rejected' ? <ShieldX className="h-3 w-3" /> : null}
                              {agency.verification.latestStatus === null ? <CircleSlash className="h-3 w-3" /> : null}
                              {verificationLabel(agency.verification.latestStatus)}
                            </button>
                            <p className="text-xs text-slate-500">
                              {agency.is_verified ? 'Badge: verified' : 'Badge: not verified'}
                            </p>
                            {pendingRequest ? <p className="text-xs font-medium text-amber-700">Requires admin decision</p> : null}
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top">
                          {agency.subscription ? (
                            <div className="space-y-1">
                              <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                                {agency.subscription.status}
                              </Badge>
                              <p className="text-xs text-slate-600">{agency.subscription.plan?.name ?? 'Plan not linked'}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">Not available</span>
                          )}
                        </td>

                        <td className="px-3 py-3 align-top">
                          <div className="space-y-1 text-xs">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openAgencyDetail(agency, 'tours');
                              }}
                              className="font-medium text-slate-800 hover:text-blue-600"
                            >
                              Tours: {formatNumber(agency.stats.totalTours)}
                            </button>
                            <p className="text-slate-500">Published: {formatNumber(agency.stats.publishedTours)}</p>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openAgencyDetail(agency, 'leads');
                              }}
                              className="font-medium text-slate-800 hover:text-blue-600"
                            >
                              Leads: {formatNumber(agency.stats.totalLeads)}
                            </button>
                            <p className="text-slate-500">30d leads: {formatNumber(agency.stats.recentLeads30d)}</p>
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top text-xs text-slate-600">
                          <p>{formatDate(agency.created_at)}</p>
                          <p className="text-slate-500">{formatDateTime(agency.created_at)}</p>
                        </td>

                        <td className="px-3 py-3 align-top text-xs text-slate-600">
                          <p className="font-medium text-slate-800">{formatRelativeActivity(agency.stats.lastActivityAt)}</p>
                          <p className="text-slate-500">{formatDateTime(agency.stats.lastActivityAt)}</p>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <div className="flex items-center justify-end gap-1.5" onClick={(event) => event.stopPropagation()}>
                            <Button size="sm" variant="outline" onClick={() => openAgencyDetail(agency)}>
                              <Eye />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant={agency.is_approved ? 'destructive' : 'default'}
                              onClick={() => setApprovalIntent({ agency, nextApproved: !agency.is_approved })}
                              disabled={isActionBusy}
                            >
                              {agency.is_approved ? <XCircle /> : <CheckCircle2 />}
                              {agency.is_approved ? 'Reject' : 'Approve'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyValue(agency.phone ?? agency.owner?.email, 'Contact')}
                            >
                              <Copy />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAgency ? (
        <Sheet
          open={Boolean(selectedAgencyId)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedAgencyId(null);
              setDetailError(null);
            }
          }}
        >
          <SheetContent side="right" className="w-full overflow-y-auto border-l border-slate-200 bg-white sm:max-w-3xl">
            <>
              <SheetHeader className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-start gap-3">
                  <AgencyAvatar name={selectedAgency.name} logoUrl={selectedAgency.logo_url} className="h-14 w-14" />
                  <div className="min-w-0 space-y-1">
                    <SheetTitle className="truncate text-xl font-semibold text-slate-900">{selectedAgency.name}</SheetTitle>
                    <SheetDescription className="text-sm text-slate-500">/{selectedAgency.slug}</SheetDescription>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <Badge variant="outline" className={selectedAgency.is_approved ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                        {selectedAgency.is_approved ? 'Approved' : 'Pending approval'}
                      </Badge>
                      <Badge variant="outline" className={verificationTone(selectedAgency.verification.latestStatus)}>
                        {verificationLabel(selectedAgency.verification.latestStatus)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-4 p-6">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    variant={selectedAgency.is_approved ? 'destructive' : 'default'}
                    onClick={() => setApprovalIntent({ agency: selectedAgency, nextApproved: !selectedAgency.is_approved })}
                    disabled={isActionBusy}
                  >
                    {selectedAgency.is_approved ? <XCircle /> : <CheckCircle2 />}
                    {selectedAgency.is_approved ? 'Reject agency' : 'Approve agency'}
                  </Button>
                  <Button variant="outline" onClick={() => copyValue(selectedAgency.phone ?? selectedAgency.owner?.email, 'Primary contact')}>
                    <Copy />
                    Copy contact
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/admin/tours')}>
                    <Building2 />
                    View tours list
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/admin/leads')}>
                    <Building2 />
                    View leads list
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!selectedAgency.slug}
                    onClick={() => {
                      if (!selectedAgency.slug) return;
                      window.open(`/agencies/${selectedAgency.slug}`, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <ExternalLink />
                    Open public profile
                  </Button>
                  <Button variant="ghost" disabled>
                    <CircleSlash />
                    Suspend (not supported)
                  </Button>
                </div>

                {detailLoadingId === selectedAgency.id ? (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-36 rounded-2xl" />
                    <Skeleton className="h-36 rounded-2xl" />
                  </div>
                ) : detailError ? (
                  <Card className="rounded-2xl border border-rose-200 bg-rose-50 py-4">
                    <CardContent className="flex items-center justify-between gap-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-rose-700">
                        <AlertTriangle className="h-4 w-4" />
                        {detailError}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAgencyDetail(selectedAgency, selectedTab)}
                      >
                        Retry
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <AgencyDetailTabs
                    agency={selectedAgency}
                    detail={selectedDetail}
                    activeTab={selectedTab}
                    onTabChange={setSelectedTab}
                    onCopy={copyValue}
                    onApproveVerification={(requestId) =>
                      setVerificationIntent({ agency: selectedAgency, requestId, action: 'approve' })
                    }
                    onRejectVerification={(requestId) => {
                      setVerificationRejectNote(selectedAgency.verification.latestAdminNote ?? '');
                      setVerificationIntent({ agency: selectedAgency, requestId, action: 'reject' });
                    }}
                  />
                )}
              </div>
            </>
          </SheetContent>
        </Sheet>
      ) : null}

      <Dialog open={Boolean(approvalIntent)} onOpenChange={(open) => !open && setApprovalIntent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalIntent?.nextApproved ? 'Approve agency?' : 'Reject agency?'}
            </DialogTitle>
            <DialogDescription>
              {approvalIntent
                ? `This will update ${approvalIntent.agency.name} approval status in the agencies table.`
                : 'Confirm agency approval update.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalIntent(null)} disabled={isActionBusy}>Cancel</Button>
            <Button
              variant={approvalIntent?.nextApproved ? 'default' : 'destructive'}
              onClick={executeApprovalAction}
              disabled={isActionBusy}
            >
              {isActionBusy ? <Loader2 className="animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(verificationIntent)} onOpenChange={(open) => !open && setVerificationIntent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verificationIntent?.action === 'approve' ? 'Approve verification request?' : 'Reject verification request?'}
            </DialogTitle>
            <DialogDescription>
              {verificationIntent?.action === 'approve'
                ? 'This marks the request approved and sets agency verified badge to true.'
                : 'This marks the request rejected and removes the verified badge.'}
            </DialogDescription>
          </DialogHeader>

          {verificationIntent?.action === 'reject' ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">Admin note (optional)</p>
              <Textarea
                value={verificationRejectNote}
                onChange={(event) => setVerificationRejectNote(event.target.value)}
                placeholder="Provide rejection reason for audit history"
                className="min-h-24"
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setVerificationIntent(null)} disabled={isActionBusy}>Cancel</Button>
            <Button
              variant={verificationIntent?.action === 'approve' ? 'default' : 'destructive'}
              onClick={executeVerificationAction}
              disabled={isActionBusy}
            >
              {isActionBusy ? <Loader2 className="animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionShell>
  );
}

function AgencyDetailTabs({
  agency,
  detail,
  activeTab,
  onTabChange,
  onCopy,
  onApproveVerification,
  onRejectVerification,
}: {
  agency: AdminAgencyListRow;
  detail?: AdminAgencyDetailPayload;
  activeTab: 'overview' | 'verification' | 'tours' | 'leads' | 'operations';
  onTabChange: (tab: 'overview' | 'verification' | 'tours' | 'leads' | 'operations') => void;
  onCopy: (value: string | null | undefined, label: string) => Promise<void>;
  onApproveVerification: (requestId: string) => void;
  onRejectVerification: (requestId: string) => void;
}) {
  const tours = detail?.tours ?? [];
  const leads = detail?.leads ?? [];
  const verificationRequests = detail?.verificationRequests ?? [];
  const subscriptions = detail?.subscriptions ?? [];
  const maxcoinTransactions = detail?.maxcoinTransactions ?? [];
  const promotions = detail?.promotions ?? [];

  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as typeof activeTab)}>
      <TabsList className="grid grid-cols-5 rounded-xl bg-slate-100 p-1">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="verification">Verification</TabsTrigger>
        <TabsTrigger value="tours">Tours</TabsTrigger>
        <TabsTrigger value="leads">Leads</TabsTrigger>
        <TabsTrigger value="operations">Ops</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4 pt-3">
        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="grid gap-3 px-4 sm:grid-cols-2">
            <InfoLine icon={<Building2 className="h-4 w-4" />} label="Agency name" value={agency.name} />
            <InfoLine icon={<Building2 className="h-4 w-4" />} label="Slug" value={agency.slug} />
            <InfoLine icon={<Phone className="h-4 w-4" />} label="Phone" value={agency.phone ?? 'Not provided'} onCopy={() => onCopy(agency.phone, 'Phone')} />
            <InfoLine icon={<Mail className="h-4 w-4" />} label="Owner email" value={agency.owner?.email ?? 'Not provided'} onCopy={() => onCopy(agency.owner?.email, 'Owner email')} />
            <InfoLine icon={<MapPin className="h-4 w-4" />} label="Location" value={agency.city ? `${agency.city}, ${agency.country}` : agency.country} />
            <InfoLine icon={<Calendar className="h-4 w-4" />} label="Created" value={formatDateTime(agency.created_at)} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-2 px-4">
            <p className="text-sm font-semibold text-slate-900">Manager and company</p>
            <p className="text-sm text-slate-700">Manager: {agency.owner?.full_name ?? 'Not provided'}</p>
            <p className="text-sm text-slate-700">Telegram: {agency.telegram_username ?? agency.owner?.telegram_username ?? 'Not provided'}</p>
            <p className="text-sm text-slate-700">Responsible person: {agency.responsible_person ?? 'Not provided'}</p>
            <p className="text-sm text-slate-700">INN: {agency.inn ?? 'Not provided'}</p>
            <p className="text-sm text-slate-700">Address: {agency.address ?? 'Not provided'}</p>
            <p className="text-sm text-slate-700">Website: {agency.website_url ?? 'Not provided'}</p>
            <p className="text-sm text-slate-700">Instagram: {agency.instagram_url ?? 'Not provided'}</p>
            <p className="text-sm text-slate-700">Google Maps URL: {agency.google_maps_url ?? 'Not provided'}</p>
            <p className="text-sm text-slate-700">Description: {agency.description ?? 'Not provided'}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="grid gap-3 px-4 sm:grid-cols-3">
            <MiniMetric label="Tours" value={agency.stats.totalTours} />
            <MiniMetric label="Leads" value={agency.stats.totalLeads} />
            <MiniMetric label="Profile views" value={agency.profile_views} />
            <MiniMetric label="Rating" value={agency.avg_rating} />
            <MiniMetric label="Reviews" value={agency.review_count} />
            <MiniMetric label="MaxCoin balance" value={agency.maxcoin_balance} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="verification" className="space-y-4 pt-3">
        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-3 px-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={verificationTone(agency.verification.latestStatus)}>
                {verificationLabel(agency.verification.latestStatus)}
              </Badge>
              <Badge variant="outline" className={agency.is_verified ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}>
                Badge: {agency.is_verified ? 'verified' : 'not verified'}
              </Badge>
            </div>
            <p className="text-sm text-slate-600">Latest submitted: {formatDateTime(agency.verification.latestSubmittedAt)}</p>
            <p className="text-sm text-slate-600">Latest admin note: {agency.verification.latestAdminNote ?? 'Not available'}</p>
            <div className="flex flex-wrap gap-2">
              {agency.verification.latestRequestId && agency.verification.latestStatus === 'pending' ? (
                <>
                  <Button size="sm" onClick={() => onApproveVerification(agency.verification.latestRequestId!)}>
                    <CheckCircle2 />
                    Approve verification
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onRejectVerification(agency.verification.latestRequestId!)}>
                    <XCircle />
                    Reject verification
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" disabled>
                  <ShieldCheck />
                  No pending verification action
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-2 px-4">
            <p className="text-sm font-semibold text-slate-900">Verification history</p>
            {verificationRequests.length === 0 ? (
              <p className="text-sm text-slate-500">No verification requests found for this agency.</p>
            ) : (
              verificationRequests.map((request) => (
                <div key={request.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline" className={verificationTone(request.status)}>{request.status}</Badge>
                    <span className="text-xs text-slate-500">{formatDateTime(request.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">Admin note: {request.admin_note ?? 'Not provided'}</p>
                  <p className="text-sm text-slate-600">Certificate URL: {request.certificate_url ?? 'Not provided'}</p>
                  {request.form_data ? (
                    <div className="mt-2 grid gap-1 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-600">
                      {Object.entries(request.form_data).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium text-slate-700">{key}:</span>
                          <span className="break-all">{String(value ?? '') || 'Not provided'}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="tours" className="space-y-4 pt-3">
        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-3 px-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Tours preview</p>
              <Badge variant="outline">{formatNumber(agency.stats.totalTours)} total</Badge>
            </div>
            {tours.length === 0 ? (
              <p className="text-sm text-slate-500">No tours found for this agency.</p>
            ) : (
              tours.slice(0, 20).map((tour) => (
                <TourRow key={tour.id} tour={tour} />
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="leads" className="space-y-4 pt-3">
        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-3 px-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Leads preview</p>
              <Badge variant="outline">{formatNumber(agency.stats.totalLeads)} total</Badge>
            </div>
            {leads.length === 0 ? (
              <p className="text-sm text-slate-500">No leads found for this agency.</p>
            ) : (
              leads.slice(0, 20).map((lead) => (
                <div key={lead.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{lead.full_name}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(lead.created_at)}</p>
                    </div>
                    <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">{lead.status}</Badge>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <p>Phone: {lead.phone}</p>
                    <p>Telegram: {lead.telegram_username ?? 'Not provided'}</p>
                    <p>People count: {lead.people_count}</p>
                    <p>Tour: {lead.tour?.title ?? 'Not linked'}</p>
                    <p>Comment: {lead.comment ?? 'Not provided'}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="operations" className="space-y-4 pt-3">
        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-2 px-4">
            <p className="text-sm font-semibold text-slate-900">Data quality warnings</p>
            {agency.stats.missingFields.length === 0 ? (
              <p className="text-sm text-emerald-700">No required profile fields are missing.</p>
            ) : (
              <ul className="space-y-1 text-sm text-amber-700">
                {agency.stats.missingFields.map((field) => (
                  <li key={field} className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {field}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-2 px-4">
            <p className="text-sm font-semibold text-slate-900">Subscription and promotion status</p>
            <p className="text-sm text-slate-700">Current subscription: {agency.subscription?.status ?? 'Not available'}</p>
            <p className="text-sm text-slate-700">Current plan: {agency.subscription?.plan?.name ?? 'Not available'}</p>
            <p className="text-sm text-slate-700">Active promotions: {agency.stats.activePromotions}</p>
            <p className="text-sm text-slate-700">MaxCoin balance: {formatNumber(agency.maxcoin_balance)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-3 px-4">
            <p className="text-sm font-semibold text-slate-900">Recent MaxCoin activity</p>
            {maxcoinTransactions.length === 0 ? (
              <p className="text-sm text-slate-500">No MaxCoin transaction data available.</p>
            ) : (
              maxcoinTransactions.slice(0, 8).map((transaction) => (
                <div key={transaction.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
                  <p className="font-medium">{transaction.type}</p>
                  <p>Amount: {formatNumber(transaction.amount)}</p>
                  <p>Description: {transaction.description ?? 'Not provided'}</p>
                  <p>{formatDateTime(transaction.created_at)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-3 px-4">
            <p className="text-sm font-semibold text-slate-900">Recent promotions</p>
            {promotions.length === 0 ? (
              <p className="text-sm text-slate-500">No promotion records available.</p>
            ) : (
              promotions.slice(0, 10).map((promotion) => (
                <div key={promotion.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
                  <p className="font-medium">{promotion.placement} {promotion.is_active ? '(active)' : '(inactive)'}</p>
                  <p>Tour: {promotion.tour?.title ?? promotion.tour_id}</p>
                  <p>Cost: {formatNumber(promotion.cost_coins)} MC</p>
                  <p>Ends: {formatDateTime(promotion.ends_at)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-2 px-4">
            <p className="text-sm font-semibold text-slate-900">Subscription history</p>
            {subscriptions.length === 0 ? (
              <p className="text-sm text-slate-500">No subscription history available.</p>
            ) : (
              subscriptions.map((subscription) => (
                <div key={subscription.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
                  <p className="font-medium">{subscription.status}</p>
                  <p>Plan: {subscription.plan?.name ?? 'Not linked'}</p>
                  <p>Starts: {formatDateTime(subscription.startsAt)}</p>
                  <p>Ends: {formatDateTime(subscription.endsAt)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-base font-semibold text-slate-900">{formatNumber(value)}</p>
    </div>
  );
}

function InfoLine({
  icon,
  label,
  value,
  onCopy,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-slate-500">{icon}</span>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-sm font-medium text-slate-900">{value}</p>
        </div>
      </div>
      {onCopy ? (
        <Button variant="ghost" size="icon-xs" onClick={onCopy}>
          <Copy />
        </Button>
      ) : null}
    </div>
  );
}

function TourRow({ tour }: { tour: AdminAgencyTourPreview }) {
  const safeCover = safeImageUrl(tour.cover_image_url);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 overflow-hidden rounded-lg bg-slate-200">
          {safeCover ? (
            <img
              src={safeCover}
              alt={tour.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No image</div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">{tour.title}</p>
            <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">{tour.status}</Badge>
          </div>
          <p className="text-xs text-slate-500">{tour.city ? `${tour.city}, ${tour.country}` : tour.country ?? 'Location not provided'}</p>
          <p className="text-xs text-slate-500">{formatDateTime(tour.updated_at)}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href={`/admin/tours/${tour.id}`} className="text-blue-600 hover:underline">Open admin tour</Link>
            <Link href={`/tours/${tour.slug}`} className="text-blue-600 hover:underline" target="_blank">Open public tour</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
