'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  FilterX,
  Layers3,
  RefreshCw,
  Search,
  Star,
  Timer,
  Wallet,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { approveCoinRequest, rejectCoinRequest } from '@/features/admin/actions';
import type {
  AdminCoinRequestPanelRecord,
  AdminPromotionPanelRecord,
  AdminPromotionsMaxcoinPanelPayload,
} from '@/features/admin/types';
import { cn, formatNumber, placeholderImage } from '@/lib/utils';

const DAY_MS = 24 * 60 * 60 * 1000;

type SortKey =
  | 'newest'
  | 'oldest'
  | 'ending_soon'
  | 'active_first'
  | 'placement'
  | 'agency'
  | 'maxcoin_amount'
  | 'highest_spend';

interface PreparedPromotion extends AdminPromotionPanelRecord {
  createdAtMs: number | null;
  startsAtMs: number | null;
  endsAtMs: number | null;
  durationDays: number | null;
  remainingDays: number | null;
  warnings: string[];
}

interface CoinActionState {
  requestId: string;
  action: 'approve' | 'reject';
}

interface Props {
  payload: AdminPromotionsMaxcoinPanelPayload | null;
  errorMessage?: string;
}

function parseDateMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Not available';
  return date.toLocaleString();
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Not available';
  return date.toLocaleDateString();
}

function formatPlacementLabel(value: string | null | undefined): string {
  if (!value) return 'Not provided';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'featured') return 'Featured';
  if (normalized === 'hot_deals') return 'Good Deals';
  if (normalized === 'hot_tours') return 'Hot Tours';
  if (normalized === 'home_featured') return 'Home Featured';
  if (normalized === 'category_top') return 'Category Top';
  if (normalized === 'search_boost') return 'Search Boost';
  return value.replace(/_/g, ' ');
}

function formatPromotionStatusLabel(status: PreparedPromotion['status']): string {
  if (status === 'active') return 'Active';
  if (status === 'scheduled') return 'Scheduled';
  if (status === 'expired') return 'Expired';
  return 'Pending';
}

