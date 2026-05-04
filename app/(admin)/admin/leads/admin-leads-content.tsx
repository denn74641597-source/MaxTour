'use client';

import { useEffect, useMemo, useState, useTransition, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  FilterX,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
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
import { updateLeadStatusAction } from '@/features/admin/actions';
import type {
  AdminLeadPanelItem,
  AdminLeadStatus,
  AdminLeadsPanelPayload,
} from '@/features/admin/types';
import { useDebouncedValue } from '@/features/admin/use-debounced-value';
import { cn, formatNumber, formatPrice } from '@/lib/utils';

const LEADS_PAGE_SIZE = 80;

interface AdminLeadsContentProps {
  payload: AdminLeadsPanelPayload;
}

type StatusFilter = 'all' | AdminLeadStatus;
type OutcomeFilter = 'all' | 'open' | 'converted' | 'lost';
type ContactFilter = 'all' | 'has_contact' | 'missing_contact';
type QuickWindow = 'all' | '24h' | '7d';
type SortOption = 'newest' | 'oldest' | 'unresolved_first' | 'status' | 'agency' | 'tour';

interface PendingStatusIntent {
  leadId: string;
  nextStatus: AdminLeadStatus;
}

interface LeadQuality {
  stale: boolean;
  warnings: string[];
}

const LEAD_STATUS_LABEL: Record<AdminLeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  closed: 'Closed',
  won: 'Won',
  lost: 'Lost',
};

const LEAD_STATUS_TONE: Record<AdminLeadStatus, string> = {
  new: 'border-sky-200 bg-sky-50 text-sky-700',
  contacted: 'border-amber-200 bg-amber-50 text-amber-700',
  closed: 'border-slate-200 bg-slate-100 text-slate-700',
  won: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  lost: 'border-rose-200 bg-rose-50 text-rose-700',
};

const STALE_THRESHOLD_MS = 72 * 60 * 60 * 1000;

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  return new Date(value).getTime();
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Not available';
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const ms = toTimestamp(value);
  if (!Number.isFinite(ms)) return 'Not available';
  const deltaMs = Date.now() - ms;
  if (deltaMs < 0) return 'Just now';
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function normalizePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, '').replace(/[()-]/g, '').toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function getOutcome(status: AdminLeadStatus): OutcomeFilter {
  if (status === 'won' || status === 'closed') return 'converted';
  if (status === 'lost') return 'lost';
  return 'open';
}

function hasAnyContact(lead: AdminLeadPanelItem): boolean {
  return Boolean(
    normalizeText(lead.phone) ||
      normalizeText(lead.telegram_username) ||
      normalizeText(lead.user?.phone) ||
      normalizeText(lead.user?.email) ||
      normalizeText(lead.user?.telegram_username)
  );
}

function resolveDestination(lead: AdminLeadPanelItem): string {
  const parts = [lead.tour?.country, lead.tour?.region, lead.tour?.city, lead.tour?.district].filter(
    (part): part is string => Boolean(part && part.trim().length > 0)
  );
  if (parts.length === 0) return 'Not available';
  return parts.join(', ');
}

function resolveCustomerLabel(lead: AdminLeadPanelItem): string {
  if (lead.user?.full_name && lead.user.full_name.trim().length > 0) {
    return lead.user.full_name;
  }
  return lead.full_name;
}

function isUnresolved(lead: AdminLeadPanelItem): boolean {
  return lead.status === 'new' || lead.status === 'contacted';
}

function isLeadStale(lead: AdminLeadPanelItem): boolean {
  if (!isUnresolved(lead)) return false;
  const referenceMs = toTimestamp(lead.updated_at || lead.created_at);
  if (!Number.isFinite(referenceMs)) return false;
  return Date.now() - referenceMs >= STALE_THRESHOLD_MS;
}

