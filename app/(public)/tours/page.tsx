import { Suspense } from 'react';
import { SearchBar } from '@/components/shared/search-bar';
import { TourCard } from '@/components/shared/tour-card';
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

  const tours = await getTours(filters);

  return (
    <div className="px-4 py-4 space-y-4">
      <Suspense>
        <SearchBar />
      </Suspense>

      <Suspense>
        <ToursFilterBar />
      </Suspense>

      {tours.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No tours found"
          description="Try adjusting your filters or search query."
        />
      )}
    </div>
  );
}
