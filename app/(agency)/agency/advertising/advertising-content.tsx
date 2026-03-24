'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coins, Star, Flame, TrendingUp, Eye, Zap, ShoppingCart, Shield } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { purchaseMaxCoins, promoteTour, COIN_PRICE_UZS } from '@/features/maxcoin/actions';
import { toast } from 'sonner';
import type { Tour, PromotionTier, TourPromotion, MaxCoinTransaction, PromotionPlacement } from '@/types';

interface AdvertisingContentProps {
  agencyId: string;
  balance: number;
  tiers: PromotionTier[];
  activePromotions: TourPromotion[];
  transactions: MaxCoinTransaction[];
  tours: Tour[];
}

export function AdvertisingContent({
  agencyId, balance: initialBalance, tiers, activePromotions: initialPromos, transactions: initialTx, tours,
}: AdvertisingContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [activeTab, setActiveTab] = useState<'main' | 'buy' | 'history'>('main');
  const [sliderValue, setSliderValue] = useState(5);
  const [buying, setBuying] = useState(false);

  // Promote state
  const [selectedTour, setSelectedTour] = useState('');
  const [selectedPlacement, setSelectedPlacement] = useState<PromotionPlacement>('featured');
  const [selectedTierId, setSelectedTierId] = useState('');
  const [promoting, setPromoting] = useState(false);

  const placementTiers = tiers.filter(t => t.placement === selectedPlacement);
  const selectedTier = tiers.find(t => t.id === selectedTierId);

  // Auto-calculate price
  const totalPrice = sliderValue * COIN_PRICE_UZS;

  async function handleBuy() {
    if (sliderValue < 5 || sliderValue > 200) return;
    setBuying(true);
    const result = await purchaseMaxCoins(agencyId, sliderValue);
    setBuying(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`${sliderValue} MC qo'shildi!`);
      if (result.newBalance !== undefined) setBalance(result.newBalance);
      router.refresh();
    }
  }

  async function handlePromote() {
    if (!selectedTour || !selectedTierId) return;
    setPromoting(true);
    const result = await promoteTour(agencyId, selectedTour, selectedTierId);
    setPromoting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Tur muvaffaqiyatli reklama qilindi!');
      if (result.newBalance !== undefined) setBalance(result.newBalance);
      setSelectedTierId('');
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

      {/* Main Tab */}
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
                  {(['featured', 'hot_deals', 'hot_tours'] as PromotionPlacement[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => { setSelectedPlacement(p); setSelectedTierId(''); }}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedPlacement === p
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-muted bg-surface-container-low text-foreground'
                      }`}
                    >
                      <div className="flex justify-center mb-1">{placementIcons[p]}</div>
                      <p className="text-[10px] font-semibold leading-tight">{placementLabels[p]}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tier selection */}
              <div>
                <label className="text-xs text-muted-foreground font-medium">{t.maxcoin.days}</label>
                <div className="flex flex-col gap-2 mt-1.5">
                  {placementTiers.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTierId(tier.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        selectedTierId === tier.id
                          ? 'border-primary bg-primary/5'
                          : 'border-muted bg-surface-container-low'
                      }`}
                    >
                      <span className={`text-sm font-semibold ${selectedTierId === tier.id ? 'text-primary' : 'text-foreground'}`}>
                        {tier.days} {t.maxcoin.days}
                      </span>
                      <span className={`text-sm font-bold ${selectedTierId === tier.id ? 'text-primary' : 'text-muted-foreground'}`}>
                        {tier.coins} MC
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost summary */}
              {selectedTier && (
                <div className="flex items-center justify-between bg-primary/5 rounded-xl p-3">
                  <span className="text-sm font-medium text-foreground">{t.maxcoin.totalCost}</span>
                  <span className="text-lg font-bold text-primary">{selectedTier.coins} MC / {selectedTier.days} {t.maxcoin.days}</span>
                </div>
              )}

              {/* Promote button */}
              <button
                onClick={handlePromote}
                disabled={!selectedTour || !selectedTierId || promoting || (selectedTier ? balance < selectedTier.coins : true)}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {promoting ? '...' : (selectedTier && balance < selectedTier.coins) ? t.maxcoin.insufficientBalance : t.maxcoin.promoteNow}
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

      {/* Buy Tab */}
      {activeTab === 'buy' && (
        <div className="px-6 mt-6 space-y-6">
          <button onClick={() => setActiveTab('main')} className="text-sm text-primary font-medium">
            ← {t.maxcoin.title}
          </button>

          <div className="bg-surface rounded-2xl p-6 shadow-ambient text-center">
            <h2 className="text-xl font-bold text-foreground">{t.maxcoin.purchaseTitle}</h2>
            <p className="text-muted-foreground text-sm mt-1">{t.maxcoin.purchaseSubtitle}</p>

            {/* Coin display */}
            <div className="mt-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6">
              <p className="text-4xl font-bold text-primary">{sliderValue}</p>
              <p className="text-sm font-semibold text-primary/80">{t.maxcoin.coins}</p>
            </div>

            {/* Slider */}
            <div className="mt-5">
              <input
                type="range"
                min={5}
                max={200}
                step={3}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>5</span>
                <span>50</span>
                <span>100</span>
                <span>150</span>
                <span>200</span>
              </div>
            </div>

            {/* Auto-calculated price */}
            <div className="mt-4 bg-surface-container-low rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.maxcoin.totalCost}</span>
                <span className="text-lg font-bold text-foreground">{totalPrice.toLocaleString()} UZS</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t.maxcoin.pricePerCoin}</span>
                <span className="text-xs text-muted-foreground">{COIN_PRICE_UZS.toLocaleString()} UZS</span>
              </div>
            </div>

            {/* Buy button */}
            <button
              onClick={handleBuy}
              disabled={buying}
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

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="px-6 mt-6 space-y-4">
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