function getStatusBadgeVariant(status: PreparedPromotion['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'active') return 'default';
  if (status === 'scheduled') return 'secondary';
  if (status === 'expired') return 'destructive';
  return 'outline';
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function isDateWithinRange(valueMs: number | null, fromDate: string, toDate: string): boolean {
  if (!fromDate && !toDate) return true;
  if (valueMs == null) return false;
  if (fromDate) {
    const fromMs = new Date(fromDate).getTime();
    if (Number.isFinite(fromMs) && valueMs < fromMs) return false;
  }
  if (toDate) {
    const toMs = new Date(`${toDate}T23:59:59`).getTime();
    if (Number.isFinite(toMs) && valueMs > toMs) return false;
  }
  return true;
}

function buildPromotionWarnings(promotion: PreparedPromotion, nowMs: number): string[] {
  const warnings: string[] = [];
  if (!promotion.tour) warnings.push('Promotion is linked to a missing tour record.');
  if (promotion.tour?.status && promotion.tour.status !== 'published') {
    warnings.push(`Linked tour is not published (${promotion.tour.status}).`);
  }
  if (promotion.agency?.is_verified === false) warnings.push('Linked agency is not verified.');
  if (promotion.agency?.is_approved === false) warnings.push('Linked agency is not approved.');
  if (promotion.startsAtMs != null && promotion.endsAtMs != null && promotion.startsAtMs > promotion.endsAtMs) {
    warnings.push('Invalid date range: start date is after end date.');
  }
  if (promotion.endsAtMs != null && promotion.endsAtMs < nowMs && promotion.is_active === true) {
    warnings.push('Promotion is expired but still marked active.');
  }
  if (promotion.status === 'active' && !promotion.placement) {
    warnings.push('Active promotion has no placement value.');
  }
  if (promotion.source === 'tour_promotion' && (promotion.maxcoin_cost == null || promotion.maxcoin_cost <= 0)) {
    warnings.push('Promotion cost is missing or zero.');
  }
  return warnings;
}

function getTourPublicLink(promotion: AdminPromotionPanelRecord): string | null {
  const slug = promotion.tour?.slug;
  if (!slug) return null;
  return `/tour/${slug}`;
}

function tryCopy(value: string, successLabel: string) {
  navigator.clipboard
    .writeText(value)
    .then(() => {
      toast.success(successLabel);
    })
    .catch(() => {
      toast.error('Unable to copy to clipboard');
    });
}

export function AdminCoinRequestsContent({ payload, errorMessage }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRefreshing, startRefresh] = useTransition();

  const [search, setSearch] = useState('');
  const [placementFilter, setPlacementFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | PreparedPromotion['status']>('all');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [tourFilter, setTourFilter] = useState('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [balanceMin, setBalanceMin] = useState('');
  const [balanceMax, setBalanceMax] = useState('');

  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [pendingCoinAction, setPendingCoinAction] = useState<CoinActionState | null>(null);
  const [processingCoinRequestId, setProcessingCoinRequestId] = useState<string | null>(null);

  useEffect(() => {
    const placement = searchParams.get('placement');
    if (!placement) return;
    setPlacementFilter(placement);
  }, [searchParams]);

  const generatedAt = payload?.generatedAt ?? null;
  const generatedAtText = useMemo(() => formatDateTime(generatedAt), [generatedAt]);

  const preparedPromotions = useMemo<PreparedPromotion[]>(() => {
    if (!payload) return [];
    const nowMs = Date.now();
    return payload.promotions.map((item) => {
      const startsAtMs = parseDateMs(item.starts_at);
      const endsAtMs = parseDateMs(item.ends_at);
      const createdAtMs = parseDateMs(item.created_at);
      const durationDays =
        startsAtMs != null && endsAtMs != null
          ? Math.max(1, Math.ceil((endsAtMs - startsAtMs) / DAY_MS))
          : null;
      const remainingDays =
        endsAtMs != null
          ? Math.ceil((endsAtMs - nowMs) / DAY_MS)
          : null;

      const prepared: PreparedPromotion = {
        ...item,
        startsAtMs,
        endsAtMs,
        createdAtMs,
        durationDays,
        remainingDays,
        warnings: [],
      };

      return {
        ...prepared,
        warnings: buildPromotionWarnings(prepared, nowMs),
      };
    });
  }, [payload]);

  const agencyOptions = useMemo(() => {
    if (!payload) return [];
    const map = new Map<string, { id: string; name: string }>();

    for (const agency of payload.agencyBalances) {
      map.set(agency.id, { id: agency.id, name: agency.name });
    }
    for (const promotion of payload.promotions) {
      if (!promotion.agency) continue;
      map.set(promotion.agency.id, { id: promotion.agency.id, name: promotion.agency.name });
    }
    for (const tx of payload.maxcoinTransactions) {
      if (!tx.agency) continue;
      map.set(tx.agency.id, { id: tx.agency.id, name: tx.agency.name });
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [payload]);

  const placementOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of preparedPromotions) {
      if (item.placement) set.add(item.placement);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [preparedPromotions]);

  const tourOptions = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();
    for (const item of preparedPromotions) {
      if (!item.tour) continue;
      map.set(item.tour.id, { id: item.tour.id, title: item.tour.title });
    }
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [preparedPromotions]);

  const transactionTypeOptions = useMemo(() => {
    if (!payload) return [];
    const set = new Set<string>();
    for (const row of payload.maxcoinTransactions) {
      if (row.type) set.add(row.type);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [payload]);

  const agencySpendMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!payload) return map;
    for (const row of payload.maxcoinTransactions) {
      if (!row.agency_id) continue;
      if (row.amount >= 0) continue;
      const previous = map.get(row.agency_id) ?? 0;
      map.set(row.agency_id, previous + Math.abs(row.amount));
    }
    return map;
  }, [payload]);

  const filteredPromotions = useMemo(() => {
    const query = normalizeText(search);
    return preparedPromotions
      .filter((promotion) => {
        if (query) {
          const haystack = [
            promotion.tour?.title ?? '',
            promotion.tour?.slug ?? '',
            promotion.agency?.name ?? '',
            promotion.agency?.slug ?? '',
            promotion.agency?.phone ?? '',
            promotion.agency?.telegram_username ?? '',
            promotion.agency?.responsible_person ?? '',
            promotion.placement ?? '',
            promotion.status,
            promotion.source,
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        if (placementFilter !== 'all' && promotion.placement !== placementFilter) return false;
        if (statusFilter !== 'all' && promotion.status !== statusFilter) return false;
        if (agencyFilter !== 'all' && promotion.agency_id !== agencyFilter) return false;
        if (tourFilter !== 'all' && promotion.tour_id !== tourFilter) return false;
        if (!isDateWithinRange(promotion.startsAtMs ?? promotion.createdAtMs, dateFrom, dateTo)) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'oldest':
            return (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0);
          case 'ending_soon':
            return (a.endsAtMs ?? Number.POSITIVE_INFINITY) - (b.endsAtMs ?? Number.POSITIVE_INFINITY);
          case 'active_first':
            return Number(b.status === 'active') - Number(a.status === 'active') || (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0);
          case 'placement':
            return (a.placement ?? '').localeCompare(b.placement ?? '');
          case 'agency':
            return (a.agency?.name ?? '').localeCompare(b.agency?.name ?? '');
          case 'maxcoin_amount':
            return (b.maxcoin_cost ?? 0) - (a.maxcoin_cost ?? 0);
          case 'highest_spend': {
            const left = a.agency_id ? agencySpendMap.get(a.agency_id) ?? 0 : 0;
            const right = b.agency_id ? agencySpendMap.get(b.agency_id) ?? 0 : 0;
            return right - left;
          }
          case 'newest':
          default:
            return (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0);
        }
      });
  }, [
    preparedPromotions,
    search,
    placementFilter,
    statusFilter,
    agencyFilter,
    tourFilter,
    dateFrom,
    dateTo,
    sortBy,
    agencySpendMap,
  ]);

  const filteredTransactions = useMemo(() => {
    if (!payload) return [];
    const query = normalizeText(search);
    const minBalance = balanceMin.trim().length > 0 ? Number(balanceMin) : null;
    const maxBalance = balanceMax.trim().length > 0 ? Number(balanceMax) : null;

    return payload.maxcoinTransactions.filter((row) => {
      if (query) {
        const haystack = [
          row.agency?.name ?? '',
          row.agency?.slug ?? '',
          row.type ?? '',
          row.description ?? '',
          row.tour?.title ?? '',
          row.agency?.responsible_person ?? '',
          row.agency?.phone ?? '',
          row.agency?.telegram_username ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (agencyFilter !== 'all' && row.agency_id !== agencyFilter) return false;
      if (tourFilter !== 'all' && row.tour_id !== tourFilter) return false;
      if (transactionTypeFilter !== 'all' && row.type !== transactionTypeFilter) return false;

      if (!isDateWithinRange(parseDateMs(row.created_at), dateFrom, dateTo)) return false;

      const currentBalance = row.agency?.maxcoin_balance;
      if (minBalance != null && Number.isFinite(minBalance) && (currentBalance ?? Number.NEGATIVE_INFINITY) < minBalance) {
        return false;
      }
      if (maxBalance != null && Number.isFinite(maxBalance) && (currentBalance ?? Number.POSITIVE_INFINITY) > maxBalance) {
        return false;
      }

      return true;
    });
  }, [
    payload,
    search,
    agencyFilter,
    tourFilter,
    transactionTypeFilter,
    dateFrom,
    dateTo,
    balanceMin,
    balanceMax,
  ]);

  const filteredAgencyBalances = useMemo(() => {
    if (!payload) return [];
    const query = normalizeText(search);
    const minBalance = balanceMin.trim().length > 0 ? Number(balanceMin) : null;
    const maxBalance = balanceMax.trim().length > 0 ? Number(balanceMax) : null;

    return payload.agencyBalances
      .filter((agency) => {
        if (query) {
          const haystack = [
            agency.name,
            agency.slug,
            agency.phone ?? '',
            agency.telegram_username ?? '',
            agency.responsible_person ?? '',
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        if (agencyFilter !== 'all' && agency.id !== agencyFilter) return false;
        if (minBalance != null && Number.isFinite(minBalance) && agency.maxcoin_balance < minBalance) return false;
        if (maxBalance != null && Number.isFinite(maxBalance) && agency.maxcoin_balance > maxBalance) return false;
        return true;
      })
      .sort((a, b) => a.maxcoin_balance - b.maxcoin_balance);
  }, [payload, search, agencyFilter, balanceMin, balanceMax]);

  const promotionStats = useMemo(() => {
    const nowMs = Date.now();
    const active = preparedPromotions.filter((promotion) => promotion.status === 'active').length;
    const scheduled = preparedPromotions.filter((promotion) => promotion.status === 'scheduled').length;
    const pending = preparedPromotions.filter((promotion) => promotion.status === 'pending').length;
    const expired = preparedPromotions.filter((promotion) => promotion.status === 'expired').length;
    const endingSoon = preparedPromotions.filter((promotion) => {
      if (promotion.status !== 'active') return false;
      if (promotion.endsAtMs == null) return false;
      return promotion.endsAtMs >= nowMs && promotion.endsAtMs <= nowMs + 7 * DAY_MS;
    }).length;
    const warnings = preparedPromotions.reduce((sum, promotion) => sum + promotion.warnings.length, 0);
    return {
      active,
      scheduled,
      pending,
      expired,
      endingSoon,
      warnings,
    };
  }, [preparedPromotions]);

  const maxcoinStats = useMemo(() => {
    if (!payload) {
      return {
        issued: 0,
        spent: 0,
        balance: 0,
        lowBalanceCount: 0,
        lowBalanceThreshold: 50,
        pendingRequests: 0,
      };
    }

    const issued = payload.maxcoinTransactions
      .filter((row) => row.amount > 0)
      .reduce((sum, row) => sum + row.amount, 0);
    const spent = payload.maxcoinTransactions
      .filter((row) => row.amount < 0)
      .reduce((sum, row) => sum + Math.abs(row.amount), 0);
    const balance = payload.agencyBalances.reduce((sum, row) => sum + row.maxcoin_balance, 0);

    const tierMinimum = payload.promotionTiers
      .filter((row) => row.coins > 0)
      .reduce((min, row) => Math.min(min, row.coins), Number.POSITIVE_INFINITY);
    const lowBalanceThreshold = Number.isFinite(tierMinimum) ? tierMinimum : 50;

    const lowBalanceCount = payload.agencyBalances.filter((agency) => agency.maxcoin_balance < lowBalanceThreshold).length;
    const pendingRequests = payload.coinRequests.filter((request) => request.status === 'pending').length;

    return {
      issued,
      spent,
      balance,
      lowBalanceCount,
      lowBalanceThreshold,
      pendingRequests,
    };
  }, [payload]);

  const placementSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        placement: string;
        active: number;
        scheduled: number;
        expired: number;
        endingSoon: number;
        warningCount: number;
      }
    >();

    const nowMs = Date.now();

    for (const promotion of preparedPromotions) {
      const key = promotion.placement ?? 'not_provided';
      const current = map.get(key) ?? {
        placement: key,
        active: 0,
        scheduled: 0,
        expired: 0,
        endingSoon: 0,
        warningCount: 0,
      };

      if (promotion.status === 'active') current.active += 1;
      if (promotion.status === 'scheduled' || promotion.status === 'pending') current.scheduled += 1;
      if (promotion.status === 'expired') current.expired += 1;
      if (promotion.status === 'active' && promotion.endsAtMs != null && promotion.endsAtMs <= nowMs + 7 * DAY_MS) {
        current.endingSoon += 1;
      }
      current.warningCount += promotion.warnings.length;

      map.set(key, current);
    }

    return Array.from(map.values()).sort((a, b) => b.active - a.active);
  }, [preparedPromotions]);

  const promotionWarnings = useMemo(() => {
    const list: Array<{ promotionId: string; message: string }> = [];
    for (const promotion of preparedPromotions) {
      for (const warning of promotion.warnings) {
        list.push({ promotionId: promotion.id, message: warning });
      }
    }
    return list;
  }, [preparedPromotions]);

  const selectedPromotion = useMemo(
    () => preparedPromotions.find((promotion) => promotion.id === selectedPromotionId) ?? null,
    [preparedPromotions, selectedPromotionId]
  );

  const selectedAgency = useMemo(() => {
    if (!payload || !selectedAgencyId) return null;
    return payload.agencyBalances.find((agency) => agency.id === selectedAgencyId) ?? null;
  }, [payload, selectedAgencyId]);

  const selectedAgencyPromotions = useMemo(() => {
    if (!selectedAgencyId) return [];
    return preparedPromotions.filter((promotion) => promotion.agency_id === selectedAgencyId);
  }, [preparedPromotions, selectedAgencyId]);

  const selectedAgencyActivePromotions = useMemo(
    () => selectedAgencyPromotions.filter((promotion) => promotion.status === 'active'),
    [selectedAgencyPromotions]
  );

  const selectedAgencyTransactions = useMemo(() => {
    if (!payload || !selectedAgencyId) return [];
    return payload.maxcoinTransactions.filter((row) => row.agency_id === selectedAgencyId).slice(0, 30);
  }, [payload, selectedAgencyId]);

  const selectedAgencySpendByPlacement = useMemo(() => {
    const map = new Map<string, number>();
    for (const promotion of selectedAgencyPromotions) {
      if (promotion.maxcoin_cost == null) continue;
      const key = promotion.placement ?? 'not_provided';
      const prev = map.get(key) ?? 0;
      map.set(key, prev + promotion.maxcoin_cost);
    }
    return Array.from(map.entries()).map(([placement, total]) => ({ placement, total }));
  }, [selectedAgencyPromotions]);

  const pendingCoinRequests = useMemo(() => {
    if (!payload) return [];
    return payload.coinRequests.filter((item) => item.status === 'pending');
  }, [payload]);

  async function handleCoinRequestAction(request: AdminCoinRequestPanelRecord, action: 'approve' | 'reject') {
    setProcessingCoinRequestId(request.id);
    const result = action === 'approve'
      ? await approveCoinRequest(request.id)
      : await rejectCoinRequest(request.id);
    setProcessingCoinRequestId(null);
    setPendingCoinAction(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(action === 'approve' ? 'Coin request approved' : 'Coin request rejected');
    startRefresh(() => {
      router.refresh();
    });
  }

  function resetFilters() {
    setSearch('');
    setPlacementFilter('all');
    setStatusFilter('all');
    setAgencyFilter('all');
    setTourFilter('all');
    setTransactionTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('newest');
    setBalanceMin('');
    setBalanceMax('');
  }

  if (errorMessage || !payload) {
    return (
      <div className="p-6">
        <Card className="border-rose-200 bg-rose-50/70">
          <CardHeader>
            <CardTitle className="text-rose-900">Promotions / MaxCoin failed to load</CardTitle>
            <CardDescription className="text-rose-700">
              {errorMessage ?? 'Unknown error while loading promotions and MaxCoin operations.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => startRefresh(() => router.refresh())}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <SectionShell className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <PageTitle
            title="Promotions / MaxCoin"
            subtitle="Boost operations, agency balances, ad placements, and marketplace visibility control."
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => startRefresh(() => router.refresh())}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Last updated: {generatedAtText}</span>
          {payload.health.partialData ? (
            <Badge variant="destructive">Partial data</Badge>
          ) : (
            <Badge variant="outline">Data healthy</Badge>
          )}
        </div>
      </SectionShell>

      {payload.health.errors.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/80">
          <CardHeader>
            <CardTitle className="text-amber-900">Data source warnings</CardTitle>
            <CardDescription className="text-amber-800">
              Some metrics are partially available. No fallback data was fabricated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {payload.health.errors.map((error) => (
              <p key={error} className="text-xs text-amber-800">
                - {error}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <SectionShell>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <button
            onClick={() => setStatusFilter('active')}
            className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-left transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Active promotions</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{formatNumber(promotionStats.active)}</p>
          </button>
          <button
            onClick={() => setStatusFilter('scheduled')}
            className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-left transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">Scheduled / pending</p>
            <p className="mt-1 text-2xl font-bold text-sky-900">
              {formatNumber(promotionStats.scheduled + promotionStats.pending)}
            </p>
          </button>
          <button
            onClick={() => setSortBy('ending_soon')}
            className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-left transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Ending soon</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{formatNumber(promotionStats.endingSoon)}</p>
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-left transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">Expired promotions</p>
            <p className="mt-1 text-2xl font-bold text-rose-900">{formatNumber(promotionStats.expired)}</p>
          </button>
          <button
            onClick={() => setTransactionTypeFilter('all')}
            className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 text-left transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">Total MaxCoin spent</p>
            <p className="mt-1 text-2xl font-bold text-indigo-900">{formatNumber(maxcoinStats.spent)}</p>
          </button>
          <button
            onClick={() => setBalanceMax(String(Math.max(maxcoinStats.lowBalanceThreshold - 1, 0)))}
            className="rounded-2xl border border-orange-200 bg-orange-50/80 p-4 text-left transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-700">Low-balance agencies</p>
            <p className="mt-1 text-2xl font-bold text-orange-900">{formatNumber(maxcoinStats.lowBalanceCount)}</p>
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Issued</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xl font-semibold text-slate-900">{formatNumber(maxcoinStats.issued)} MC</CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Current Balance Pool</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xl font-semibold text-slate-900">{formatNumber(maxcoinStats.balance)} MC</CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pending Top-Up Requests</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xl font-semibold text-slate-900">{formatNumber(maxcoinStats.pendingRequests)}</CardContent>
          </Card>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Placement Monitoring</h2>
        </div>
        {placementSummary.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">
              No placement records are available yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {placementSummary.map((item) => (
              <button
                key={item.placement}
                onClick={() => setPlacementFilter(item.placement)}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{formatPlacementLabel(item.placement)}</p>
                  <Badge variant={item.warningCount > 0 ? 'destructive' : 'outline'}>
                    {item.warningCount > 0 ? `${item.warningCount} warnings` : 'Stable'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <span>Active: {item.active}</span>
                  <span>Scheduled: {item.scheduled}</span>
                  <span>Ending soon: {item.endingSoon}</span>
                  <span>Expired: {item.expired}</span>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">Visible slot capacity is not configured in existing schema.</p>
              </button>
            ))}
          </div>
        )}
      </SectionShell>

      <SectionShell className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by tour, agency, placement, contact, manager, transaction..."
              className="pl-8"
            />
          </div>
          <Select value={placementFilter} onValueChange={(value) => setPlacementFilter(value ?? 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Placement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All placements</SelectItem>
              {placementOptions.map((placement) => (
                <SelectItem key={placement} value={placement}>
                  {formatPlacementLabel(placement)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter((value as typeof statusFilter) ?? 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={agencyFilter} onValueChange={(value) => setAgencyFilter(value ?? 'all')}>
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[190px]">
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
          <Select value={transactionTypeFilter} onValueChange={(value) => setTransactionTypeFilter(value ?? 'all')}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Transaction type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All transaction types</SelectItem>
              {transactionTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value) => setSortBy((value as SortKey) ?? 'newest')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="ending_soon">Ending soon</SelectItem>
              <SelectItem value="active_first">Active first</SelectItem>
              <SelectItem value="placement">Placement</SelectItem>
              <SelectItem value="agency">Agency</SelectItem>
              <SelectItem value="maxcoin_amount">MaxCoin amount</SelectItem>
              <SelectItem value="highest_spend">Highest spend</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[170px]" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[170px]" />
          <Input
            value={balanceMin}
            onChange={(e) => setBalanceMin(e.target.value)}
            className="w-[130px]"
            inputMode="numeric"
            placeholder="Min balance"
          />
          <Input
            value={balanceMax}
            onChange={(e) => setBalanceMax(e.target.value)}
            className="w-[130px]"
            inputMode="numeric"
            placeholder="Max balance"
          />
          <Button variant="outline" onClick={resetFilters}>
            <FilterX className="mr-1 h-4 w-4" />
            Reset
          </Button>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Promotion Operations</h2>
          <p className="text-xs text-slate-500">{filteredPromotions.length} records</p>
        </div>
        <Card className="overflow-hidden border-slate-200">
          {filteredPromotions.length === 0 ? (
            <CardContent className="py-12 text-center text-sm text-slate-500">
              No promotions match the selected filters.
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Promotion</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Placement</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Schedule</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">MaxCoin</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Warnings</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPromotions.map((promotion) => {
                    const remainingLabel =
                      promotion.remainingDays == null
                        ? 'Not available'
                        : promotion.remainingDays < 0
                          ? `Ended ${Math.abs(promotion.remainingDays)}d ago`
                          : `${promotion.remainingDays}d left`;

                    return (
                      <tr key={promotion.id} className="border-b border-slate-100 align-top">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedPromotionId(promotion.id)}
                            className="group flex w-full items-start gap-3 text-left"
                          >
                            <Image
                              src={promotion.tour?.cover_image_url || placeholderImage(120, 90, 'Tour')}
                              alt={promotion.tour?.title ?? 'Tour'}
                              width={56}
                              height={44}
                              className="h-11 w-14 rounded-lg object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-slate-900 group-hover:text-sky-700">
                                {promotion.tour?.title ?? 'Not provided'}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {promotion.agency?.name ?? 'Agency not provided'}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-400">
                                {promotion.source === 'tour_promotion' ? 'Source: tour_promotions' : 'Source: featured_items'}
                              </p>
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{formatPlacementLabel(promotion.placement)}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getStatusBadgeVariant(promotion.status)}>
                            {formatPromotionStatusLabel(promotion.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          <p>{formatShortDate(promotion.starts_at)}</p>
                          <p>{formatShortDate(promotion.ends_at)}</p>
                          <p className="mt-1 text-slate-400">{remainingLabel}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {promotion.maxcoin_cost == null ? 'Not available' : `${formatNumber(promotion.maxcoin_cost)} MC`}
                          </p>
                          <p className="text-xs text-slate-500">Leads: {formatNumber(promotion.lead_count)}</p>
                        </td>
                        <td className="px-4 py-3">
                          {promotion.warnings.length === 0 ? (
                            <Badge variant="outline">None</Badge>
                          ) : (
                            <button
                              onClick={() => setSelectedPromotionId(promotion.id)}
                              className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700"
                            >
                              {promotion.warnings.length} warning(s)
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPromotionId(promotion.id)}
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!getTourPublicLink(promotion)}
                              onClick={() => {
                                const link = getTourPublicLink(promotion);
                                if (!link) return;
                                tryCopy(link, 'Tour link copied');
                              }}
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
          )}
        </Card>
      </SectionShell>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <SectionShell>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">MaxCoin Ledger</h2>
            <p className="text-xs text-slate-500">{filteredTransactions.length} records</p>
          </div>
          <Card className="border-slate-200">
            {filteredTransactions.length === 0 ? (
              <CardContent className="py-10 text-center text-sm text-slate-500">
                No MaxCoin transactions match the selected filters.
              </CardContent>
            ) : (
              <CardContent className="space-y-2 py-3">
                {filteredTransactions.slice(0, 120).map((row) => (
                  <button
                    key={row.id}
                    onClick={() => {
                      if (row.agency_id) setSelectedAgencyId(row.agency_id);
                    }}
                    className="flex w-full items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-sky-200"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{row.agency?.name ?? 'Agency not provided'}</p>
                      <p className="truncate text-xs text-slate-500">{row.type ?? 'Unknown type'}</p>
                      <p className="truncate text-xs text-slate-400">{row.description ?? 'Not provided'}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(row.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('font-semibold', row.amount >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                        {row.amount >= 0 ? '+' : ''}
                        {formatNumber(row.amount)} MC
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Balance: {row.agency?.maxcoin_balance == null ? 'Not available' : `${formatNumber(row.agency.maxcoin_balance)} MC`}
                      </p>
                    </div>
                  </button>
                ))}
              </CardContent>
            )}
          </Card>
        </SectionShell>

        <SectionShell>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Agency Balances</h2>
            <p className="text-xs text-slate-500">{filteredAgencyBalances.length} agencies</p>
          </div>
          <Card className="border-slate-200">
            {filteredAgencyBalances.length === 0 ? (
              <CardContent className="py-10 text-center text-sm text-slate-500">
                No agencies match current search and balance filters.
              </CardContent>
            ) : (
              <CardContent className="space-y-2 py-3">
                {filteredAgencyBalances.slice(0, 120).map((agency) => (
                  <button
                    key={agency.id}
                    onClick={() => setSelectedAgencyId(agency.id)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:border-sky-200"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{agency.name}</p>
                      <p className="text-xs text-slate-500">{agency.responsible_person ?? agency.phone ?? 'Contact not provided'}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('font-semibold', agency.maxcoin_balance < maxcoinStats.lowBalanceThreshold ? 'text-orange-700' : 'text-slate-900')}>
                        {formatNumber(agency.maxcoin_balance)} MC
                      </p>
                      <p className="text-[11px] text-slate-400">{formatDateTime(agency.updated_at)}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            )}
          </Card>
        </SectionShell>
      </div>

      <SectionShell>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Pending MaxCoin Purchases</CardTitle>
              <CardDescription>Approve or reject existing safe coin top-up requests.</CardDescription>
            </CardHeader>
            {pendingCoinRequests.length === 0 ? (
              <CardContent className="pb-8 text-sm text-slate-500">No pending requests.</CardContent>
            ) : (
              <CardContent className="space-y-2 pb-4">
                {pendingCoinRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{request.agency?.name ?? 'Agency not provided'}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(request.created_at)}</p>
                      <p className="text-xs text-slate-500">
                        {formatNumber(request.coins)} MC / {formatNumber(request.price_uzs)} UZS
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPendingCoinAction({ requestId: request.id, action: 'reject' })}
                        disabled={processingCoinRequestId === request.id}
                      >
                        <XCircle className="mr-1 h-3.5 w-3.5" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setPendingCoinAction({ requestId: request.id, action: 'approve' })}
                        disabled={processingCoinRequestId === request.id}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Data Quality Indicators</CardTitle>
              <CardDescription>Warnings are derived from real fields; no automatic blocking applied.</CardDescription>
            </CardHeader>
            {promotionWarnings.length === 0 ? (
              <CardContent className="pb-8 text-sm text-emerald-700">
                No promotion data-quality warnings detected.
              </CardContent>
            ) : (
              <CardContent className="space-y-2 pb-4">
                {promotionWarnings.slice(0, 18).map((warning, index) => (
                  <button
                    key={`${warning.promotionId}-${index}`}
                    onClick={() => setSelectedPromotionId(warning.promotionId)}
                    className="flex w-full items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-left text-xs text-rose-800"
                  >
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{warning.message}</span>
                  </button>
                ))}
              </CardContent>
            )}
          </Card>
        </div>
      </SectionShell>

      <Sheet open={Boolean(selectedPromotion)} onOpenChange={(open) => !open && setSelectedPromotionId(null)}>
        <SheetContent side="right" className="w-full max-w-3xl overflow-y-auto">
          {selectedPromotion ? (
            <div className="space-y-4 p-2">
              <SheetHeader className="px-0 pt-0">
                <SheetTitle className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-sky-600" />
                  Promotion Detail
                </SheetTitle>
                <SheetDescription>
                  Promotion identity, placement, schedule, MaxCoin spend, links, and warning context.
                </SheetDescription>
              </SheetHeader>

              <Card className="border-slate-200">
                <CardContent className="space-y-3 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(selectedPromotion.status)}>
                      {formatPromotionStatusLabel(selectedPromotion.status)}
                    </Badge>
                    <Badge variant="outline">{formatPlacementLabel(selectedPromotion.placement)}</Badge>
                    <Badge variant="outline">
                      {selectedPromotion.source === 'tour_promotion' ? 'tour_promotions' : 'featured_items'}
                    </Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Promotion ID</p>
                      <p className="text-sm text-slate-900">{selectedPromotion.sourceId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Created</p>
                      <p className="text-sm text-slate-900">{formatDateTime(selectedPromotion.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Start</p>
                      <p className="text-sm text-slate-900">{formatDateTime(selectedPromotion.starts_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">End</p>
                      <p className="text-sm text-slate-900">{formatDateTime(selectedPromotion.ends_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Duration</p>
                      <p className="text-sm text-slate-900">
                        {selectedPromotion.durationDays == null ? 'Not available' : `${selectedPromotion.durationDays} day(s)`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">MaxCoin cost</p>
                      <p className="text-sm text-slate-900">
                        {selectedPromotion.maxcoin_cost == null
                          ? 'Not available'
                          : `${formatNumber(selectedPromotion.maxcoin_cost)} MC`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Linked Tour</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-4">
                  {!selectedPromotion.tour ? (
                    <p className="text-sm text-slate-500">Tour is not available for this promotion.</p>
                  ) : (
                    <div className="flex gap-3">
                      <Image
                        src={selectedPromotion.tour.cover_image_url || placeholderImage(180, 120, 'Tour')}
                        alt={selectedPromotion.tour.title}
                        width={120}
                        height={84}
                        className="h-20 w-28 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{selectedPromotion.tour.title}</p>
                        <p className="text-xs text-slate-500">Status: {selectedPromotion.tour.status ?? 'Not provided'}</p>
                        <p className="text-xs text-slate-500">Views: {selectedPromotion.tour.view_count == null ? 'Not available' : formatNumber(selectedPromotion.tour.view_count)}</p>
                        <p className="text-xs text-slate-500">Leads: {formatNumber(selectedPromotion.lead_count)}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedPromotion.tour_id ? (
                            <Button variant="outline" size="sm" render={<Link href={`/admin/tours/${selectedPromotion.tour_id}`} />}>
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              View Tour (Admin)
                            </Button>
                          ) : null}
                          {getTourPublicLink(selectedPromotion) ? (
                            <Button variant="outline" size="sm" render={<Link href={getTourPublicLink(selectedPromotion) ?? '#'} target="_blank" rel="noreferrer" />}>
                              <ExternalLink className="mr-1 h-3.5 w-3.5" />
                              Public Tour
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Linked Agency / Action Center</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 py-0 pb-4">
                  {!selectedPromotion.agency ? (
                    <p className="text-sm text-slate-500">Agency is not available for this promotion.</p>
                  ) : (
                    <>
                      <div className="rounded-xl border border-slate-200 p-3">
                        <p className="font-semibold text-slate-900">{selectedPromotion.agency.name}</p>
                        <p className="text-xs text-slate-500">
                          {selectedPromotion.agency.responsible_person ?? selectedPromotion.agency.phone ?? 'Contact not provided'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Balance: {selectedPromotion.agency.maxcoin_balance == null ? 'Not available' : `${formatNumber(selectedPromotion.agency.maxcoin_balance)} MC`}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedAgencyId(selectedPromotion.agency!.id)}>
                            <Wallet className="mr-1 h-3.5 w-3.5" />
                            Agency MaxCoin Detail
                          </Button>
                          <Button variant="outline" size="sm" render={<Link href="/admin/agencies" />}>
                            <Building2 className="mr-1 h-3.5 w-3.5" />
                            Agencies Panel
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!getTourPublicLink(selectedPromotion)}
                          onClick={() => {
                            const link = getTourPublicLink(selectedPromotion);
                            if (!link) return;
                            tryCopy(link, 'Promotion link copied');
                          }}
                        >
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          Copy promotion link
                        </Button>
                        <Button variant="outline" size="sm" disabled title="No safe admin mutation exists for cancellation in current codebase">
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          Cancel promotion (Unavailable)
                        </Button>
                        <Button variant="outline" size="sm" disabled title="No safe admin mutation exists for force-expire in current codebase">
                          <Timer className="mr-1 h-3.5 w-3.5" />
                          Expire now (Unavailable)
                        </Button>
                        <Button variant="outline" size="sm" disabled title="No safe admin mutation exists for extending duration in current codebase">
                          <CalendarDays className="mr-1 h-3.5 w-3.5" />
                          Extend campaign (Unavailable)
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Warnings & Fairness</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 py-0 pb-4">
                  {selectedPromotion.warnings.length === 0 ? (
                    <p className="text-sm text-emerald-700">No active warnings for this promotion.</p>
                  ) : (
                    selectedPromotion.warnings.map((warning) => (
                      <div key={warning} className="rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs text-rose-800">
                        {warning}
                      </div>
                    ))
                  )}
                  <Separator />
                  <p className="text-xs text-slate-500">
                    Slot rotation/capacity controls are read-only here. Rotation algorithm and placement RPC logic were intentionally not changed.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selectedAgency)} onOpenChange={(open) => !open && setSelectedAgencyId(null)}>
        <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto">
          {selectedAgency ? (
            <div className="space-y-4 p-2">
              <SheetHeader className="px-0 pt-0">
                <SheetTitle className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-sky-600" />
                  Agency MaxCoin Detail
                </SheetTitle>
                <SheetDescription>
                  Agency balance, recent transactions, active promotions, and spend by placement.
                </SheetDescription>
              </SheetHeader>

              <Card className="border-slate-200">
                <CardContent className="grid gap-3 py-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Agency</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedAgency.name}</p>
                    <p className="text-xs text-slate-500">{selectedAgency.responsible_person ?? selectedAgency.phone ?? 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Current balance</p>
                    <p className={cn('text-xl font-bold', selectedAgency.maxcoin_balance < maxcoinStats.lowBalanceThreshold ? 'text-orange-700' : 'text-slate-900')}>
                      {formatNumber(selectedAgency.maxcoin_balance)} MC
                    </p>
                    {selectedAgency.maxcoin_balance < maxcoinStats.lowBalanceThreshold ? (
                      <p className="text-xs text-orange-700">Low balance warning</p>
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <Button variant="outline" size="sm" render={<Link href="/admin/agencies" />}>
                      <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                      Open Agencies Panel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Active Promotions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 py-0 pb-4">
                  {selectedAgencyActivePromotions.length === 0 ? (
                    <p className="text-sm text-slate-500">No promotions found for this agency.</p>
                  ) : (
                    selectedAgencyActivePromotions.slice(0, 20).map((promotion) => (
                      <button
                        key={promotion.id}
                        onClick={() => setSelectedPromotionId(promotion.id)}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:border-sky-200"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{promotion.tour?.title ?? 'Tour not provided'}</p>
                          <p className="text-xs text-slate-500">{formatPlacementLabel(promotion.placement)}</p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(promotion.status)}>
                          {formatPromotionStatusLabel(promotion.status)}
                        </Badge>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Spend by Placement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 py-0 pb-4">
                  {selectedAgencySpendByPlacement.length === 0 ? (
                    <p className="text-sm text-slate-500">Not available from current promotion cost records.</p>
                  ) : (
                    selectedAgencySpendByPlacement.map((item) => (
                      <div key={item.placement} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                        <p className="text-sm text-slate-700">{formatPlacementLabel(item.placement)}</p>
                        <p className="text-sm font-semibold text-slate-900">{formatNumber(item.total)} MC</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 py-0 pb-4">
                  {selectedAgencyTransactions.length === 0 ? (
                    <p className="text-sm text-slate-500">No transaction history available for this agency.</p>
                  ) : (
                    selectedAgencyTransactions.map((row) => (
                      <div key={row.id} className="rounded-xl border border-slate-200 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-slate-900">{row.type ?? 'Unknown type'}</p>
                          <p className={cn('text-sm font-semibold', row.amount >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                            {row.amount >= 0 ? '+' : ''}
                            {formatNumber(row.amount)} MC
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">{row.description ?? 'No description'}</p>
                        <p className="text-[11px] text-slate-400">{formatDateTime(row.created_at)}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(pendingCoinAction)} onOpenChange={(open) => !open && setPendingCoinAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingCoinAction?.action === 'approve' ? 'Approve coin request?' : 'Reject coin request?'}
            </DialogTitle>
            <DialogDescription>
              This action uses existing admin-safe server logic. It will update request status and refresh the panel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingCoinAction(null)}>
              Cancel
            </Button>
            <Button
              variant={pendingCoinAction?.action === 'approve' ? 'default' : 'destructive'}
              onClick={() => {
                if (!pendingCoinAction) return;
                const request = payload.coinRequests.find((item) => item.id === pendingCoinAction.requestId);
                if (!request) {
                  setPendingCoinAction(null);
                  return;
                }
                void handleCoinRequestAction(request, pendingCoinAction.action);
              }}
              disabled={pendingCoinAction == null}
            >
              {pendingCoinAction?.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
