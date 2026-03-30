import { getFeaturedTours, getTours, getPopularTours, getPromotedTours } from '@/features/tours/queries';
import { getVerifiedAgencies, getTopRatedAgencies } from '@/features/agencies/queries';
import { getMyAgency } from '@/features/agencies/queries';
import { notifySystemError } from '@/lib/telegram/admin-bot';
import { HomeContent } from './home/home-content';
import type { Tour } from '@/types';

export default async function HomePage() {
  let featuredTours: Awaited<ReturnType<typeof getFeaturedTours>> = [];
  let recentTours: Awaited<ReturnType<typeof getTours>> = [];
  let agencies: Awaited<ReturnType<typeof getVerifiedAgencies>> = [];
  let topAgencies: Awaited<ReturnType<typeof getTopRatedAgencies>> = [];
  let popularTours: Awaited<ReturnType<typeof getPopularTours>> = [];
  let promotedFeatured: Tour[] = [];
  let promotedHotDeals: Tour[] = [];
  let promotedHotTours: Tour[] = [];
  let currentAgencyId: string | undefined;

  try {
    [featuredTours, recentTours, agencies, topAgencies, popularTours, promotedFeatured, promotedHotDeals, promotedHotTours] = await Promise.all([
      getFeaturedTours(),
      getTours({ sortBy: 'newest', limit: 20 }),
      getVerifiedAgencies(6),
      getTopRatedAgencies(6),
      getPopularTours(10),
      getPromotedTours('featured'),
      getPromotedTours('hot_deals'),
      getPromotedTours('hot_tours'),
    ]);
    const myAgency = await getMyAgency();
    currentAgencyId = myAgency?.id;
  } catch (error) {
    console.error('HomePage data fetch error:', error);
    await notifySystemError({ source: 'Page: HomePage', message: error instanceof Error ? error.message : 'Data fetch error' });
  }

  return (
    <HomeContent
      featuredTours={promotedFeatured.length > 0 ? promotedFeatured : featuredTours}
      recentTours={recentTours}
      agencies={agencies}
      topAgencies={topAgencies}
      popularTours={popularTours}
      hotDeals={promotedHotDeals}
      hotTours={promotedHotTours}
      currentAgencyId={currentAgencyId}
    />
  );
}
