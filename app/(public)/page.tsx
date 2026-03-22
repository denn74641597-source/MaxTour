import { getFeaturedTours, getTours, getPopularTours } from '@/features/tours/queries';
import { getVerifiedAgencies, getTopRatedAgencies } from '@/features/agencies/queries';
import { HomeContent } from './home/home-content';

export default async function HomePage() {
  let featuredTours: Awaited<ReturnType<typeof getFeaturedTours>> = [];
  let recentTours: Awaited<ReturnType<typeof getTours>> = [];
  let agencies: Awaited<ReturnType<typeof getVerifiedAgencies>> = [];
  let topAgencies: Awaited<ReturnType<typeof getTopRatedAgencies>> = [];
  let popularTours: Awaited<ReturnType<typeof getPopularTours>> = [];
  let hotTours: Awaited<ReturnType<typeof getTours>> = [];

  try {
    [featuredTours, recentTours, agencies, topAgencies, popularTours, hotTours] = await Promise.all([
      getFeaturedTours(),
      getTours({ sortBy: 'newest', limit: 20 }),
      getVerifiedAgencies(6),
      getTopRatedAgencies(6),
      getPopularTours(10),
      getTours({ sortBy: 'price_asc', limit: 20 }),
    ]);
  } catch (error) {
    console.error('HomePage data fetch error:', error);
  }

  return (
    <HomeContent
      featuredTours={featuredTours}
      recentTours={recentTours}
      agencies={agencies}
      topAgencies={topAgencies}
      popularTours={popularTours}
      hotTours={hotTours}
    />
  );
}
