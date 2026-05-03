'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  Copy,
  FilterX,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { rejectDeletionRequestAction, type AccountDeletionPanelItem, type AccountDeletionPanelPayload } from '@/features/account-deletions/actions';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';

interface Props {
  payload: AccountDeletionPanelPayload;
}

type PresenceFilter = 'all' | 'with' | 'without';
type RiskFilter = 'all' | 'high_risk';
type SortKey =
  | 'newest'
  | 'oldest'
  | 'pending_first'
  | 'highest_risk'
  | 'role'
  | 'linked_data';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'pending_first', label: 'Pending first' },
  { value: 'highest_risk', label: 'Highest risk first' },
  { value: 'role', label: 'Role' },
  { value: 'linked_data', label: 'Linked data count' },
];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function formatDateTime(value: string | null): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function getItemKey(item: AccountDeletionPanelItem): string {
  return item.requestId ?? `lookup:${item.user.id}`;
}

function matchesDateRange(value: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return false;
  if (from) {
    const fromTimestamp = new Date(from).getTime();
    if (Number.isFinite(fromTimestamp) && timestamp < fromTimestamp) return false;
  }
  if (to) {
    const toTimestamp = new Date(to).getTime();
    if (Number.isFinite(toTimestamp) && timestamp > toTimestamp) return false;
  }
  return true;
}

function roleRank(role: AccountDeletionPanelItem['user']['role']) {
  if (role === 'admin') return 0;
  if (role === 'agency_manager') return 1;
  return 2;
}

function StatusBadge({ status }: { status: AccountDeletionPanelItem['requestStatus'] }) {
  if (status == null) {
    return <Badge className="bg-slate-100 text-slate-700">No request row</Badge>;
  }
  if (status === 'pending') {
    return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
  }
  if (status === 'approved') {
    return <Badge className="bg-emerald-100 text-emerald-700">Processed</Badge>;
  }
  if (status === 'rejected') {
    return <Badge className="bg-rose-100 text-rose-700">Rejected</Badge>;
  }
  return <Badge className="bg-slate-200 text-slate-700">Cancelled</Badge>;
}

