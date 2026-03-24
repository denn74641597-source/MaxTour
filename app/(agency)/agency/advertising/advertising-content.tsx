'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coins, Star, Flame, TrendingUp, Eye, Zap, ShoppingCart, Shield, ChevronRight, Clock, Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { purchaseMaxCoins, promoteTour } from '@/features/maxcoin/actions';
import { toast } from 'sonner';
import type { Tour, MaxCoinPackage, PromotionPricing, TourPromotion, MaxCoinTransaction, PromotionPlacement } from '@/types';

interface AdvertisingContentProps {
  agencyId: string;
  balance: number;
  packages: MaxCoinPackage[];
  pricing: PromotionPricing[];
  activePromotions: TourPromotion[];
  transactions: MaxCoinTransaction[];
  tours: Tour[];
}

export function AdvertisingContent({
  agencyId, balance: initialBalance, packages, pricing, activePromotions: initialPromos, transactions: initialTx, tours,
}: AdvertisingContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [activeTab, setActiveTab] = useState<'main' | 'buy' | 'history'>('main');
  const [sliderValue, setSliderValue] = useState(50);
  const [buying, setBuying] = useState(false);

  // Promote state
  const [selectedTour, setSelectedTour] = useState('');
  const [selectedPlacement, setSelectedPlacement] = useState<PromotionPlacement>('featured');
  const [promoteDays, setPromoteDays] = useState(7);
  const [promoting, setPromoting] = useState(false);

  const selectedPricing = pricing.find(p => p.placement === selectedPlacement);
  const promoteCost = selectedPricing ? selectedPricing.cost_per_day * promoteDays : 0;

  // Find best matching package for slider
  const sortedPackages = [...packages].sort((a, b) => a.coins - b.coins);
  const closestPackage = sortedPackages.reduce((prev, curr) =>
    Math.abs(curr.coins - sliderValue) < Math.abs(prev.coins - sliderValue) ? curr : prev,
    sortedPackages[0]
  );

  const pricePerCoin = closestPackage ? Math.round(closestPackage.price_uzs / closestPackage.coins) : 15000;

  async function handleBuy() {
    if (!closestPackage) return;
    setBuying(true);
    const result = await purchaseMaxCoins(agencyId, closestPackage.id);
    setBuying(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`${closestPackage.coins + closestPackage.bonus_coins} MC qo'shildi!`);
      if (result.newBalance !== undefined) setBalance(result.newBalance);
      router.refresh();
    }
  }

  async function handlePromote() {
    if (!selectedTour || !selectedPlacement) return;
    setPromoting(true);
    const result = await promoteTour(agencyId, selectedTour, selectedPlacement, promoteDays);
    setPromoting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Tur muvaffaqiyatli reklama qilindi!');
      if (result.newBalance !== undefined) setBalance(result.newBalance);
      router.refresh();
    }
  }

  const placementIcons: Record<PromotionPlacement, React.ReactNode> = {
    featured: <Star className="h-5 w-5" />,
    hot_deals: <TrendingUp className="h-5 w-5" />,
    hot_tours: <Flame className="h-5 w-5" />,
  };

  const placementLabels: Record<PromotionPlacement, string> = {
    featured: t.maxcoin.placementFeatured,
    hot_deals: t.maxcoin.placementHotDeals,
    hot_tours: t.maxcoin.placementHotTours,
  };

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary-container text-white rounded-b-[2rem] px-6 pt-6 pb-8">
        <h1 className="text-2xl font-bold">{t.maxcoin.title}</h1>
        <p className="text-white/80 text-sm mt-1 leading-snug">{t.maxcoin.subtitle}</p>

        {/* Balance Card */}
        <div className="mt-6 bg-white/15 backdrop-blur-sm rounded-2xl p-5 text-center">
          <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">{t.maxcoin.balance}</p>
          <p className="text-4xl font-bold mt-1">{balance.toLocaleString()} <span className="text-lg font-medium">MC</span></p>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setActiveTab('buy')}
              className="flex-1 bg-white text-primary font-bold py-2.5 rounded-xl text-sm hover:bg-white/90 transition-colors"
            >
              {t.maxcoin.buyCoins}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="flex-1 bg-white/20 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-white/30 transition-colors"
            >
              {t.maxcoin.history}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'main' && (
        <div className="px-6 mt-6 space-y-6">
          {/* Where to use */}
          <section>
            <h3 className="text-base font-bold text-foreground mb-3">{t.maxcoin.whereToUse}</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Star className="h-6 w-6 text-primary" />, label: t.maxcoin.useFeatured },
                { icon: <TrendingUp className="h-6 w-6 text-primary" />, label: t.maxcoin.useHotDeals },
                { icon: <Flame className="h-6 w-6 text-primary" />, label: t.maxcoin.useHotTours },
              ].map((item, i) => (
                <div key={i} className="bg-surface rounded-2xl p-4 flex flex-col items-center text-center shadow-ambient">
                  <div className="bg-primary/10 rounded-full p-3 mb-2">{item.icon}</div>
                  <span className="text-xs font-medium text-foreground leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Promote Tour */}
          <section>
            <h3 className="text-base font-bold text-foreground mb-3">{t.maxcoin.promoteTour}</h3>
            <div className="bg-surface rounded-2xl p-4 shadow-ambient space-y-4">
              {/* Tour selection */}
              <div>
                <label className="text-xs text-muted-foreground font-medium">{t.maxcoin.selectTour}</label>
                <select
                  value={selectedTour}
                  onChange={(e) => setSelectedTour(e.target.value)}
                  className="mt-1 w-full bg-surface-container-low border border-muted rounded-xl px-3 py-2.5 text-sm"
                >
                  <option value="">{t.maxcoin.selectTour}...</option>
                  {tours.map((tour) => (
                    <option key={tour.id} value={tour.id}>{tour.title}</option>
                  ))}
                </select>
              </div>

              {/* Placement selection */}
              <div>
                <label className="text-xs text-muted-foreground font-medium">{t.maxcoin.selectPlacement}</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {(['featured', 'hot_deals', 'hot_tours'] as PromotionPlacement[]).map((p) => {
                    const pr = pricing.find(pp => pp.placement === p);
                    return (
                      <button
                        key={p}
                        onClick={() => setSelectedPlacement(p)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedPlacement === p
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-muted bg-surface-container-low text-foreground'
                        }`}
                      >
                        <div className="flex justify-center mb-1">{placementIcons[p]}</div>
                        <p className="text-[10px] font-semibold leading-tight">{placementLabels[p]}</p>
                        {pr && <p className="text-[10px] text-muted-foreground mt-0.5">{pr.cost_per_day} MC/{t.maxcoin.perDay}</p>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Days slider */}
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{t.maxcoin.days}</span>
                  <span className="font-bold text-foreground">{promoteDays} {t.maxcoin.days}</span>
                </div>
                <input
                  type="range"
                  min={selectedPricing?.min_days ?? 1}
                  max={selectedPricing?.max_days ?? 30}
                  value={promoteDays}
                  onChange={(e) => setPromoteDays(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{selectedPricing?.min_days ?? 1}</span>
                  <span>{selectedPricing?.max_days ?? 30}</span>
                </div>
              </div>

              {/* Cost summary */}
              <div className="flex items-center justify-between bg-primary/5 rounded-xl p-3">
                <span className="text-sm font-medium text-foreground">{t.maxcoin.totalCost}</span>
                <span className="text-lg font-bold text-primary">{promoteCost} MC</span>
              </div>

              {/* Promote button */}
              <button
                onClick={handlePromote}
                disabled={!selectedTour || promoting || balance < promoteCost}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {promoting ? '...' : balance < promoteCost ? t.maxcoin.insufficientBalance : t.maxcoin.promoteNow}
              </button>
            </div>
          </section>

          {/* Active Promotions */}
          {initialPromos.length > 0 && (
            <section>
              <h3 className="text-base font-bold text-foreground mb-3">{t.maxcoin.activePromotions}</h3>
              <div className="space-y-2">
                {initialPromos.map((promo) => {
                  const daysLeft = Math.max(0, Math.ceil((new Date(promo.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                  return (
                    <div key={promo.id} className="bg-surface rounded-xl p-3 shadow-ambient flex items-center gap-3">
                      <div className="bg-primary/10 rounded-full p-2">{placementIcons[promo.placement]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{(promo.tour as any)?.title ?? 'Tour'}</p>
                        <p className="text-xs text-muted-foreground">{placementLabels[promo.placement]}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-primary">{daysLeft} {t.maxcoin.daysLeft}</p>
                        <p className="text-[10px] text-muted-foreground">{promo.cost_coins} MC</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Why MaxCoin */}
          <section>
            <div className="bg-surface rounded-2xl p-5 shadow-ambient">
              <h3 className="text-base font-bold text-foreground text-center mb-4">{t.maxcoin.whyMaxCoin}</h3>
              <div className="space-y-3">
                {[
                  { icon: <Eye className="h-5 w-5 text-primary" />, text: t.maxcoin.benefit1 },
                  { icon: <TrendingUp className="h-5 w-5 text-primary" />, text: t.maxcoin.benefit2 },
                  { icon: <Zap className="h-5 w-5 text-primary" />, text: t.maxcoin.benefit3 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-2 shrink-0">{item.icon}</div>
                    <span className="text-sm font-medium text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Buy CTA */}
          <button
            onClick={() => setActiveTab('buy')}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Coins className="h-5 w-5" />
            {t.maxcoin.buyCoins}
          </button>
        </div>
      )}

      {activeTab === 'buy' && (
        <div className="px-6 mt-6 space-y-6">
          {/* Back to main */}
          <button onClick={() => setActiveTab('main')} className="text-sm text-primary font-medium">
            ← {t.maxcoin.title}
          </button>

          {/* Purchase Card */}
          <div className="bg-surface rounded-2xl p-6 shadow-ambient text-center">
            <h2 className="text-xl font-bold text-foreground">{t.maxcoin.purchaseTitle}</h2>
            <p className="text-muted-foreground text-sm mt-1">{t.maxcoin.purchaseSubtitle}</p>

            {/* Coin display */}
            <div className="mt-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6">
              {closestPackage && closestPackage.bonus_coins > 0 && (
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">{t.maxcoin.bestPrice}</p>
              )}
              <p className="text-4xl font-bold text-primary">{closestPackage?.coins ?? sliderValue}</p>
              <p className="text-sm font-semibold text-primary/80">{t.maxcoin.coins}</p>
              <p className="text-lg font-bold text-foreground mt-2">
                {closestPackage?.price_uzs?.toLocaleString() ?? '—'} UZS
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                {t.maxcoin.pricePerCoin} {pricePerCoin.toLocaleString()} UZS
              </p>
            </div>

            {/* Slider */}
            <div className="mt-5">
              <input
                type="range"
                min={sortedPackages[0]?.coins ?? 10}
                max={sortedPackages[sortedPackages.length - 1]?.coins ?? 1000}
                step={1}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                {sortedPackages.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSliderValue(p.coins)}
                    className={`text-xs font-medium ${closestPackage?.id === p.id ? 'text-primary font-bold' : 'text-muted-foreground'}`}
                  >
                    {p.coins}
                  </button>
                ))}
              </div>
            </div>

            {/* Bonus display */}
            {closestPackage && closestPackage.bonus_coins > 0 && (
              <p className="text-sm text-primary font-semibold mt-3">
                + {closestPackage.bonus_coins} {t.maxcoin.bonus} 🎁
              </p>
            )}

            {/* Buy button */}
            <button
              onClick={handleBuy}
              disabled={buying || !closestPackage}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl mt-5 hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              {buying ? '...' : t.maxcoin.buyNow}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-3">
              <Shield className="h-3.5 w-3.5" />
              {t.maxcoin.securePay}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="px-6 mt-6 space-y-4">
          {/* Back to main */}
          <button onClick={() => setActiveTab('main')} className="text-sm text-primary font-medium">
            ← {t.maxcoin.title}
          </button>

          <h3 className="text-base font-bold text-foreground">{t.maxcoin.history}</h3>

          {initialTx.length === 0 ? (
            <div className="text-center py-10">
              <Coins className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Tarix mavjud emas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {initialTx.map((tx) => {
                const isCredit = tx.amount > 0;
                const typeLabel = tx.type === 'purchase' ? t.maxcoin.transactionPurchase
                  : tx.type === 'bonus' ? t.maxcoin.transactionBonus
                  : tx.type === 'refund' ? t.maxcoin.transactionRefund
                  : t.maxcoin.transactionSpend;
                return (
                  <div key={tx.id} className="bg-surface rounded-xl p-3 shadow-ambient flex items-center gap-3">
                    <div className={`rounded-full p-2 ${isCredit ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {isCredit
                        ? <Coins className="h-4 w-4 text-emerald-500" />
                        : <TrendingUp className="h-4 w-4 text-red-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{typeLabel}</p>
                      {tx.description && <p className="text-xs text-muted-foreground truncate">{tx.description}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${isCredit ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isCredit ? '+' : ''}{tx.amount} MC
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
