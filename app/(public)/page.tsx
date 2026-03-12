import { Suspense } from 'react';
import Link from 'next/link';
import { SearchBar } from '@/components/shared/search-bar';
import { TourCardHorizontal } from '@/components/shared/tour-card-horizontal';
import { AgencyCard } from '@/components/shared/agency-card';
import { HeroBanner } from '@/components/shared/hero-banner';
import { PopularDestinations } from '@/components/shared/popular-destinations';
import { TourListSkeleton } from '@/components/shared/loading-skeleton';
import { getFeaturedTours, getTours } from '@/features/tours/queries';
import { getVerifiedAgencies } from '@/features/agencies/queries';
import { HomeFilterChipsClient } from './home-filter-chips';

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

  const heroTour = featuredTours[0] ?? recentTours[0];
  const hotDeals = recentTours.slice(0, 6);

  return (
    <div className="px-4 space-y-6">
      {/* Search Bar */}
      <div className="mt-2">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      {/* Quick Filter Chips */}
      <Suspense>
        <HomeFilterChipsClient />
      </Suspense>

      {/* Hero Banner */}
      {heroTour && <HeroBanner tour={heroTour} />}

      {/* Popular Destinations */}
      <PopularDestinations />

      {/* Verified Agencies */}
      {agencies.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Verified Agencies</h3>
          <div className="flex gap-6 overflow-x-auto no-scrollbar items-center py-2 -mx-4 px-4">
            {agencies.map((agency) => (
              <AgencyCard key={agency.id} agency={agency} />
            ))}
          </div>
        </section>
      )}

      {/* Hot Deals */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Hot Deals</h3>
          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold uppercase animate-pulse">
            Live Now
          </span>
        </div>
        {hotDeals.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {hotDeals.map((tour) => (
              <TourCardHorizontal key={tour.id} tour={tour} />
            ))}
          </div>
        ) : (
          <TourListSkeleton count={3} />
        )}
      </section>
    </div>
  );
}
