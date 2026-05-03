'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Coins,
  Eye,
  Flame,
  Loader2,
  ShoppingCart,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { purchaseMaxCoins, promoteTour } from '@/features/maxcoin/actions';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { GlowCard } from '@/components/pioneerui/glow-card';
import { GlassCard } from '@/components/pioneerui/glass-card';
import type {
  MaxCoinTransaction,
  PromotionPlacement,
  PromotionTier,
  Tour,
  TourPromotion,
} from '@/types';

const COIN_PRICE_UZS = 15000;

interface AdvertisingContentProps {
  agencyId: string;
  balance: number;
  tiers: PromotionTier[];
  activePromotions: TourPromotion[];
  transactions: MaxCoinTransaction[];
  tours: Tour[];
}

const PLACEMENT_ORDER: PromotionPlacement[] = ['featured', 'hot_deals', 'hot_tours'];

function formatNumber(value: number) {
  return value.toLocaleString('en-US').replace(/,/g, ' ');
}

export function AdvertisingContent({
  agencyId,
  balance: initialBalance,
  tiers,
  activePromotions: initialPromotions,
  transactions: initialTransactions,
  tours,
}: AdvertisingContentProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [tab, setTab] = useState<'main' | 'buy' | 'history'>('main');
  const [balance, setBalance] = useState(initialBalance);
  const [sliderValue, setSliderValue] = useState(5);
  const [buying, setBuying] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedTour, setSelectedTour] = useState('');
  const [selectedPlacement, setSelectedPlacement] = useState<PromotionPlacement>('featured');
  const [selectedTierId, setSelectedTierId] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const publishedTours = useMemo(
    () => tours.filter((tour) => tour.status === 'published'),
    [tours]
  );

  const tiersByPlacement = useMemo(() => {
    return PLACEMENT_ORDER.reduce<Record<PromotionPlacement, PromotionTier[]>>(
      (acc, placement) => {
        acc[placement] = tiers
          .filter((tier) => tier.placement === placement)
          .sort((left, right) => left.days - right.days);
        return acc;
      },
      { featured: [], hot_deals: [], hot_tours: [] }
    );
  }, [tiers]);

  const placementTiers = tiersByPlacement[selectedPlacement];
  const selectedTier = placementTiers.find((tier) => tier.id === selectedTierId) ?? null;
  const totalPrice = sliderValue * COIN_PRICE_UZS;

  const placementIcons: Record<PromotionPlacement, ReactNode> = {
    featured: <Star className="h-4 w-4" />,
    hot_deals: <TrendingUp className="h-4 w-4" />,
    hot_tours: <Flame className="h-4 w-4" />,
  };

  const placementLabels: Record<PromotionPlacement, string> = {
    featured: t.maxcoin.placementFeatured,
    hot_deals: t.maxcoin.placementHotDeals,
    hot_tours: t.maxcoin.placementHotTours,
  };

  const activePromotionsCount = initialPromotions.length;
  const availablePlacementCount = PLACEMENT_ORDER.filter(
    (placement) => tiersByPlacement[placement].length > 0
  ).length;

  async function handleBuy() {
    if (sliderValue < 5 || sliderValue > 200) return;
    setActionError(null);
    setBuying(true);

    const result = await purchaseMaxCoins(agencyId, sliderValue);
    setBuying(false);

    if (result.error) {
      setActionError(result.error);
      toast.error(result.error || t.errors.somethingWrong);
      return;
    }

    setShowPurchaseModal(true);
    setTab('main');
    toast.success(t.maxcoin.requestPending);
    router.refresh();
  }

  async function handlePromote() {
    if (!selectedTour || !selectedTierId) return;
    setActionError(null);
    setPromoting(true);

    const result = await promoteTour(agencyId, selectedTour, selectedTierId);
    setPromoting(false);

    if (result.error) {
      setActionError(result.error);
      toast.error(result.error || t.errors.somethingWrong);
      return;
    }

    if ((result as { newBalance?: number }).newBalance !== undefined) {
      setBalance((result as { newBalance: number }).newBalance);
    }
    setSelectedTierId('');
    toast.success(t.maxcoin.promoteNow);
    router.refresh();
  }

  return (
    <div className="space-y-5 pb-10">
      <GlowCard className="rounded-[30px]">
        <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(130deg,#0e5f8f,#0f7ea6,#17617e)] px-6 pb-6 pt-5 text-white shadow-[0_28px_56px_-30px_rgba(15,23,42,0.8)]">
          <div className="absolute -right-12 -top-14 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-blue-300/15 blur-3xl" />

          <div className="relative">
            <h1 className="text-2xl font-bold">{t.maxcoin.title}</h1>
            <p className="mt-1 text-sm text-white/80">{t.maxcoin.subtitle}</p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <GlassCard className="rounded-2xl border-white/35 bg-white/18">
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    {t.maxcoin.currentBalance}
                  </p>
                  <p className="mt-2 text-3xl font-bold">
                    {formatNumber(balance)} <span className="text-base font-semibold">MC</span>
                  </p>
                </div>
              </GlassCard>

              <GlassCard className="rounded-2xl border-white/35 bg-white/18">
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    {t.maxcoin.activePromotions}
                  </p>
                  <p className="mt-2 text-3xl font-bold">{activePromotionsCount}</p>
                </div>
              </GlassCard>

              <GlassCard className="rounded-2xl border-white/35 bg-white/18">
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    {t.maxcoin.selectPlacement}
                  </p>
                  <p className="mt-2 text-3xl font-bold">{availablePlacementCount}</p>
                </div>
              </GlassCard>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="rounded-xl bg-white text-slate-900 hover:bg-white/90"
                onClick={() => setTab('buy')}
              >
                <Coins />
                {t.maxcoin.buyCoins}
              </Button>
              <Button
                variant="ghost"
                className="rounded-xl border border-white/35 bg-white/10 text-white hover:bg-white/20"
                onClick={() => setTab('history')}
              >
                {t.maxcoin.history}
              </Button>
            </div>
          </div>
        </section>
      </GlowCard>

      {actionError && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-2 p-4 text-sm text-amber-800">
            <Shield className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className="space-y-4">
        <div className="market-section p-2">
          <TabsList className="grid w-full grid-cols-3 rounded-xl bg-slate-100 p-1">
            <TabsTrigger value="main" className="gap-1.5 text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              {t.maxcoin.promoteTour}
            </TabsTrigger>
            <TabsTrigger value="buy" className="gap-1.5 text-sm font-semibold">
              <ShoppingCart className="h-4 w-4" />
              {t.maxcoin.buyCoins}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-sm font-semibold">
              <Coins className="h-4 w-4" />
              {t.maxcoin.history}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="main" className="space-y-5">
          <div className="grid items-start gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <GlowCard className="rounded-2xl">
              <Card className="market-subtle-border rounded-2xl border-none bg-white/92 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
                <CardContent className="space-y-4 p-5">
                  <h3 className="text-base font-bold text-slate-900">{t.maxcoin.whereToUse}</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {PLACEMENT_ORDER.map((placement) => (
                      <div
                        key={placement}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="inline-flex rounded-xl bg-sky-100 p-2 text-sky-700">
                          {placementIcons[placement]}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {placementLabels[placement]}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {tiersByPlacement[placement].length > 0
                            ? `${tiersByPlacement[placement].length} ${t.maxcoin.days}`
                            : t.empty.noItems}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="text-sm font-semibold text-slate-900">{t.maxcoin.activePromotions}</h4>
                    {initialPromotions.length === 0 ? (
                      <div className="pt-4">
                        <EmptyState
                          icon={<Coins className="mb-4 h-10 w-10 text-muted-foreground/50" />}
                          title={t.maxcoin.noActivePromotions}
                          description={t.maxcoin.promoteTour}
                        />
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {initialPromotions.map((promotion) => {
                          const promotionPlacement = promotion.placement as PromotionPlacement;
                          const msLeft = Math.max(
                            0,
                            new Date(promotion.ends_at).getTime() - Date.now()
                          );
                          const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
                          const hoursLeft = Math.floor(
                            (msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                          );

                          return (
                            <div
                              key={promotion.id}
                              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                            >
                              <div className="inline-flex rounded-lg bg-sky-100 p-2 text-sky-700">
                                {placementIcons[promotionPlacement]}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {promotion.tour?.title ?? 'Tour'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {placementLabels[promotionPlacement]}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-semibold text-sky-700">
                                  {daysLeft} {t.maxcoin.days} {hoursLeft}h
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {promotion.cost_coins} MC
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="text-sm font-semibold text-slate-900">{t.maxcoin.whyMaxCoin}</h4>
                    {[
                      { icon: <Eye className="h-4 w-4 text-sky-700" />, label: t.maxcoin.benefit1 },
                      { icon: <TrendingUp className="h-4 w-4 text-sky-700" />, label: t.maxcoin.benefit2 },
                      { icon: <Zap className="h-4 w-4 text-sky-700" />, label: t.maxcoin.benefit3 },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className="inline-flex rounded-md bg-sky-100 p-1.5">{item.icon}</span>
                        <span className="text-sm text-slate-700">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </GlowCard>

            <GlowCard className="rounded-2xl">
              <Card className="market-subtle-border rounded-2xl border-none bg-white/92 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
                <CardContent className="space-y-4 p-5">
                  <h3 className="text-base font-bold text-slate-900">{t.maxcoin.promoteTour}</h3>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                      {t.maxcoin.selectTour}
                    </p>
                    <select
                      value={selectedTour}
                      onChange={(event) => setSelectedTour(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400"
                    >
                      <option value="">{t.maxcoin.selectTour}...</option>
                      {publishedTours.map((tour) => (
                        <option key={tour.id} value={tour.id}>
                          {tour.title}
                        </option>
                      ))}
                    </select>
                    {publishedTours.length === 0 && (
                      <p className="text-xs text-slate-500">{t.agency.noActiveToursToPush}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                      {t.maxcoin.selectPlacement}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {PLACEMENT_ORDER.map((placement) => {
                        const active = selectedPlacement === placement;
                        return (
                          <button
                            key={placement}
                            type="button"
                            onClick={() => {
                              setSelectedPlacement(placement);
                              setSelectedTierId('');
                            }}
                            className={`rounded-xl border p-3 text-left transition ${
                              active
                                ? 'border-sky-400 bg-sky-50 text-sky-800'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="mb-1 inline-flex">{placementIcons[placement]}</span>
                            <p className="text-xs font-semibold">{placementLabels[placement]}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                      {t.maxcoin.days}
                    </p>
                    {placementTiers.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        {t.empty.noItems}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {placementTiers.map((tier) => {
                          const active = selectedTierId === tier.id;
                          return (
                            <button
                              key={tier.id}
                              type="button"
                              onClick={() => setSelectedTierId(tier.id)}
                              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition ${
                                active
                                  ? 'border-sky-400 bg-sky-50 text-sky-900'
                                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                              }`}
                            >
                              <span className="font-semibold">
                                {tier.days} {t.maxcoin.days}
                              </span>
                              <span className="font-bold">{tier.coins} MC</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {selectedTier && (
                    <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-sky-700">
                        {t.maxcoin.totalCost}
                      </p>
                      <p className="mt-1 text-sm font-bold text-sky-900">
                        {selectedTier.coins} MC / {selectedTier.days} {t.maxcoin.days}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <StatusBadge status="active" label={t.maxcoin.balance} />
                    <p className="text-sm font-semibold text-slate-800">
                      {formatNumber(balance)} MC
                    </p>
                  </div>

                  <Button
                    className="w-full rounded-xl"
                    onClick={handlePromote}
                    disabled={
                      !selectedTour ||
                      !selectedTierId ||
                      promoting ||
                      (selectedTier ? balance < selectedTier.coins : true)
                    }
                  >
                    {promoting ? (
                      <>
                        <Loader2 className="animate-spin" />
                        {t.common.loading}
                      </>
                    ) : selectedTier && balance < selectedTier.coins ? (
                      t.maxcoin.insufficientBalance
                    ) : (
                      t.maxcoin.promoteNow
                    )}
                  </Button>
                </CardContent>
              </Card>
            </GlowCard>
          </div>
        </TabsContent>

        <TabsContent value="buy">
          <GlowCard className="rounded-2xl">
            <Card className="market-subtle-border rounded-2xl border-none bg-white/92 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
              <CardContent className="mx-auto max-w-2xl space-y-5 p-6 text-center">
                <h3 className="text-xl font-bold text-slate-900">{t.maxcoin.purchaseTitle}</h3>
                <p className="text-sm text-slate-500">{t.maxcoin.purchaseSubtitle}</p>

                <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-6">
                  <p className="text-4xl font-bold text-sky-800">{sliderValue}</p>
                  <p className="text-sm font-semibold text-sky-700">{t.maxcoin.coins}</p>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min={5}
                    max={200}
                    step={3}
                    value={sliderValue}
                    onChange={(event) => setSliderValue(Number(event.target.value))}
                    className="w-full accent-sky-600"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>5</span>
                    <span>50</span>
                    <span>100</span>
                    <span>150</span>
                    <span>200</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{t.maxcoin.totalCost}</span>
                    <span className="text-lg font-bold text-slate-900">
                      {formatNumber(totalPrice)} UZS
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{t.maxcoin.pricePerCoin}</span>
                    <span className="text-xs text-slate-500">{formatNumber(COIN_PRICE_UZS)} UZS</span>
                  </div>
                </div>

                <Button className="w-full rounded-xl" onClick={handleBuy} disabled={buying}>
                  {buying ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {t.common.loading}
                    </>
                  ) : (
                    <>
                      <ShoppingCart />
                      {t.maxcoin.buyNow}
                    </>
                  )}
                </Button>

                <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Shield className="h-3.5 w-3.5" />
                  {t.maxcoin.securePay}
                </p>
              </CardContent>
            </Card>
          </GlowCard>
        </TabsContent>

        <TabsContent value="history">
          <GlowCard className="rounded-2xl">
            <Card className="market-subtle-border rounded-2xl border-none bg-white/92 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.62)]">
              <CardContent className="space-y-4 p-5">
                <h3 className="text-base font-bold text-slate-900">{t.maxcoin.history}</h3>

                {initialTransactions.length === 0 ? (
                  <EmptyState
                    icon={<Coins className="mb-4 h-10 w-10 text-muted-foreground/50" />}
                    title={t.empty.noItems}
                    description={t.maxcoin.promotionHistory}
                  />
                ) : (
                  <div className="space-y-2">
                    {initialTransactions.map((tx) => {
                      const isCredit = tx.amount > 0;
                      const typeLabel =
                        tx.type === 'purchase'
                          ? t.maxcoin.transactionPurchase
                          : tx.type === 'bonus'
                            ? t.maxcoin.transactionBonus
                            : tx.type === 'refund'
                              ? t.maxcoin.transactionRefund
                              : t.maxcoin.transactionSpend;

                      return (
                        <div
                          key={tx.id}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                        >
                          <div
                            className={`inline-flex rounded-full p-2 ${
                              isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isCredit ? <Coins className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">{typeLabel}</p>
                            {tx.description && (
                              <p className="truncate text-xs text-slate-500">{tx.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-sm font-bold ${
                                isCredit ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {isCredit ? '+' : ''}
                              {tx.amount} MC
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </GlowCard>
        </TabsContent>
      </Tabs>

      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
            <div className="mb-4 flex justify-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-7 w-7" />
              </span>
            </div>
            <h4 className="text-lg font-bold text-slate-900">{t.maxcoin.requestSent}</h4>
            <p className="mt-2 text-sm text-slate-500">{t.maxcoin.requestSentDescription}</p>
            <Button className="mt-5 w-full rounded-xl" onClick={() => setShowPurchaseModal(false)}>
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
