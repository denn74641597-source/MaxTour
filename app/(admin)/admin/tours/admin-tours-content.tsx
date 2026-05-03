'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Copy,
  Eye,
  FilterX,
  Globe2,
  ImageIcon,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn, formatDate, formatNumber, formatPrice, placeholderImage } from '@/lib/utils';
import { updateTourStatusAction } from '@/features/admin/actions';
import type { AdminTourPanelItem, AdminToursPanelPayload } from '@/features/admin/types';
import {
  buildTourQualityWarnings,
  collectTourImageUrls,
  resolveLocation,
  TourStatusKey,
} from './tour-admin-utils';
import { TourStatusBadge } from './tour-status-badge';
import { TourDetailSheet } from './tour-detail-sheet';

interface AdminToursContentProps {
  payload: AdminToursPanelPayload;
}

type SortKey =
  | 'newest'
  | 'oldest'
  | 'price_low'
  | 'price_high'
  | 'departure_soonest'
  | 'pending_first'
  | 'most_viewed'
  | 'most_leads';

type PresenceFilter = 'all' | 'with' | 'without';
type VisibilityFilter = 'all' | 'published' | 'non_published';
type FeaturedFilter = 'all' | 'featured' | 'not_featured';

interface PendingStatusChange {
  tourId: string;
  nextStatus: TourStatusKey;
}

