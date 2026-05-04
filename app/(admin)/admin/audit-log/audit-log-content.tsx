'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  RefreshCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
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
import { cn, formatNumber } from '@/lib/utils';
import { useDebouncedValue } from '@/features/admin/use-debounced-value';
import type { AdminAuditEvent, AdminAuditPayload } from '@/features/admin/audit-log';

const AuditLogDetailSheet = dynamic(
  () => import('./audit-log-detail-sheet').then((module) => module.AuditLogDetailSheet),
  { ssr: false }
);

const EVENTS_PAGE_SIZE = 80;

type SortValue = 'newest' | 'oldest' | 'severity' | 'actor' | 'entity' | 'action';
type SeverityValue = NonNullable<AdminAuditEvent['severity']>;
type StatusValue = NonNullable<AdminAuditEvent['status']>;

interface AuditLogContentProps {
  initialPayload?: AdminAuditPayload;
  loadError?: string;
}

const EMPTY_PAYLOAD: AdminAuditPayload = {
  generatedAt: new Date(0).toISOString(),
  coverageMode: 'unavailable',
  coverageTitle: 'Audit logging is not configured yet',
  coverageDescription: 'No audit sources were loaded.',
  coveredAreas: [],
  missingAreas: [],
  backendRequirements: [],
  sourceSummaries: [],
  events: [],
  sourceErrors: [],
};

function safeTimestamp(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';
  return date.toLocaleString();
}

function label(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : 'Not provided';
}

function severityRank(value: AdminAuditEvent['severity']): number {
  if (value === 'critical') return 4;
  if (value === 'error') return 3;
  if (value === 'warning') return 2;
  if (value === 'info') return 1;
  return 0;
}

