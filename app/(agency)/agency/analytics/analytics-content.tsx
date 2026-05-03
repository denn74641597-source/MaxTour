'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Coins,
  Heart,
  Loader2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { GlowCard } from '@/components/pioneerui/glow-card';
import { GlassCard } from '@/components/pioneerui/glass-card';
import { useTranslation } from '@/lib/i18n';

export interface TourAnalyticsRow {
  tour: {
    id: string;
    title: string;
    slug: string;
    country: string;
    city: string | null;
  };
  interests: number;
  calls: number;
  telegram: number;
}

export interface AnalyticsTourRow {
  id: string;
  title: string;
  slug: string;
  country: string | null;
  city: string | null;
  status: string | null;
  view_count: number | null;
  created_at: string;
}

export interface LeadEventRow {
  id: string;
  tour_id: string | null;
  created_at: string;
}

export interface FavoriteEventRow {
  id: string;
  tour_id: string | null;
  user_id: string | null;
  created_at: string;
}

export interface CallEventRow {
  id: string;
  tour_id: string | null;
  type: string | null;
  created_at: string;
}

export interface PromotionEventRow {
  id: string;
  tour_id: string | null;
  cost_coins: number | null;
  is_active: boolean | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  status?: string | null;
}

export interface MaxCoinTxRow {
  id: string;
  amount: number;
  type: string;
  created_at: string;
  tour_id: string | null;
}

interface AnalyticsContentProps {
  analytics: TourAnalyticsRow[];
  totalRequests: number;
  tours: AnalyticsTourRow[];
  leads: LeadEventRow[];
  favorites: FavoriteEventRow[];
  callTracking: CallEventRow[];
  promotions: PromotionEventRow[];
  transactions: MaxCoinTxRow[];
  profileViews: number;
  avgRating: number | null;
  reviewCount: number;
  followersCount: number;
  loadError?: string | null;
}

type RangeKey = '7d' | '30d' | '90d' | 'all';

const RANGE_DAYS: Record<Exclude<RangeKey, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

