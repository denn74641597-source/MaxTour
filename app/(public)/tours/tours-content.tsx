'use client';

import { Suspense, useMemo } from 'react';
import { SearchBar } from '@/components/shared/search-bar';
import { TourCardCatalog } from '@/components/shared/tour-card-catalog';
import { EmptyState } from '@/components/shared/empty-state';
import { useTranslation } from '@/lib/i18n';
import { useFollows } from '@/hooks/use-follows';
import { ToursFilterBar } from './tours-filter-bar';
import type { Tour } from '@/types';

interface ToursContentProps {
  tours: Tour[];
}

export function ToursContent({ tours }: ToursContentProps) {
  const { t } = useTranslation();
  const { followedAgencyIds, loading: followsLoading } = useFollows();

  // Filter tours by followed agencies (if user follows any)
  const filteredTours = useMemo(() => {
    if (followsLoading || followedAgencyIds.length === 0) return tours;
    return tours.filter((tour) => followedAgencyIds.includes(tour.agency_id));
  }, [tours, followedAgencyIds, followsLoading]);

  return (
    <div>
      {/* Sticky search + filters header area */}
      <div className="sticky top-[56px] z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="px-4 py-3">
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

      {/* Tour list */}
      <div className="p-4 space-y-6">
        {filteredTours.length > 0 ? (
          filteredTours.map((tour) => (
            <TourCardCatalog key={tour.id} tour={tour} />
          ))
        ) : (
          <EmptyState
            title={t.tours.noToursFound}
            description={t.tours.noToursHint}
          />
        )}
      </div>
    </div>
  );
}