function statusBadgeClass(value: AdminAuditEvent['status']): string {
  if (value === 'success') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (value === 'failed') return 'bg-red-100 text-red-700 border-red-200';
  if (value === 'pending') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function severityBadgeClass(value: AdminAuditEvent['severity']): string {
  if (value === 'critical') return 'bg-red-100 text-red-700 border-red-200';
  if (value === 'error') return 'bg-rose-100 text-rose-700 border-rose-200';
  if (value === 'warning') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (value === 'info') return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

export function AuditLogContent({ initialPayload, loadError }: AuditLogContentProps) {
  const router = useRouter();
  const [payload, setPayload] = useState<AdminAuditPayload>(initialPayload ?? EMPTY_PAYLOAD);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actorFilter, setActorFilter] = useState<'all' | string>('all');
  const [actionFilter, setActionFilter] = useState<'all' | string>('all');
  const [entityFilter, setEntityFilter] = useState<'all' | string>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | string>('all');
  const [sortBy, setSortBy] = useState<SortValue>('newest');
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const [failedOnly, setFailedOnly] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AdminAuditEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(initialPayload?.generatedAt ?? '');
  const debouncedSearch = useDebouncedValue(search, 250);

  useEffect(() => {
    if (initialPayload) {
      setPayload(initialPayload);
      setLastUpdatedAt(initialPayload.generatedAt);
    }
  }, [initialPayload]);

  const allEvents = payload.events;

  const actorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allEvents
            .map((event) => event.actorName || event.actorEmail || event.actorId)
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [allEvents]
  );

  const actionOptions = useMemo(
    () => Array.from(new Set(allEvents.map((event) => event.actionType))).sort((a, b) => a.localeCompare(b)),
    [allEvents]
  );

  const entityOptions = useMemo(
    () => Array.from(new Set(allEvents.map((event) => event.entityType))).sort((a, b) => a.localeCompare(b)),
    [allEvents]
  );

  const severityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allEvents
            .map((event) => event.severity)
            .filter((value): value is SeverityValue => value !== null)
        )
      ).sort((a, b) => severityRank(b) - severityRank(a)),
    [allEvents]
  );

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allEvents
            .map((event) => event.status)
            .filter((value): value is StatusValue => value !== null)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [allEvents]
  );

  const sourceOptions = useMemo(
    () => Array.from(new Set(allEvents.map((event) => event.sourceModule))).sort((a, b) => a.localeCompare(b)),
    [allEvents]
  );

  const filteredEvents = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

    const rows = allEvents.filter((event) => {
      const ts = safeTimestamp(event.timestamp);

      if (fromMs != null && ts < fromMs) return false;
      if (toMs != null && ts > toMs) return false;
      if (highRiskOnly && !event.highRisk) return false;
      if (failedOnly && event.status !== 'failed' && event.severity !== 'error') return false;
      if (actorFilter !== 'all') {
        const actorValue = event.actorName || event.actorEmail || event.actorId || '';
        if (actorValue !== actorFilter) return false;
      }
      if (actionFilter !== 'all' && event.actionType !== actionFilter) return false;
      if (entityFilter !== 'all' && event.entityType !== entityFilter) return false;
      if (severityFilter !== 'all' && event.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && event.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && event.sourceModule !== sourceFilter) return false;

      if (normalizedSearch.length === 0) return true;

      const haystack = [
        event.action,
        event.actionType,
        event.actorName,
        event.actorEmail,
        event.actorId,
        event.targetSummary,
        event.entityType,
        event.entityId,
        event.sourceModule,
        event.status,
        event.severity,
        JSON.stringify(event.metadata ?? {}),
      ]
        .map((value) => (value ? String(value).toLowerCase() : ''))
        .join(' ');

      return haystack.includes(normalizedSearch);
    });

    rows.sort((a, b) => {
      if (sortBy === 'newest') return safeTimestamp(b.timestamp) - safeTimestamp(a.timestamp);
      if (sortBy === 'oldest') return safeTimestamp(a.timestamp) - safeTimestamp(b.timestamp);
      if (sortBy === 'severity') {
        const diff = severityRank(b.severity) - severityRank(a.severity);
        return diff !== 0 ? diff : safeTimestamp(b.timestamp) - safeTimestamp(a.timestamp);
      }
      if (sortBy === 'actor') {
        const left = (a.actorName || a.actorEmail || a.actorId || '').toLowerCase();
        const right = (b.actorName || b.actorEmail || b.actorId || '').toLowerCase();
        return left.localeCompare(right) || safeTimestamp(b.timestamp) - safeTimestamp(a.timestamp);
      }
      if (sortBy === 'entity') {
        return (
          a.entityType.localeCompare(b.entityType) ||
          safeTimestamp(b.timestamp) - safeTimestamp(a.timestamp)
        );
      }
      return (
        a.actionType.localeCompare(b.actionType) ||
        safeTimestamp(b.timestamp) - safeTimestamp(a.timestamp)
      );
    });

    return rows;
  }, [
    actionFilter,
    actorFilter,
    allEvents,
    dateFrom,
    dateTo,
    entityFilter,
    failedOnly,
    highRiskOnly,
    debouncedSearch,
    severityFilter,
    sortBy,
    sourceFilter,
    statusFilter,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    actionFilter,
    actorFilter,
    dateFrom,
    dateTo,
    debouncedSearch,
    entityFilter,
    failedOnly,
    highRiskOnly,
    severityFilter,
    sortBy,
    sourceFilter,
    statusFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const visibleEvents = useMemo(() => {
    const startIndex = (safePage - 1) * EVENTS_PAGE_SIZE;
    return filteredEvents.slice(startIndex, startIndex + EVENTS_PAGE_SIZE);
  }, [filteredEvents, safePage]);

  const metrics = useMemo(() => {
    const now = Date.now();
    const in24h = allEvents.filter((event) => now - safeTimestamp(event.timestamp) <= 24 * 60 * 60 * 1000).length;
    const in7d = allEvents.filter((event) => now - safeTimestamp(event.timestamp) <= 7 * 24 * 60 * 60 * 1000).length;
    const highRisk = allEvents.filter((event) => event.highRisk).length;
    const failedOrError = allEvents.filter(
      (event) => event.status === 'failed' || event.severity === 'error'
    ).length;
    const adminActions = allEvents.filter((event) => event.actorRole === 'admin').length;

    const moduleCount = new Map<string, number>();
    for (const event of allEvents) {
      moduleCount.set(event.sourceModule, (moduleCount.get(event.sourceModule) ?? 0) + 1);
    }
    const topModule = Array.from(moduleCount.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      total: allEvents.length,
      in24h,
      in7d,
      highRisk,
      failedOrError,
      adminActions,
      topModule: topModule ? `${topModule[0]} (${topModule[1]})` : 'Not available',
    };
  }, [allEvents]);

  const resetFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setActorFilter('all');
    setActionFilter('all');
    setEntityFilter('all');
    setSeverityFilter('all');
    setStatusFilter('all');
    setSourceFilter('all');
    setSortBy('newest');
    setHighRiskOnly(false);
    setFailedOnly(false);
  };

  const refreshData = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const openEventDetail = (event: AdminAuditEvent) => {
    setSelectedEvent(event);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Audit Log</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Admin activity, moderation decisions, security-relevant events, and operational traceability.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={refreshData}
            className="inline-flex items-center gap-2"
            disabled={refreshing}
          >
            <RefreshCcw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
            Last updated: {lastUpdatedAt ? formatTimestamp(lastUpdatedAt) : 'Not available'}
          </span>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-medium">Audit log failed to load</p>
          <p className="mt-1">{loadError}</p>
        </div>
      ) : (
        <div
          className={cn(
            'rounded-2xl border px-4 py-3',
            payload.coverageMode === 'unavailable'
              ? 'border-amber-200 bg-amber-50'
              : 'border-blue-200 bg-blue-50'
          )}
        >
          <p className="text-sm font-semibold text-slate-900">{payload.coverageTitle}</p>
          <p className="mt-1 text-sm text-slate-700">{payload.coverageDescription}</p>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-white/70 bg-white/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Currently covered</p>
              {payload.coveredAreas.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {payload.coveredAreas.map((area) => (
                    <li key={area} className="inline-flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-600">No covered areas detected.</p>
              )}
            </div>
            <div className="rounded-xl border border-white/70 bg-white/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Not covered</p>
              {payload.missingAreas.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {payload.missingAreas.map((area) => (
                    <li key={area} className="inline-flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-amber-600" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-600">No explicit gaps detected.</p>
              )}
            </div>
          </div>

          {payload.coverageMode === 'unavailable' && payload.backendRequirements.length > 0 ? (
            <div className="mt-3 rounded-xl border border-amber-300 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Missing backend requirements
              </p>
              <ul className="mt-2 grid gap-1 text-sm text-slate-700 md:grid-cols-2">
                {payload.backendRequirements.map((requirement) => (
                  <li key={requirement}>- {requirement}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <button
          type="button"
          onClick={resetFilters}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total events</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(metrics.total)}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setDateFrom(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
            setDateTo(new Date().toISOString().slice(0, 10));
          }}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Events last 24h</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(metrics.in24h)}</p>
        </button>
        <button
          type="button"
          onClick={() => setHighRiskOnly(true)}
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">High-risk events</p>
          <p className="mt-2 text-2xl font-semibold text-amber-800">{formatNumber(metrics.highRisk)}</p>
        </button>
        <button
          type="button"
          onClick={() => setFailedOnly(true)}
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Failed/error events</p>
          <p className="mt-2 text-2xl font-semibold text-red-800">{formatNumber(metrics.failedOrError)}</p>
        </button>
        <button
          type="button"
          onClick={() => setActorFilter('all')}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin actions</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(metrics.adminActions)}</p>
        </button>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Most active module</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{metrics.topModule}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 xl:grid-cols-12">
          <div className="relative xl:col-span-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search action, actor, entity, metadata..."
              className="h-9 pl-9"
            />
          </div>

          <div className="xl:col-span-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="h-9"
            />
          </div>

          <div className="xl:col-span-2">
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="h-9"
            />
          </div>

          <div className="xl:col-span-2">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy((value as SortValue | null) ?? 'newest')}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="severity">Severity</SelectItem>
                <SelectItem value="actor">Actor</SelectItem>
                <SelectItem value="entity">Entity type</SelectItem>
                <SelectItem value="action">Action type</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2 xl:col-span-2">
            <Button
              variant={highRiskOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHighRiskOnly((value) => !value)}
              className="inline-flex items-center gap-1.5"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              High-risk
            </Button>
            <Button
              variant={failedOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFailedOnly((value) => !value)}
              className="inline-flex items-center gap-1.5"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Failed
            </Button>
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-6">
          <Select value={actorFilter} onValueChange={(value) => setActorFilter(value ?? 'all')}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="Actor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actors</SelectItem>
              {actorOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={(value) => setActionFilter(value ?? 'all')}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="Action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {actionOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={entityFilter} onValueChange={(value) => setEntityFilter(value ?? 'all')}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="Entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entity types</SelectItem>
              {entityOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value ?? 'all')}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              {severityOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'all')}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center justify-between gap-2">
            <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value ?? 'all')}>
              <SelectTrigger className="h-8 w-full">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {sourceOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="shrink-0">
              Reset
            </Button>
          </div>
        </div>

        <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {filteredEvents.length} events matched from {allEvents.length} loaded records
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Audit event timeline</p>
          <div className="flex items-center gap-2">
            <p className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Clock3 className="h-3.5 w-3.5" />
              Sorted by {sortBy}
            </p>
            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="min-w-12 text-center text-[11px] font-medium text-slate-600">
                {safePage}/{totalPages}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={safePage >= totalPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-14 text-center">
            <Filter className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">No audit events matched current filters</p>
            <p className="mt-1 text-xs text-slate-500">
              Reset filters or broaden date/search criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Timestamp</th>
                    <th className="px-3 py-2">Action</th>
                    <th className="px-3 py-2">Actor</th>
                    <th className="px-3 py-2">Entity</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Severity</th>
                    <th className="px-3 py-2">Module</th>
                    <th className="px-3 py-2">Metadata</th>
                    <th className="px-3 py-2 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
                      onClick={() => openEventDetail(event)}
                    >
                      <td className="px-3 py-3 text-xs text-slate-600">{formatTimestamp(event.timestamp)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              'mt-1 h-2 w-2 rounded-full',
                              event.severity === 'critical'
                                ? 'bg-red-600'
                                : event.severity === 'error'
                                  ? 'bg-rose-500'
                                  : event.severity === 'warning'
                                    ? 'bg-amber-500'
                                    : 'bg-blue-500'
                            )}
                          />
                          <div>
                            <p className="font-medium text-slate-900">{event.action}</p>
                            <p className="text-xs text-slate-500">{event.actionType}</p>
                            {event.highRisk ? (
                              <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                                <ShieldAlert className="h-3 w-3" />
                                High-risk
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-800">{label(event.actorName)}</p>
                        <p className="text-xs text-slate-500">{label(event.actorEmail)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium capitalize text-slate-800">{event.entityType}</p>
                        <p className="text-xs text-slate-500">{label(event.targetSummary)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <Badge className={cn('border capitalize', statusBadgeClass(event.status))}>
                          {event.status ?? 'not_provided'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge className={cn('border capitalize', severityBadgeClass(event.severity))}>
                          {event.severity ?? 'not_provided'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">{event.sourceModule}</td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {event.metadata ? 'Available (sanitized)' : 'Not provided'}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            openEventDetail(event);
                          }}
                        >
                          Quick view
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 lg:hidden">
              {visibleEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => openEventDetail(event)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{event.action}</p>
                      <p className="text-xs text-slate-500">{event.actionType}</p>
                    </div>
                    {event.highRisk ? (
                      <Badge className="border border-amber-200 bg-amber-100 text-amber-700">High-risk</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{formatTimestamp(event.timestamp)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge className={cn('border capitalize', statusBadgeClass(event.status))}>
                      {event.status ?? 'not_provided'}
                    </Badge>
                    <Badge className={cn('border capitalize', severityBadgeClass(event.severity))}>
                      {event.severity ?? 'not_provided'}
                    </Badge>
                    <Badge className="border border-slate-200 bg-slate-100 text-slate-700 capitalize">
                      {event.entityType}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">Audit data sources</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Table</th>
                <th className="px-3 py-2">Availability</th>
                <th className="px-3 py-2">Rows</th>
                <th className="px-3 py-2">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {payload.sourceSummaries.map((source) => (
                <tr key={source.key} className="border-b border-slate-100">
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-900">{source.label}</p>
                    <p className="text-xs text-slate-500">{source.description}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">{source.table}</td>
                  <td className="px-3 py-3">
                    <Badge
                      className={cn(
                        'border',
                        source.available
                          ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                          : 'border-amber-200 bg-amber-100 text-amber-700'
                      )}
                    >
                      {source.available ? 'Available' : 'Unavailable'}
                    </Badge>
                    {source.error ? <p className="mt-1 text-xs text-amber-700">{source.error}</p> : null}
                  </td>
                  <td className="px-3 py-3 text-sm font-medium text-slate-800">{formatNumber(source.count)}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">
                    {source.eventTypes.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payload.sourceErrors.length > 0 ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Source warnings</p>
            <ul className="mt-2 space-y-1 text-sm text-amber-800">
              {payload.sourceErrors.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {selectedEvent ? (
        <AuditLogDetailSheet
          event={selectedEvent}
          open={detailOpen}
          onOpenChange={(open) => {
            setDetailOpen(open);
            if (!open) {
              setSelectedEvent(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
