'use client';

import { Suspense } from 'react';
import { SearchBar } from '@/components/shared/search-bar';
import { TourCard } from '@/components/shared/tour-card';
import { EmptyState } from '@/components/shared/empty-state';
import { useTranslation } from '@/lib/i18n';
import { Search as SearchIcon } from 'lucide-react';
import type { Tour } from '@/types';

interface SearchContentProps {
  tours: Tour[];
  query: string;
}

export function SearchContent({ tours, query }: SearchContentProps) {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-lg font-bold">{t.search.title}</h1>
      <Suspense>
        <SearchBar />
      </Suspense>

      {query ? (
        tours.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              {tours.length} {t.search.resultsFor} &quot;{query}&quot;
            </p>
            <div className="grid grid-cols-2 gap-3">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title={t.search.noResults}
            description={`"${query}" ${t.search.noResultsFor}`}
          />
        )
      ) : (
        <EmptyState
          icon={<SearchIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />}
          title={t.search.searchForTours}
          description={t.search.searchHint}
        />
      )}
    </div>
  );
}