function safeNumber(value: number | null | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

function formatInteger(value: number) {
  return value.toLocaleString('en-US').replace(/,/g, ' ');
}

function isWithinRange(dateString: string, range: RangeKey, now: number) {
  if (range === 'all') return true;
  const created = new Date(dateString).getTime();
  if (!Number.isFinite(created)) return false;
  return now - created <= RANGE_DAYS[range] * 24 * 60 * 60 * 1000;
}

export function AnalyticsContent({
  analytics,
  totalRequests,
  tours,
  leads,
  favorites,
  callTracking,
  promotions,
  transactions,
  profileViews,
  avgRating,
  reviewCount,
  followersCount,
  loadError = null,
}: AnalyticsContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [range, setRange] = useState<RangeKey>('30d');
  const [isPending, startTransition] = useTransition();

  const now = Date.now();

  const filteredLeads = useMemo(
    () => leads.filter((row) => isWithinRange(row.created_at, range, now)),
    [leads, now, range]
  );
  const filteredFavorites = useMemo(
    () => favorites.filter((row) => isWithinRange(row.created_at, range, now)),
    [favorites, now, range]
  );
  const filteredCalls = useMemo(
    () => callTracking.filter((row) => isWithinRange(row.created_at, range, now)),
    [callTracking, now, range]
  );
  const filteredPromotions = useMemo(
    () => promotions.filter((row) => isWithinRange(row.created_at, range, now)),
    [promotions, now, range]
  );
  const filteredTransactions = useMemo(
    () => transactions.filter((row) => isWithinRange(row.created_at, range, now)),
    [transactions, now, range]
  );

  const callsCount = filteredCalls.filter((row) => row.type === 'call').length;
  const telegramCount = filteredCalls.filter((row) => row.type === 'telegram').length;
  const interestsCount = filteredFavorites.length;
  const uniqueInterestedUsersCount = new Set(
    filteredFavorites.map((row) => row.user_id).filter(Boolean)
  ).size;

  const totalViews = tours.reduce((sum, row) => sum + safeNumber(row.view_count), 0);
  const publishedTours = tours.filter((row) => row.status === 'published');

  const leadToInterestRate =
    interestsCount > 0 ? (filteredLeads.length / interestsCount) * 100 : null;
  const profileViewConversionRate =
    profileViews > 0 ? (totalRequests / profileViews) * 100 : null;

  const activePromotionsCount = promotions.filter((row) => {
    const isMarkedActive = row.status ? row.status === 'active' : row.is_active === true;
    if (!isMarkedActive) return false;
    if (!row.ends_at) return false;
    const endsAt = new Date(row.ends_at).getTime();
    return Number.isFinite(endsAt) && endsAt >= now;
  }).length;

  const promotionSpendCoins = filteredTransactions.reduce((sum, row) => {
    if (!row.type.startsWith('spend_')) return sum;
    return sum + Math.abs(safeNumber(row.amount));
  }, 0);

  const tourPerformanceRows = useMemo(() => {
    const favoritesMap = new Map<string, number>();
    const leadsMap = new Map<string, number>();
    const callsMap = new Map<string, number>();
    const telegramMap = new Map<string, number>();

    for (const row of filteredFavorites) {
      if (!row.tour_id) continue;
      favoritesMap.set(row.tour_id, (favoritesMap.get(row.tour_id) ?? 0) + 1);
    }
    for (const row of filteredLeads) {
      if (!row.tour_id) continue;
      leadsMap.set(row.tour_id, (leadsMap.get(row.tour_id) ?? 0) + 1);
    }
    for (const row of filteredCalls) {
      if (!row.tour_id) continue;
      if (row.type === 'call') {
        callsMap.set(row.tour_id, (callsMap.get(row.tour_id) ?? 0) + 1);
      } else if (row.type === 'telegram') {
        telegramMap.set(row.tour_id, (telegramMap.get(row.tour_id) ?? 0) + 1);
      }
    }

    return publishedTours
      .map((tour) => {
        const interests = favoritesMap.get(tour.id) ?? 0;
        const leadsValue = leadsMap.get(tour.id) ?? 0;
        const calls = callsMap.get(tour.id) ?? 0;
        const telegram = telegramMap.get(tour.id) ?? 0;
        const interactions = interests + leadsValue + calls + telegram;
        const conversionRate = interests > 0 ? (leadsValue / interests) * 100 : null;

        return {
          ...tour,
          interests,
          leads: leadsValue,
          calls,
          telegram,
          interactions,
          conversionRate,
          views: safeNumber(tour.view_count),
        };
      })
      .sort((left, right) => {
        if (right.interactions !== left.interactions) {
          return right.interactions - left.interactions;
        }
        return right.views - left.views;
      });
  }, [filteredCalls, filteredFavorites, filteredLeads, publishedTours]);

  const topTours = tourPerformanceRows.slice(0, 5);
  const maxTourScore = Math.max(...topTours.map((row) => row.interactions), 0);

  const hasAnyData =
    tours.length > 0 ||
    leads.length > 0 ||
    favorites.length > 0 ||
    callTracking.length > 0 ||
    promotions.length > 0 ||
    transactions.length > 0 ||
    analytics.length > 0;

  return (
    <div className="space-y-5">
      <GlowCard className="rounded-[30px]">
        <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(130deg,#0d5f8d,#0f7ea6,#1a6d7f)] px-6 pb-6 pt-5 text-white shadow-[0_28px_56px_-30px_rgba(15,23,42,0.8)]">
          <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-blue-300/15 blur-3xl" />
          <div className="relative">
            <h1 className="text-2xl font-bold">{t.analytics.title}</h1>
            <p className="mt-1 text-sm text-white/80">{t.analytics.subtitle}</p>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <GlassCard className="rounded-2xl border-white/35 bg-white/18">
                <div className="p-4">
                  <div className="inline-flex rounded-lg bg-white/20 p-2 text-white">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    {t.agency.totalViews}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{formatInteger(totalViews)}</p>
                </div>
              </GlassCard>
              <GlassCard className="rounded-2xl border-white/35 bg-white/18">
                <div className="p-4">
                  <div className="inline-flex rounded-lg bg-white/20 p-2 text-white">
                    <Users className="h-4 w-4" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    {t.leadsPage.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{formatInteger(filteredLeads.length)}</p>
                </div>
              </GlassCard>
              <GlassCard className="rounded-2xl border-white/35 bg-white/18">
                <div className="p-4">
                  <div className="inline-flex rounded-lg bg-white/20 p-2 text-white">
                    <Heart className="h-4 w-4" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    {t.analytics.interestedUsers}
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {formatInteger(uniqueInterestedUsersCount)}
                  </p>
                </div>
              </GlassCard>
              <GlassCard className="rounded-2xl border-white/35 bg-white/18">
                <div className="p-4">
                  <div className="inline-flex rounded-lg bg-white/20 p-2 text-white">
                    <Coins className="h-4 w-4" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    {t.analytics.activePromotions}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{formatInteger(activePromotionsCount)}</p>
                </div>
              </GlassCard>
            </div>
          </div>
        </section>
      </GlowCard>

      {loadError && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-rose-700">{t.analytics.loadErrorTitle}</p>
            <p className="text-sm text-rose-600">{loadError}</p>
            <Button size="sm" variant="outline" onClick={() => router.refresh()}>
              {t.errors.tryAgain}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="market-section p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {t.analytics.dateRange}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {([
              { key: '7d', label: t.analytics.range7d },
              { key: '30d', label: t.analytics.range30d },
              { key: '90d', label: t.analytics.range90d },
              { key: 'all', label: t.analytics.rangeAll },
            ] as { key: RangeKey; label: string }[]).map((item) => (
              <button
                key={item.key}
                onClick={() =>
                  startTransition(() => {
                    setRange(item.key);
                  })
                }
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  range === item.key
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
            {isPending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </div>
        </div>
      </div>

      {hasAnyData ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <GlowCard className="rounded-2xl">
              <Card className="market-subtle-border rounded-2xl border-none bg-white/92 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
                <CardContent className="space-y-4 p-5">
                  <h3 className="text-base font-bold text-slate-900">{t.analytics.tourPerformance}</h3>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {t.analytics.interests}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-pink-600">
                        {formatInteger(interestsCount)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {t.leadsPage.title}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-sky-700">
                        {formatInteger(filteredLeads.length)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {t.analytics.calls}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-emerald-600">
                        {formatInteger(callsCount)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {t.analytics.telegram}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-blue-600">
                        {formatInteger(telegramCount)}
                      </p>
                    </div>
                  </div>

                  {leadToInterestRate !== null && (
                    <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">
                        {t.analytics.leadToInterestRate}
                      </p>
                      <p className="mt-1 text-xl font-bold text-sky-900">
                        {leadToInterestRate.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </GlowCard>

            <GlowCard className="rounded-2xl">
              <Card className="market-subtle-border rounded-2xl border-none bg-white/92 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
                <CardContent className="space-y-4 p-5">
                  <h3 className="text-base font-bold text-slate-900">{t.analytics.profilePerformance}</h3>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {t.analytics.profileViews}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {formatInteger(profileViews)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {t.analytics.followers}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {formatInteger(followersCount)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {t.analytics.averageRating}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {avgRating !== null ? avgRating.toFixed(1) : '—'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {t.analytics.reviewCount}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {formatInteger(reviewCount)}
                      </p>
                    </div>
                  </div>

                  {profileViewConversionRate !== null && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">
                        {t.analytics.profileViewLeadRate}
                      </p>
                      <p className="mt-1 text-xl font-bold text-indigo-900">
                        {profileViewConversionRate.toFixed(2)}%
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </GlowCard>
          </div>

          <GlowCard className="rounded-2xl">
            <Card className="market-subtle-border rounded-2xl border-none bg-white/92 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
              <CardContent className="space-y-4 p-5">
                <h3 className="text-base font-bold text-slate-900">{t.analytics.promotionPerformance}</h3>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {t.analytics.activePromotions}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {formatInteger(activePromotionsCount)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {t.analytics.promotionLaunches}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {formatInteger(filteredPromotions.length)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {t.analytics.promotionSpendCoins}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {formatInteger(promotionSpendCoins)}
                    </p>
                  </div>
                </div>

                {filteredPromotions.length === 0 && (
                  <p className="text-sm text-slate-500">{t.analytics.noPromotionData}</p>
                )}
              </CardContent>
            </Card>
          </GlowCard>

          <GlowCard className="rounded-2xl">
            <Card className="market-subtle-border rounded-2xl border-none bg-white/92 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900">{t.analytics.topTours}</h3>
                  <span className="text-xs text-slate-500">{t.analytics.total}: {formatInteger(topTours.length)}</span>
                </div>

                {topTours.length > 0 ? (
                  <div className="space-y-3">
                    {topTours.map((row) => {
                      const width =
                        maxTourScore > 0
                          ? Math.max(8, Math.round((row.interactions / maxTourScore) * 100))
                          : 8;
                      return (
                        <div
                          key={row.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{row.title}</p>
                              <p className="text-xs text-slate-500">
                                {row.city ? `${row.city}, ` : ''}
                                {row.country ?? ''}
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-[11px] font-semibold text-sky-700">
                              <TrendingUp className="h-3 w-3" />
                              {formatInteger(row.interactions)}
                            </span>
                          </div>

                          <div className="mt-2 h-2 rounded-full bg-slate-200">
                            <div
                              className="h-2 rounded-full bg-[linear-gradient(90deg,#0ea5e9,#2563eb)]"
                              style={{ width: `${width}%` }}
                            />
                          </div>

                          <div className="mt-3 grid grid-cols-5 gap-2 text-[11px]">
                            <div className="rounded-md bg-white px-2 py-1 text-center text-slate-700">
                              <p className="font-semibold">{formatInteger(row.views)}</p>
                              <p>{t.agency.totalViews}</p>
                            </div>
                            <div className="rounded-md bg-white px-2 py-1 text-center text-slate-700">
                              <p className="font-semibold">{formatInteger(row.leads)}</p>
                              <p>{t.leadsPage.title}</p>
                            </div>
                            <div className="rounded-md bg-white px-2 py-1 text-center text-slate-700">
                              <p className="font-semibold">{formatInteger(row.interests)}</p>
                              <p>{t.analytics.interests}</p>
                            </div>
                            <div className="rounded-md bg-white px-2 py-1 text-center text-slate-700">
                              <p className="font-semibold">{formatInteger(row.calls)}</p>
                              <p>{t.analytics.calls}</p>
                            </div>
                            <div className="rounded-md bg-white px-2 py-1 text-center text-slate-700">
                              <p className="font-semibold">
                                {row.conversionRate !== null ? `${row.conversionRate.toFixed(1)}%` : '—'}
                              </p>
                              <p>{t.analytics.leadToInterestShort}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={<BarChart3 className="mb-4 h-10 w-10 text-muted-foreground/50" />}
                    title={t.analytics.noData}
                    description={t.analytics.noDataHint}
                  />
                )}
              </CardContent>
            </Card>
          </GlowCard>
        </>
      ) : (
        <div className="market-section p-6 md:p-8">
          <EmptyState
            icon={<BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/50" />}
            title={t.analytics.noData}
            description={t.analytics.noDataHint}
          />
        </div>
      )}
    </div>
  );
}
