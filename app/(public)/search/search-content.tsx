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
    <div className="space-y-5">
      <section className="market-section p-4 md:p-6">
        <p className="market-kicker">{t.search.title}</p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">{t.search.searchForTours}</h1>
        <div className="mt-4">
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
      </section>

      {query ? (
        tours.length > 0 ? (
          <section className="market-section p-4 md:p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              {tours.length} {t.search.resultsFor} &quot;{query}&quot;
            </p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          </section>
        ) : (
          <div className="market-section p-6 md:p-8">
            <EmptyState
              title={t.search.noResults}
              description={`"${query}" ${t.search.noResultsFor}`}
            />
          </div>
        )
      ) : (
        <div className="market-section p-6 md:p-8">
          <EmptyState
            icon={<SearchIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />}
            title={t.search.searchForTours}
            description={t.search.searchHint}
          />
        </div>
      )}
    </div>
  );
}
