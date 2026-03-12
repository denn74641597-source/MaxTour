import { Suspense } from 'react';
import { SearchBar } from '@/components/shared/search-bar';
import { FilterChips } from '@/components/shared/filter-chips';
import { TourCard } from '@/components/shared/tour-card';
import { EmptyState } from '@/components/shared/empty-state';
import { TourListSkeleton } from '@/components/shared/loading-skeleton';
import { getTours } from '@/features/tours/queries';
import { Search as SearchIcon } from 'lucide-react';

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q ?? '';

  const tours = query ? await getTours({ search: query }) : [];

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-lg font-bold">Search</h1>
      <Suspense>
        <SearchBar />
      </Suspense>

      {query ? (
        tours.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              {tours.length} result{tours.length !== 1 ? 's' : ''} for "{query}"
            </p>
            <div className="grid grid-cols-2 gap-3">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="No results"
            description={`Nothing found for "${query}". Try a different search.`}
          />
        )
      ) : (
        <EmptyState
          icon={<SearchIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />}
          title="Search for tours"
          description="Enter a destination, tour name, or keyword."
        />
      )}
    </div>
  );
}
