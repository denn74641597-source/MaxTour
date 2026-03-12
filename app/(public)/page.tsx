import { Suspense } from 'react';
import Link from 'next/link';
import { SearchBar } from '@/components/shared/search-bar';
import { SectionHeader } from '@/components/shared/section-header';
import { TourCard } from '@/components/shared/tour-card';
import { AgencyCard } from '@/components/shared/agency-card';
import { TourListSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { getFeaturedTours, getTours } from '@/features/tours/queries';
import { getVerifiedAgencies } from '@/features/agencies/queries';
import { HomeFilterChipsClient } from './home-filter-chips';
import { ChevronRight } from 'lucide-react';

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
    <div className="px-4 py-4 space-y-6">
      {/* Hero / Search */}
      <div className="space-y-3">
        <div>
          <h1 className="text-xl font-bold">Find Your Perfect Tour</h1>
          <p className="text-sm text-muted-foreground">
            Trusted travel agencies in Uzbekistan
          </p>
        </div>
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      {/* Category Chips */}
      <Suspense>
        <HomeFilterChipsClient />
      </Suspense>

      {/* Featured Tours */}
      {featuredTours.length > 0 && (
        <section>
          <SectionHeader
            title="Featured Tours"
            subtitle="Handpicked by MaxTour"
            action={
              <Link href="/tours?featured=true">
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  See all <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            }
          />
          <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4">
            {featuredTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} compact />
            ))}
          </div>
        </section>
      )}

      {/* Verified Agencies */}
      {agencies.length > 0 && (
        <section>
          <SectionHeader title="Verified Agencies" subtitle="Trusted partners" />
          <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4">
            {agencies.map((agency) => (
              <AgencyCard key={agency.id} agency={agency} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended Tours */}
      <section>
        <SectionHeader
          title="Recommended Tours"
          action={
            <Link href="/tours">
              <Button variant="ghost" size="sm" className="text-xs h-7">
                View all <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          }
        />
        {recentTours.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {recentTours.slice(0, 6).map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        ) : (
          <TourListSkeleton count={4} />
        )}
      </section>
    </div>
  );
}
