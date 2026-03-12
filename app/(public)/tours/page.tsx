import { Suspense } from 'react';
import { SearchBar } from '@/components/shared/search-bar';
import { TourCardCatalog } from '@/components/shared/tour-card-catalog';
import { EmptyState } from '@/components/shared/empty-state';
import { TourListSkeleton } from '@/components/shared/loading-skeleton';
import { getTours } from '@/features/tours/queries';
import { ToursFilterBar } from './tours-filter-bar';
import type { TourFilters } from '@/types';

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ToursPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters: TourFilters = {
    search: params.q,
    country: params.country,
    sortBy: (params.sort as TourFilters['sortBy']) ?? 'newest',
    visaFree: params.visaFree === 'true',
  };

  let tours: Awaited<ReturnType<typeof getTours>> = [];
  try {
    tours = await getTours(filters);
  } catch (error) {
    console.error('ToursPage data fetch error:', error);
  }

  return (
    <div>
      {/* Sticky search + filters header area */}
      <div className="sticky top-[56px] z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="px-4 py-3">
          <Suspense>
            <SearchBar
              placeholder="Search tours, destinations..."
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
        {tours.length > 0 ? (
          tours.map((tour) => (
            <TourCardCatalog key={tour.id} tour={tour} />
          ))
        ) : (
          <EmptyState
            title="No tours found"
            description="Try adjusting your filters or search query."
          />
        )}
      </div>
    </div>
  );
}
