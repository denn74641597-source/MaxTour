import { getMyAgency } from '@/features/agencies/queries';
import { getMaxCoinBalance, getMaxCoinPackages, getPromotionPricing, getActivePromotions, getMaxCoinTransactions } from '@/features/maxcoin/queries';
import { getToursByAgency } from '@/features/tours/queries';
import { redirect } from 'next/navigation';
import { AdvertisingContent } from './advertising-content';

export default async function AdvertisingPage() {
  const agency = await getMyAgency();
  if (!agency) redirect('/agency');

  const [balance, packages, pricing, activePromotions, transactions, tours] = await Promise.all([
    getMaxCoinBalance(agency.id),
    getMaxCoinPackages(),
    getPromotionPricing(),
    getActivePromotions(agency.id),
    getMaxCoinTransactions(agency.id),
    getToursByAgency(agency.id),
  ]);

  return (
    <AdvertisingContent
      agencyId={agency.id}
      balance={balance}
      packages={packages}
      pricing={pricing}
      activePromotions={activePromotions}
      transactions={transactions}
      tours={tours}
    />
  );
}
