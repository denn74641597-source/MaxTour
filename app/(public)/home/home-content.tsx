import { Suspense } from 'react';
import { SearchBar } from '@/components/shared/search-bar';
import { AgencyCard } from '@/components/shared/agency-card';
import { PopularDestinations } from '@/components/shared/popular-destinations';
import { HorizontalScroll } from '@/components/shared/horizontal-scroll';
import { CategoryChips, RotatingHero, AgenciesHeading } from './home-client';
import type { Tour, Agency } from '@/types';

interface HomeContentProps {
  featuredTours: Tour[];
  popularTours?: Tour[];
}

export function HomeContent({ featuredTours, popularTours = [] }: HomeContentProps) {
  return (
    <>
      {/* Search Bar */}
      <div className="mt-4 mb-5">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <CategoryChips />
      </div>

      {/* Hero Banner — rotates featured tours every 5s */}
      {featuredTours.length > 0 && (
        <div className="mb-10">
          <RotatingHero tours={featuredTours} />
        </div>
      )}

      {/* Popular Destinations (dynamic - most viewed tours) */}
      <div className="mb-10">
        <PopularDestinations tours={popularTours} />
      </div>
    </>
  );
}

/* --- Server-rendered section wrapper --- */

export function HomeAgenciesSection({ agencies }: { agencies: Agency[] }) {
  if (agencies.length === 0) return null;
  return (
    <section className="mb-10">
      <AgenciesHeading />
      <HorizontalScroll className="gap-5 items-start py-1">
        {agencies.map((agency) => (
          <AgencyCard key={agency.id} agency={agency} />
        ))}
      </HorizontalScroll>
    </section>
  );
}
