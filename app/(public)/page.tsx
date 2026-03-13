import { getFeaturedTours, getTours } from '@/features/tours/queries';
import { getVerifiedAgencies } from '@/features/agencies/queries';
import { HomeContent } from './home/home-content';

export default async function HomePage() {
  let featuredTours: Awaited<ReturnType<typeof getFeaturedTours>> = [];
  let recentTours: Awaited<ReturnType<typeof getTours>> = [];
  let agencies: Awaited<ReturnType<typeof getVerifiedAgencies>> = [];

  try {
    [featuredTours, recentTours, agencies] = await Promise.all([
      getFeaturedTours(),
      getTours({ sortBy: 'newest' }),
      getVerifiedAgencies(6),
    ]);
  } catch (error) {
    console.error('HomePage data fetch error:', error);
  }

  return (
    <HomeContent
      featuredTours={featuredTours}
      recentTours={recentTours}
      agencies={agencies}
    />
  );
}
