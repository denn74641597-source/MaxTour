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
  ChevronLeft,
  ChevronRight,
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
import { Button, buttonVariants } from '@/components/ui/button';
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
import { useAdminI18n } from '@/features/admin/i18n';
import { useDebouncedValue } from '@/features/admin/use-debounced-value';
import { cn, formatNumber, placeholderImage } from '@/lib/utils';

const DAY_MS = 24 * 60 * 60 * 1000;
const PROMOTIONS_PAGE_SIZE = 80;

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
  viewMode?: 'combined' | 'maxcoin';
}

function parseDateMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatPlacementLabel(value: string | null | undefined): string {
  if (!value) return 'Not provided';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'featured') return 'Featured';
  if (normalized === 'hot_deals') return 'Hot deals';
  if (normalized === 'hot_tours') return 'Hot tours';
  if (normalized === 'home_featured') return 'Home featured';
  if (normalized === 'category_top') return 'Category top';
  if (normalized === 'search_boost') return 'Search boost';
  return value.replace(/_/g, ' ');
}

function formatPromotionStatusLabel(status: PreparedPromotion['status']): string {
  return status;
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

function tryCopy(value: string, successLabel: string, errorLabel: string) {
  navigator.clipboard
    .writeText(value)
    .then(() => {
      toast.success(successLabel);
    })
    .catch(() => {
      toast.error(errorLabel);
    });
}

export function AdminCoinRequestsContent({ payload, errorMessage, viewMode = 'combined' }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, tInline, localizeStatus, tc } = useAdminI18n();
  const [isRefreshing, startRefresh] = useTransition();
  const isMaxcoinOnly = viewMode === 'maxcoin';

  const [search, setSearch] = useState('');
  const [placementFilter, setPlacementFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | PreparedPromotion['status']>('all');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [tourFilter, setTourFilter] = useState('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [balanceMin, setBalanceMin] = useState('');
  const [balanceMax, setBalanceMax] = useState('');

  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [pendingCoinAction, setPendingCoinAction] = useState<CoinActionState | null>(null);
  const [processingCoinRequestId, setProcessingCoinRequestId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 250);

  useEffect(() => {
    const placement = searchParams.get('placement');
    if (!placement) return;
    setPlacementFilter(placement);
  }, [searchParams]);

  const generatedAt = payload?.generatedAt ?? null;
  const generatedAtText = useMemo(() => formatDateTime(generatedAt), [generatedAt]);

  const localizePromotionWarning = (warning: string): string => {
    const normalized = warning.trim().toLowerCase();
    if (normalized === 'promotion is linked to a missing tour record.') {
      return language === 'ru'
        ? 'Реклама связана с отсутствующей записью тура.'
        : "Reklama mavjud bo'lmagan tur yozuviga bog'langan.";
    }
    if (normalized.startsWith('linked tour is not published')) {
      return language === 'ru'
        ? 'Связанный тур не опубликован.'
        : "Bog'langan tur nashr qilinmagan.";
    }
    if (normalized === 'linked agency is not verified.') {
      return language === 'ru'
        ? 'Связанное агентство не верифицировано.'
        : 'Bog‘langan agentlik verifikatsiyadan o‘tmagan.';
    }
    if (normalized === 'linked agency is not approved.') {
      return language === 'ru'
        ? 'Связанное агентство не подтверждено.'
        : 'Bog‘langan agentlik tasdiqlanmagan.';
    }
    if (normalized === 'invalid date range: start date is after end date.') {
      return language === 'ru'
        ? 'Неверный диапазон дат: начало позже окончания.'
        : 'Sana oralig‘i noto‘g‘ri: boshlanish tugashdan keyin.';
    }
    if (normalized === 'promotion is expired but still marked active.') {
      return language === 'ru'
        ? 'Реклама завершена, но отмечена как активная.'
        : 'Reklama tugagan, ammo faol deb belgilangan.';
    }
    if (normalized === 'active promotion has no placement value.') {
      return language === 'ru'
        ? 'У активной рекламы не указан тип размещения.'
        : "Faol reklamada joylashuv qiymati kiritilmagan.";
    }
    if (normalized === 'promotion cost is missing or zero.') {
      return language === 'ru'
        ? 'Стоимость рекламы отсутствует или равна нулю.'
        : 'Reklama narxi yo‘q yoki nolga teng.';
    }
    return tInline(warning);
  };

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
    const query = normalizeText(debouncedSearch);
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
    debouncedSearch,
    placementFilter,
    statusFilter,
    agencyFilter,
    tourFilter,
    dateFrom,
    dateTo,
    sortBy,
    agencySpendMap,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    agencyFilter,
    dateFrom,
    dateTo,
    debouncedSearch,
    placementFilter,
    sortBy,
    statusFilter,
    tourFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredPromotions.length / PROMOTIONS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const visiblePromotions = useMemo(() => {
    const startIndex = (safePage - 1) * PROMOTIONS_PAGE_SIZE;
    return filteredPromotions.slice(startIndex, startIndex + PROMOTIONS_PAGE_SIZE);
  }, [filteredPromotions, safePage]);

  const filteredTransactions = useMemo(() => {
    if (!payload) return [];
    const query = normalizeText(debouncedSearch);
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
    debouncedSearch,
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
    const query = normalizeText(debouncedSearch);
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
  }, [payload, debouncedSearch, agencyFilter, balanceMin, balanceMax]);

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

    toast.success(
      action === 'approve'
        ? language === 'ru'
          ? 'Заявка на MaxCoin подтверждена.'
          : "MaxCoin so'rovi tasdiqlandi."
        : language === 'ru'
          ? 'Заявка на MaxCoin отклонена.'
          : "MaxCoin so'rovi rad etildi."
    );
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
            <CardTitle className="text-rose-900">
              {language === 'ru'
                ? 'Не удалось загрузить раздел Реклама / MaxCoin'
                : 'Reklama / MaxCoin bo‘limini yuklab bo‘lmadi'}
            </CardTitle>
            <CardDescription className="text-rose-700">
              {errorMessage ??
                (language === 'ru'
                  ? 'Во время загрузки рекламных операций и MaxCoin произошла неизвестная ошибка.'
                  : "Reklama operatsiyalari va MaxCoin ma'lumotini yuklashda noma'lum xatolik yuz berdi.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => startRefresh(() => router.refresh())}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
              {tc('retry')}
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
            title={isMaxcoinOnly ? 'MaxCoin' : (language === 'ru' ? 'Реклама / MaxCoin' : 'Reklama / MaxCoin')}
            subtitle={
              isMaxcoinOnly
                ? language === 'ru'
                  ? 'Балансы агентств, журнал транзакций и мониторинг низкого баланса.'
                  : 'Agentlik balanslari, tranzaksiya jurnali va past balans monitoringi.'
                : language === 'ru'
                  ? 'Рекламные операции, размещения и контроль видимости вместе с MaxCoin.'
                  : "Reklama operatsiyalari, joylashuvlar va ko'rinish nazorati MaxCoin bilan birga."
            }
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => startRefresh(() => router.refresh())}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
              {tc('refresh')}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{language === 'ru' ? 'Обновлено:' : 'Oxirgi yangilanish:'} {generatedAtText}</span>
          {payload.health.partialData ? (
            <Badge variant="destructive">{language === 'ru' ? 'Частичные данные' : "Qisman ma'lumot"}</Badge>
          ) : (
            <Badge variant="outline">{language === 'ru' ? 'Данные корректны' : "Ma'lumot holati yaxshi"}</Badge>
          )}
        </div>
      </SectionShell>

      {payload.health.errors.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/80">
          <CardHeader>
            <CardTitle className="text-amber-900">{language === 'ru' ? 'Предупреждения' : 'Ogohlantirishlar'}</CardTitle>
            <CardDescription className="text-amber-800">
              {language === 'ru'
                ? 'Некоторые показатели доступны частично. Искусственные данные не добавлялись.'
                : "Ba'zi ko'rsatkichlar qisman mavjud. Sun'iy ma'lumot qo'shilmagan."}
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
          {!isMaxcoinOnly ? (
            <>
              <button
                onClick={() => setStatusFilter('active')}
                className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-left transition hover:-translate-y-0.5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                  {language === 'ru' ? 'Активная реклама' : 'Faol reklamalar'}
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-900">{formatNumber(promotionStats.active)}</p>
              </button>
              <button
                onClick={() => setStatusFilter('scheduled')}
                className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-left transition hover:-translate-y-0.5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">
                  {language === 'ru' ? 'Запланировано / в ожидании' : 'Rejalashtirilgan / kutilmoqda'}
                </p>
                <p className="mt-1 text-2xl font-bold text-sky-900">
                  {formatNumber(promotionStats.scheduled + promotionStats.pending)}
                </p>
              </button>
              <button
                onClick={() => setSortBy('ending_soon')}
                className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-left transition hover:-translate-y-0.5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                  {language === 'ru' ? 'Скоро завершатся' : 'Tez orada tugaydi'}
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-900">{formatNumber(promotionStats.endingSoon)}</p>
              </button>
              <button
                onClick={() => setStatusFilter('expired')}
                className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-left transition hover:-translate-y-0.5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">
                  {language === 'ru' ? 'Завершенные рекламы' : 'Tugagan reklamalar'}
                </p>
                <p className="mt-1 text-2xl font-bold text-rose-900">{formatNumber(promotionStats.expired)}</p>
              </button>
            </>
          ) : null}
          <button
            onClick={() => setTransactionTypeFilter('all')}
            className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 text-left transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">
              {language === 'ru' ? 'Потрачено MaxCoin' : 'Sarf qilingan MaxCoin'}
            </p>
            <p className="mt-1 text-2xl font-bold text-indigo-900">{formatNumber(maxcoinStats.spent)}</p>
          </button>
          <button
            onClick={() => setBalanceMax(String(Math.max(maxcoinStats.lowBalanceThreshold - 1, 0)))}
            className="rounded-2xl border border-orange-200 bg-orange-50/80 p-4 text-left transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-700">
              {language === 'ru' ? 'Низкий баланс агентств' : 'Balansi past agentliklar'}
            </p>
            <p className="mt-1 text-2xl font-bold text-orange-900">{formatNumber(maxcoinStats.lowBalanceCount)}</p>
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{language === 'ru' ? 'Начислено' : 'Berilgan'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xl font-semibold text-slate-900">{formatNumber(maxcoinStats.issued)} MC</CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{language === 'ru' ? 'Текущий общий баланс' : 'Joriy umumiy balans'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xl font-semibold text-slate-900">{formatNumber(maxcoinStats.balance)} MC</CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{language === 'ru' ? 'Ожидающие пополнения' : "Kutilayotgan to'ldirish so'rovlari"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xl font-semibold text-slate-900">{formatNumber(maxcoinStats.pendingRequests)}</CardContent>
          </Card>
        </div>
      </SectionShell>

      {!isMaxcoinOnly ? (
      <SectionShell>
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">
            {language === 'ru' ? 'Мониторинг размещений' : 'Joylashuvlar monitoringi'}
          </h2>
        </div>
        {placementSummary.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">
              {language === 'ru' ? 'Записи по размещениям пока отсутствуют.' : "Joylashuv yozuvlari hozircha mavjud emas."}
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
                  <p className="text-sm font-semibold text-slate-900">{tInline(formatPlacementLabel(item.placement))}</p>
                  <Badge variant={item.warningCount > 0 ? 'destructive' : 'outline'}>
                    {item.warningCount > 0
                      ? `${item.warningCount} ${language === 'ru' ? 'предупреждений' : 'ogohlantirish'}`
                      : language === 'ru'
                        ? 'Стабильно'
                        : 'Barqaror'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <span>{language === 'ru' ? 'Активно' : 'Faol'}: {item.active}</span>
                  <span>{language === 'ru' ? 'Запланировано' : 'Rejalashtirilgan'}: {item.scheduled}</span>
                  <span>{language === 'ru' ? 'Скоро завершатся' : 'Tez tugaydi'}: {item.endingSoon}</span>
                  <span>{language === 'ru' ? 'Завершено' : 'Tugagan'}: {item.expired}</span>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  {language === 'ru'
                    ? 'В текущей схеме емкость слотов не настроена.'
                    : "Joriy sxemada slot sig'imi sozlanmagan."}
                </p>
              </button>
            ))}
          </div>
        )}
      </SectionShell>
      ) : null}

      <SectionShell className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                isMaxcoinOnly
                  ? language === 'ru'
                    ? 'Поиск: агентство, контакт, транзакция, менеджер...'
                    : 'Qidiruv: agentlik, aloqa, tranzaksiya, menejer...'
                  : language === 'ru'
                    ? 'Поиск: тур, агентство, размещение, контакт, менеджер, транзакция...'
                    : 'Qidiruv: tur, agentlik, joylashuv, aloqa, menejer, tranzaksiya...'
              }
              className="pl-8"
            />
          </div>
          <Select value={placementFilter} onValueChange={(value) => setPlacementFilter(value ?? 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={language === 'ru' ? 'Размещение' : 'Joylashuv'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ru' ? 'Все размещения' : 'Barcha joylashuvlar'}</SelectItem>
              {placementOptions.map((placement) => (
                <SelectItem key={placement} value={placement}>
                  {tInline(formatPlacementLabel(placement))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter((value as typeof statusFilter) ?? 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={language === 'ru' ? 'Статус' : 'Holat'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ru' ? 'Все статусы' : 'Barcha holatlar'}</SelectItem>
              <SelectItem value="active">{language === 'ru' ? 'Активно' : 'Faol'}</SelectItem>
              <SelectItem value="scheduled">{language === 'ru' ? 'Запланировано' : 'Rejalashtirilgan'}</SelectItem>
              <SelectItem value="pending">{language === 'ru' ? 'Ожидает' : 'Kutilmoqda'}</SelectItem>
              <SelectItem value="expired">{language === 'ru' ? 'Завершено' : 'Tugagan'}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={agencyFilter} onValueChange={(value) => setAgencyFilter(value ?? 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={language === 'ru' ? 'Агентство' : 'Agentlik'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ru' ? 'Все агентства' : 'Barcha agentliklar'}</SelectItem>
              {agencyOptions.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tourFilter} onValueChange={(value) => setTourFilter(value ?? 'all')}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder={language === 'ru' ? 'Тур' : 'Tur'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ru' ? 'Все туры' : 'Barcha turlar'}</SelectItem>
              {tourOptions.map((tour) => (
                <SelectItem key={tour.id} value={tour.id}>
                  {tour.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={transactionTypeFilter} onValueChange={(value) => setTransactionTypeFilter(value ?? 'all')}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder={language === 'ru' ? 'Тип транзакции' : 'Tranzaksiya turi'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ru' ? 'Все типы транзакций' : 'Barcha tranzaksiya turlari'}</SelectItem>
              {transactionTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value) => setSortBy((value as SortKey) ?? 'newest')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={language === 'ru' ? 'Сортировка' : 'Saralash'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{language === 'ru' ? 'Сначала новые' : 'Avval yangilari'}</SelectItem>
              <SelectItem value="oldest">{language === 'ru' ? 'Сначала старые' : 'Avval eskilari'}</SelectItem>
              <SelectItem value="ending_soon">{language === 'ru' ? 'Скоро завершатся' : 'Tez tugaydi'}</SelectItem>
              <SelectItem value="active_first">{language === 'ru' ? 'Сначала активные' : 'Avval faollari'}</SelectItem>
              <SelectItem value="placement">{language === 'ru' ? 'Размещение' : 'Joylashuv'}</SelectItem>
              <SelectItem value="agency">{language === 'ru' ? 'Агентство' : 'Agentlik'}</SelectItem>
              <SelectItem value="maxcoin_amount">{language === 'ru' ? 'Сумма MaxCoin' : 'MaxCoin miqdori'}</SelectItem>
              <SelectItem value="highest_spend">{language === 'ru' ? 'Наибольший расход' : 'Eng katta sarf'}</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[170px]" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[170px]" />
          <Input
            value={balanceMin}
            onChange={(e) => setBalanceMin(e.target.value)}
            className="w-[130px]"
            inputMode="numeric"
            placeholder={language === 'ru' ? 'Мин. баланс' : 'Minimal balans'}
          />
          <Input
            value={balanceMax}
            onChange={(e) => setBalanceMax(e.target.value)}
            className="w-[130px]"
            inputMode="numeric"
            placeholder={language === 'ru' ? 'Макс. баланс' : 'Maksimal balans'}
          />
          <Button variant="outline" onClick={resetFilters}>
            <FilterX className="mr-1 h-4 w-4" />
            {language === 'ru' ? 'Сбросить' : 'Tozalash'}
          </Button>
        </div>
      </SectionShell>

      {!isMaxcoinOnly ? (
      <SectionShell>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{language === 'ru' ? 'Рекламные операции' : 'Reklama operatsiyalari'}</h2>
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-500">
              {visiblePromotions.length}/{filteredPromotions.length} {language === 'ru' ? 'записей' : 'yozuv'}
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
          </div>
        </div>
        <Card className="overflow-hidden border-slate-200">
          {filteredPromotions.length === 0 ? (
            <CardContent className="py-12 text-center text-sm text-slate-500">
              {language === 'ru'
                ? 'По выбранным фильтрам реклама не найдена.'
                : "Tanlangan filtrlarga mos reklama topilmadi."}
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{language === 'ru' ? 'Реклама' : 'Reklama'}</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{language === 'ru' ? 'Размещение' : 'Joylashuv'}</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{language === 'ru' ? 'Статус' : 'Holat'}</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{language === 'ru' ? 'Период' : 'Muddat'}</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">MaxCoin</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {language === 'ru' ? 'Предупреждения' : 'Ogohlantirishlar'}
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 text-right">{language === 'ru' ? 'Действия' : 'Amallar'}</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePromotions.map((promotion) => {
                    const remainingLabel =
                      promotion.remainingDays == null
                        ? '—'
                        : promotion.remainingDays < 0
                          ? language === 'ru'
                            ? `Завершено ${Math.abs(promotion.remainingDays)} дн. назад`
                            : `${Math.abs(promotion.remainingDays)} kun oldin tugagan`
                          : language === 'ru'
                            ? `${promotion.remainingDays} дн. осталось`
                            : `${promotion.remainingDays} kun qoldi`;

                    return (
                      <tr key={promotion.id} className="border-b border-slate-100 align-top">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedPromotionId(promotion.id)}
                            className="group flex w-full items-start gap-3 text-left"
                          >
                            <Image
                              src={promotion.tour?.cover_image_url || placeholderImage(120, 90, language === 'ru' ? 'Тур' : 'Tur')}
                              alt={promotion.tour?.title ?? (language === 'ru' ? 'Тур' : 'Tur')}
                              width={56}
                              height={44}
                              className="h-11 w-14 rounded-lg object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-slate-900 group-hover:text-sky-700">
                                {promotion.tour?.title ?? (language === 'ru' ? 'Не указано' : 'Kiritilmagan')}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {promotion.agency?.name ?? (language === 'ru' ? 'Агентство не указано' : 'Agentlik kiritilmagan')}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-400">
                                {promotion.source === 'tour_promotion'
                                  ? (language === 'ru' ? 'Источник: реклама тура' : 'Manba: tur reklamasi')
                                  : (language === 'ru' ? 'Источник: рекомендуемая реклама' : 'Manba: tavsiya reklamasi')}
                              </p>
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{tInline(formatPlacementLabel(promotion.placement))}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getStatusBadgeVariant(promotion.status)}>
                            {localizeStatus(formatPromotionStatusLabel(promotion.status))}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          <p>{formatShortDate(promotion.starts_at)}</p>
                          <p>{formatShortDate(promotion.ends_at)}</p>
                          <p className="mt-1 text-slate-400">{remainingLabel}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {promotion.maxcoin_cost == null ? '—' : `${formatNumber(promotion.maxcoin_cost)} MC`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {language === 'ru' ? 'Заявки' : "So'rovlar"}: {formatNumber(promotion.lead_count)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {promotion.warnings.length === 0 ? (
                            <Badge variant="outline">{language === 'ru' ? 'Нет' : "Yo'q"}</Badge>
                          ) : (
                            <button
                              onClick={() => setSelectedPromotionId(promotion.id)}
                              className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700"
                            >
                              {promotion.warnings.length} {language === 'ru' ? 'предупреждений' : 'ogohlantirish'}
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
                              {tc('open')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!getTourPublicLink(promotion)}
                              onClick={() => {
                                const link = getTourPublicLink(promotion);
                                if (!link) return;
                                tryCopy(
                                  link,
                                  language === 'ru' ? 'Ссылка тура скопирована.' : 'Tur havolasi nusxalandi.',
                                  language === 'ru' ? 'Ошибка копирования.' : "Nusxalashda xatolik yuz berdi."
                                );
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
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <SectionShell>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{language === 'ru' ? 'Журнал MaxCoin' : 'MaxCoin jurnali'}</h2>
            <p className="text-xs text-slate-500">{filteredTransactions.length} {language === 'ru' ? 'записей' : 'yozuv'}</p>
          </div>
          <Card className="border-slate-200">
            {filteredTransactions.length === 0 ? (
              <CardContent className="py-10 text-center text-sm text-slate-500">
                {language === 'ru'
                  ? 'По выбранным фильтрам транзакции MaxCoin не найдены.'
                  : "Tanlangan filtrlarga mos MaxCoin tranzaksiyalari topilmadi."}
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
                      <p className="truncate font-medium text-slate-900">
                        {row.agency?.name ?? (language === 'ru' ? 'Агентство не указано' : 'Agentlik kiritilmagan')}
                      </p>
                      <p className="truncate text-xs text-slate-500">{row.type ? tInline(row.type) : (language === 'ru' ? 'Неизвестный тип' : "Noma'lum tur")}</p>
                      <p className="truncate text-xs text-slate-400">{row.description ?? (language === 'ru' ? 'Не указано' : 'Kiritilmagan')}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(row.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('font-semibold', row.amount >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                        {row.amount >= 0 ? '+' : ''}
                        {formatNumber(row.amount)} MC
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {language === 'ru' ? 'Баланс' : 'Balans'}: {row.agency?.maxcoin_balance == null ? '—' : `${formatNumber(row.agency.maxcoin_balance)} MC`}
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
            <h2 className="text-lg font-semibold text-slate-900">{language === 'ru' ? 'Балансы агентств' : 'Agentlik balanslari'}</h2>
            <p className="text-xs text-slate-500">{filteredAgencyBalances.length} {language === 'ru' ? 'агентств' : 'agentlik'}</p>
          </div>
          <Card className="border-slate-200">
            {filteredAgencyBalances.length === 0 ? (
              <CardContent className="py-10 text-center text-sm text-slate-500">
                {language === 'ru'
                  ? 'По текущему поиску и фильтрам баланса агентства не найдены.'
                  : "Joriy qidiruv va balans filtrlari bo'yicha agentlik topilmadi."}
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
                      <p className="text-xs text-slate-500">
                        {agency.responsible_person ?? agency.phone ?? (language === 'ru' ? 'Контакт не указан' : "Aloqa kiritilmagan")}
                      </p>
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
              <CardTitle className="text-base">
                {language === 'ru' ? 'Ожидающие заявки на MaxCoin' : "Kutilayotgan MaxCoin so'rovlari"}
              </CardTitle>
              <CardDescription>
                {language === 'ru'
                  ? 'Одобрение или отклонение существующих безопасных заявок на пополнение.'
                  : "Mavjud xavfsiz to'ldirish so'rovlarini tasdiqlash yoki rad etish."}
              </CardDescription>
            </CardHeader>
            {pendingCoinRequests.length === 0 ? (
              <CardContent className="pb-8 text-sm text-slate-500">
                {language === 'ru' ? 'Ожидающие заявки отсутствуют.' : "Kutilayotgan so'rovlar mavjud emas."}
              </CardContent>
            ) : (
              <CardContent className="space-y-2 pb-4">
                {pendingCoinRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {request.agency?.name ?? (language === 'ru' ? 'Агентство не указано' : 'Agentlik kiritilmagan')}
                      </p>
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
                        {language === 'ru' ? 'Отклонить' : 'Rad etish'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setPendingCoinAction({ requestId: request.id, action: 'approve' })}
                        disabled={processingCoinRequestId === request.id}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        {language === 'ru' ? 'Подтвердить' : 'Tasdiqlash'}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">{language === 'ru' ? 'Показатели качества данных' : "Ma'lumot sifati ko'rsatkichlari"}</CardTitle>
              <CardDescription>
                {language === 'ru'
                  ? 'Предупреждения формируются на основе реальных полей, без автоматической блокировки.'
                  : "Ogohlantirishlar real maydonlarga asoslanadi, avtomatik bloklash qo'llanmaydi."}
              </CardDescription>
            </CardHeader>
            {promotionWarnings.length === 0 ? (
              <CardContent className="pb-8 text-sm text-emerald-700">
                {language === 'ru'
                  ? 'Предупреждения по качеству рекламных данных не обнаружены.'
                  : "Reklama ma'lumotlarida sifat ogohlantirishlari topilmadi."}
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
                    <span>{localizePromotionWarning(warning.message)}</span>
                  </button>
                ))}
              </CardContent>
            )}
          </Card>
        </div>
      </SectionShell>

      {!isMaxcoinOnly && selectedPromotion ? (
        <Sheet open={Boolean(selectedPromotion)} onOpenChange={(open) => !open && setSelectedPromotionId(null)}>
        <SheetContent side="right" className="w-full max-w-3xl overflow-y-auto">
          {selectedPromotion ? (
            <div className="space-y-4 p-2">
              <SheetHeader className="px-0 pt-0">
                <SheetTitle className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-sky-600" />
                  {language === 'ru' ? 'Детали рекламы' : 'Reklama tafsilotlari'}
                </SheetTitle>
                <SheetDescription>
                  {language === 'ru'
                    ? 'Идентификатор, размещение, сроки, расходы MaxCoin, ссылки и контекст предупреждений.'
                    : "Identifikator, joylashuv, muddat, MaxCoin sarfi, havolalar va ogohlantirish konteksti."}
                </SheetDescription>
              </SheetHeader>

              <Card className="border-slate-200">
                <CardContent className="space-y-3 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(selectedPromotion.status)}>
                      {localizeStatus(formatPromotionStatusLabel(selectedPromotion.status))}
                    </Badge>
                    <Badge variant="outline">{tInline(formatPlacementLabel(selectedPromotion.placement))}</Badge>
                    <Badge variant="outline">
                      {selectedPromotion.source === 'tour_promotion'
                        ? (language === 'ru' ? 'Реклама тура' : 'Tur reklamasi')
                        : (language === 'ru' ? 'Рекомендуемая реклама' : 'Tavsiya reklamasi')}
                    </Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500">{language === 'ru' ? 'ID рекламы' : 'Reklama ID'}</p>
                      <p className="text-sm text-slate-900">{selectedPromotion.sourceId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">{language === 'ru' ? 'Создано' : 'Yaratilgan'}</p>
                      <p className="text-sm text-slate-900">{formatDateTime(selectedPromotion.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">{language === 'ru' ? 'Начало' : 'Boshlanish'}</p>
                      <p className="text-sm text-slate-900">{formatDateTime(selectedPromotion.starts_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">{language === 'ru' ? 'Окончание' : 'Tugash'}</p>
                      <p className="text-sm text-slate-900">{formatDateTime(selectedPromotion.ends_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">{language === 'ru' ? 'Длительность' : 'Muddat'}</p>
                      <p className="text-sm text-slate-900">
                        {selectedPromotion.durationDays == null
                          ? '—'
                          : language === 'ru'
                            ? `${selectedPromotion.durationDays} дн.`
                            : `${selectedPromotion.durationDays} kun`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">{language === 'ru' ? 'Стоимость MaxCoin' : 'MaxCoin narxi'}</p>
                      <p className="text-sm text-slate-900">
                        {selectedPromotion.maxcoin_cost == null
                          ? '—'
                          : `${formatNumber(selectedPromotion.maxcoin_cost)} MC`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{language === 'ru' ? 'Связанный тур' : "Bog'langan tur"}</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-4">
                  {!selectedPromotion.tour ? (
                    <p className="text-sm text-slate-500">
                      {language === 'ru' ? 'Для этой рекламы тур недоступен.' : 'Ushbu reklama uchun tur mavjud emas.'}
                    </p>
                  ) : (
                    <div className="flex gap-3">
                      <Image
                        src={selectedPromotion.tour.cover_image_url || placeholderImage(180, 120, language === 'ru' ? 'Тур' : 'Tur')}
                        alt={selectedPromotion.tour.title}
                        width={120}
                        height={84}
                        className="h-20 w-28 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{selectedPromotion.tour.title}</p>
                        <p className="text-xs text-slate-500">
                          {language === 'ru' ? 'Статус' : 'Holat'}: {selectedPromotion.tour.status ? localizeStatus(selectedPromotion.tour.status) : (language === 'ru' ? 'Не указано' : 'Kiritilmagan')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {language === 'ru' ? 'Просмотры' : "Ko'rishlar"}: {selectedPromotion.tour.view_count == null ? '—' : formatNumber(selectedPromotion.tour.view_count)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {language === 'ru' ? 'Заявки' : "So'rovlar"}: {formatNumber(selectedPromotion.lead_count)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedPromotion.tour_id ? (
                            <Link
                              href={`/admin/tours/${selectedPromotion.tour_id}`}
                              className={buttonVariants({ variant: 'outline', size: 'sm' })}
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              {language === 'ru' ? 'Тур в админке' : 'Admin turini ochish'}
                            </Link>
                          ) : null}
                          {getTourPublicLink(selectedPromotion) ? (
                            <Link
                              href={getTourPublicLink(selectedPromotion) ?? '#'}
                              target="_blank"
                              rel="noreferrer"
                              className={buttonVariants({ variant: 'outline', size: 'sm' })}
                            >
                              <ExternalLink className="mr-1 h-3.5 w-3.5" />
                              {language === 'ru' ? 'Публичный тур' : 'Ommaviy tur'}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{language === 'ru' ? 'Связанное агентство / Действия' : "Bog'langan agentlik / Amallar"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 py-0 pb-4">
                  {!selectedPromotion.agency ? (
                    <p className="text-sm text-slate-500">
                      {language === 'ru' ? 'Для этой рекламы агентство недоступно.' : 'Ushbu reklama uchun agentlik mavjud emas.'}
                    </p>
                  ) : (
                    <>
                      <div className="rounded-xl border border-slate-200 p-3">
                        <p className="font-semibold text-slate-900">{selectedPromotion.agency.name}</p>
                        <p className="text-xs text-slate-500">
                          {selectedPromotion.agency.responsible_person ?? selectedPromotion.agency.phone ?? (language === 'ru' ? 'Контакт не указан' : 'Aloqa kiritilmagan')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {language === 'ru' ? 'Баланс' : 'Balans'}: {selectedPromotion.agency.maxcoin_balance == null ? '—' : `${formatNumber(selectedPromotion.agency.maxcoin_balance)} MC`}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedAgencyId(selectedPromotion.agency!.id)}>
                            <Wallet className="mr-1 h-3.5 w-3.5" />
                            {language === 'ru' ? 'Детали MaxCoin агентства' : 'Agentlik MaxCoin tafsiloti'}
                          </Button>
                          <Link
                            href="/admin/agencies"
                            className={buttonVariants({ variant: 'outline', size: 'sm' })}
                          >
                            <Building2 className="mr-1 h-3.5 w-3.5" />
                            {language === 'ru' ? 'Панель агентств' : 'Agentliklar paneli'}
                          </Link>
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
                            tryCopy(
                              link,
                              language === 'ru' ? 'Ссылка рекламы скопирована.' : 'Reklama havolasi nusxalandi.',
                              language === 'ru' ? 'Ошибка копирования.' : "Nusxalashda xatolik yuz berdi."
                            );
                          }}
                        >
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          {language === 'ru' ? 'Скопировать ссылку рекламы' : 'Reklama havolasini nusxalash'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title={language === 'ru'
                            ? 'В текущем коде нет безопасной админ-мутации для отмены.'
                            : "Joriy kodda bekor qilish uchun xavfsiz admin mutatsiyasi yo'q."}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          {language === 'ru' ? 'Отмена рекламы (недоступно)' : 'Reklamani bekor qilish (mavjud emas)'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title={language === 'ru'
                            ? 'В текущем коде нет безопасной админ-мутации для принудительного завершения.'
                            : "Joriy kodda majburiy tugatish uchun xavfsiz admin mutatsiyasi yo'q."}
                        >
                          <Timer className="mr-1 h-3.5 w-3.5" />
                          {language === 'ru' ? 'Завершить сейчас (недоступно)' : 'Hozir tugatish (mavjud emas)'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title={language === 'ru'
                            ? 'В текущем коде нет безопасной админ-мутации для продления.'
                            : "Joriy kodda uzaytirish uchun xavfsiz admin mutatsiyasi yo'q."}
                        >
                          <CalendarDays className="mr-1 h-3.5 w-3.5" />
                          {language === 'ru' ? 'Продлить кампанию (недоступно)' : 'Kampaniyani uzaytirish (mavjud emas)'}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{language === 'ru' ? 'Предупреждения' : 'Ogohlantirishlar'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 py-0 pb-4">
                  {selectedPromotion.warnings.length === 0 ? (
                    <p className="text-sm text-emerald-700">
                      {language === 'ru' ? 'Активных предупреждений нет.' : 'Faol ogohlantirishlar yoʻq.'}
                    </p>
                  ) : (
                    selectedPromotion.warnings.map((warning) => (
                      <div key={warning} className="rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs text-rose-800">
                        {localizePromotionWarning(warning)}
                      </div>
                    ))
                  )}
                  <Separator />
                  <p className="text-xs text-slate-500">
                    {language === 'ru'
                      ? 'Эти элементы доступны только для чтения. Алгоритм ротации и RPC-логика размещений намеренно не изменялись.'
                      : "Bu boshqaruvlar faqat o'qish rejimida. Joylashuv rotatsiyasi algoritmi va RPC logikasi ataylab o'zgartirilmadi."}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </SheetContent>
        </Sheet>
      ) : null}

      {selectedAgency ? (
        <Sheet open={Boolean(selectedAgency)} onOpenChange={(open) => !open && setSelectedAgencyId(null)}>
        <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto">
          {selectedAgency ? (
            <div className="space-y-4 p-2">
              <SheetHeader className="px-0 pt-0">
                <SheetTitle className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-sky-600" />
                  {language === 'ru' ? 'Детали MaxCoin агентства' : 'Agentlik MaxCoin tafsiloti'}
                </SheetTitle>
                <SheetDescription>
                  {language === 'ru'
                    ? 'Баланс агентства, последние транзакции, активная реклама и расходы по размещениям.'
                    : "Agentlik balansi, so'nggi tranzaksiyalar, faol reklamalar va joylashuv bo'yicha sarf."}
                </SheetDescription>
              </SheetHeader>

              <Card className="border-slate-200">
                <CardContent className="grid gap-3 py-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500">{language === 'ru' ? 'Агентство' : 'Agentlik'}</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedAgency.name}</p>
                    <p className="text-xs text-slate-500">
                      {selectedAgency.responsible_person ?? selectedAgency.phone ?? (language === 'ru' ? 'Не указано' : 'Kiritilmagan')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">{language === 'ru' ? 'Текущий баланс' : 'Joriy balans'}</p>
                    <p className={cn('text-xl font-bold', selectedAgency.maxcoin_balance < maxcoinStats.lowBalanceThreshold ? 'text-orange-700' : 'text-slate-900')}>
                      {formatNumber(selectedAgency.maxcoin_balance)} MC
                    </p>
                    {selectedAgency.maxcoin_balance < maxcoinStats.lowBalanceThreshold ? (
                      <p className="text-xs text-orange-700">
                        {language === 'ru' ? 'Предупреждение: низкий баланс' : 'Ogohlantirish: past balans'}
                      </p>
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <Link
                      href="/admin/agencies"
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex')}
                    >
                      <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                      {language === 'ru' ? 'Открыть агентства' : 'Agentliklarni ochish'}
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{language === 'ru' ? 'Активная реклама' : 'Faol reklamalar'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 py-0 pb-4">
                  {selectedAgencyActivePromotions.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      {language === 'ru' ? 'Для этого агентства реклама не найдена.' : 'Ushbu agentlik uchun reklama topilmadi.'}
                    </p>
                  ) : (
                    selectedAgencyActivePromotions.slice(0, 20).map((promotion) => (
                      <button
                        key={promotion.id}
                        onClick={() => setSelectedPromotionId(promotion.id)}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:border-sky-200"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {promotion.tour?.title ?? (language === 'ru' ? 'Тур не указан' : 'Tur kiritilmagan')}
                          </p>
                          <p className="text-xs text-slate-500">{tInline(formatPlacementLabel(promotion.placement))}</p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(promotion.status)}>
                          {localizeStatus(formatPromotionStatusLabel(promotion.status))}
                        </Badge>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{language === 'ru' ? 'Расход по размещениям' : 'Joylashuv bo‘yicha sarf'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 py-0 pb-4">
                  {selectedAgencySpendByPlacement.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      {language === 'ru'
                        ? 'По текущим данным расходов информация недоступна.'
                        : "Joriy xarajat yozuvlari bo'yicha ma'lumot mavjud emas."}
                    </p>
                  ) : (
                    selectedAgencySpendByPlacement.map((item) => (
                      <div key={item.placement} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                        <p className="text-sm text-slate-700">{tInline(formatPlacementLabel(item.placement))}</p>
                        <p className="text-sm font-semibold text-slate-900">{formatNumber(item.total)} MC</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{language === 'ru' ? 'Последние транзакции' : "So'nggi tranzaksiyalar"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 py-0 pb-4">
                  {selectedAgencyTransactions.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      {language === 'ru'
                        ? 'История транзакций для этого агентства недоступна.'
                        : 'Ushbu agentlik uchun tranzaksiya tarixi mavjud emas.'}
                    </p>
                  ) : (
                    selectedAgencyTransactions.map((row) => (
                      <div key={row.id} className="rounded-xl border border-slate-200 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-slate-900">{row.type ? tInline(row.type) : (language === 'ru' ? 'Неизвестный тип' : "Noma'lum tur")}</p>
                          <p className={cn('text-sm font-semibold', row.amount >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                            {row.amount >= 0 ? '+' : ''}
                            {formatNumber(row.amount)} MC
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {row.description ?? (language === 'ru' ? 'Описание не указано' : 'Tavsif kiritilmagan')}
                        </p>
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
      ) : null}

      <Dialog open={Boolean(pendingCoinAction)} onOpenChange={(open) => !open && setPendingCoinAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingCoinAction?.action === 'approve'
                ? language === 'ru'
                  ? 'Подтвердить заявку MaxCoin?'
                  : "MaxCoin so'rovini tasdiqlaysizmi?"
                : language === 'ru'
                  ? 'Отклонить заявку MaxCoin?'
                  : "MaxCoin so'rovini rad etasizmi?"}
            </DialogTitle>
            <DialogDescription>
              {language === 'ru'
                ? 'Действие использует существующую безопасную серверную логику. Статус заявки будет обновлен, панель перезагрузится.'
                : "Amal mavjud xavfsiz server logikasidan foydalanadi. So'rov holati yangilanadi va panel yangilanadi."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingCoinAction(null)}>
              {tc('cancel')}
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
              {pendingCoinAction?.action === 'approve'
                ? language === 'ru'
                  ? 'Подтвердить'
                  : 'Tasdiqlash'
                : language === 'ru'
                  ? 'Отклонить'
                  : 'Rad etish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