function buildLeadQuality(lead: AdminLeadPanelItem, duplicatedPhones: Set<string>): LeadQuality {
  const normalizedPhone = normalizePhone(lead.phone);
  const warnings: string[] = [];

  if (!hasAnyContact(lead)) warnings.push('Missing contact details');
  if (!lead.tour) warnings.push('Missing linked tour');
  if (!lead.agency) warnings.push('Missing linked agency');
  if (lead.agency && !lead.agency.is_verified) warnings.push('Linked agency is unverified');
  if (lead.tour?.status && lead.tour.status !== 'published') warnings.push('Linked tour is not published');
  if (lead.status === 'new') warnings.push('No response yet');
  if (isLeadStale(lead)) warnings.push('Lead is stale (>72h unresolved)');
  if (normalizedPhone && duplicatedPhones.has(normalizedPhone)) warnings.push('Possible duplicate contact');

  return {
    stale: warnings.includes('Lead is stale (>72h unresolved)'),
    warnings,
  };
}

function matchDateRange(isoValue: string, from: string, to: string): boolean {
  const valueMs = toTimestamp(isoValue);
  if (!Number.isFinite(valueMs)) return false;

  if (from) {
    const fromMs = toTimestamp(`${from}T00:00:00`);
    if (Number.isFinite(fromMs) && valueMs < fromMs) return false;
  }

  if (to) {
    const toMs = toTimestamp(`${to}T23:59:59`);
    if (Number.isFinite(toMs) && valueMs > toMs) return false;
  }

  return true;
}

function matchesQuickWindow(isoValue: string, window: QuickWindow): boolean {
  if (window === 'all') return true;
  const valueMs = toTimestamp(isoValue);
  if (!Number.isFinite(valueMs)) return false;
  const ageMs = Date.now() - valueMs;
  if (window === '24h') return ageMs <= 24 * 60 * 60 * 1000;
  if (window === '7d') return ageMs <= 7 * 24 * 60 * 60 * 1000;
  return true;
}

function statusRank(status: AdminLeadStatus): number {
  if (status === 'new') return 0;
  if (status === 'contacted') return 1;
  if (status === 'won') return 2;
  if (status === 'closed') return 3;
  return 4;
}

function LeadStatusBadge({ status }: { status: AdminLeadStatus }) {
  return (
    <Badge variant="outline" className={cn('border text-[11px] font-medium', LEAD_STATUS_TONE[status])}>
      {LEAD_STATUS_LABEL[status]}
    </Badge>
  );
}

function MetricCard({
  label,
  value,
  tone = 'default',
  active = false,
  onClick,
}: {
  label: string;
  value: number;
  tone?: 'default' | 'info' | 'warning' | 'success' | 'danger';
  active?: boolean;
  onClick?: () => void;
}) {
  const toneClass: Record<NonNullable<typeof tone>, string> = {
    default: 'border-slate-200 bg-white text-slate-900',
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    danger: 'border-rose-200 bg-rose-50 text-rose-900',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-4 text-left transition hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
        toneClass[tone],
        active && 'ring-2 ring-slate-300',
        !onClick && 'cursor-default'
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{formatNumber(value)}</p>
    </button>
  );
}

