'use client';

import { Suspense } from 'react';
import { SearchBar } from '@/components/shared/search-bar';
import { TourCardHorizontal } from '@/components/shared/tour-card-horizontal';
import { AgencyCard } from '@/components/shared/agency-card';
import { HeroBanner } from '@/components/shared/hero-banner';
import { PopularDestinations } from '@/components/shared/popular-destinations';
import { EmptyState } from '@/components/shared/empty-state';
import { useTranslation } from '@/lib/i18n';
import { HomeFilterChipsClient } from '../home-filter-chips';
import type { Tour, Agency } from '@/types';

interface HomeContentProps {
  featuredTours: Tour[];
  recentTours: Tour[];
  agencies: Agency[];
}

export function HomeContent({ featuredTours, recentTours, agencies }: HomeContentProps) {
  const { t } = useTranslation();

  const heroTour = featuredTours[0] ?? recentTours[0];
  const hotDeals = recentTours.slice(0, 6);

  return (
    <div className="px-4 pb-6">
      {/* Search Bar */}
      <div className="mt-2 mb-5">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      {/* Quick Filter Chips */}
      <div className="mb-8">
        <Suspense>
          <HomeFilterChipsClient />
        </Suspense>
      </div>

      {/* Hero Banner */}
      {heroTour && <div className="mb-10"><HeroBanner tour={heroTour} /></div>}

      {/* Popular Destinations — will show when destinations data is available */}
      <div className="mb-10"><PopularDestinations /></div>

      {/* Verified Agencies */}
      {agencies.length > 0 && (
        <section className="mb-10">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{t.home.verifiedAgencies}</h3>
          <div className="flex gap-6 overflow-x-auto no-scrollbar items-center py-2 -mx-4 px-4">
            {agencies.map((agency) => (
              <AgencyCard key={agency.id} agency={agency} />
            ))}
          </div>
        </section>
      )}

      {/* Hot Deals */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">{t.home.hotDeals}</h3>
          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold uppercase animate-pulse">
            {t.common.liveNow}
          </span>
        </div>
        {hotDeals.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {hotDeals.map((tour) => (
              <TourCardHorizontal key={tour.id} tour={tour} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t.tours.noToursFound}
            description={t.tours.noToursHint}
          />
        )}
      </section>
    </div>
  );
}
