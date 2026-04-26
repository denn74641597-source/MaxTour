import { AgencyCard } from '@/components/shared/agency-card';
import { PopularDestinations } from '@/components/shared/popular-destinations';
import { HorizontalScroll } from '@/components/shared/horizontal-scroll';
import { MapHeroShowcase, AgenciesHeading } from './home-client';
import type { Tour, Agency } from '@/types';

interface HomeContentProps {
  featuredTours: Tour[];
  popularTours?: Tour[];
}

export function HomeContent({ featuredTours, popularTours = [] }: HomeContentProps) {
  return (
    <>
      <div className="mt-0 mb-10">
        <MapHeroShowcase tours={featuredTours} fallbackTours={popularTours} />
      </div>

      {/* Popular Destinations (dynamic - most viewed tours) */}
      <div className="mb-10 home-enter-up home-enter-delay-2">
        <PopularDestinations tours={popularTours} />
      </div>
    </>
  );
}

/* --- Server-rendered section wrapper --- */

export function HomeAgenciesSection({ agencies }: { agencies: Agency[] }) {
  if (agencies.length === 0) return null;
  return (
    <section className="mb-10 home-enter-up home-enter-delay-3">
      <AgenciesHeading />
      <HorizontalScroll className="gap-5 items-start py-1">
        {agencies.map((agency) => (
          <AgencyCard key={agency.id} agency={agency} />
        ))}
      </HorizontalScroll>
    </section>
  );
}