export function AdminLeadsContent({ payload }: AdminLeadsContentProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  const [leads, setLeads] = useState<AdminLeadPanelItem[]>(payload.leads);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(payload.generatedAt);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [tourFilter, setTourFilter] = useState('all');
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('all');
  const [contactFilter, setContactFilter] = useState<ContactFilter>('all');
  const [quickWindow, setQuickWindow] = useState<QuickWindow>('all');
  const [staleOnly, setStaleOnly] = useState(false);
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [pendingStatusIntent, setPendingStatusIntent] = useState<PendingStatusIntent | null>(null);
  const [statusBusyLeadId, setStatusBusyLeadId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 250);

  useEffect(() => {
    setLeads(payload.leads);
    setLastUpdatedAt(payload.generatedAt);
  }, [payload.generatedAt, payload.leads]);

  const duplicatedPhones = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of leads) {
      const phone = normalizePhone(lead.phone);
      if (!phone) continue;
      counts.set(phone, (counts.get(phone) ?? 0) + 1);
    }

    const duplicates = new Set<string>();
    for (const [phone, count] of counts.entries()) {
      if (count > 1) duplicates.add(phone);
    }
    return duplicates;
  }, [leads]);

  const leadQualityMap = useMemo(() => {
    const map = new Map<string, LeadQuality>();
    for (const lead of leads) {
      map.set(lead.id, buildLeadQuality(lead, duplicatedPhones));
    }
    return map;
  }, [leads, duplicatedPhones]);

  const agencyOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ id: string; name: string }> = [];

    for (const lead of leads) {
      const agencyId = lead.agency?.id ?? lead.agency_id;
      const agencyName = lead.agency?.name;
      if (!agencyId || !agencyName || seen.has(agencyId)) continue;
      seen.add(agencyId);
      options.push({ id: agencyId, name: agencyName });
    }

    return options.sort((a, b) => a.name.localeCompare(b.name));
  }, [leads]);

  const tourOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ id: string; title: string }> = [];

    for (const lead of leads) {
      const tourId = lead.tour?.id ?? lead.tour_id;
      const title = lead.tour?.title;
      if (!tourId || !title || seen.has(tourId)) continue;
      seen.add(tourId);
      options.push({ id: tourId, title });
    }

    return options.sort((a, b) => a.title.localeCompare(b.title));
  }, [leads]);

  const destinationOptions = useMemo(() => {
    const set = new Set<string>();
    for (const lead of leads) {
      const destination = resolveDestination(lead);
      if (destination !== 'Not available') set.add(destination);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const query = normalizeText(debouncedSearch);

    const rows = leads.filter((lead) => {
      const quality = leadQualityMap.get(lead.id);
      const destination = resolveDestination(lead);

      if (query) {
        const haystack = [
          resolveCustomerLabel(lead),
          lead.full_name,
          lead.phone,
          lead.telegram_username,
          lead.user?.phone,
          lead.user?.email,
          lead.user?.telegram_username,
          lead.tour?.title,
          lead.agency?.name,
          destination,
          lead.comment,
        ]
          .map((value) => normalizeText(value))
          .join(' ');

        if (!haystack.includes(query)) return false;
      }

      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;

      const currentAgencyId = lead.agency?.id ?? lead.agency_id;
      if (agencyFilter !== 'all' && currentAgencyId !== agencyFilter) return false;

      const currentTourId = lead.tour?.id ?? lead.tour_id;
      if (tourFilter !== 'all' && currentTourId !== tourFilter) return false;

      if (destinationFilter !== 'all' && destination !== destinationFilter) return false;
      if (outcomeFilter !== 'all' && getOutcome(lead.status) !== outcomeFilter) return false;

      if (contactFilter === 'has_contact' && !hasAnyContact(lead)) return false;
      if (contactFilter === 'missing_contact' && hasAnyContact(lead)) return false;

      if (!matchDateRange(lead.created_at, createdFrom, createdTo)) return false;
      if (!matchesQuickWindow(lead.created_at, quickWindow)) return false;
      if (staleOnly && !quality?.stale) return false;

      return true;
    });

    return [...rows].sort((a, b) => {
      const aCreated = toTimestamp(a.created_at);
      const bCreated = toTimestamp(b.created_at);

      if (sortBy === 'oldest') return aCreated - bCreated;
      if (sortBy === 'status') return statusRank(a.status) - statusRank(b.status) || bCreated - aCreated;
      if (sortBy === 'agency') {
        return (a.agency?.name ?? 'zzzz').localeCompare(b.agency?.name ?? 'zzzz') || bCreated - aCreated;
      }
      if (sortBy === 'tour') {
        return (a.tour?.title ?? 'zzzz').localeCompare(b.tour?.title ?? 'zzzz') || bCreated - aCreated;
      }
      if (sortBy === 'unresolved_first') {
        const unresolvedDiff = Number(isUnresolved(b)) - Number(isUnresolved(a));
        if (unresolvedDiff !== 0) return unresolvedDiff;
        return bCreated - aCreated;
      }
      return bCreated - aCreated;
    });
  }, [
    leads,
    leadQualityMap,
    debouncedSearch,
    statusFilter,
    agencyFilter,
    tourFilter,
    destinationFilter,
    outcomeFilter,
    contactFilter,
    createdFrom,
    createdTo,
    quickWindow,
    staleOnly,
    sortBy,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    agencyFilter,
    contactFilter,
    createdFrom,
    createdTo,
    debouncedSearch,
    destinationFilter,
    outcomeFilter,
    quickWindow,
    sortBy,
    staleOnly,
    statusFilter,
    tourFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / LEADS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const visibleLeads = useMemo(() => {
    const startIndex = (safePage - 1) * LEADS_PAGE_SIZE;
    return filteredLeads.slice(startIndex, startIndex + LEADS_PAGE_SIZE);
  }, [filteredLeads, safePage]);

  const stats = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    let newCount = 0;
    let contactedCount = 0;
    let convertedClosedCount = 0;
    let lostCount = 0;
    let recent24h = 0;
    let recent7d = 0;
    let staleCount = 0;

    for (const lead of leads) {
      if (lead.status === 'new') newCount += 1;
      if (lead.status === 'contacted') contactedCount += 1;
      if (lead.status === 'won' || lead.status === 'closed') convertedClosedCount += 1;
      if (lead.status === 'lost') lostCount += 1;

      const createdMs = toTimestamp(lead.created_at);
      if (Number.isFinite(createdMs)) {
        const age = now - createdMs;
        if (age <= dayMs) recent24h += 1;
        if (age <= 7 * dayMs) recent7d += 1;
      }

      if (leadQualityMap.get(lead.id)?.stale) staleCount += 1;
    }

    return {
      total: leads.length,
      newCount,
      contactedCount,
      convertedClosedCount,
      lostCount,
      recent24h,
      recent7d,
      staleCount,
    };
  }, [leads, leadQualityMap]);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );

  function resetFilters() {
    setSearch('');
    setStatusFilter('all');
    setAgencyFilter('all');
    setTourFilter('all');
    setDestinationFilter('all');
    setOutcomeFilter('all');
    setContactFilter('all');
    setQuickWindow('all');
    setStaleOnly(false);
    setCreatedFrom('');
    setCreatedTo('');
    setSortBy('newest');
  }

  function applyMetricFilter(type: 'all' | 'new' | 'open' | 'converted' | 'lost' | '24h' | '7d' | 'stale') {
    if (type === 'all') {
      resetFilters();
      return;
    }
    if (type === 'new') {
      setStatusFilter('new');
      setOutcomeFilter('all');
      return;
    }
    if (type === 'open') {
      setStatusFilter('all');
      setOutcomeFilter('open');
      return;
    }
    if (type === 'converted') {
      setStatusFilter('all');
      setOutcomeFilter('converted');
      return;
    }
    if (type === 'lost') {
      setStatusFilter('all');
      setOutcomeFilter('lost');
      return;
    }
    if (type === '24h') {
      setQuickWindow('24h');
      return;
    }
    if (type === '7d') {
      setQuickWindow('7d');
      return;
    }
    setStaleOnly((prev) => !prev);
  }

  async function copyValue(value: string | null | undefined, label: string) {
    if (!value || value.trim().length === 0) {
      toast.error(`${label} not available`);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  }

  function requestStatusChange(lead: AdminLeadPanelItem, nextStatus: AdminLeadStatus) {
    if (lead.status === nextStatus) return;
    setPendingStatusIntent({ leadId: lead.id, nextStatus });
  }

  async function confirmStatusChange() {
    if (!pendingStatusIntent) return;

    const { leadId, nextStatus } = pendingStatusIntent;
    const currentLead = leads.find((lead) => lead.id === leadId);
    if (!currentLead) {
      setPendingStatusIntent(null);
      return;
    }

    setStatusBusyLeadId(leadId);
    const result = await updateLeadStatusAction(leadId, nextStatus);
    setStatusBusyLeadId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? { ...lead, status: nextStatus, updated_at: new Date().toISOString() }
          : lead
      )
    );

    setPendingStatusIntent(null);
    setLastUpdatedAt(new Date().toISOString());
    toast.success('Lead status updated');
    router.refresh();
  }

  function handleRefresh() {
    startRefresh(() => {
      router.refresh();
    });
  }

  function openLeadDetails(leadId: string) {
    setSelectedLeadId(leadId);
    setDetailOpen(true);
  }

  const showHardError = payload.health.partialData && leads.length === 0;

  return (
    <SectionShell className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle
          title="Leads"
          subtitle="Inquiry tracking, agency response monitoring, and marketplace sales operations"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn(isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
            Last updated: <span className="font-medium text-slate-900">{formatDateTime(lastUpdatedAt)}</span>
          </div>
        </div>
      </div>

      {payload.health.partialData ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Some lead data is unavailable right now.</p>
              <p className="mt-1 text-xs">{payload.health.errors.join(' | ')}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
        <MetricCard
          label="Total leads"
          value={stats.total}
          active={statusFilter === 'all' && outcomeFilter === 'all' && quickWindow === 'all' && !staleOnly}
          onClick={() => applyMetricFilter('all')}
        />
        <MetricCard
          label="New / unread"
          value={stats.newCount}
          tone="info"
          active={statusFilter === 'new'}
          onClick={() => applyMetricFilter('new')}
        />
        <MetricCard
          label="Open / in progress"
          value={stats.contactedCount}
          tone="warning"
          active={outcomeFilter === 'open' && statusFilter === 'all'}
          onClick={() => applyMetricFilter('open')}
        />
        <MetricCard
          label="Converted / closed"
          value={stats.convertedClosedCount}
          tone="success"
          active={outcomeFilter === 'converted'}
          onClick={() => applyMetricFilter('converted')}
        />
        <MetricCard
          label="Lost / cancelled"
          value={stats.lostCount}
          tone="danger"
          active={outcomeFilter === 'lost'}
          onClick={() => applyMetricFilter('lost')}
        />
        <MetricCard
          label="Leads last 24h"
          value={stats.recent24h}
          active={quickWindow === '24h'}
          onClick={() => applyMetricFilter('24h')}
        />
        <MetricCard
          label="Leads last 7d"
          value={stats.recent7d}
          active={quickWindow === '7d'}
          onClick={() => applyMetricFilter('7d')}
        />
        <MetricCard
          label="Stale unresolved"
          value={stats.staleCount}
          tone="warning"
          active={staleOnly}
          onClick={() => applyMetricFilter('stale')}
        />
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white py-3">
        <CardContent className="space-y-3 px-4">
          <div className="grid gap-2 xl:grid-cols-[1.4fr_repeat(6,minmax(0,1fr))]">
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer, contact, tour, agency, destination, message..."
                className="h-9 pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={agencyFilter} onValueChange={(value) => setAgencyFilter(value ?? 'all')}>
              <SelectTrigger className="h-9 w-full">
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

            <Select value={tourFilter} onValueChange={(value) => setTourFilter(value ?? 'all')}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Tour" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tours</SelectItem>
                {tourOptions.map((tour) => (
                  <SelectItem key={tour.id} value={tour.id}>
                    {tour.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={destinationFilter} onValueChange={(value) => setDestinationFilter(value ?? 'all')}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Destination" />
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

            <Select value={outcomeFilter} onValueChange={(value) => setOutcomeFilter(value as OutcomeFilter)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All outcomes</SelectItem>
                <SelectItem value="open">Open / unresolved</SelectItem>
                <SelectItem value="converted">Converted / closed</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={contactFilter} onValueChange={(value) => setContactFilter(value as ContactFilter)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Contact state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All contacts</SelectItem>
                <SelectItem value="has_contact">Has contact</SelectItem>
                <SelectItem value="missing_contact">Missing contact</SelectItem>
              </SelectContent>
            </Select>

            <Select value={quickWindow} onValueChange={(value) => setQuickWindow(value as QuickWindow)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Recent window" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7d</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={createdFrom}
              onChange={(event) => setCreatedFrom(event.target.value)}
              className="h-9"
            />
            <Input
              type="date"
              value={createdTo}
              onChange={(event) => setCreatedTo(event.target.value)}
              className="h-9"
            />

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="unresolved_first">Unresolved first</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="agency">Agency</SelectItem>
                <SelectItem value="tour">Tour</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="h-9" onClick={resetFilters}>
              <FilterX />
              Reset filters
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                Filtered: {formatNumber(filteredLeads.length)}
              </Badge>
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
                <span className="min-w-12 text-center text-[11px] font-medium text-slate-700">
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
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                Source/channel filter: not available in current schema
              </Badge>
            </div>
            <div>Response-time and assignment filters are hidden because those fields are not available.</div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-slate-200 bg-white">
        {showHardError ? (
          <div className="space-y-4 p-10 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-rose-500" />
            <p className="text-sm text-slate-700">Leads could not be loaded right now.</p>
            <Button onClick={handleRefresh}>Try again</Button>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="space-y-4 p-10 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">No leads match the current filters.</p>
            <Button variant="outline" onClick={resetFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[1380px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Inquiry</th>
                    <th className="px-4 py-3">Tour & agency</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Quality</th>
                    <th className="px-4 py-3">Timeline</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLeads.map((lead) => {
                    const quality = leadQualityMap.get(lead.id);
                    const destination = resolveDestination(lead);
                    const contactLine = lead.user?.email ?? lead.phone;
                    const quickActionStatus: AdminLeadStatus | null =
                      lead.status === 'new' ? 'contacted' : lead.status === 'contacted' ? 'closed' : null;

                    return (
                      <tr
                        key={lead.id}
                        className="cursor-pointer border-b border-slate-100 align-top transition hover:bg-slate-50"
                        onClick={() => openLeadDetails(lead.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900">{resolveCustomerLabel(lead)}</p>
                              {lead.user?.role === 'user' ? (
                                <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                                  Registered
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-xs text-slate-500">{contactLine || 'Not provided'}</p>
                            <p className="text-xs text-slate-500">
                              {lead.telegram_username || lead.user?.telegram_username || 'Telegram not provided'}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <p className="line-clamp-2 text-sm text-slate-800">
                            {lead.comment?.trim() ? lead.comment : 'Not provided'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Travelers: {formatNumber(Math.max(lead.people_count, 0))}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900">{lead.tour?.title ?? 'Tour not linked'}</p>
                            <p className="text-xs text-slate-500">{lead.agency?.name ?? 'Agency not linked'}</p>
                            <p className="text-xs text-slate-500">{destination}</p>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="space-y-1.5">
                            <LeadStatusBadge status={lead.status} />
                            <Badge variant="outline" className="border-slate-300 bg-white text-slate-700 capitalize">
                              {getOutcome(lead.status)}
                            </Badge>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {quality && quality.warnings.length > 0 ? (
                            <div className="space-y-1">
                              <Badge className="bg-amber-100 text-amber-800">
                                {quality.warnings.length} warning{quality.warnings.length > 1 ? 's' : ''}
                              </Badge>
                              <p className="line-clamp-2 text-xs text-amber-700">
                                {quality.warnings.join(' • ')}
                              </p>
                            </div>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700">Clean</Badge>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="space-y-1 text-xs text-slate-600">
                            <p>Created: {formatDateTime(lead.created_at)}</p>
                            <p>Updated: {formatDateTime(lead.updated_at)}</p>
                            <p className="text-slate-500">{formatRelativeTime(lead.updated_at)}</p>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => openLeadDetails(lead.id)}>
                              Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyValue(lead.phone || lead.user?.email, 'Primary contact')}
                            >
                              <Copy />
                            </Button>
                            {quickActionStatus ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => requestStatusChange(lead, quickActionStatus)}
                                disabled={statusBusyLeadId === lead.id}
                              >
                                {statusBusyLeadId === lead.id ? <Loader2 className="animate-spin" /> : null}
                                {quickActionStatus === 'contacted' ? 'Mark contacted' : 'Close'}
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-3 xl:hidden">
              {visibleLeads.map((lead) => {
                const quality = leadQualityMap.get(lead.id);
                return (
                  <article key={lead.id} className="rounded-2xl border border-slate-200 p-3">
                    <button type="button" className="w-full text-left" onClick={() => openLeadDetails(lead.id)}>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">{resolveCustomerLabel(lead)}</p>
                            <p className="text-xs text-slate-500">{lead.agency?.name ?? 'Agency not linked'}</p>
                          </div>
                          <LeadStatusBadge status={lead.status} />
                        </div>
                        <p className="line-clamp-2 text-sm text-slate-700">{lead.comment || 'Not provided'}</p>
                        <p className="text-xs text-slate-500">{resolveDestination(lead)}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(lead.created_at)}</p>
                        {quality && quality.warnings.length > 0 ? (
                          <Badge className="bg-amber-100 text-amber-800">
                            {quality.warnings.length} warning{quality.warnings.length > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700">Clean</Badge>
                        )}
                      </div>
                    </button>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openLeadDetails(lead.id)}>
                        Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyValue(lead.phone || lead.user?.email, 'Primary contact')}
                      >
                        <Copy />
                        Copy contact
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {selectedLead ? (
        <Sheet
          open={detailOpen}
          onOpenChange={(open) => {
            setDetailOpen(open);
            if (!open) {
              setSelectedLeadId(null);
            }
          }}
        >
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl">
          {selectedLead ? (
            <div className="space-y-5 p-5">
              <SheetHeader className="space-y-2 text-left">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SheetTitle className="text-xl">Lead Detail</SheetTitle>
                  <LeadStatusBadge status={selectedLead.status} />
                </div>
                <SheetDescription>
                  ID: {selectedLead.id} · Created {formatDateTime(selectedLead.created_at)}
                </SheetDescription>
              </SheetHeader>

              <Card className="rounded-2xl border border-slate-200">
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-slate-900 text-white">Workflow</Badge>
                    <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700 capitalize">
                      {getOutcome(selectedLead.status)}
                    </Badge>
                    {leadQualityMap.get(selectedLead.id)?.stale ? (
                      <Badge className="bg-amber-100 text-amber-800">Stale unresolved</Badge>
                    ) : null}
                  </div>

                  <p className="text-sm text-slate-600">
                    Select a safe lead status action. Status updates use existing admin server action.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {(['new', 'contacted', 'closed', 'won', 'lost'] as AdminLeadStatus[]).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={status === selectedLead.status ? 'secondary' : 'outline'}
                        disabled={statusBusyLeadId === selectedLead.id || status === selectedLead.status}
                        onClick={() => requestStatusChange(selectedLead, status)}
                      >
                        {statusBusyLeadId === selectedLead.id ? <Loader2 className="animate-spin" /> : null}
                        {LEAD_STATUS_LABEL[status]}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-slate-200">
                <CardContent className="space-y-3 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Customer</h3>
                  <DetailLine
                    icon={<UserRound className="h-4 w-4" />}
                    label="Lead contact name"
                    value={selectedLead.full_name}
                  />
                  <DetailLine
                    icon={<UserRound className="h-4 w-4" />}
                    label="Linked user"
                    value={selectedLead.user?.full_name ?? 'Not linked'}
                  />
                  <DetailLine
                    icon={<Phone className="h-4 w-4" />}
                    label="Phone"
                    value={selectedLead.phone || selectedLead.user?.phone || 'Not provided'}
                    onCopy={() => copyValue(selectedLead.phone || selectedLead.user?.phone, 'Phone')}
                  />
                  <DetailLine
                    icon={<Mail className="h-4 w-4" />}
                    label="Email"
                    value={selectedLead.user?.email ?? 'Not available'}
                    onCopy={selectedLead.user?.email ? () => copyValue(selectedLead.user?.email, 'Email') : undefined}
                  />
                  <DetailLine
                    icon={<MessageSquare className="h-4 w-4" />}
                    label="Telegram"
                    value={selectedLead.telegram_username || selectedLead.user?.telegram_username || 'Not provided'}
                    onCopy={() => copyValue(selectedLead.telegram_username || selectedLead.user?.telegram_username, 'Telegram')}
                  />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-slate-200">
                <CardContent className="space-y-3 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Inquiry</h3>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    {selectedLead.comment?.trim() ? selectedLead.comment : 'Not provided'}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <MiniField label="Travelers" value={formatNumber(Math.max(selectedLead.people_count, 0))} />
                    <MiniField label="Preferred date" value="Not available" />
                    <MiniField label="Budget" value="Not available" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-slate-200">
                <CardContent className="space-y-3 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Tour Context</h3>
                  {selectedLead.tour ? (
                    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-900">{selectedLead.tour.title}</p>
                        <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                          {selectedLead.tour.status ?? 'Unknown status'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">{resolveDestination(selectedLead)}</p>
                      <p className="text-xs text-slate-600">
                        Price:{' '}
                        {selectedLead.tour.price != null
                          ? formatPrice(selectedLead.tour.price, selectedLead.tour.currency)
                          : 'Not provided'}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link
                          href={`/admin/tours/${selectedLead.tour.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Open admin tour
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/tours/${selectedLead.tour.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:underline"
                        >
                          Open public tour
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No linked tour for this lead.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-slate-200">
                <CardContent className="space-y-3 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Agency Context</h3>
                  {selectedLead.agency ? (
                    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-900">{selectedLead.agency.name}</p>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={
                              selectedLead.agency.is_verified
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-800'
                            }
                          >
                            {selectedLead.agency.is_verified ? 'Verified' : 'Unverified'}
                          </Badge>
                          <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                            {selectedLead.agency.is_approved ? 'Approved' : 'Not approved'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">Phone: {selectedLead.agency.phone ?? 'Not provided'}</p>
                      <p className="text-xs text-slate-600">
                        Telegram: {selectedLead.agency.telegram_username ?? 'Not provided'}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link
                          href="/admin/agencies"
                          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Open agencies panel
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No linked agency for this lead.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-slate-200">
                <CardContent className="space-y-3 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Workflow Metadata</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <MiniField label="Created" value={formatDateTime(selectedLead.created_at)} />
                    <MiniField label="Updated" value={formatDateTime(selectedLead.updated_at)} />
                    <MiniField label="Source / channel" value="Not available" />
                    <MiniField label="Agency response" value="Not available" />
                    <MiniField label="Admin notes" value="Not available" />
                    <MiniField label="Conversation thread" value="Not available" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-slate-200">
                <CardContent className="space-y-3 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Quality Warnings</h3>
                  {leadQualityMap.get(selectedLead.id)?.warnings.length ? (
                    <ul className="space-y-1.5 text-sm text-amber-800">
                      {leadQualityMap.get(selectedLead.id)?.warnings.map((warning) => (
                        <li key={warning} className="flex items-start gap-1.5">
                          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-emerald-700">No data-quality warnings for this lead.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-slate-200">
                <CardContent className="space-y-3 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Admin Action Center</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyValue(selectedLead.phone || selectedLead.user?.phone, 'Phone')}
                    >
                      <Phone />
                      Copy phone
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copyValue(selectedLead.user?.email, 'Email')}>
                      <Mail />
                      Copy email
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyValue(selectedLead.telegram_username || selectedLead.user?.telegram_username, 'Telegram')}
                    >
                      <MessageSquare />
                      Copy telegram
                    </Button>
                    <Link
                      href="/admin/users"
                      className="inline-flex h-7 items-center gap-1 rounded-xl border border-slate-200 px-2.5 text-[0.8rem] font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Users className="h-3.5 w-3.5" />
                      Open users panel
                    </Link>
                    <Link
                      href="/admin/agencies"
                      className="inline-flex h-7 items-center gap-1 rounded-xl border border-slate-200 px-2.5 text-[0.8rem] font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      Open agencies panel
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="p-6 text-sm text-slate-500">Lead details unavailable.</div>
          )}
        </SheetContent>
        </Sheet>
      ) : null}

      <Dialog open={Boolean(pendingStatusIntent)} onOpenChange={(open) => !open && setPendingStatusIntent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm lead status update</DialogTitle>
            <DialogDescription>
              {pendingStatusIntent
                ? `Change status to "${LEAD_STATUS_LABEL[pendingStatusIntent.nextStatus]}"?`
                : 'Confirm this lead status change.'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingStatusIntent(null)} disabled={statusBusyLeadId != null}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange} disabled={statusBusyLeadId != null}>
              {statusBusyLeadId ? <Loader2 className="animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InlineInsight
          label="Unresolved in current view"
          value={formatNumber(filteredLeads.filter((lead) => isUnresolved(lead)).length)}
          icon={<Clock3 className="h-4 w-4" />}
        />
        <InlineInsight
          label="Missing contact in current view"
          value={formatNumber(filteredLeads.filter((lead) => !hasAnyContact(lead)).length)}
          icon={<Phone className="h-4 w-4" />}
        />
        <InlineInsight
          label="Unverified agency links"
          value={formatNumber(filteredLeads.filter((lead) => Boolean(lead.agency && !lead.agency.is_verified)).length)}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <InlineInsight
          label="Filtered rows"
          value={formatNumber(filteredLeads.length)}
          icon={<Sparkles className="h-4 w-4" />}
        />
      </div>
    </SectionShell>
  );
}

function DetailLine({
  icon,
  label,
  value,
  onCopy,
}: {
  icon: ReactNode;
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

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function InlineInsight({
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
