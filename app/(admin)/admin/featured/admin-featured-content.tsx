'use client';

import { useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  Copy,
  ExternalLink,
  FilterX,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageTitle, SectionShell } from '@/components/shared-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type {
  AdminPromotionComputedStatus,
  AdminPromotionsMaxcoinPanelPayload,
} from '@/features/admin/types';
import { cn, formatNumber, placeholderImage } from '@/lib/utils';
import {
  type FeaturedIssueFilter,
  type FeaturedPreparedPromotion,
  type FeaturedSortKey,
  buildPlacementSummaries,
  detectFeaturedPlacements,
  formatDateTime,
  formatPlacementLabel,
  formatShortDate,
  getAgencyAdminLink,
  getStatusLabel,
  getTourAdminLink,
  getTourPublicLink,
  normalizeText,
  parseDateMs,
  prepareFeaturedPromotions,
  sortFeaturedPromotions,
} from './featured-promotions-utils';

interface Props {
  payload: AdminPromotionsMaxcoinPanelPayload | null;
  errorMessage?: string;
}

function statusBadgeClass(status: AdminPromotionComputedStatus): string {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700';
  if (status === 'scheduled') return 'bg-sky-100 text-sky-700';
  if (status === 'expired') return 'bg-rose-100 text-rose-700';
  return 'bg-slate-200 text-slate-700';
}

function formatRemaining(days: number | null): string {
  if (days == null) return 'Not available';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  return `${days}d left`;
}

function withinDateRange(
  item: FeaturedPreparedPromotion,
  dateFrom: string,
  dateTo: string
): boolean {
  if (!dateFrom && !dateTo) return true;
  const fromMs = dateFrom ? parseDateMs(`${dateFrom}T00:00:00`) : null;
  const toMs = dateTo ? parseDateMs(`${dateTo}T23:59:59`) : null;
  if (fromMs == null && toMs == null) return true;
  if (item.startsAtMs == null || item.endsAtMs == null) return false;
  if (fromMs != null && item.endsAtMs < fromMs) return false;
  if (toMs != null && item.startsAtMs > toMs) return false;
  return true;
}

function filterByIssue(item: FeaturedPreparedPromotion, issueFilter: FeaturedIssueFilter): boolean {
  if (issueFilter === 'all') return true;
  if (issueFilter === 'with_warnings') return item.warnings.length > 0;
  if (issueFilter === 'ending_soon') return item.isEndingSoon;
  if (issueFilter === 'unverified_agency') {
    return item.agency?.is_verified === false || item.agency?.is_approved === false;
  }
  if (issueFilter === 'unpublished_tour') {
    return Boolean(item.tour?.status && item.tour.status !== 'published');
  }
  if (issueFilter === 'missing_image') return !item.tour?.cover_image_url;
  if (issueFilter === 'over_capacity') return item.isOverCapacity;
  return true;
}

function safeCopy(value: string, successText: string) {
  navigator.clipboard
    .writeText(value)
    .then(() => toast.success(successText))
    .catch(() => toast.error('Unable to copy to clipboard'));
}