interface PreparedTour extends AdminTourPanelItem {
  locationLabel: string;
  imageUrls: string[];
  warningCount: number;
  warnings: ReturnType<typeof buildTourQualityWarnings>;
  createdAtMs: number;
  departureAtMs: number | null;
}

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'price_high', label: 'Price: high to low' },
  { value: 'departure_soonest', label: 'Departure soonest' },
  { value: 'pending_first', label: 'Pending moderation first' },
  { value: 'most_viewed', label: 'Most viewed' },
  { value: 'most_leads', label: 'Most leads' },
];

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function formatDateTimeLabel(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function matchesDateRange(
  value: string | null | undefined,
  from: string,
  to: string
): boolean {
  if (!from && !to) return true;
  if (!value) return false;
  const date = new Date(value).getTime();
  if (!Number.isFinite(date)) return false;
  if (from) {
    const fromValue = new Date(from).getTime();
    if (Number.isFinite(fromValue) && date < fromValue) return false;
  }
  if (to) {
    const toValue = new Date(to).getTime();
    if (Number.isFinite(toValue) && date > toValue) return false;
  }
  return true;
}

export function AdminToursContent({ payload }: AdminToursContentProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  const [tours, setTours] = useState<AdminTourPanelItem[]>(payload.tours);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TourStatusKey>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tourTypeFilter, setTourTypeFilter] = useState('all');
  const [hasImageFilter, setHasImageFilter] = useState<PresenceFilter>('all');
  const [hasSeatsFilter, setHasSeatsFilter] = useState<PresenceFilter>('all');
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [departureFrom, setDepartureFrom] = useState('');
  const [departureTo, setDepartureTo] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);

  const preparedTours = useMemo<PreparedTour[]>(
    () =>
      tours.map((tour) => {
        const warnings = buildTourQualityWarnings(tour);
        return {
          ...tour,
          locationLabel: resolveLocation(tour),
          imageUrls: collectTourImageUrls(tour),
          warnings,
          warningCount: warnings.length,
          createdAtMs: new Date(tour.created_at).getTime(),
          departureAtMs: tour.departure_date ? new Date(tour.departure_date).getTime() : null,
        };
      }),
    [tours]
  );

  const agencyOptions = useMemo(() => {
    const seen = new Set<string>();
    const list = preparedTours
      .filter((tour) => tour.agency?.id && tour.agency?.name)
      .map((tour) => ({ id: tour.agency!.id, name: tour.agency!.name }));
    return list
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [preparedTours]);

  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const tour of preparedTours) {
      if (tour.country) set.add(tour.country);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [preparedTours]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const tour of preparedTours) {
      if (tour.category) set.add(tour.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [preparedTours]);

  const filteredTours = useMemo(() => {
    const searchValue = normalizeText(search);
    const minPrice = priceMin.trim().length > 0 ? Number(priceMin) : null;
    const maxPrice = priceMax.trim().length > 0 ? Number(priceMax) : null;

    return preparedTours
      .filter((tour) => {
        if (searchValue) {
          const haystack = [
            tour.title,
            tour.slug,
            tour.agency?.name ?? '',
            tour.country ?? '',
            tour.city ?? '',
            tour.region ?? '',
            tour.district ?? '',
            tour.category ?? '',
            tour.short_description ?? '',
            tour.full_description ?? '',
            tour.operator_phone ?? '',
            tour.operator_telegram_username ?? '',
            tour.agency?.phone ?? '',
            tour.agency?.telegram_username ?? '',
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(searchValue)) return false;
        }

        if (statusFilter !== 'all' && tour.status !== statusFilter) return false;
        if (visibilityFilter === 'published' && tour.status !== 'published') return false;
        if (visibilityFilter === 'non_published' && tour.status === 'published') return false;
        if (agencyFilter !== 'all' && tour.agency?.id !== agencyFilter) return false;
        if (countryFilter !== 'all' && tour.country !== countryFilter) return false;
        if (categoryFilter !== 'all' && tour.category !== categoryFilter) return false;
        if (tourTypeFilter !== 'all' && tour.tour_type !== tourTypeFilter) return false;

        if (hasImageFilter === 'with' && tour.imageUrls.length === 0) return false;
        if (hasImageFilter === 'without' && tour.imageUrls.length > 0) return false;

        const hasSeatsInfo = tour.seats_total != null || tour.seats_left != null;
        if (hasSeatsFilter === 'with' && !hasSeatsInfo) return false;
        if (hasSeatsFilter === 'without' && hasSeatsInfo) return false;

        if (featuredFilter === 'featured' && !tour.is_featured) return false;
        if (featuredFilter === 'not_featured' && tour.is_featured) return false;

        if (minPrice != null && Number.isFinite(minPrice) && (tour.price ?? 0) < minPrice) return false;
        if (maxPrice != null && Number.isFinite(maxPrice) && (tour.price ?? 0) > maxPrice) return false;

        if (!matchesDateRange(tour.departure_date, departureFrom, departureTo)) return false;
        if (!matchesDateRange(tour.created_at, createdFrom, createdTo)) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'oldest':
            return a.createdAtMs - b.createdAtMs;
          case 'price_low':
            return (a.price ?? 0) - (b.price ?? 0);
          case 'price_high':
            return (b.price ?? 0) - (a.price ?? 0);
          case 'departure_soonest':
            return (a.departureAtMs ?? Number.POSITIVE_INFINITY) - (b.departureAtMs ?? Number.POSITIVE_INFINITY);
          case 'pending_first':
            return Number(b.status === 'pending') - Number(a.status === 'pending') || b.createdAtMs - a.createdAtMs;
          case 'most_viewed':
            return b.view_count - a.view_count;
          case 'most_leads':
            return b.leadSummary.count - a.leadSummary.count;
          case 'newest':
          default:
            return b.createdAtMs - a.createdAtMs;
        }
      });
  }, [
    preparedTours,
    search,
    statusFilter,
    visibilityFilter,
    agencyFilter,
    countryFilter,
    categoryFilter,
    tourTypeFilter,
    hasImageFilter,
    hasSeatsFilter,
    featuredFilter,
    priceMin,
    priceMax,
    departureFrom,
    departureTo,
    createdFrom,
    createdTo,
    sortBy,
  ]);

  const stats = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const nextSevenDaysMs = nowMs + 7 * 24 * 60 * 60 * 1000;

    const pendingModeration = preparedTours.filter((tour) => tour.status === 'pending').length;
    const published = preparedTours.filter((tour) => tour.status === 'published').length;
    const archivedOrDraft = preparedTours.filter(
      (tour) => tour.status === 'archived' || tour.status === 'draft'
    ).length;
    const missingImages = preparedTours.filter((tour) => tour.imageUrls.length === 0).length;
    const unverifiedAgencyTours = preparedTours.filter(
      (tour) => tour.agency && tour.agency.is_verified === false
    ).length;
    const expiringSoon = preparedTours.filter((tour) => {
      if (!tour.departureAtMs) return false;
      return tour.departureAtMs >= nowMs && tour.departureAtMs <= nextSevenDaysMs;
    }).length;
    const expired = preparedTours.filter((tour) => {
      if (!tour.departureAtMs) return false;
      return tour.departureAtMs < nowMs;
    }).length;

    return {
      total: preparedTours.length,
      pendingModeration,
      published,
      archivedOrDraft,
      missingImages,
      unverifiedAgencyTours,
      expiringSoon,
      expired,
    };
  }, [preparedTours]);

  const selectedTour = useMemo(
    () => preparedTours.find((tour) => tour.id === selectedTourId) ?? null,
    [preparedTours, selectedTourId]
  );

  function handleRefresh() {
    startRefresh(() => {
      router.refresh();
    });
  }

  function openTourDetail(tourId: string) {
    setSelectedTourId(tourId);
    setDetailOpen(true);
  }

  function resetFilters() {
    setSearch('');
    setStatusFilter('all');
    setVisibilityFilter('all');
    setAgencyFilter('all');
    setCountryFilter('all');
    setCategoryFilter('all');
    setTourTypeFilter('all');
    setHasImageFilter('all');
    setHasSeatsFilter('all');
    setFeaturedFilter('all');
    setPriceMin('');
    setPriceMax('');
    setDepartureFrom('');
    setDepartureTo('');
    setCreatedFrom('');
    setCreatedTo('');
    setSortBy('newest');
  }

  function requestStatusChange(tour: AdminTourPanelItem, nextStatus: TourStatusKey) {
    if (tour.status === nextStatus) return;
    setPendingStatusChange({ tourId: tour.id, nextStatus });
  }

  async function confirmStatusChange() {
    if (!pendingStatusChange) return;
    const tour = tours.find((item) => item.id === pendingStatusChange.tourId);
    if (!tour) {
      setPendingStatusChange(null);
      return;
    }

    setStatusBusyId(tour.id);
    const result = await updateTourStatusAction(tour.id, pendingStatusChange.nextStatus);
    setStatusBusyId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setTours((prev) =>
      prev.map((item) =>
        item.id === tour.id
          ? {
              ...item,
              status: pendingStatusChange.nextStatus,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );
    setPendingStatusChange(null);
    toast.success('Tour status updated');
    router.refresh();
  }

  function copyPublicLink(slug: string) {
    const link = `https://mxtr.uz/tours/${slug}`;
    navigator.clipboard
      .writeText(link)
      .then(() => toast.success('Tour link copied'))
      .catch(() => toast.error('Could not copy tour link'));
  }

  const hasGlobalError = payload.health.errors.length > 0 && tours.length === 0;

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Tours</h1>
            <p className="max-w-3xl text-sm text-slate-200">
              Tour moderation, quality control, visibility, and marketplace operations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-300">
          Last updated: {formatDateTimeLabel(payload.health.lastUpdated)}
        </div>
      </section>

      {payload.health.partialData ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Some metrics are unavailable.</p>
              <p className="mt-1 text-xs">
                {payload.health.errors.join(' | ')}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <KpiCard label="Total tours" value={formatNumber(stats.total)} icon={<Tag className="h-4 w-4" />} />
        <KpiCard label="Pending moderation" value={formatNumber(stats.pendingModeration)} icon={<Clock3 className="h-4 w-4" />} tone="amber" />
        <KpiCard label="Published" value={formatNumber(stats.published)} icon={<Sparkles className="h-4 w-4" />} tone="emerald" />
        <KpiCard label="Archived + draft" value={formatNumber(stats.archivedOrDraft)} icon={<AlertTriangle className="h-4 w-4" />} tone="rose" />
        <KpiCard label="Missing images" value={formatNumber(stats.missingImages)} icon={<ImageIcon className="h-4 w-4" />} />
        <KpiCard label="Unverified agency tours" value={formatNumber(stats.unverifiedAgencyTours)} icon={<Globe2 className="h-4 w-4" />} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, agency, destination, category, description, contact..."
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | TourStatusKey)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Moderation status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={visibilityFilter} onValueChange={(value) => setVisibilityFilter(value as VisibilityFilter)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All visibility</SelectItem>
              <SelectItem value="published">Visible (published)</SelectItem>
              <SelectItem value="non_published">Hidden or draft</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={agencyFilter}
            onValueChange={(value) => setAgencyFilter(value ?? 'all')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Agency" />
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

          <Select
            value={countryFilter}
            onValueChange={(value) => setCountryFilter(value ?? 'all')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Country / destination" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {countryOptions.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value ?? 'all')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={tourTypeFilter}
            onValueChange={(value) => setTourTypeFilter(value ?? 'all')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tour type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tour types</SelectItem>
              <SelectItem value="international">International</SelectItem>
              <SelectItem value="domestic">Domestic</SelectItem>
            </SelectContent>
          </Select>

          <Select value={hasImageFilter} onValueChange={(value) => setHasImageFilter(value as PresenceFilter)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Images" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All image states</SelectItem>
              <SelectItem value="with">Has images</SelectItem>
              <SelectItem value="without">No images</SelectItem>
            </SelectContent>
          </Select>

          <Select value={hasSeatsFilter} onValueChange={(value) => setHasSeatsFilter(value as PresenceFilter)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seats data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All seat states</SelectItem>
              <SelectItem value="with">Has seats data</SelectItem>
              <SelectItem value="without">No seats data</SelectItem>
            </SelectContent>
          </Select>

          <Select value={featuredFilter} onValueChange={(value) => setFeaturedFilter(value as FeaturedFilter)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Featured" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All feature states</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="not_featured">Not featured</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="number"
            value={priceMin}
            onChange={(event) => setPriceMin(event.target.value)}
            placeholder="Min price"
          />
          <Input
            type="number"
            value={priceMax}
            onChange={(event) => setPriceMax(event.target.value)}
            placeholder="Max price"
          />
          <Input
            type="date"
            value={departureFrom}
            onChange={(event) => setDepartureFrom(event.target.value)}
            placeholder="Departure from"
          />
          <Input
            type="date"
            value={departureTo}
            onChange={(event) => setDepartureTo(event.target.value)}
            placeholder="Departure to"
          />
          <Input
            type="date"
            value={createdFrom}
            onChange={(event) => setCreatedFrom(event.target.value)}
            placeholder="Created from"
          />
          <Input
            type="date"
            value={createdTo}
            onChange={(event) => setCreatedTo(event.target.value)}
            placeholder="Created to"
          />

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortKey)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={resetFilters} className="w-full">
            <FilterX className="h-4 w-4" />
            Reset filters
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        {hasGlobalError ? (
          <div className="space-y-4 p-10 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-rose-400" />
            <p className="text-sm text-slate-700">
              Tours data could not be loaded right now.
            </p>
            <Button onClick={handleRefresh}>Try again</Button>
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="space-y-4 p-10 text-center">
            <Search className="mx-auto h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">
              No tours matched the current filters.
            </p>
            <Button variant="outline" onClick={resetFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1300px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Tour</th>
                    <th className="px-4 py-3">Agency</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Schedule</th>
                    <th className="px-4 py-3">Seats</th>
                    <th className="px-4 py-3">Activity</th>
                    <th className="px-4 py-3">Quality</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTours.map((tour) => (
                    <tr
                      key={tour.id}
                      className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                      onClick={() => openTourDetail(tour.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <TourThumbnail
                            src={tour.imageUrls[0] ?? placeholderImage(220, 140, 'Tour')}
                            alt={tour.title}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{tour.title}</p>
                            <p className="text-xs text-slate-500">{tour.slug}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Created {formatDate(tour.created_at)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="font-medium text-slate-800">
                          {tour.agency?.name ?? 'Not provided'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {tour.agency?.is_verified ? 'Verified' : 'Unverified'}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <TourStatusBadge status={tour.status} />
                          {tour.is_featured ? <Badge className="bg-violet-100 text-violet-700">Featured</Badge> : null}
                          {tour.activePromotions.length > 0 ? (
                            <Badge className="bg-sky-100 text-sky-700">
                              {tour.activePromotions.length} promotion
                              {tour.activePromotions.length > 1 ? 's' : ''}
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-slate-700">
                        {tour.locationLabel}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {tour.price != null ? (
                          <p className="font-semibold text-slate-900">
                            {formatPrice(tour.price, tour.currency)}
                          </p>
                        ) : (
                          <p className="text-slate-500">Not provided</p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-slate-700">
                          {tour.departure_date ? formatDate(tour.departure_date) : 'Not provided'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Updated {formatDate(tour.updated_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top text-slate-700">
                        {tour.seats_total != null || tour.seats_left != null
                          ? `${tour.seats_left ?? 'Not set'} / ${tour.seats_total ?? 'Not set'}`
                          : 'Not provided'}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="space-y-0.5 text-xs text-slate-600">
                          <p className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                            {formatNumber(tour.view_count)}
                          </p>
                          <p className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            {formatNumber(tour.leadSummary.count)} leads
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {tour.warningCount > 0 ? (
                          <Badge className="bg-amber-100 text-amber-800">
                            {tour.warningCount} warning{tour.warningCount > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700">Clean</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-right" onClick={(event) => event.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openTourDetail(tour.id)}
                          >
                            Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={statusBusyId === tour.id}
                            onClick={() => requestStatusChange(tour, 'published')}
                          >
                            Publish
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={statusBusyId === tour.id}
                            onClick={() => requestStatusChange(tour, 'archived')}
                          >
                            Archive
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyPublicLink(tour.slug)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-3 lg:hidden">
              {filteredTours.map((tour) => (
                <article
                  key={tour.id}
                  className="rounded-2xl border border-slate-200 p-3"
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => openTourDetail(tour.id)}
                  >
                    <div className="flex items-center gap-3">
                      <TourThumbnail
                        src={tour.imageUrls[0] ?? placeholderImage(220, 140, 'Tour')}
                        alt={tour.title}
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate font-semibold text-slate-900">{tour.title}</p>
                        <p className="text-xs text-slate-500">{tour.locationLabel}</p>
                        <div className="flex flex-wrap items-center gap-1">
                          <TourStatusBadge status={tour.status} />
                          {tour.warningCount > 0 ? (
                            <Badge className="bg-amber-100 text-amber-800">
                              {tour.warningCount} warning
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openTourDetail(tour.id)}>
                      Details
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => requestStatusChange(tour, 'published')}>
                      Publish
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => requestStatusChange(tour, 'archived')}>
                      Archive
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <TourDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        tour={selectedTour}
        onRequestStatusChange={requestStatusChange}
        statusBusy={statusBusyId != null}
      />

      <Dialog
        open={Boolean(pendingStatusChange)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingStatusChange(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm moderation action</DialogTitle>
            <DialogDescription>
              {pendingStatusChange
                ? `Change tour status to "${pendingStatusChange.nextStatus}"? This action updates moderation state immediately.`
                : 'Please confirm this status change.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingStatusChange(null)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange} disabled={statusBusyId != null}>
              {statusBusyId ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InlineStat
          label="Expiring soon departures"
          value={formatNumber(stats.expiringSoon)}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <InlineStat
          label="Expired departures"
          value={formatNumber(stats.expired)}
          icon={<Clock3 className="h-4 w-4" />}
        />
        <InlineStat
          label="Filtered tours"
          value={formatNumber(filteredTours.length)}
          icon={<Search className="h-4 w-4" />}
        />
        <InlineStat
          label="Pending in filtered view"
          value={formatNumber(filteredTours.filter((tour) => tour.status === 'pending').length)}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tone = 'slate',
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: 'slate' | 'amber' | 'emerald' | 'rose';
}) {
  const toneClasses =
    tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : tone === 'emerald'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : tone === 'rose'
          ? 'border-rose-200 bg-rose-50 text-rose-900'
          : 'border-slate-200 bg-white text-slate-900';

  return (
    <div className={cn('rounded-2xl border p-4', toneClasses)}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function InlineStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-1 flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function TourThumbnail({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      {failed ? (
        <div className="flex h-full items-center justify-center text-slate-400">
          <ImageIcon className="h-4 w-4" />
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          onError={() => setFailed(true)}
          className="object-cover"
          sizes="120px"
        />
      )}
    </div>
  );
}
