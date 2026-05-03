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
    <div className="space-y-5">
      <section className="market-section p-4 md:p-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="market-kicker">{t.nav.tours}</p>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t.tours.allDestinations}</h1>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {tours.length}
          </span>
        </div>
        <div className="mb-4">
          <Suspense>
            <SearchBar placeholder={t.search.placeholder} variant="compact" />
          </Suspense>
        </div>
        <div className="space-y-3">
          <Suspense>
            <ToursFilterBar />
          </Suspense>
          <Suspense>
            <ToursSortBar />
          </Suspense>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="market-section p-4 md:p-5">
          <p className="market-kicker mb-2">{t.tours.priceRange}</p>
          <Suspense>
            <AdvancedTourFilter />
          </Suspense>
        </aside>

        <section className="space-y-5">
          {tours.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {tours.map((tour) => (
                <TourCardCatalog
                  key={tour.id}
                  tour={tour}
                  isPromoted={promotions.featured.includes(tour.id)}
                  isHotDeal={promotions.hotDeals.includes(tour.id)}
                  isHotTour={promotions.hotTours.includes(tour.id)}
                />
              ))}
            </div>
          ) : (
            <div className="market-section p-6 md:p-8">
              <EmptyState title={t.tours.noToursFound} description={t.tours.noToursHint} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
