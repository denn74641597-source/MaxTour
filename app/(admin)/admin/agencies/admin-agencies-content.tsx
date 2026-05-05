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
import { useAdminI18n } from '@/features/admin/i18n';
import { useDebouncedValue } from '@/features/admin/use-debounced-value';
import { approveVerificationAction, rejectVerificationAction } from '@/features/verification/admin-actions';
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
type AgencyDetailTab = 'general' | 'contacts' | 'verification' | 'tours' | 'leads' | 'activity';

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
  if (!value) return '—';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return '—';
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
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

function formatRelativeActivity(lastActivityAt: string | null, language: 'uz' | 'ru'): string {
  if (!lastActivityAt) return language === 'ru' ? 'Нет активности' : 'Faollik yoʻq';
  const ms = new Date(lastActivityAt).getTime();
  if (!Number.isFinite(ms)) return language === 'ru' ? 'Нет активности' : 'Faollik yoʻq';
  const delta = Date.now() - ms;
  const hours = Math.floor(delta / (60 * 60 * 1000));
  if (hours < 1) return language === 'ru' ? 'Сейчас активен' : 'Hozir faol';
  if (hours < 24) return language === 'ru' ? `${hours} ч. назад` : `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days < 30) return language === 'ru' ? `${days} дн. назад` : `${days} kun oldin`;
  const months = Math.floor(days / 30);
  return language === 'ru' ? `${months} мес. назад` : `${months} oy oldin`;
}

function verificationTone(status: AdminVerificationStatus | null): string {
  if (status === 'pending') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'approved') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'rejected') return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function verificationLabel(status: AdminVerificationStatus | null, language: 'uz' | 'ru'): string {
  if (status === 'pending') return language === 'ru' ? 'Ожидает верификацию' : 'Tasdiqlash kutilmoqda';
  if (status === 'approved') return language === 'ru' ? 'Верификация подтверждена' : 'Tasdiqlash maʼqullangan';
  if (status === 'rejected') return language === 'ru' ? 'Верификация отклонена' : 'Tasdiqlash rad etilgan';
  return language === 'ru' ? 'Заявка не отправлена' : 'Soʻrov yuborilmagan';
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
  const { language, tInline, localizeStatus } = useAdminI18n();

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
  const [selectedTab, setSelectedTab] = useState<AgencyDetailTab>('general');
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

  async function openAgencyDetail(agency: AdminAgencyListRow, tab: AgencyDetailTab = 'general') {
    setSelectedAgencyId(agency.id);
    setSelectedTab(tab);
    setDetailError(null);

    if (detailCache[agency.id]) return;

    setDetailLoadingId(agency.id);
    const result = await getAdminAgencyDetailAction(agency.id);
    setDetailLoadingId(null);

    if (result.error || !result.data) {
      setDetailError(
        result.error ??
          (language === 'ru'
            ? 'Не удалось загрузить детали агентства.'
            : "Agentlik tafsilotlarini yuklab bo'lmadi.")
      );
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
      toast.error(tInline('Agentlik tasdiq holatini yangilab bo‘lmadi.'));
      return;
    }

    toast.success(nextApproved ? tInline('Agentlik tasdiqlandi.') : tInline('Agentlik rad etildi.'));
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
      toast.error(tInline('Tasdiqlash so‘rovini yangilab bo‘lmadi.'));
      return;
    }

    toast.success(action === 'approve' ? tInline('Tasdiqlash maʼqullandi.') : tInline('Tasdiqlash rad etildi.'));
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
      toast.error(`${label}: ${tInline('mavjud emas')}`);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label}: ${tInline('nusxalandi')}`);
    } catch {
      toast.error(`${tInline('Nusxalab bo‘lmadi')}: ${label.toLowerCase()}`);
    }
  }

  const isActionBusy = processingActionKey !== null;

  return (
    <SectionShell className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle
          title={language === 'ru' ? 'Агентства' : 'Agentliklar'}
          subtitle={
            language === 'ru'
              ? 'Онбординг, верификация, показатели и модерация агентств'
              : 'Agentliklarni ishga tushirish, tasdiqlash, samaradorlik va moderatsiya'
          }
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
            {language === 'ru' ? 'Обновить' : 'Yangilash'}
          </Button>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
            {language === 'ru' ? 'Обновлено:' : 'Oxirgi yangilanish:'}{' '}
            <span className="font-medium text-slate-900">{formatDateTime(lastUpdatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard title={language === 'ru' ? 'Всего агентств' : 'Jami agentliklar'} value={overviewStats.total} tone="default" />
        <MetricCard title={language === 'ru' ? 'Ожидают верификацию' : 'Tasdiqlash kutilmoqda'} value={overviewStats.pendingVerification} tone="warning" />
        <MetricCard title={language === 'ru' ? 'Верифицированы' : 'Tasdiqlangan'} value={overviewStats.verified} tone="success" />
        <MetricCard title={language === 'ru' ? 'Отклонены / не подтверждены' : 'Rad etilgan / tasdiqlanmagan'} value={overviewStats.restricted} tone="danger" />
        <MetricCard title={language === 'ru' ? 'С активными турами' : 'Faol turlari bor'} value={overviewStats.activeTours} tone="info" />
        <MetricCard title={language === 'ru' ? 'Неполный профиль' : 'Profil maʼlumotlari yetishmaydi'} value={overviewStats.missingData} tone="warning" />
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white py-3">
        <CardContent className="space-y-3 px-4">
          <div className="grid gap-2 xl:grid-cols-[1.3fr_repeat(6,minmax(0,1fr))]">
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  language === 'ru'
                    ? 'Поиск: название, менеджер, телефон, email, город...'
                    : 'Qidiruv: nomi, menejer, telefon, email, shahar...'
                }
                className="h-9 pl-8"
              />
            </div>

            <Select value={approvalFilter} onValueChange={(value) => setApprovalFilter(value as ApprovalFilter)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder={language === 'ru' ? 'Подтверждение' : 'Tasdiqlash'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ru' ? 'Все' : 'Barchasi'}</SelectItem>
                <SelectItem value="approved">{language === 'ru' ? 'Подтверждены' : 'Tasdiqlangan'}</SelectItem>
                <SelectItem value="pending_approval">{language === 'ru' ? 'Ожидают подтверждения' : 'Tasdiq kutilmoqda'}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={verificationFilter} onValueChange={(value) => setVerificationFilter(value as VerificationFilter)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder={language === 'ru' ? 'Верификация' : 'Verifikatsiya'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ru' ? 'Все' : 'Barchasi'}</SelectItem>
                <SelectItem value="verified">{language === 'ru' ? 'С бейджем верификации' : 'Tasdiqlangan belgi bor'}</SelectItem>
                <SelectItem value="pending">{language === 'ru' ? 'Ожидающие заявки' : 'Kutilayotgan soʻrovlar'}</SelectItem>
                <SelectItem value="rejected">{language === 'ru' ? 'Отклоненные заявки' : 'Rad etilgan soʻrovlar'}</SelectItem>
                <SelectItem value="not_requested">{language === 'ru' ? 'Без заявки' : 'Soʻrov yoʻq'}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={subscriptionFilter} onValueChange={(value) => setSubscriptionFilter(value ?? 'all')}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder={language === 'ru' ? 'Подписка' : 'Obuna'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ru' ? 'Все подписки' : 'Barcha obunalar'}</SelectItem>
                <SelectItem value="none">{language === 'ru' ? 'Без подписки' : 'Obuna yoʻq'}</SelectItem>
                {subscriptionOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {localizeStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={(value) => setCityFilter(value ?? 'all')}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder={language === 'ru' ? 'Город' : 'Shahar'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ru' ? 'Все города' : 'Barcha shaharlar'}</SelectItem>
                {cityOptions.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={activityFilter} onValueChange={(value) => setActivityFilter(value as ActivityFilter)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder={language === 'ru' ? 'Активность' : 'Faollik'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ru' ? 'Вся активность' : 'Barcha faollik'}</SelectItem>
                <SelectItem value="active_30d">{language === 'ru' ? 'Активные (30д)' : 'Faol (30 kun)'}</SelectItem>
                <SelectItem value="quiet_30d">{language === 'ru' ? 'Тихие (31-90д)' : 'Sokin (31-90 kun)'}</SelectItem>
                <SelectItem value="dormant_90d">{language === 'ru' ? 'Спящие (90д+)' : 'Sust (90 kun+)'}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={hasToursFilter} onValueChange={(value) => setHasToursFilter(value as HasToursFilter)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder={language === 'ru' ? 'Туры' : 'Turlar'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ru' ? 'Любые' : 'Barchasi'}</SelectItem>
                <SelectItem value="has_tours">{language === 'ru' ? 'Есть туры' : 'Turlari bor'}</SelectItem>
                <SelectItem value="no_tours">{language === 'ru' ? 'Без туров' : 'Tursiz'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
            <Input
              type="date"
              value={createdFrom}
              onChange={(event) => setCreatedFrom(event.target.value)}
              className="h-9"
              aria-label={language === 'ru' ? 'Дата создания с' : 'Yaratilgan sanadan'}
            />
            <Input
              type="date"
              value={createdTo}
              onChange={(event) => setCreatedTo(event.target.value)}
              className="h-9"
              aria-label={language === 'ru' ? 'Дата создания по' : 'Yaratilgan sanagacha'}
            />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="h-9 w-full">
                <ArrowUpDown />
                <SelectValue placeholder={language === 'ru' ? 'Сортировка' : 'Saralash'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{language === 'ru' ? 'Сначала новые' : 'Avval yangi'}</SelectItem>
                <SelectItem value="oldest">{language === 'ru' ? 'Сначала старые' : 'Avval eski'}</SelectItem>
                <SelectItem value="most_tours">{language === 'ru' ? 'Больше туров' : 'Koʻp turlar'}</SelectItem>
                <SelectItem value="pending_verification">{language === 'ru' ? 'Сначала верификация' : 'Avval verifikatsiya'}</SelectItem>
                <SelectItem value="most_active">{language === 'ru' ? 'Самые активные' : 'Eng faol'}</SelectItem>
              </SelectContent>
            </Select>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {language === 'ru' ? 'Показано' : 'Koʻrsatilgan'}{' '}
              <span className="font-semibold text-slate-900">{visibleAgencies.length}</span>{' '}
              {language === 'ru' ? 'из' : 'dan'}{' '}
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
              {language === 'ru' ? 'Сбросить фильтры' : 'Filtrlarni tozalash'}
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
              {language === 'ru' ? 'Повторить' : 'Qayta urinish'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border border-slate-200 bg-white py-2">
        <CardContent className="px-2">
          {filteredAgencies.length === 0 ? (
            <div className="flex min-h-[340px] flex-col items-center justify-center gap-2 text-center">
              <CircleSlash className="h-10 w-10 text-slate-300" />
              <h3 className="text-base font-semibold text-slate-800">
                {language === 'ru'
                  ? 'По текущим фильтрам агентства не найдены'
                  : 'Joriy filtrlarga mos agentlik topilmadi'}
              </h3>
              <p className="max-w-md text-sm text-slate-500">
                {language === 'ru'
                  ? 'Измените параметры поиска или фильтры.'
                  : 'Qidiruv yoki filtr qiymatlarini o‘zgartirib ko‘ring.'}
              </p>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                {language === 'ru' ? 'Сбросить фильтры' : 'Filtrlarni tozalash'}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">{language === 'ru' ? 'Агентство' : 'Agentlik'}</th>
                    <th className="px-3 py-3">{language === 'ru' ? 'Контакты' : 'Aloqa'}</th>
                    <th className="px-3 py-3">{language === 'ru' ? 'Локация' : 'Joylashuv'}</th>
                    <th className="px-3 py-3">{language === 'ru' ? 'Верификация' : 'Tasdiqlash'}</th>
                    <th className="px-3 py-3">{language === 'ru' ? 'Подписка' : 'Obuna'}</th>
                    <th className="px-3 py-3">{language === 'ru' ? 'Метрики' : 'Ko‘rsatkichlar'}</th>
                    <th className="px-3 py-3">{language === 'ru' ? 'Создано' : 'Yaratilgan'}</th>
                    <th className="px-3 py-3">{language === 'ru' ? 'Активность' : 'Faollik'}</th>
                    <th className="px-3 py-3 text-right">{language === 'ru' ? 'Действия' : 'Amallar'}</th>
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
                                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                    {language === 'ru' ? 'Подтверждено' : 'Tasdiqlangan'}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                    {language === 'ru' ? 'Ожидает подтверждения' : 'Tasdiq kutilmoqda'}
                                  </Badge>
                                )}
                                {agency.stats.missingFieldCount > 0 ? (
                                  <button
                                    type="button"
                                    className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openAgencyDetail(agency, 'activity');
                                    }}
                                  >
                                    {agency.stats.missingFieldCount} {language === 'ru' ? 'пустых полей' : 'bo‘sh maydon'}
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
                              {agency.phone ?? (language === 'ru' ? 'Не указано' : 'Kiritilmagan')}
                            </p>
                            <p className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-slate-400" />
                              {agency.owner?.email ?? (language === 'ru' ? 'Не указано' : 'Kiritilmagan')}
                            </p>
                            <p className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-slate-400" />
                              {agency.owner?.full_name ?? (language === 'ru' ? 'Не указано' : 'Kiritilmagan')}
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <p className="text-sm font-medium text-slate-800">
                            {agency.city ? `${agency.city}, ${agency.country}` : agency.country}
                          </p>
                          <p className="text-xs text-slate-500">{agency.address ?? (language === 'ru' ? 'Адрес не указан' : 'Manzil kiritilmagan')}</p>
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
                              {verificationLabel(agency.verification.latestStatus, language)}
                            </button>
                            <p className="text-xs text-slate-500">
                              {agency.is_verified
                                ? language === 'ru'
                                  ? 'Знак: верифицировано'
                                  : 'Belgi: tasdiqlangan'
                                : language === 'ru'
                                  ? 'Знак: не верифицировано'
                                  : 'Belgi: tasdiqlanmagan'}
                            </p>
                            {pendingRequest ? (
                              <p className="text-xs font-medium text-amber-700">
                                {language === 'ru' ? 'Требуется решение администратора' : 'Admin qarori talab qilinadi'}
                              </p>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top">
                          {agency.subscription ? (
                            <div className="space-y-1">
                              <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                                {localizeStatus(agency.subscription.status)}
                              </Badge>
                              <p className="text-xs text-slate-600">
                                {agency.subscription.plan?.name ?? (language === 'ru' ? 'Тариф не связан' : 'Tarif ulanmagan')}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">{language === 'ru' ? 'Недоступно' : 'Mavjud emas'}</span>
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
                              {language === 'ru' ? 'Туры' : 'Turlar'}: {formatNumber(agency.stats.totalTours)}
                            </button>
                            <p className="text-slate-500">
                              {language === 'ru' ? 'Опубликовано' : 'Nashr etilgan'}: {formatNumber(agency.stats.publishedTours)}
                            </p>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openAgencyDetail(agency, 'leads');
                              }}
                              className="font-medium text-slate-800 hover:text-blue-600"
                            >
                              {language === 'ru' ? 'Заявки' : 'So‘rovlar'}: {formatNumber(agency.stats.totalLeads)}
                            </button>
                            <p className="text-slate-500">
                              {language === 'ru' ? 'Заявки за 30д' : '30 kundagi so‘rovlar'}: {formatNumber(agency.stats.recentLeads30d)}
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top text-xs text-slate-600">
                          <p>{formatDate(agency.created_at)}</p>
                          <p className="text-slate-500">{formatDateTime(agency.created_at)}</p>
                        </td>

                        <td className="px-3 py-3 align-top text-xs text-slate-600">
                          <p className="font-medium text-slate-800">{formatRelativeActivity(agency.stats.lastActivityAt, language)}</p>
                          <p className="text-slate-500">{formatDateTime(agency.stats.lastActivityAt)}</p>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <div className="flex items-center justify-end gap-1.5" onClick={(event) => event.stopPropagation()}>
                            <Button size="sm" variant="outline" onClick={() => openAgencyDetail(agency)}>
                              <Eye />
                              {language === 'ru' ? 'Открыть' : 'Ochish'}
                            </Button>
                            <Button
                              size="sm"
                              variant={agency.is_approved ? 'destructive' : 'default'}
                              onClick={() => setApprovalIntent({ agency, nextApproved: !agency.is_approved })}
                              disabled={isActionBusy}
                            >
                              {agency.is_approved ? <XCircle /> : <CheckCircle2 />}
                              {agency.is_approved
                                ? language === 'ru'
                                  ? 'Отклонить'
                                  : 'Rad etish'
                                : language === 'ru'
                                  ? 'Подтвердить'
                                  : 'Tasdiqlash'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyValue(agency.phone ?? agency.owner?.email, language === 'ru' ? 'Контакт' : 'Aloqa')}
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
        <Dialog
          open={Boolean(selectedAgencyId)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedAgencyId(null);
              setDetailError(null);
            }
          }}
        >
          <DialogContent className="h-[88vh] w-[96vw] max-w-6xl overflow-hidden p-0">
            <div className="flex h-full flex-col bg-white">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <AgencyAvatar name={selectedAgency.name} logoUrl={selectedAgency.logo_url} className="h-14 w-14" />
                    <div className="min-w-0 space-y-1">
                      <DialogTitle className="truncate text-xl font-semibold text-slate-900">{selectedAgency.name}</DialogTitle>
                      <DialogDescription className="text-sm text-slate-500">/{selectedAgency.slug}</DialogDescription>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <Badge
                          variant="outline"
                          className={
                            selectedAgency.is_approved
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-amber-200 bg-amber-50 text-amber-700'
                          }
                        >
                          {selectedAgency.is_approved ? tInline('Tasdiqlangan') : tInline('Tasdiqlash kutilmoqda')}
                        </Badge>
                        <Badge variant="outline" className={verificationTone(selectedAgency.verification.latestStatus)}>
                          {verificationLabel(selectedAgency.verification.latestStatus, language)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <Button
                    variant={selectedAgency.is_approved ? 'destructive' : 'default'}
                    onClick={() => setApprovalIntent({ agency: selectedAgency, nextApproved: !selectedAgency.is_approved })}
                    disabled={isActionBusy}
                  >
                    {selectedAgency.is_approved ? <XCircle /> : <CheckCircle2 />}
                    {selectedAgency.is_approved ? tInline('Agentlikni rad etish') : tInline('Agentlikni tasdiqlash')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyValue(selectedAgency.phone ?? selectedAgency.owner?.email, tInline('Asosiy aloqa'))}
                  >
                    <Copy />
                    {tInline('Aloqani nusxalash')}
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/admin/tours')}>
                    <Building2 />
                    {tInline('Turlar roʻyxatini ochish')}
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/admin/leads')}>
                    <Building2 />
                    {tInline('Soʻrovlar roʻyxatini ochish')}
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
                    {tInline('Ommaviy profilni ochish')}
                  </Button>
                  <Button variant="ghost" disabled>
                    <CircleSlash />
                    {tInline('Toʻxtatish mavjud emas')}
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
                        {tInline('Qayta urinish')}
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
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      <Dialog open={Boolean(approvalIntent)} onOpenChange={(open) => !open && setApprovalIntent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalIntent?.nextApproved
                ? tInline('Agentlikni tasdiqlaysizmi?')
                : tInline('Agentlikni rad etasizmi?')}
            </DialogTitle>
            <DialogDescription>
              {approvalIntent
                ? `${approvalIntent.agency.name}: ${tInline('agentlik tasdiq holati yangilanadi.')}`
                : tInline('Agentlik tasdiq holatini yangilashni tasdiqlang.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalIntent(null)} disabled={isActionBusy}>
              {tInline('Bekor qilish')}
            </Button>
            <Button
              variant={approvalIntent?.nextApproved ? 'default' : 'destructive'}
              onClick={executeApprovalAction}
              disabled={isActionBusy}
            >
              {isActionBusy ? <Loader2 className="animate-spin" /> : null}
              {tInline('Tasdiqlash')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(verificationIntent)} onOpenChange={(open) => !open && setVerificationIntent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verificationIntent?.action === 'approve'
                ? tInline('Tasdiqlash soʻrovini maʼqullaysizmi?')
                : tInline('Tasdiqlash soʻrovini rad etasizmi?')}
            </DialogTitle>
            <DialogDescription>
              {verificationIntent?.action === 'approve'
                ? tInline('Soʻrov tasdiqlanadi va agentlik verifikatsiya belgisi yoqiladi.')
                : tInline('Soʻrov rad etiladi va agentlik verifikatsiya belgisi olib tashlanadi.')}
            </DialogDescription>
          </DialogHeader>

          {verificationIntent?.action === 'reject' ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">{tInline('Admin izohi (ixtiyoriy)')}</p>
              <Textarea
                value={verificationRejectNote}
                onChange={(event) => setVerificationRejectNote(event.target.value)}
                placeholder={tInline('Audit tarixi uchun rad etish sababini kiriting')}
                className="min-h-24"
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setVerificationIntent(null)} disabled={isActionBusy}>
              {tInline('Bekor qilish')}
            </Button>
            <Button
              variant={verificationIntent?.action === 'approve' ? 'default' : 'destructive'}
              onClick={executeVerificationAction}
              disabled={isActionBusy}
            >
              {isActionBusy ? <Loader2 className="animate-spin" /> : null}
              {tInline('Tasdiqlash')}
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
  activeTab: AgencyDetailTab;
  onTabChange: (tab: AgencyDetailTab) => void;
  onCopy: (value: string | null | undefined, label: string) => Promise<void>;
  onApproveVerification: (requestId: string) => void;
  onRejectVerification: (requestId: string) => void;
}) {
  const { language, localizeStatus } = useAdminI18n();
  const tours = detail?.tours ?? [];
  const leads = detail?.leads ?? [];
  const verificationRequests = detail?.verificationRequests ?? [];
  const subscriptions = detail?.subscriptions ?? [];
  const maxcoinTransactions = detail?.maxcoinTransactions ?? [];
  const promotions = detail?.promotions ?? [];
  const notProvided = language === 'ru' ? 'Не указано' : 'Kiritilmagan';
  const notAvailable = language === 'ru' ? 'Недоступно' : 'Mavjud emas';
  const tabLabels = language === 'ru'
    ? {
        general: 'Общее',
        contacts: 'Контакты',
        verification: 'Верификация',
        tours: 'Туры',
        leads: 'Заявки',
        activity: 'Активность',
      }
    : {
        general: 'Umumiy',
        contacts: 'Aloqa',
        verification: 'Tasdiqlash',
        tours: 'Turlar',
        leads: "So'rovlar",
        activity: 'Faollik',
      };

  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as AgencyDetailTab)} className="space-y-4">
      <TabsList className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 md:grid-cols-6">
        <TabsTrigger value="general">{tabLabels.general}</TabsTrigger>
        <TabsTrigger value="contacts">{tabLabels.contacts}</TabsTrigger>
        <TabsTrigger value="verification">{tabLabels.verification}</TabsTrigger>
        <TabsTrigger value="tours">{tabLabels.tours}</TabsTrigger>
        <TabsTrigger value="leads">{tabLabels.leads}</TabsTrigger>
        <TabsTrigger value="activity">{tabLabels.activity}</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="grid gap-3 px-4 sm:grid-cols-2">
            <InfoLine icon={<Building2 className="h-4 w-4" />} label={language === 'ru' ? 'Агентство' : 'Agentlik'} value={agency.name} />
            <InfoLine icon={<Building2 className="h-4 w-4" />} label="Slug" value={agency.slug} />
            <InfoLine icon={<MapPin className="h-4 w-4" />} label={language === 'ru' ? 'Локация' : 'Joylashuv'} value={agency.city ? `${agency.city}, ${agency.country}` : agency.country ?? notAvailable} />
            <InfoLine icon={<Calendar className="h-4 w-4" />} label={language === 'ru' ? 'Создано' : 'Yaratilgan'} value={formatDateTime(agency.created_at)} />
            <InfoLine icon={<Calendar className="h-4 w-4" />} label={language === 'ru' ? 'Активность' : 'Faollik'} value={formatRelativeActivity(agency.stats.lastActivityAt, language)} />
            <InfoLine icon={<ShieldCheck className="h-4 w-4" />} label={language === 'ru' ? 'Верификация' : 'Tasdiqlash'} value={verificationLabel(agency.verification.latestStatus, language)} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="grid gap-3 px-4 sm:grid-cols-3">
            <MiniMetric label={language === 'ru' ? 'Туры' : 'Turlar'} value={agency.stats.totalTours} />
            <MiniMetric label={language === 'ru' ? 'Заявки' : "So'rovlar"} value={agency.stats.totalLeads} />
            <MiniMetric label={language === 'ru' ? 'Просмотры профиля' : "Profil ko'rishlari"} value={agency.profile_views} />
            <MiniMetric label={language === 'ru' ? 'Рейтинг' : 'Reyting'} value={agency.avg_rating} />
            <MiniMetric label={language === 'ru' ? 'Отзывы' : 'Sharhlar'} value={agency.review_count} />
            <MiniMetric label={language === 'ru' ? 'Баланс MaxCoin' : 'MaxCoin balansi'} value={agency.maxcoin_balance} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="contacts" className="space-y-4">
        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="grid gap-3 px-4 sm:grid-cols-2">
            <InfoLine
              icon={<Phone className="h-4 w-4" />}
              label={language === 'ru' ? 'Телефон' : 'Telefon'}
              value={agency.phone ?? notProvided}
              onCopy={() => onCopy(agency.phone, language === 'ru' ? 'Телефон' : 'Telefon')}
            />
            <InfoLine
              icon={<Mail className="h-4 w-4" />}
              label={language === 'ru' ? 'Email владельца' : 'Egasi emaili'}
              value={agency.owner?.email ?? notProvided}
              onCopy={() => onCopy(agency.owner?.email, language === 'ru' ? 'Email' : 'Email')}
            />
            <InfoLine
              icon={<Building2 className="h-4 w-4" />}
              label={language === 'ru' ? 'Менеджер' : 'Menejer'}
              value={agency.owner?.full_name ?? notProvided}
            />
            <InfoLine
              icon={<Building2 className="h-4 w-4" />}
              label={language === 'ru' ? 'Ответственный' : "Mas'ul shaxs"}
              value={agency.responsible_person ?? notProvided}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-2 px-4 text-sm text-slate-700">
            <p><span className="font-medium">Telegram:</span> {agency.telegram_username ?? agency.owner?.telegram_username ?? notProvided}</p>
            <p><span className="font-medium">INN:</span> {agency.inn ?? notProvided}</p>
            <p><span className="font-medium">{language === 'ru' ? 'Адрес' : 'Manzil'}:</span> {agency.address ?? notProvided}</p>
            <p><span className="font-medium">{language === 'ru' ? 'Сайт' : 'Veb-sayt'}:</span> {agency.website_url ?? notProvided}</p>
            <p><span className="font-medium">Instagram:</span> {agency.instagram_url ?? notProvided}</p>
            <p><span className="font-medium">Google Maps:</span> {agency.google_maps_url ?? notProvided}</p>
            <p><span className="font-medium">{language === 'ru' ? 'Описание' : 'Tavsif'}:</span> {agency.description ?? notProvided}</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="verification" className="space-y-4">
        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-3 px-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={verificationTone(agency.verification.latestStatus)}>
                {verificationLabel(agency.verification.latestStatus, language)}
              </Badge>
              <Badge variant="outline" className={agency.is_verified ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}>
                {agency.is_verified
                  ? language === 'ru'
                    ? 'Знак: подтверждено'
                    : 'Belgi: tasdiqlangan'
                  : language === 'ru'
                    ? 'Знак: не подтверждено'
                    : 'Belgi: tasdiqlanmagan'}
              </Badge>
            </div>
            <p className="text-sm text-slate-600">{language === 'ru' ? 'Последняя отправка' : 'Oxirgi yuborilgan'}: {formatDateTime(agency.verification.latestSubmittedAt)}</p>
            <p className="text-sm text-slate-600">{language === 'ru' ? 'Комментарий администратора' : 'Admin izohi'}: {agency.verification.latestAdminNote ?? notAvailable}</p>
            <div className="flex flex-wrap gap-2">
              {agency.verification.latestRequestId && agency.verification.latestStatus === 'pending' ? (
                <>
                  <Button size="sm" onClick={() => onApproveVerification(agency.verification.latestRequestId!)}>
                    <CheckCircle2 />
                    {language === 'ru' ? 'Подтвердить' : 'Tasdiqlash'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onRejectVerification(agency.verification.latestRequestId!)}>
                    <XCircle />
                    {language === 'ru' ? 'Отклонить' : 'Rad etish'}
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" disabled>
                  <ShieldCheck />
                  {language === 'ru' ? 'Нет ожидающих действий' : 'Kutilayotgan amal yoq'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-2 px-4">
            <p className="text-sm font-semibold text-slate-900">{language === 'ru' ? 'История верификации' : 'Tasdiqlash tarixi'}</p>
            {verificationRequests.length === 0 ? (
              <p className="text-sm text-slate-500">{language === 'ru' ? 'Заявки на верификацию не найдены.' : "Tasdiqlash so'rovlari topilmadi."}</p>
            ) : (
              verificationRequests.map((request) => (
                <div key={request.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline" className={verificationTone(request.status)}>{localizeStatus(request.status)}</Badge>
                    <span className="text-xs text-slate-500">{formatDateTime(request.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{language === 'ru' ? 'Комментарий администратора' : 'Admin izohi'}: {request.admin_note ?? notProvided}</p>
                  <p className="text-sm text-slate-600">{language === 'ru' ? 'Ссылка сертификата' : 'Sertifikat havolasi'}: {request.certificate_url ?? notProvided}</p>
                  {request.form_data ? (
                    <div className="mt-2 grid gap-1 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-600">
                      {Object.entries(request.form_data).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium text-slate-700">{key}:</span>
                          <span className="break-all">{String(value ?? '') || notProvided}</span>
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

      <TabsContent value="tours" className="space-y-4">
        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-3 px-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{language === 'ru' ? 'Предпросмотр туров' : "Turlar ko'rinishi"}</p>
              <Badge variant="outline">{formatNumber(agency.stats.totalTours)} {language === 'ru' ? 'всего' : 'jami'}</Badge>
            </div>
            {tours.length === 0 ? (
              <p className="text-sm text-slate-500">{language === 'ru' ? 'Туры не найдены.' : 'Turlar topilmadi.'}</p>
            ) : (
              tours.slice(0, 20).map((tour) => (
                <TourRow key={tour.id} tour={tour} language={language} localizeStatus={localizeStatus} />
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="leads" className="space-y-4">
        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-3 px-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{language === 'ru' ? 'Предпросмотр заявок' : "So'rovlar ko'rinishi"}</p>
              <Badge variant="outline">{formatNumber(agency.stats.totalLeads)} {language === 'ru' ? 'всего' : 'jami'}</Badge>
            </div>
            {leads.length === 0 ? (
              <p className="text-sm text-slate-500">{language === 'ru' ? 'Заявки не найдены.' : "So'rovlar topilmadi."}</p>
            ) : (
              leads.slice(0, 20).map((lead) => (
                <div key={lead.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{lead.full_name}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(lead.created_at)}</p>
                    </div>
                    <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">{localizeStatus(lead.status)}</Badge>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <p>{language === 'ru' ? 'Телефон' : 'Telefon'}: {lead.phone}</p>
                    <p>Telegram: {lead.telegram_username ?? notProvided}</p>
                    <p>{language === 'ru' ? 'Количество людей' : 'Odam soni'}: {lead.people_count}</p>
                    <p>{language === 'ru' ? 'Тур' : 'Tur'}: {lead.tour?.title ?? (language === 'ru' ? 'Не связано' : "Bog'lanmagan")}</p>
                    <p>{language === 'ru' ? 'Комментарий' : 'Izoh'}: {lead.comment ?? notProvided}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="activity" className="space-y-4">
        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-2 px-4">
            <p className="text-sm font-semibold text-slate-900">{language === 'ru' ? 'Предупреждения качества' : 'Sifat ogohlantirishlari'}</p>
            {agency.stats.missingFields.length === 0 ? (
              <p className="text-sm text-emerald-700">{language === 'ru' ? 'Обязательные поля заполнены.' : "Majburiy maydonlar to'liq."}</p>
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
            <p className="text-sm font-semibold text-slate-900">{language === 'ru' ? 'Подписка и реклама' : 'Obuna va reklama'}</p>
            <p className="text-sm text-slate-700">{language === 'ru' ? 'Текущая подписка' : 'Joriy obuna'}: {agency.subscription?.status ? localizeStatus(agency.subscription.status) : notAvailable}</p>
            <p className="text-sm text-slate-700">{language === 'ru' ? 'Текущий тариф' : 'Joriy tarif'}: {agency.subscription?.plan?.name ?? notAvailable}</p>
            <p className="text-sm text-slate-700">{language === 'ru' ? 'Активные рекламы' : 'Faol reklamalar'}: {agency.stats.activePromotions}</p>
            <p className="text-sm text-slate-700">{language === 'ru' ? 'Баланс MaxCoin' : 'MaxCoin balansi'}: {formatNumber(agency.maxcoin_balance)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-3 px-4">
            <p className="text-sm font-semibold text-slate-900">{language === 'ru' ? 'Последние операции MaxCoin' : "So'nggi MaxCoin amallari"}</p>
            {maxcoinTransactions.length === 0 ? (
              <p className="text-sm text-slate-500">{language === 'ru' ? 'Транзакции MaxCoin недоступны.' : "MaxCoin tranzaksiyalari mavjud emas."}</p>
            ) : (
              maxcoinTransactions.slice(0, 8).map((transaction) => (
                <div key={transaction.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
                  <p className="font-medium">{localizeStatus(transaction.type)}</p>
                  <p>{language === 'ru' ? 'Сумма' : 'Miqdor'}: {formatNumber(transaction.amount)}</p>
                  <p>{language === 'ru' ? 'Описание' : 'Tavsif'}: {transaction.description ?? notProvided}</p>
                  <p>{formatDateTime(transaction.created_at)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-3 px-4">
            <p className="text-sm font-semibold text-slate-900">{language === 'ru' ? 'Последние рекламы' : "So'nggi reklamalar"}</p>
            {promotions.length === 0 ? (
              <p className="text-sm text-slate-500">{language === 'ru' ? 'Рекламные записи недоступны.' : "Reklama yozuvlari mavjud emas."}</p>
            ) : (
              promotions.slice(0, 10).map((promotion) => (
                <div key={promotion.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
                  <p className="font-medium">{localizeStatus(promotion.placement)} {promotion.is_active ? `(${localizeStatus('active')})` : `(${localizeStatus('inactive')})`}</p>
                  <p>{language === 'ru' ? 'Тур' : 'Tur'}: {promotion.tour?.title ?? promotion.tour_id}</p>
                  <p>{language === 'ru' ? 'Стоимость' : 'Narx'}: {formatNumber(promotion.cost_coins)} MC</p>
                  <p>{language === 'ru' ? 'Окончание' : 'Tugash'}: {formatDateTime(promotion.ends_at)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white py-4">
          <CardContent className="space-y-2 px-4">
            <p className="text-sm font-semibold text-slate-900">{language === 'ru' ? 'История подписок' : 'Obuna tarixi'}</p>
            {subscriptions.length === 0 ? (
              <p className="text-sm text-slate-500">{language === 'ru' ? 'История подписок недоступна.' : 'Obuna tarixi mavjud emas.'}</p>
            ) : (
              subscriptions.map((subscription) => (
                <div key={subscription.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
                  <p className="font-medium">{localizeStatus(subscription.status)}</p>
                  <p>{language === 'ru' ? 'Тариф' : 'Tarif'}: {subscription.plan?.name ?? (language === 'ru' ? 'Не связано' : "Bog'lanmagan")}</p>
                  <p>{language === 'ru' ? 'Начало' : 'Boshlanish'}: {formatDateTime(subscription.startsAt)}</p>
                  <p>{language === 'ru' ? 'Окончание' : 'Tugash'}: {formatDateTime(subscription.endsAt)}</p>
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

function TourRow({
  tour,
  language,
  localizeStatus,
}: {
  tour: AdminAgencyTourPreview;
  language: 'uz' | 'ru';
  localizeStatus: (value: string | null | undefined) => string;
}) {
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
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
              {language === 'ru' ? 'Нет изображения' : "Rasm yo'q"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">{tour.title}</p>
            <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
              {localizeStatus(tour.status)}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            {tour.city
              ? `${tour.city}, ${tour.country}`
              : tour.country ?? (language === 'ru' ? 'Локация не указана' : 'Joylashuv kiritilmagan')}
          </p>
          <p className="text-xs text-slate-500">{formatDateTime(tour.updated_at)}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href={`/admin/tours/${tour.id}`} className="text-blue-600 hover:underline">
              {language === 'ru' ? 'Открыть тур в админке' : 'Admin turini ochish'}
            </Link>
            <Link href={`/tours/${tour.slug}`} className="text-blue-600 hover:underline" target="_blank">
              {language === 'ru' ? 'Открыть публичный тур' : 'Ommaviy turni ochish'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