function RoleBadge({ role }: { role: AccountDeletionPanelItem['user']['role'] }) {
  if (role === 'admin') {
    return (
      <Badge className="bg-purple-100 text-purple-700">
        <ShieldCheck className="h-3 w-3" />
        admin
      </Badge>
    );
  }
  if (role === 'agency_manager') {
    return (
      <Badge className="bg-sky-100 text-sky-700">
        <Building2 className="h-3 w-3" />
        agency_manager
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-100 text-slate-700">
      <UserRound className="h-3 w-3" />
      user
    </Badge>
  );
}

function RiskBadge({ item }: { item: AccountDeletionPanelItem }) {
  if (item.risk.level === 'critical') {
    return (
      <Badge className="bg-red-100 text-red-700">
        <ShieldAlert className="h-3 w-3" />
        Critical
      </Badge>
    );
  }
  if (item.risk.level === 'high') {
    return <Badge className="bg-rose-100 text-rose-700">High</Badge>;
  }
  if (item.risk.level === 'medium') {
    return <Badge className="bg-amber-100 text-amber-700">Medium</Badge>;
  }
  return <Badge className="bg-emerald-100 text-emerald-700">Low</Badge>;
}

export function AdminAccountDeletionsContent({ payload }: Props) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'agency_manager' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'no_request'
  >('all');
  const [linkedAgencyFilter, setLinkedAgencyFilter] = useState<PresenceFilter>('all');
  const [activeToursFilter, setActiveToursFilter] = useState<PresenceFilter>('all');
  const [leadsFilter, setLeadsFilter] = useState<PresenceFilter>('all');
  const [promotionsFilter, setPromotionsFilter] = useState<PresenceFilter>('all');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<AccountDeletionPanelItem | null>(null);
  const [rejectConfirmText, setRejectConfirmText] = useState('');
  const [requestNotes, setRequestNotes] = useState<Record<string, string>>({});

  const items = payload.items;

  const filteredItems = useMemo(() => {
    const query = normalizeText(search);

    return items
      .filter((item) => {
        if (query) {
          const haystack = [
            item.user.fullName ?? '',
            item.user.email ?? '',
            item.user.phone ?? '',
            item.user.role,
            item.user.id,
            item.agency.name ?? '',
            item.requestId ?? '',
            item.reason ?? '',
            item.requestStatus ?? '',
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        if (roleFilter !== 'all' && item.user.role !== roleFilter) return false;

        if (statusFilter !== 'all') {
          if (statusFilter === 'no_request') {
            if (item.requestStatus != null) return false;
          } else if (item.requestStatus !== statusFilter) {
            return false;
          }
        }

        if (linkedAgencyFilter === 'with' && !item.agency.id) return false;
        if (linkedAgencyFilter === 'without' && item.agency.id) return false;

        const hasActiveTours = item.impact.activeTours > 0;
        if (activeToursFilter === 'with' && !hasActiveTours) return false;
        if (activeToursFilter === 'without' && hasActiveTours) return false;

        const hasLeads = item.impact.totalLeads + item.impact.userLeads > 0;
        if (leadsFilter === 'with' && !hasLeads) return false;
        if (leadsFilter === 'without' && hasLeads) return false;

        const hasPromotions =
          item.impact.activePromotions + (item.impact.activeFeaturedPromotions ?? 0) > 0;
        if (promotionsFilter === 'with' && !hasPromotions) return false;
        if (promotionsFilter === 'without' && hasPromotions) return false;

        if (riskFilter === 'high_risk' && !item.risk.isHighRisk) return false;

        if (!matchesDateRange(item.requestedAt, createdFrom, createdTo)) return false;

        return true;
      })
      .sort((a, b) => {
        const aRequested = new Date(a.requestedAt).getTime();
        const bRequested = new Date(b.requestedAt).getTime();
        const aTs = Number.isFinite(aRequested) ? aRequested : 0;
        const bTs = Number.isFinite(bRequested) ? bRequested : 0;

        switch (sortBy) {
          case 'oldest':
            return aTs - bTs;
          case 'pending_first':
            return (
              Number(b.requestStatus === 'pending') -
              Number(a.requestStatus === 'pending') ||
              bTs - aTs
            );
          case 'highest_risk':
            return b.risk.score - a.risk.score || bTs - aTs;
          case 'role':
            return roleRank(a.user.role) - roleRank(b.user.role) || bTs - aTs;
          case 'linked_data':
            return b.impact.linkedDataCount - a.impact.linkedDataCount || bTs - aTs;
          case 'newest':
          default:
            return bTs - aTs;
        }
      });
  }, [
    items,
    search,
    roleFilter,
    statusFilter,
    linkedAgencyFilter,
    activeToursFilter,
    leadsFilter,
    promotionsFilter,
    riskFilter,
    createdFrom,
    createdTo,
    sortBy,
  ]);

  const stats = useMemo(() => {
    const pending = items.filter((item) => item.requestStatus === 'pending').length;
    const processed = items.filter((item) => item.requestStatus === 'approved').length;
    const rejectedOrCancelled = items.filter(
      (item) => item.requestStatus === 'rejected' || item.requestStatus === 'cancelled'
    ).length;
    const highRisk = items.filter((item) => item.risk.isHighRisk).length;
    const agencyManager = items.filter((item) => item.user.role === 'agency_manager').length;
    const withLinkedData = items.filter((item) => item.impact.linkedDataCount > 0).length;

    return {
      total: items.length,
      pending,
      processed,
      rejectedOrCancelled,
      highRisk,
      agencyManager,
      withLinkedData,
    };
  }, [items]);

  const selectedItem = useMemo(() => {
    if (!selectedKey) return null;
    return items.find((item) => getItemKey(item) === selectedKey) ?? null;
  }, [items, selectedKey]);

  function handleRefresh() {
    startRefresh(() => {
      router.refresh();
    });
  }

  function openDetails(item: AccountDeletionPanelItem) {
    setSelectedKey(getItemKey(item));
    setSheetOpen(true);
  }

  function resetFilters() {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setLinkedAgencyFilter('all');
    setActiveToursFilter('all');
    setLeadsFilter('all');
    setPromotionsFilter('all');
    setRiskFilter('all');
    setCreatedFrom('');
    setCreatedTo('');
    setSortBy('newest');
  }

  function copyToClipboard(value: string | null, label: string) {
    if (!value) {
      toast.error(`${label} is not available`);
      return;
    }
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(`${label} copied`))
      .catch(() => toast.error(`Could not copy ${label.toLowerCase()}`));
  }

  function openRejectDialog(item: AccountDeletionPanelItem) {
    if (!item.capabilities.canRejectRequest || !item.requestId) {
      toast.error('Reject action is not available for this row');
      return;
    }
    setRejectConfirmText('');
    setRejectTarget(item);
  }

  async function confirmRejectRequest() {
    if (!rejectTarget?.requestId) return;
    if (rejectConfirmText.trim().toUpperCase() !== 'REJECT') {
      toast.error('Type REJECT to confirm');
      return;
    }

    const requestId = rejectTarget.requestId;
    const notes = requestNotes[requestId] ?? '';

    setProcessingRequestId(requestId);
    const result = await rejectDeletionRequestAction(requestId, notes);
    setProcessingRequestId(null);

    if ('error' in result && result.error) {
      toast.error(`Reject failed: ${result.error}`);
      return;
    }

    toast.success('Request marked as rejected. Deletion request flags were cleared.');
    setRejectTarget(null);
    router.refresh();
  }

  const showGlobalError = payload.health.errors.length > 0 && items.length === 0;
  const requestsLabel = payload.requestsAvailable
    ? 'Deletion request queue'
    : 'Safe account lookup mode (request table unavailable)';

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Delete Account</h1>
            <p className="max-w-3xl text-sm text-slate-200">
              Account deletion review, risk control, and data impact audit.
            </p>
          </div>
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
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            Last updated: {formatDateTime(payload.generatedAt)}
          </span>
          <span>{requestsLabel}</span>
        </div>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-2">
            <p className="font-semibold">Destructive deletion is disabled in this panel.</p>
            <p className="text-xs text-red-800">{payload.deletionDisabledReason}</p>
            <div className="space-y-1 text-xs text-red-800">
              <p className="font-medium">Missing backend requirements:</p>
              {payload.missingBackendRequirements.map((requirement) => (
                <p key={requirement}>- {requirement}</p>
              ))}
            </div>
            <p className="text-[11px] text-red-700">
              Deletion function/RPC in use: none (disabled in web admin).
            </p>
          </div>
        </div>
      </section>

      {payload.health.partialData ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Some data sources are unavailable.</p>
              <p className="mt-1 text-xs">{payload.health.errors.join(' | ')}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <MetricCard label="Total rows" value={formatNumber(stats.total)} />
        <MetricCard label="Pending requests" value={formatNumber(stats.pending)} tone="amber" />
        <MetricCard label="Processed" value={formatNumber(stats.processed)} tone="emerald" />
        <MetricCard label="Rejected / cancelled" value={formatNumber(stats.rejectedOrCancelled)} tone="rose" />
        <MetricCard label="High-risk rows" value={formatNumber(stats.highRisk)} tone="rose" />
        <MetricCard label="Agency manager rows" value={formatNumber(stats.agencyManager)} />
        <MetricCard label="Rows with linked data" value={formatNumber(stats.withLinkedData)} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, phone, role, request ID, reason, agency..."
              className="pl-9"
            />
          </div>

          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="agency_manager">Agency manager</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Request status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Processed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_request">No request row</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={linkedAgencyFilter}
            onValueChange={(value) => setLinkedAgencyFilter(value as PresenceFilter)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Linked agency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agency states</SelectItem>
              <SelectItem value="with">Has linked agency</SelectItem>
              <SelectItem value="without">No linked agency</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={activeToursFilter}
            onValueChange={(value) => setActiveToursFilter(value as PresenceFilter)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Active tours" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tour states</SelectItem>
              <SelectItem value="with">Has active tours</SelectItem>
              <SelectItem value="without">No active tours</SelectItem>
            </SelectContent>
          </Select>

          <Select value={leadsFilter} onValueChange={(value) => setLeadsFilter(value as PresenceFilter)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Leads" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All lead states</SelectItem>
              <SelectItem value="with">Has leads</SelectItem>
              <SelectItem value="without">No leads</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={promotionsFilter}
            onValueChange={(value) => setPromotionsFilter(value as PresenceFilter)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Promotions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All promotion states</SelectItem>
              <SelectItem value="with">Has active promotions</SelectItem>
              <SelectItem value="without">No active promotions</SelectItem>
            </SelectContent>
          </Select>

          <Select value={riskFilter} onValueChange={(value) => setRiskFilter(value as RiskFilter)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All risk levels</SelectItem>
              <SelectItem value="high_risk">High-risk only</SelectItem>
            </SelectContent>
          </Select>

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
        {showGlobalError ? (
          <div className="space-y-4 p-10 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-rose-400" />
            <p className="text-sm text-slate-700">Account deletion data could not be loaded.</p>
            <Button onClick={handleRefresh}>Try again</Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="space-y-4 p-10 text-center">
            <Search className="mx-auto h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">
              No rows matched current search/filter settings.
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
                    <th className="px-4 py-3">Requester</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Requested</th>
                    <th className="px-4 py-3">Agency / linked data</th>
                    <th className="px-4 py-3">Risk</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={getItemKey(item)}
                      className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                      onClick={() => openDetails(item)}
                    >
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {item.user.fullName || 'No full name'}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {item.user.email || 'No email'}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.user.phone || 'No phone'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <RoleBadge role={item.user.role} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <StatusBadge status={item.requestStatus} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-slate-700">{formatDate(item.requestedAt)}</p>
                        <p className="text-xs text-slate-500">
                          {item.requestId ? `Request ${item.requestId.slice(0, 8)}...` : 'Lookup row'}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="font-medium text-slate-800">{item.agency.name || 'No linked agency'}</p>
                        <p className="text-xs text-slate-500">
                          Active tours {item.impact.activeTours} • Leads {item.impact.totalLeads}
                        </p>
                        <p className="text-xs text-slate-500">
                          Promotions {item.impact.activePromotions + (item.impact.activeFeaturedPromotions ?? 0)} • MaxCoin {item.impact.maxcoinBalance}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="space-y-1">
                          <RiskBadge item={item} />
                          <p className="text-xs text-slate-500">Score {item.risk.score}</p>
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 align-top text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => openDetails(item)}>
                            Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!item.capabilities.canRejectRequest || processingRequestId === item.requestId}
                            onClick={() => openRejectDialog(item)}
                          >
                            Reject
                          </Button>
                          <Button size="sm" variant="destructive" disabled>
                            Disabled
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-3 lg:hidden">
              {filteredItems.map((item) => (
                <article key={getItemKey(item)} className="rounded-2xl border border-slate-200 p-3">
                  <button type="button" className="w-full text-left" onClick={() => openDetails(item)}>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <RoleBadge role={item.user.role} />
                        <StatusBadge status={item.requestStatus} />
                        <RiskBadge item={item} />
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.user.fullName || 'No full name'}
                      </p>
                      <p className="text-xs text-slate-500">{item.user.email || 'No email'}</p>
                      <p className="text-xs text-slate-500">
                        Tours {item.impact.activeTours} • Leads {item.impact.totalLeads} • Promotions{' '}
                        {item.impact.activePromotions + (item.impact.activeFeaturedPromotions ?? 0)}
                      </p>
                    </div>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openDetails(item)}>
                      Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!item.capabilities.canRejectRequest || processingRequestId === item.requestId}
                      onClick={() => openRejectDialog(item)}
                    >
                      Reject
                    </Button>
                    <Button size="sm" variant="destructive" disabled>
                      Deletion disabled
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-2xl">
          {selectedItem ? (
            <>
              <SheetHeader className="border-b border-slate-200 bg-slate-50 p-6">
                <SheetTitle className="text-xl font-semibold text-slate-900">Account impact detail</SheetTitle>
                <SheetDescription>
                  {selectedItem.user.fullName || selectedItem.user.email || selectedItem.user.id}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 p-6">
                <section className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <RoleBadge role={selectedItem.user.role} />
                    <StatusBadge status={selectedItem.requestStatus} />
                    <RiskBadge item={selectedItem} />
                  </div>
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <DetailRow label="User name" value={selectedItem.user.fullName || 'Not available'} />
                    <DetailRow label="User ID" value={selectedItem.user.id} mono />
                    <DetailRow label="Email" value={selectedItem.user.email || 'Not available'} />
                    <DetailRow label="Phone" value={selectedItem.user.phone || 'Not available'} />
                    <DetailRow label="Profile created" value={formatDateTime(selectedItem.user.createdAt)} />
                    <DetailRow label="Profile updated" value={formatDateTime(selectedItem.user.updatedAt)} />
                  </dl>
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Linked agency</h3>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <DetailRow label="Agency" value={selectedItem.agency.name || 'Not linked'} />
                    <DetailRow
                      label="Agency status"
                      value={
                        selectedItem.agency.id
                          ? `${selectedItem.agency.isVerified ? 'Verified' : 'Unverified'} / ${
                            selectedItem.agency.isApproved ? 'Approved' : 'Not approved'
                          }`
                          : 'Not available'
                      }
                    />
                    <DetailRow label="Linked agency count" value={String(selectedItem.agency.linkedCount)} />
                    <DetailRow label="Unresolved verification" value={String(selectedItem.impact.unresolvedVerificationCount)} />
                  </dl>
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Impact summary</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <ImpactPill label="Active tours" value={selectedItem.impact.activeTours} />
                    <ImpactPill label="Total tours" value={selectedItem.impact.totalTours} />
                    <ImpactPill label="Agency leads" value={selectedItem.impact.totalLeads} />
                    <ImpactPill label="Pending leads" value={selectedItem.impact.pendingLeads} />
                    <ImpactPill label="User leads" value={selectedItem.impact.userLeads} />
                    <ImpactPill label="Favorites" value={selectedItem.impact.favorites} />
                    <ImpactPill label="Reviews" value={selectedItem.impact.reviews} />
                    <ImpactPill label="Active promotions" value={selectedItem.impact.activePromotions} />
                    <ImpactPill
                      label="Featured promotions"
                      value={
                        selectedItem.impact.activeFeaturedPromotions == null
                          ? 'Not available'
                          : selectedItem.impact.activeFeaturedPromotions
                      }
                    />
                    <ImpactPill label="MaxCoin balance" value={selectedItem.impact.maxcoinBalance} />
                    <ImpactPill label="MaxCoin ledger" value={selectedItem.impact.maxcoinLedgerEntries} />
                    <ImpactPill
                      label="Bookings / orders"
                      value={selectedItem.impact.bookingsOrdersCount == null ? 'Not available' : selectedItem.impact.bookingsOrdersCount}
                    />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Latest activity: {formatDateTime(selectedItem.impact.latestActivityAt)}
                  </p>
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Request and review fields</h3>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <DetailRow label="Request ID" value={selectedItem.requestId || 'Not available'} mono />
                    <DetailRow label="Requested at" value={formatDateTime(selectedItem.requestedAt)} />
                    <DetailRow label="Reviewed at" value={formatDateTime(selectedItem.reviewedAt)} />
                    <DetailRow label="Reviewed by" value={selectedItem.reviewedBy || 'Not available'} mono />
                    <DetailRow label="Reason" value={selectedItem.reason || 'Not available'} />
                    <DetailRow label="Admin notes" value={selectedItem.adminNotes || 'Not available'} />
                    <DetailRow label="Deletion enabled" value="Disabled" />
                    <DetailRow label="Deletion backend function/RPC" value="None (disabled in web admin)" />
                  </dl>
                </section>

                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="text-sm font-semibold text-amber-900">Risk warnings</h3>
                  <div className="mt-3 space-y-2">
                    {selectedItem.risk.flags.length === 0 ? (
                      <p className="text-xs text-amber-800">No additional risk flags from available data.</p>
                    ) : (
                      selectedItem.risk.flags.map((flag) => (
                        <div
                          key={flag.key}
                          className={cn(
                            'rounded-xl border px-3 py-2 text-xs',
                            flag.severity === 'danger'
                              ? 'border-red-200 bg-red-50 text-red-800'
                              : flag.severity === 'warning'
                                ? 'border-amber-200 bg-amber-100/60 text-amber-900'
                                : 'border-slate-200 bg-white text-slate-700'
                          )}
                        >
                          <p className="font-semibold">{flag.label}</p>
                          <p className="mt-0.5">{flag.detail}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Safe action center</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(selectedItem.user.id, 'User ID')}
                    >
                      <Copy className="h-4 w-4" />
                      Copy user ID
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(selectedItem.user.email, 'Email')}
                    >
                      <Mail className="h-4 w-4" />
                      Copy email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(selectedItem.user.phone, 'Phone')}
                    >
                      <Phone className="h-4 w-4" />
                      Copy phone
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!selectedItem.agency.id}
                      onClick={() => router.push('/admin/agencies')}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      View linked agency
                    </Button>
                    <Button
                      variant="outline"
                      disabled={selectedItem.impact.totalTours === 0}
                      onClick={() => router.push('/admin/tours')}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      View related tours
                    </Button>
                    <Button
                      variant="outline"
                      disabled={selectedItem.impact.totalLeads + selectedItem.impact.userLeads === 0}
                      onClick={() => router.push('/admin/leads')}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      View related leads
                    </Button>
                    <Button variant="outline" disabled>
                      Mark reviewed (not configured)
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!selectedItem.capabilities.canRejectRequest || processingRequestId === selectedItem.requestId}
                      onClick={() => openRejectDialog(selectedItem)}
                    >
                      Reject request
                    </Button>
                    <Button variant="destructive" disabled className="sm:col-span-2">
                      <Trash2 className="h-4 w-4" />
                      Process deletion disabled
                    </Button>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {selectedItem.capabilities.processBlockedReason}
                  </p>
                </section>
              </div>
            </>
          ) : (
            <div className="p-6 text-sm text-slate-500">Select a row to inspect account impact details.</div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(rejectTarget)} onOpenChange={(open) => (!open ? setRejectTarget(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject deletion request</DialogTitle>
            <DialogDescription>
              This keeps the account active and clears deletion-request flags. Type{' '}
              <span className="font-semibold text-slate-900">REJECT</span> to continue.
            </DialogDescription>
          </DialogHeader>

          {rejectTarget ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <p>
                  <span className="font-medium">Target:</span>{' '}
                  {rejectTarget.user.fullName || rejectTarget.user.email || rejectTarget.user.id}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Request ID:</span> {rejectTarget.requestId}
                </p>
              </div>
              <Textarea
                value={requestNotes[rejectTarget.requestId ?? ''] ?? ''}
                onChange={(event) => {
                  if (!rejectTarget.requestId) return;
                  setRequestNotes((prev) => ({
                    ...prev,
                    [rejectTarget.requestId as string]: event.target.value,
                  }));
                }}
                placeholder="Admin note (optional)"
                rows={3}
              />
              <Input
                value={rejectConfirmText}
                onChange={(event) => setRejectConfirmText(event.target.value)}
                placeholder="Type REJECT"
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmRejectRequest}
              disabled={!rejectTarget?.requestId || processingRequestId === rejectTarget.requestId}
            >
              {processingRequestId === rejectTarget?.requestId ? 'Rejecting...' : 'Confirm reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: string;
  tone?: 'slate' | 'amber' | 'emerald' | 'rose';
}) {
  const toneClass =
    tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : tone === 'emerald'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : tone === 'rose'
          ? 'border-rose-200 bg-rose-50 text-rose-900'
          : 'border-slate-200 bg-white text-slate-900';

  return (
    <div className={cn('rounded-2xl border p-4', toneClass)}>
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('mt-0.5 text-slate-900', mono && 'font-mono text-xs')}>{value}</p>
    </div>
  );
}

function ImpactPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
