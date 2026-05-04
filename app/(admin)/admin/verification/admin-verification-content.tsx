'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  Clock3,
  Copy,
  FileText,
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
import { Textarea } from '@/components/ui/textarea';
import { getAdminAgencyDetailAction } from '@/features/admin/actions';
import type { AdminAgencyDetailPayload } from '@/features/admin/types';
import { useDebouncedValue } from '@/features/admin/use-debounced-value';
import {
  approveVerificationAction,
  rejectVerificationAction,
} from '@/features/verification/actions';
import type { AdminVerificationRequest } from '@/features/verification/types';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import {
  buildVerificationWarnings,
  extractVerificationDocuments,
  formatDateTime,
  normalizeText,
  type VerificationDocumentItem,
  type VerificationWarningItem,
} from './verification-utils';

const VerificationDetailSheet = dynamic(
  () =>
    import('./verification-detail-sheet').then(
      (module) => module.VerificationDetailSheet
    ),
  { ssr: false }
);

const REQUESTS_PAGE_SIZE = 60;

interface AdminVerificationContentProps {
  requests: AdminVerificationRequest[];
  generatedAt: string;
  loadError?: string;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type DocumentFilter = 'all' | 'with_documents' | 'without_documents';
type LegalFilter = 'all' | 'complete' | 'missing';
type SortOption =
  | 'newest'
  | 'oldest'
  | 'pending_first'
  | 'incomplete_first'
  | 'agency_name'
  | 'highest_warning_count';

interface PreparedVerificationRequest {
  request: AdminVerificationRequest;
  documents: VerificationDocumentItem[];
  warnings: VerificationWarningItem[];
  hasDocuments: boolean;
  hasLegalInfo: boolean;
  warningCount: number;
  createdAtMs: number;
  searchIndex: string;
  contactSignature: string | null;
}

function statusTone(status: AdminVerificationRequest['status']) {
  if (status === 'pending') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'approved') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-rose-200 bg-rose-50 text-rose-700';
}

function statusLabel(status: AdminVerificationRequest['status']) {
  if (status === 'pending') return 'Pending';
  if (status === 'approved') return 'Approved';
  return 'Rejected';
}

function buildContactSignature(request: AdminVerificationRequest): string | null {
  const phone = normalizeText(
    request.agency?.phone ??
      request.agency?.owner?.phone ??
      request.form_data?.work_phone ??
      null
  );
  const email = normalizeText(
    request.agency?.owner?.email ?? request.form_data?.work_email ?? null
  );
  if (!phone && !email) return null;
  return `${phone}|${email}`;
}

function hasLegalInformation(request: AdminVerificationRequest): boolean {
  return Boolean(
    request.form_data?.company_name?.trim() ||
      request.form_data?.registered_name?.trim() ||
      request.form_data?.inn?.trim() ||
      request.form_data?.registration_number?.trim() ||
      request.agency?.inn?.trim()
  );
}

function collectRoleOptions(requests: AdminVerificationRequest[]): string[] {
  const roles = new Set<string>();
  for (const item of requests) {
    const role = item.agency?.owner?.role;
    if (role && role.trim().length > 0) roles.add(role);
  }
  return Array.from(roles).sort((a, b) => a.localeCompare(b));
}

