'use client';

import { cn } from '@/lib/utils';
import { TOUR_CATEGORIES } from '@/types';
import { useTranslation } from '@/lib/i18n';

interface FilterChipsProps {
  selected?: string;
  onSelect: (category: string | undefined) => void;
}

export function FilterChips({ selected, onSelect }: FilterChipsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
      {TOUR_CATEGORIES.map((cat) => {
        const isActive = selected === cat;
        const label = t.tourCategories[cat as keyof typeof t.tourCategories] ?? t.categories[cat] ?? cat;
        return (
          <button
            key={cat}
            onClick={() => onSelect(isActive ? undefined : cat)}
            className={cn(
              'flex h-10 shrink-0 items-center justify-center rounded-full px-5 text-sm font-medium transition-all',
              isActive
                ? 'bg-primary text-primary-foreground font-semibold shadow-ambient'
                : 'bg-secondary text-foreground hover:bg-surface-container-high'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