export function AdminFeaturedContent({ payload, errorMessage }: Props) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  const [search, setSearch] = useState('');
  const [placementFilter, setPlacementFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminPromotionComputedStatus>('all');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [issueFilter, setIssueFilter] = useState<FeaturedIssueFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<FeaturedSortKey>('active_first');
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);

  const generatedAtText = useMemo(() => formatDateTime(payload?.generatedAt), [payload?.generatedAt]);

  const placementDetection = useMemo(() => {
    if (!payload) {
      return {
        finalPlacements: [] as string[],
        featuredItemPlacements: [] as string[],
        keywordPlacements: [] as string[],
        tierPlacements: [] as string[],
      };
    }
    return detectFeaturedPlacements(payload.promotions, payload.promotionTiers);
  }, [payload]);

  const preparedPromotions = useMemo<FeaturedPreparedPromotion[]>(() => {
    if (!payload) return [];
    return prepareFeaturedPromotions({
      promotions: payload.promotions,
      tiers: payload.promotionTiers,
      placements: placementDetection.finalPlacements,
    });
  }, [payload, placementDetection.finalPlacements]);

  const placementSummaries = useMemo(
    () => buildPlacementSummaries(preparedPromotions),
    [preparedPromotions]
  );

  const agencyOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const item of preparedPromotions) {
      const agencyId = item.agency?.id ?? item.agency_id;
      const agencyName = item.agency?.name;
      if (!agencyId || !agencyName) continue;
      if (!options.has(agencyId)) {
        options.set(agencyId, agencyName);
      }
    }
    return Array.from(options.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [preparedPromotions]);

  const destinationOptions = useMemo(() => {
    const options = new Set<string>();
    for (const item of preparedPromotions) {
      if (item.locationLabel) options.add(item.locationLabel);
    }
    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [preparedPromotions]);

  const filteredPromotions = useMemo(() => {
    const normalizedSearch = normalizeText(search);
    const filtered = preparedPromotions.filter((item) => {
      if (placementFilter !== 'all' && item.placementKey !== placementFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (agencyFilter !== 'all' && (item.agency?.id ?? item.agency_id) !== agencyFilter) return false;
      if (destinationFilter !== 'all' && item.locationLabel !== destinationFilter) return false;
      if (!withinDateRange(item, dateFrom, dateTo)) return false;
      if (!filterByIssue(item, issueFilter)) return false;

      if (!normalizedSearch) return true;
      const searchable = [
        item.id,
        item.sourceId,
        item.tour?.title,
        item.tour?.slug,
        item.agency?.name,
        item.agency?.responsible_person,
        item.agency?.phone,
        item.agency?.telegram_username,
        item.placementKey,
        item.locationLabel,
      ]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLowerCase();
      return searchable.includes(normalizedSearch);
    });

    return sortFeaturedPromotions(filtered, sortBy);
  }, [
    agencyFilter,
    dateFrom,
    dateTo,
    destinationFilter,
    issueFilter,
    placementFilter,
    preparedPromotions,
    search,
    sortBy,
    statusFilter,
  ]);

  const selectedPromotion = useMemo(
    () => preparedPromotions.find((item) => item.id === selectedPromotionId) ?? null,
    [preparedPromotions, selectedPromotionId]
  );

  const activeCount = useMemo(
    () => preparedPromotions.filter((item) => item.status === 'active').length,
    [preparedPromotions]
  );
  const scheduledCount = useMemo(
    () => preparedPromotions.filter((item) => item.status === 'scheduled').length,
    [preparedPromotions]
  );
  const expiredCount = useMemo(
    () => preparedPromotions.filter((item) => item.status === 'expired').length,
    [preparedPromotions]
  );
  const endingSoonCount = useMemo(
    () => preparedPromotions.filter((item) => item.isEndingSoon).length,
    [preparedPromotions]
  );
  const warningsCount = useMemo(
    () => preparedPromotions.reduce((sum, item) => sum + item.warnings.length, 0),
    [preparedPromotions]
  );
  const overCapacityCount = useMemo(
    () => preparedPromotions.filter((item) => item.isOverCapacity).length,
    [preparedPromotions]
  );
  const unverifiedAgencyFeaturedCount = useMemo(
    () =>
      preparedPromotions.filter(
        (item) => item.agency?.is_verified === false || item.agency?.is_approved === false
      ).length,
    [preparedPromotions]
  );

  const hasKnownSlotLimit = placementSummaries.some((item) => item.slotLimit != null);
  const topPlacementPressure = placementSummaries
    .filter((item) => item.slotLimit != null)
    .sort((a, b) => b.overCapacityBy - a.overCapacityBy)[0];

  const handleRefresh = () => {
    startRefresh(() => {
      router.refresh();
    });
  };

  const resetFilters = () => {
    setSearch('');
    setPlacementFilter('all');
    setStatusFilter('all');
    setAgencyFilter('all');
    setDestinationFilter('all');
    setIssueFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('active_first');
  };

  const openPromotion = (promotionId: string) => setSelectedPromotionId(promotionId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle
          title="Featured Promotions"
          subtitle="Recommended placement visibility, featured slot monitoring, and campaign quality control."
        />
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-9 rounded-full px-3 text-xs text-slate-600">
            Last updated: {generatedAtText}
          </Badge>
          <Button onClick={handleRefresh} disabled={isRefreshing} className="h-9 rounded-full px-4">
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardHeader>
            <CardTitle className="text-rose-700">Featured promotions data error</CardTitle>
            <CardDescription className="text-rose-700/90">{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {payload?.health.partialData ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <TriangleAlert className="h-4 w-4" />
              Partial data warning
            </CardTitle>
            <CardDescription className="text-amber-800/85">
              Some tables could not be read fully. Metrics below are based only on available records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-amber-900">
            {payload.health.errors.map((issue) => (
              <p key={issue}>• {issue}</p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <SectionShell className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Card
          className="cursor-pointer border-slate-200 transition hover:border-emerald-300"
          onClick={() => setStatusFilter('active')}
        >
          <CardContent className="pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Featured</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(activeCount)}</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer border-slate-200 transition hover:border-sky-300"
          onClick={() => setStatusFilter('scheduled')}
        >
          <CardContent className="pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheduled</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(scheduledCount)}</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer border-slate-200 transition hover:border-amber-300"
          onClick={() => setIssueFilter('ending_soon')}
        >
          <CardContent className="pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ending Soon</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(endingSoonCount)}</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer border-slate-200 transition hover:border-rose-300"
          onClick={() => setStatusFilter('expired')}
        >
          <CardContent className="pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expired</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(expiredCount)}</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer border-slate-200 transition hover:border-orange-300"
          onClick={() => setIssueFilter('over_capacity')}
        >
          <CardContent className="pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slot Pressure</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(overCapacityCount)}</p>
            <p className="mt-1 text-xs text-slate-500">
              {hasKnownSlotLimit ? 'Known slot limits detected' : 'Slot limits not available'}
            </p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer border-slate-200 transition hover:border-fuchsia-300"
          onClick={() => setIssueFilter('with_warnings')}
        >
          <CardContent className="pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Warnings</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(warningsCount)}</p>
            <p className="mt-1 text-xs text-slate-500">
              Unverified agency featured: {formatNumber(unverifiedAgencyFeaturedCount)}
            </p>
          </CardContent>
        </Card>
      </SectionShell>

      <SectionShell>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Placement Monitoring</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge variant="outline">
              Detected placements: {placementDetection.finalPlacements.length > 0 ? placementDetection.finalPlacements.length : '0'}
            </Badge>
            {topPlacementPressure?.overCapacityBy ? (
              <Badge className="bg-rose-100 text-rose-700">
                Over capacity: {formatPlacementLabel(topPlacementPressure.placement)} (+{topPlacementPressure.overCapacityBy})
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {placementSummaries.length === 0 ? (
            <Card className="md:col-span-2 xl:col-span-4">
              <CardContent className="pt-6 text-sm text-slate-500">
                No featured placement records found yet.
              </CardContent>
            </Card>
          ) : (
            placementSummaries.map((summary) => (
              <button
                type="button"
                key={summary.placement}
                onClick={() => setPlacementFilter(summary.placement)}
                className="text-left"
              >
                <Card className="h-full border-slate-200 transition hover:border-slate-400">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{summary.placementLabel}</CardTitle>
                    <CardDescription className="text-xs">
                      Active {summary.active} • Ending soon {summary.endingSoon}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-slate-600">
                    <p>Total campaigns: <span className="font-medium text-slate-900">{summary.total}</span></p>
                    <p>Warnings: <span className="font-medium text-slate-900">{summary.warnings}</span></p>
                    {summary.slotLimit != null ? (
                      <p>
                        Slot usage: <span className="font-medium text-slate-900">{summary.active}/{summary.slotLimit}</span>
                        {summary.overCapacityBy > 0 ? (
                          <span className="ml-2 text-rose-600">Over by {summary.overCapacityBy}</span>
                        ) : null}
                      </p>
                    ) : (
                      <p>Slot usage: Not available</p>
                    )}
                  </CardContent>
                </Card>
              </button>
            ))
          )}
        </div>
      </SectionShell>

      <SectionShell>
        <Card className="border-slate-200">
          <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search Campaigns
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tour, agency, placement, contact, destination, campaign ID..."
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Placement</label>
              <Select
                value={placementFilter}
                onValueChange={(value) => setPlacementFilter(value ?? 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All placements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All placements</SelectItem>
                  {placementDetection.finalPlacements.map((placement) => (
                    <SelectItem key={placement} value={placement}>
                      {formatPlacementLabel(placement)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as 'all' | AdminPromotionComputedStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Agency</label>
              <Select value={agencyFilter} onValueChange={(value) => setAgencyFilter(value ?? 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="All agencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All agencies</SelectItem>
                  {agencyOptions.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Destination</label>
              <Select
                value={destinationFilter}
                onValueChange={(value) => setDestinationFilter(value ?? 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All destinations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All destinations</SelectItem>
                  {destinationOptions.map((destination) => (
                    <SelectItem key={destination} value={destination}>
                      {destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Issue Filter</label>
              <Select value={issueFilter} onValueChange={(value) => setIssueFilter(value as FeaturedIssueFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="All campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All campaigns</SelectItem>
                  <SelectItem value="with_warnings">With warnings</SelectItem>
                  <SelectItem value="ending_soon">Ending soon</SelectItem>
                  <SelectItem value="unverified_agency">Unverified agency</SelectItem>
                  <SelectItem value="unpublished_tour">Unpublished tour</SelectItem>
                  <SelectItem value="missing_image">Missing image</SelectItem>
                  <SelectItem value="over_capacity">Over capacity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Sort</label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as FeaturedSortKey)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active_first">Active first</SelectItem>
                  <SelectItem value="ending_soon">Ending soon</SelectItem>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="start_date">Start date</SelectItem>
                  <SelectItem value="end_date">End date</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="placement_type">Placement type</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Start from</label>
              <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">End to</label>
              <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>

            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</label>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={resetFilters}>
                  <FilterX className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
                <Badge variant="outline">{filteredPromotions.length} rows</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </SectionShell>

      <SectionShell>
        {filteredPromotions.length === 0 ? (
          <Card>
            <CardContent className="space-y-2 py-10 text-center">
              <Sparkles className="mx-auto h-9 w-9 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">No featured campaigns match current filters.</p>
              <p className="text-xs text-slate-500">Try resetting filters or refreshing data.</p>
              <div>
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3 text-left">Campaign</th>
                    <th className="px-3 py-3 text-left">Placement</th>
                    <th className="px-3 py-3 text-left">Status</th>
                    <th className="px-3 py-3 text-left">Schedule</th>
                    <th className="px-3 py-3 text-left">Agency</th>
                    <th className="px-3 py-3 text-left">Quality</th>
                    <th className="px-3 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPromotions.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 align-top">
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          className="group flex items-start gap-3 text-left"
                          onClick={() => openPromotion(item.id)}
                        >
                          <div className="relative h-14 w-20 overflow-hidden rounded-md bg-slate-100">
                            <Image
                              src={item.tour?.cover_image_url ?? placeholderImage(360, 220, 'Tour')}
                              alt={item.tour?.title ?? 'Tour image'}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900 group-hover:text-sky-700">
                              {item.tour?.title ?? 'Missing linked tour'}
                            </p>
                            <p className="text-xs text-slate-500">Campaign ID: {item.sourceId}</p>
                            <p className="text-xs text-slate-500">{item.locationLabel ?? 'Location not provided'}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="outline">{item.placementLabel}</Badge>
                        <p className="mt-2 text-xs text-slate-500">
                          Slot: {item.slotLimit != null ? `${item.slotLimit} known` : 'Not available'}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                            statusBadgeClass(item.status)
                          )}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                        <p className="mt-2 text-xs text-slate-500">{formatRemaining(item.remainingDays)}</p>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        <p>Start: {formatShortDate(item.starts_at)}</p>
                        <p className="mt-1">End: {formatShortDate(item.ends_at)}</p>
                        <p className="mt-1">Created: {formatShortDate(item.created_at)}</p>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        <p className="font-medium text-slate-900">{item.agency?.name ?? 'Missing agency'}</p>
                        <p className="mt-1">
                          Verification:{' '}
                          {item.agency?.is_verified === true ? 'Verified' : item.agency ? 'Unverified' : 'Not available'}
                        </p>
                        <p className="mt-1">
                          MaxCoin:{' '}
                          {item.agency?.maxcoin_balance != null
                            ? formatNumber(item.agency.maxcoin_balance)
                            : 'Not available'}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {item.warnings.length === 0 ? (
                          <Badge className="bg-emerald-100 text-emerald-700">No warnings</Badge>
                        ) : (
                          <>
                            <Badge className="bg-amber-100 text-amber-700">
                              {item.warnings.length} warning{item.warnings.length > 1 ? 's' : ''}
                            </Badge>
                            <p className="mt-2 max-w-[220px] text-slate-600">
                              {item.warnings[0]?.message ?? 'Warning'}
                            </p>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-start gap-2">
                          <Button size="sm" variant="outline" onClick={() => openPromotion(item.id)}>
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!getTourPublicLink(item)}
                            onClick={() => {
                              const link = getTourPublicLink(item);
                              if (!link) return;
                              safeCopy(link, 'Public tour link copied');
                            }}
                          >
                            <Copy className="mr-1 h-3.5 w-3.5" />
                            Copy Link
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => safeCopy(item.sourceId, 'Campaign ID copied')}
                          >
                            <Copy className="mr-1 h-3.5 w-3.5" />
                            Copy ID
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 lg:hidden">
              {filteredPromotions.map((item) => (
                <Card key={item.id} className="border-slate-200">
                  <CardContent className="space-y-3 pt-4">
                    <button type="button" onClick={() => openPromotion(item.id)} className="w-full text-left">
                      <div className="flex items-start gap-3">
                        <div className="relative h-16 w-24 overflow-hidden rounded-md bg-slate-100">
                          <Image
                            src={item.tour?.cover_image_url ?? placeholderImage(360, 220, 'Tour')}
                            alt={item.tour?.title ?? 'Tour image'}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-900">{item.tour?.title ?? 'Missing linked tour'}</p>
                          <p className="text-xs text-slate-500">{item.agency?.name ?? 'Missing agency'}</p>
                          <div className="flex flex-wrap items-center gap-1">
                            <Badge variant="outline">{item.placementLabel}</Badge>
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2 py-1 text-[11px] font-semibold',
                                statusBadgeClass(item.status)
                              )}
                            >
                              {getStatusLabel(item.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => openPromotion(item.id)}>
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!getTourPublicLink(item)}
                        onClick={() => {
                          const link = getTourPublicLink(item);
                          if (!link) return;
                          safeCopy(link, 'Public tour link copied');
                        }}
                      >
                        Copy Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </SectionShell>

      <Sheet open={Boolean(selectedPromotion)} onOpenChange={(open) => (!open ? setSelectedPromotionId(null) : null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-3xl">
          {selectedPromotion ? (
            <div className="space-y-4">
              <SheetHeader className="border-b border-slate-200 bg-slate-50 p-6 text-left">
                <SheetTitle className="text-xl font-semibold text-slate-900">
                  {selectedPromotion.tour?.title ?? 'Featured campaign detail'}
                </SheetTitle>
                <SheetDescription className="text-slate-600">
                  Campaign ID: {selectedPromotion.sourceId}
                </SheetDescription>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedPromotion.placementLabel}</Badge>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                      statusBadgeClass(selectedPromotion.status)
                    )}
                  >
                    {getStatusLabel(selectedPromotion.status)}
                  </span>
                  {selectedPromotion.warnings.length > 0 ? (
                    <Badge className="bg-amber-100 text-amber-700">
                      {selectedPromotion.warnings.length} warning{selectedPromotion.warnings.length > 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700">No warnings</Badge>
                  )}
                </div>
              </SheetHeader>

              <div className="space-y-4 p-6">
                <SectionShell>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Linked Tour</h3>
                  <Card className="border-slate-200">
                    <CardContent className="space-y-3 pt-4">
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="relative h-24 w-36 overflow-hidden rounded-md bg-slate-100">
                          <Image
                            src={selectedPromotion.tour?.cover_image_url ?? placeholderImage(640, 360, 'Tour')}
                            alt={selectedPromotion.tour?.title ?? 'Tour preview'}
                            fill
                            className="object-cover"
                            sizes="144px"
                          />
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold text-slate-900">
                            {selectedPromotion.tour?.title ?? 'Missing linked tour'}
                          </p>
                          <p className="text-slate-600">
                            Status: {selectedPromotion.tour?.status ?? 'Not available'}
                          </p>
                          <p className="text-slate-600">
                            Destination: {selectedPromotion.locationLabel ?? 'Not provided'}
                          </p>
                          <p className="text-slate-600">
                            Views: {selectedPromotion.tour?.view_count != null ? formatNumber(selectedPromotion.tour.view_count) : 'Not available'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getTourAdminLink(selectedPromotion) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(getTourAdminLink(selectedPromotion) ?? '/admin/tours')}
                          >
                            <ExternalLink className="mr-1 h-3.5 w-3.5" />
                            View in Admin
                          </Button>
                        ) : null}
                        {getTourPublicLink(selectedPromotion) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const publicLink = getTourPublicLink(selectedPromotion);
                              if (!publicLink) return;
                              window.open(publicLink, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            <ExternalLink className="mr-1 h-3.5 w-3.5" />
                            Open Public Tour
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </SectionShell>

                <SectionShell>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Linked Agency</h3>
                  <Card className="border-slate-200">
                    <CardContent className="space-y-2 pt-4 text-sm">
                      <p className="font-semibold text-slate-900">
                        {selectedPromotion.agency?.name ?? 'Missing linked agency'}
                      </p>
                      <p className="text-slate-600">
                        Verification:{' '}
                        {selectedPromotion.agency?.is_verified === true
                          ? 'Verified'
                          : selectedPromotion.agency
                            ? 'Unverified'
                            : 'Not available'}
                      </p>
                      <p className="text-slate-600">
                        Contact:{' '}
                        {selectedPromotion.agency?.phone ??
                          selectedPromotion.agency?.telegram_username ??
                          'Not provided'}
                      </p>
                      <p className="text-slate-600">
                        MaxCoin balance:{' '}
                        {selectedPromotion.agency?.maxcoin_balance != null
                          ? `${formatNumber(selectedPromotion.agency.maxcoin_balance)} MC`
                          : 'Not available'}
                      </p>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(getAgencyAdminLink(selectedPromotion))}
                        >
                          <Building2 className="mr-1 h-3.5 w-3.5" />
                          View Agency
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </SectionShell>

                <SectionShell>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Schedule & Slot State</h3>
                  <Card className="border-slate-200">
                    <CardContent className="grid gap-3 pt-4 text-sm md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Start</p>
                        <p className="font-medium text-slate-900">{formatDateTime(selectedPromotion.starts_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">End</p>
                        <p className="font-medium text-slate-900">{formatDateTime(selectedPromotion.ends_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Duration</p>
                        <p className="font-medium text-slate-900">
                          {selectedPromotion.durationDays != null ? `${selectedPromotion.durationDays} day(s)` : 'Not available'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Remaining</p>
                        <p className="font-medium text-slate-900">{formatRemaining(selectedPromotion.remainingDays)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">MaxCoin Cost</p>
                        <p className="font-medium text-slate-900">
                          {selectedPromotion.maxcoin_cost != null ? `${formatNumber(selectedPromotion.maxcoin_cost)} MC` : 'Not available'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Slot usage state</p>
                        <p className="font-medium text-slate-900">
                          {selectedPromotion.slotLimit != null
                            ? `Limit ${selectedPromotion.slotLimit}${selectedPromotion.isOverCapacity ? ' (over capacity)' : ''}`
                            : 'Not available'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </SectionShell>

                <SectionShell>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Quality Warnings</h3>
                  <Card className="border-slate-200">
                    <CardContent className="space-y-2 pt-4">
                      {selectedPromotion.warnings.length === 0 ? (
                        <div className="flex items-start gap-2 text-sm text-emerald-700">
                          <ShieldAlert className="mt-0.5 h-4 w-4" />
                          <p>No quality issues detected from available fields.</p>
                        </div>
                      ) : (
                        selectedPromotion.warnings.map((warning) => (
                          <div key={`${selectedPromotion.id}_${warning.code}`} className="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm">
                            <p className="font-medium text-amber-900">
                              {warning.severity.toUpperCase()} • {warning.code.replace(/_/g, ' ')}
                            </p>
                            <p className="text-amber-900/90">{warning.message}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </SectionShell>

                <SectionShell>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Action Center</h3>
                  <Card className="border-slate-200">
                    <CardContent className="space-y-4 pt-4">
                      <div className="grid gap-2 md:grid-cols-2">
                        <Button
                          variant="outline"
                          onClick={() => safeCopy(selectedPromotion.sourceId, 'Campaign ID copied')}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Campaign ID
                        </Button>
                        <Button
                          variant="outline"
                          disabled={!getTourPublicLink(selectedPromotion)}
                          onClick={() => {
                            const link = getTourPublicLink(selectedPromotion);
                            if (!link) return;
                            safeCopy(link, 'Public tour link copied');
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Public Tour Link
                        </Button>
                      </div>
                      <Separator />
                      <div className="grid gap-2 md:grid-cols-2">
                        <Button variant="outline" disabled>
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Cancel Campaign (Not supported)
                        </Button>
                        <Button variant="outline" disabled>
                          <Timer className="mr-2 h-4 w-4" />
                          Expire Now (Not supported)
                        </Button>
                        <Button variant="outline" disabled>
                          <CalendarDays className="mr-2 h-4 w-4" />
                          Extend Campaign (Not supported)
                        </Button>
                        <Button variant="outline" disabled>
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          Move Priority (Not supported)
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </SectionShell>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
