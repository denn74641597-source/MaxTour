import { getMyAgency } from '@/features/agencies/queries';
import { getMaxCoinBalance, getPromotionTiers, getActivePromotions, getMaxCoinTransactions } from '@/features/maxcoin/queries';
import { getToursByAgency } from '@/features/tours/queries';
import { redirect } from 'next/navigation';
import { AdvertisingContent } from './advertising-content';

export default async function AdvertisingPage() {
  const agency = await getMyAgency();
  if (!agency) redirect('/agency');

  const [balance, tiers, activePromotions, transactions, tours] = await Promise.all([
    getMaxCoinBalance(agency.id),
    getPromotionTiers(),
    getActivePromotions(agency.id),
    getMaxCoinTransactions(agency.id),
    getToursByAgency(agency.id),
  ]);

  return (
    <AdvertisingContent
      agencyId={agency.id}
      balance={balance}
      tiers={tiers}
      activePromotions={activePromotions}
      transactions={transactions}
      tours={tours}
    />
  );
}
