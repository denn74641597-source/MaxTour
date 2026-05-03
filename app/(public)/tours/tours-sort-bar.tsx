'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

const SORT_OPTIONS = [
  { key: 'newest', labelKey: 'newest' as const },
  { key: 'price_asc', labelKey: 'sortCheapest' as const },
  { key: 'price_desc', labelKey: 'sortExpensive' as const },
  { key: 'popular', labelKey: 'sortPopular' as const },
  { key: 'reviewed', labelKey: 'sortReviewed' as const },
] as const;

export function ToursSortBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const activeSort = searchParams.get('sort') ?? 'newest';

  function handleSort(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === 'newest') {
      params.delete('sort');
    } else {
      params.set('sort', key);
    }
    router.push(`/tours?${params.toString()}`);
  }

  const labels: Record<string, string> = {
    newest: t.common.sortBy,
    price_asc: t.tourFilter.sortCheapest,
    price_desc: t.tourFilter.sortExpensive,
    popular: t.tourFilter.sortPopular,
    reviewed: t.tourFilter.sortReviewed,
  };

  return (
    <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar">
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => handleSort(opt.key)}
          className={cn(
            'shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition-colors',
            activeSort === opt.key
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 market-subtle-border hover:bg-slate-100'
          )}
        >
          {labels[opt.key]}
        </button>
      ))}
    </div>
  );
}