export function AdminVerificationContent({
  requests,
  generatedAt,
  loadError,
}: AdminVerificationContentProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [lastUpdatedAt, setLastUpdatedAt] = useState(generatedAt);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [documentFilter, setDocumentFilter] = useState<DocumentFilter>('all');
  const [legalFilter, setLegalFilter] = useState<LegalFilter>('all');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('pending_first');
  const [page, setPage] = useState(1);

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, AdminAgencyDetailPayload>>({});
  const [detailLoadingAgencyId, setDetailLoadingAgencyId] = useState<string | null>(null);
  const [detailErrorByAgencyId, setDetailErrorByAgencyId] = useState<Record<string, string>>({});

  const [actionIntent, setActionIntent] = useState<{
    requestId: string;
    agencyId: string;
    action: 'approve' | 'reject';
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingActionKey, setProcessingActionKey] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 250);

  useEffect(() => {
    setLastUpdatedAt(generatedAt);
  }, [generatedAt]);

  const roleOptions = useMemo(() => collectRoleOptions(requests), [requests]);
  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const request of requests) {
      if (request.agency?.city) set.add(request.agency.city);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [requests]);

  const duplicateContactCountBySignature = useMemo(() => {
    const map = new Map<string, number>();
    for (const request of requests) {
      const signature = buildContactSignature(request);
      if (!signature) continue;
      map.set(signature, (map.get(signature) ?? 0) + 1);
    }
    return map;
  }, [requests]);

  const preparedRequests = useMemo<PreparedVerificationRequest[]>(() => {
    return requests.map((request) => {
      const documents = extractVerificationDocuments(request);
      const contactSignature = buildContactSignature(request);
      const warnings = buildVerificationWarnings({
        request,
        documentCount: documents.length,
        duplicateContactCount: contactSignature
          ? duplicateContactCountBySignature.get(contactSignature) ?? 0
          : 0,
      });

      const searchIndex = [
        request.agency?.name,
        request.agency?.slug,
        request.agency?.owner?.full_name,
        request.agency?.owner?.email,
        request.agency?.owner?.phone,
        request.agency?.phone,
        request.agency?.telegram_username,
        request.agency?.city,
        request.agency?.country,
        request.form_data?.company_name,
        request.form_data?.registered_name,
        request.form_data?.work_email,
        request.form_data?.work_phone,
      ]
        .map((value) => normalizeText(value))
        .join(' ');

      return {
        request,
        documents,
        warnings,
        hasDocuments: documents.length > 0,
        hasLegalInfo: hasLegalInformation(request),
        warningCount: warnings.length,
        createdAtMs: new Date(request.created_at).getTime(),
        searchIndex,
        contactSignature,
      };
    });
  }, [duplicateContactCountBySignature, requests]);

  const filteredRequests = useMemo(() => {
    const query = normalizeText(debouncedSearch);
    const list = preparedRequests.filter((item) => {
      const { request } = item;

      if (query && !item.searchIndex.includes(query)) return false;
      if (statusFilter !== 'all' && request.status !== statusFilter) return false;
      if (roleFilter !== 'all' && request.agency?.owner?.role !== roleFilter) return false;
      if (cityFilter !== 'all' && request.agency?.city !== cityFilter) return false;

      if (documentFilter === 'with_documents' && !item.hasDocuments) return false;
      if (documentFilter === 'without_documents' && item.hasDocuments) return false;

      if (legalFilter === 'complete' && !item.hasLegalInfo) return false;
      if (legalFilter === 'missing' && item.hasLegalInfo) return false;

      if (createdFrom) {
        const fromMs = new Date(`${createdFrom}T00:00:00`).getTime();
        if (Number.isFinite(item.createdAtMs) && Number.isFinite(fromMs) && item.createdAtMs < fromMs) {
          return false;
        }
      }

      if (createdTo) {
        const toMs = new Date(`${createdTo}T23:59:59`).getTime();
        if (Number.isFinite(item.createdAtMs) && Number.isFinite(toMs) && item.createdAtMs > toMs) {
          return false;
        }
      }

      return true;
    });

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.createdAtMs - b.createdAtMs;
        case 'pending_first':
          return (
            Number(b.request.status === 'pending') - Number(a.request.status === 'pending') ||
            b.createdAtMs - a.createdAtMs
          );
        case 'incomplete_first':
          return b.warningCount - a.warningCount || b.createdAtMs - a.createdAtMs;
        case 'agency_name':
          return (a.request.agency?.name ?? '').localeCompare(b.request.agency?.name ?? '');
        case 'highest_warning_count':
          return b.warningCount - a.warningCount || b.createdAtMs - a.createdAtMs;
        case 'newest':
        default:
          return b.createdAtMs - a.createdAtMs;
      }
    });
  }, [
    preparedRequests,
    debouncedSearch,
    statusFilter,
    roleFilter,
    cityFilter,
    documentFilter,
    legalFilter,
    createdFrom,
    createdTo,
    sortBy,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    cityFilter,
    createdFrom,
    createdTo,
    debouncedSearch,
    documentFilter,
    legalFilter,
    roleFilter,
    sortBy,
    statusFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / REQUESTS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const visibleRequests = useMemo(() => {
    const startIndex = (safePage - 1) * REQUESTS_PAGE_SIZE;
    return filteredRequests.slice(startIndex, startIndex + REQUESTS_PAGE_SIZE);
  }, [filteredRequests, safePage]);

  const selectedPreparedRequest = useMemo(
    () => preparedRequests.find((item) => item.request.id === selectedRequestId) ?? null,
    [preparedRequests, selectedRequestId]
  );

  const selectedAgencyId = selectedPreparedRequest?.request.agency_id ?? null;
  const selectedDetail = selectedAgencyId ? detailCache[selectedAgencyId] : undefined;
  const selectedDetailError = selectedAgencyId
    ? detailErrorByAgencyId[selectedAgencyId] ?? null
    : null;

  const stats = useMemo(() => {
    const total = preparedRequests.length;
    const pending = preparedRequests.filter((item) => item.request.status === 'pending').length;
    const approvedOrVerified = preparedRequests.filter(
      (item) => item.request.status === 'approved' || item.request.agency?.is_verified
    ).length;
    const rejected = preparedRequests.filter((item) => item.request.status === 'rejected').length;
    const incomplete = preparedRequests.filter((item) => item.warningCount > 0).length;

    return {
      total,
      pending,
      approvedOrVerified,
      rejected,
      incomplete,
    };
  }, [preparedRequests]);

  async function copyValue(value: string | null | undefined, label: string) {
    if (!value || value.trim().length === 0) {
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

  async function loadAgencyDetail(agencyId: string) {
    if (detailCache[agencyId]) return;
    setDetailLoadingAgencyId(agencyId);
    setDetailErrorByAgencyId((current) => ({
      ...current,
      [agencyId]: '',
    }));

    const result = await getAdminAgencyDetailAction(agencyId);
    setDetailLoadingAgencyId(null);

    if (result.error || !result.data) {
      setDetailErrorByAgencyId((current) => ({
        ...current,
        [agencyId]: result.error ?? 'Unable to load linked agency records.',
      }));
      return;
    }

    setDetailCache((current) => ({
      ...current,
      [agencyId]: result.data,
    }));
  }

  function openRequestDetail(item: PreparedVerificationRequest) {
    setSelectedRequestId(item.request.id);
    if (item.request.agency_id) {
      void loadAgencyDetail(item.request.agency_id);
    }
  }

  function resetFilters() {
    setSearch('');
    setStatusFilter('all');
    setRoleFilter('all');
    setCityFilter('all');
    setDocumentFilter('all');
    setLegalFilter('all');
    setCreatedFrom('');
    setCreatedTo('');
    setSortBy('pending_first');
  }

  function refreshData() {
    startRefresh(() => {
      setLastUpdatedAt(new Date().toISOString());
      router.refresh();
    });
  }

  function openApproveDialog(item: PreparedVerificationRequest) {
    setActionIntent({
      requestId: item.request.id,
      agencyId: item.request.agency_id,
      action: 'approve',
    });
    setRejectReason('');
  }

  function openRejectDialog(item: PreparedVerificationRequest) {
    setActionIntent({
      requestId: item.request.id,
      agencyId: item.request.agency_id,
      action: 'reject',
    });
    setRejectReason(item.request.admin_note ?? '');
  }

  async function executeAction() {
    if (!actionIntent) return;

    if (actionIntent.action === 'reject' && rejectReason.trim().length === 0) {
      toast.error('Rejection reason is required.');
      return;
    }

    const actionKey = `${actionIntent.action}:${actionIntent.requestId}`;
    setProcessingActionKey(actionKey);

    const result =
      actionIntent.action === 'approve'
        ? await approveVerificationAction(actionIntent.requestId, actionIntent.agencyId)
        : await rejectVerificationAction(
            actionIntent.requestId,
            actionIntent.agencyId,
            rejectReason.trim()
          );

    setProcessingActionKey(null);
    setActionIntent(null);
    setRejectReason('');

    if (result.error) {
      toast.error('Could not update verification request.');
      return;
    }

    toast.success(
      actionIntent.action === 'approve'
        ? 'Verification approved.'
        : 'Verification rejected.'
    );
    setLastUpdatedAt(new Date().toISOString());
    router.refresh();
  }

  const dialogBusy = processingActionKey !== null;
  const selectedActionKey = actionIntent
    ? `${actionIntent.action}:${actionIntent.requestId}`
    : null;
  const actionIsBusy = dialogBusy && selectedActionKey === processingActionKey;

  return (
    <SectionShell className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle
          title="Verification"
          subtitle="Agency identity review, approval workflow, and verification risk control"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Refresh
          </Button>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
            Last updated:{' '}
            <span className="font-medium text-slate-900">{formatDateTime(lastUpdatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Total Requests"
          value={stats.total}
          tone="default"
          onClick={() => setStatusFilter('all')}
        />
        <MetricCard
          title="Pending"
          value={stats.pending}
          tone="warning"
          onClick={() => setStatusFilter('pending')}
        />
        <MetricCard
          title="Approved / Verified"
          value={stats.approvedOrVerified}
          tone="success"
          onClick={() => setStatusFilter('approved')}
        />
        <MetricCard
          title="Rejected"
          value={stats.rejected}
          tone="danger"
          onClick={() => setStatusFilter('rejected')}
        />
        <MetricCard
          title="Incomplete"
          value={stats.incomplete}
          tone="warning"
          onClick={() => setSortBy('incomplete_first')}
        />
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white py-3">
        <CardContent className="space-y-3 px-4">
          <div className="grid gap-2 xl:grid-cols-[1.2fr_repeat(5,minmax(0,1fr))]">
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search agency, manager, email, phone, city..."
                className="h-9 pl-8"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value ?? 'all')}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Owner role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All owner roles</SelectItem>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
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

            <Select
              value={documentFilter}
              onValueChange={(value) => setDocumentFilter(value as DocumentFilter)}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Documents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any documents</SelectItem>
                <SelectItem value="with_documents">With documents</SelectItem>
                <SelectItem value="without_documents">No documents</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={legalFilter}
              onValueChange={(value) => setLegalFilter(value as LegalFilter)}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Legal info" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any legal state</SelectItem>
                <SelectItem value="complete">Legal info complete</SelectItem>
                <SelectItem value="missing">Legal info missing</SelectItem>
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
                <SelectItem value="pending_first">Pending first</SelectItem>
                <SelectItem value="incomplete_first">Incomplete first</SelectItem>
                <SelectItem value="agency_name">Agency name</SelectItem>
                <SelectItem value="highest_warning_count">Highest warning count</SelectItem>
              </SelectContent>
            </Select>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Showing{' '}
              <span className="font-semibold text-slate-900">
                {formatNumber(visibleRequests.length)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-900">
                {formatNumber(preparedRequests.length)}
              </span>
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

      {loadError && preparedRequests.length === 0 ? (
        <Card className="rounded-2xl border border-rose-200 bg-rose-50 py-4">
          <CardContent className="flex items-center justify-between gap-3 px-5">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">{loadError}</span>
            </div>
            <Button variant="outline" size="sm" onClick={refreshData}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border border-slate-200 bg-white py-2">
        <CardContent className="px-2">
          {filteredRequests.length === 0 ? (
            <div className="flex min-h-[340px] flex-col items-center justify-center gap-2 text-center">
              <CircleSlash className="h-10 w-10 text-slate-300" />
              <h3 className="text-base font-semibold text-slate-800">
                No verification requests match the current filters
              </h3>
              <p className="max-w-md text-sm text-slate-500">
                Try changing search or filter values to expand the review queue.
              </p>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[1280px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-3">Agency</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Submitted</th>
                      <th className="px-3 py-3">Contact</th>
                      <th className="px-3 py-3">Location</th>
                      <th className="px-3 py-3">Documents</th>
                      <th className="px-3 py-3">Warnings</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRequests.map((item) => {
                      const request = item.request;
                      const agency = request.agency;
                      const owner = agency?.owner;
                      const rowActionBusy = processingActionKey?.endsWith(request.id) ?? false;

                      return (
                        <tr
                          key={request.id}
                          className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
                          onClick={() => openRequestDetail(item)}
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <AgencyAvatar
                                name={agency?.name ?? 'Unknown'}
                                logoUrl={agency?.logo_url}
                              />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">
                                  {agency?.name ?? 'Unknown agency'}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                  Manager: {owner?.full_name ?? 'Not provided'}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                  {owner?.role ?? 'Role not provided'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3 align-top">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openRequestDetail(item);
                              }}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                                statusTone(request.status)
                              )}
                            >
                              {request.status === 'pending' ? (
                                <Clock3 className="h-3 w-3" />
                              ) : null}
                              {request.status === 'approved' ? (
                                <ShieldCheck className="h-3 w-3" />
                              ) : null}
                              {request.status === 'rejected' ? (
                                <ShieldX className="h-3 w-3" />
                              ) : null}
                              {statusLabel(request.status)}
                            </button>
                          </td>

                          <td className="px-3 py-3 align-top text-xs text-slate-600">
                            <p>{formatDate(request.created_at)}</p>
                            <p className="text-slate-500">{formatDateTime(request.created_at)}</p>
                          </td>

                          <td className="px-3 py-3 align-top">
                            <div className="space-y-1 text-xs text-slate-600">
                              <p className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {agency?.phone ?? owner?.phone ?? request.form_data?.work_phone ?? 'Not provided'}
                              </p>
                              <p className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-slate-400" />
                                {owner?.email ?? request.form_data?.work_email ?? 'Not provided'}
                              </p>
                            </div>
                          </td>

                          <td className="px-3 py-3 align-top">
                            <p className="text-sm font-medium text-slate-800">
                              {agency?.city
                                ? `${agency.city}, ${agency.country ?? ''}`
                                : agency?.country ?? 'Not provided'}
                            </p>
                          </td>

                          <td className="px-3 py-3 align-top">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openRequestDetail(item);
                              }}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              <FileText className="h-3 w-3" />
                              {formatNumber(item.documents.length)}
                            </button>
                          </td>

                          <td className="px-3 py-3 align-top">
                            {item.warningCount > 0 ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openRequestDetail(item);
                                }}
                                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                {formatNumber(item.warningCount)} warnings
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Clear
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-3 align-top">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Button size="sm" variant="outline" onClick={() => openRequestDetail(item)}>
                                View
                              </Button>
                              <Button
                                size="sm"
                                disabled={request.status !== 'pending' || rowActionBusy}
                                onClick={() => openApproveDialog(item)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={request.status !== 'pending' || rowActionBusy}
                                onClick={() => openRejectDialog(item)}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  void copyValue(
                                    agency?.phone ??
                                      owner?.email ??
                                      request.form_data?.work_email,
                                    'Contact'
                                  )
                                }
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 xl:hidden">
                {visibleRequests.map((item) => {
                  const request = item.request;
                  const agency = request.agency;
                  const owner = agency?.owner;

                  return (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {agency?.name ?? 'Unknown agency'}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            Manager: {owner?.full_name ?? 'Not provided'}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn('border text-xs', statusTone(request.status))}>
                          {statusLabel(request.status)}
                        </Badge>
                      </div>

                      <div className="mt-3 grid gap-1 text-xs text-slate-600">
                        <p className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {owner?.email ?? request.form_data?.work_email ?? 'Not provided'}
                        </p>
                        <p className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {agency?.phone ?? owner?.phone ?? request.form_data?.work_phone ?? 'Not provided'}
                        </p>
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {agency?.city
                            ? `${agency.city}, ${agency.country ?? ''}`
                            : agency?.country ?? 'Not provided'}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline">
                          <FileText className="h-3 w-3" />
                          {formatNumber(item.documents.length)} docs
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            item.warningCount > 0
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          )}
                        >
                          {item.warningCount > 0
                            ? `${formatNumber(item.warningCount)} warnings`
                            : 'No warnings'}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => openRequestDetail(item)}>
                          View details
                        </Button>
                        <Button
                          size="sm"
                          disabled={request.status !== 'pending'}
                          onClick={() => openApproveDialog(item)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={request.status !== 'pending'}
                          onClick={() => openRejectDialog(item)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedPreparedRequest ? (
        <VerificationDetailSheet
          open={Boolean(selectedPreparedRequest)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setSelectedRequestId(null);
          }}
          selected={selectedPreparedRequest}
          detail={selectedDetail}
          detailLoading={
            selectedAgencyId !== null && detailLoadingAgencyId === selectedAgencyId
          }
          detailError={selectedDetailError}
          onRetryDetail={() => {
            if (selectedAgencyId) {
              void loadAgencyDetail(selectedAgencyId);
            }
          }}
          onCopy={(value, label) => {
            void copyValue(value, label);
          }}
          onApprove={() => {
            if (!selectedPreparedRequest) return;
            openApproveDialog(selectedPreparedRequest);
          }}
          onReject={() => {
            if (!selectedPreparedRequest) return;
            openRejectDialog(selectedPreparedRequest);
          }}
          canApprove={selectedPreparedRequest.request.status === 'pending'}
          canReject={selectedPreparedRequest.request.status === 'pending'}
          busy={dialogBusy}
        />
      ) : null}

      <Dialog
        open={Boolean(actionIntent)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setActionIntent(null);
            setRejectReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionIntent?.action === 'approve'
                ? 'Approve verification request?'
                : 'Reject verification request?'}
            </DialogTitle>
            <DialogDescription>
              {actionIntent?.action === 'approve'
                ? 'This will set request status to approved and mark the agency as verified.'
                : 'This will set request status to rejected and remove verified badge from agency.'}
            </DialogDescription>
          </DialogHeader>

          {actionIntent?.action === 'reject' ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">
                Rejection reason (required)
              </p>
              <Textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Provide clear rejection reason for verification audit trail"
                className="min-h-24"
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionIntent(null);
                setRejectReason('');
              }}
              disabled={actionIsBusy}
            >
              Cancel
            </Button>
            <Button
              variant={actionIntent?.action === 'approve' ? 'default' : 'destructive'}
              onClick={() => {
                void executeAction();
              }}
              disabled={actionIsBusy}
            >
              {actionIsBusy ? <Loader2 className="animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionShell>
  );
}

function MetricCard({
  title,
  value,
  tone,
  onClick,
}: {
  title: string;
  value: number;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  onClick: () => void;
}) {
  const toneClasses: Record<NonNullable<typeof tone>, string> = {
    default: 'border-slate-200',
    success: 'border-emerald-200',
    warning: 'border-amber-200',
    danger: 'border-rose-200',
  };

  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card className={cn('rounded-2xl border bg-white py-4', toneClasses[tone ?? 'default'])}>
        <CardContent className="space-y-1 px-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(value)}</p>
        </CardContent>
      </Card>
    </button>
  );
}

function AgencyAvatar({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null | undefined;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
      {logoUrl && !failed ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-sm font-semibold text-slate-500">
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
    </div>
  );
}
