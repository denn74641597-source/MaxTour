'use client';

import { Suspense } from 'react';
import { SearchBar } from '@/components/shared/search-bar';
import { TourCardCatalog } from '@/components/shared/tour-card-catalog';
import { EmptyState } from '@/components/shared/empty-state';
import { useTranslation } from '@/lib/i18n';
import { ToursFilterBar } from './tours-filter-bar';
import { ToursSortBar } from './tours-sort-bar';
import { AdvancedTourFilter } from './advanced-tour-filter';
import type { Tour } from '@/types';

interface ToursContentProps {
  tours: Tour[];
  promotions?: { featured: string[]; hotDeals: string[]; hotTours: string[] };
}

export function ToursContent({ tours, promotions = { featured: [], hotDeals: [], hotTours: [] } }: ToursContentProps) {
  const { t } = useTranslation();

  return (
    <div>
      {/* Sticky search + filters header area */}
      <div className="sticky top-[56px] z-40 glass-nav">
        <div className="px-6 py-3">
          <Suspense>
            <SearchBar
              placeholder={t.search.placeholder}
              variant="compact"
            />
          </Suspense>
        </div>
        <div className="px-4 pb-4">
          <Suspense>
            <ToursFilterBar />
          </Suspense>
        </div>
      </div>

      {/* Advanced Filter + Sort */}
      <div className="px-4 pt-3">
        <Suspense>
          <AdvancedTourFilter />
        </Suspense>
        <Suspense>
          <ToursSortBar />
        </Suspense>
      </div>

      {/* Tour list */}
      <div className="p-4 space-y-6 md:grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 md:gap-6 md:space-y-0 lg:max-w-7xl lg:mx-auto">
        {tours.length > 0 ? (
          tours.map((tour) => (
            <TourCardCatalog
              key={tour.id}
              tour={tour}
              isPromoted={promotions.featured.includes(tour.id)}
              isHotDeal={promotions.hotDeals.includes(tour.id)}
              isHotTour={promotions.hotTours.includes(tour.id)}
            />
          ))
        ) : (
          <div className="md:col-span-2 lg:col-span-2 xl:col-span-3 2xl:col-span-4">
            <EmptyState
              title={t.tours.noToursFound}
              description={t.tours.noToursHint}
            />
          </div>
        )}
      </div>
    </div>
  );
}
