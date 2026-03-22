import { getFeaturedTours, getTours } from '@/features/tours/queries';
import { getVerifiedAgencies, getTopRatedAgencies } from '@/features/agencies/queries';
import { HomeContent } from './home/home-content';

export default async function HomePage() {
  let featuredTours: Awaited<ReturnType<typeof getFeaturedTours>> = [];
  let recentTours: Awaited<ReturnType<typeof getTours>> = [];
  let agencies: Awaited<ReturnType<typeof getVerifiedAgencies>> = [];
  let topAgencies: Awaited<ReturnType<typeof getTopRatedAgencies>> = [];

  try {
    [featuredTours, recentTours, agencies, topAgencies] = await Promise.all([
      getFeaturedTours(),
      getTours({ sortBy: 'newest', limit: 6 }),
      getVerifiedAgencies(6),
      getTopRatedAgencies(6),
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
    />
  );
}
