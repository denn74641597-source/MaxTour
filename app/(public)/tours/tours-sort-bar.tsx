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
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-2">
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => handleSort(opt.key)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0',
            activeSort === opt.key
              ? 'bg-foreground text-background'
              : 'bg-surface-container-low text-muted-foreground hover:bg-muted'
          )}
        >
          {opt.key === 'newest' ? t.common.sortBy : (t.tourFilter as any)[opt.labelKey]}
        </button>
      ))}
    </div>
  );
}
