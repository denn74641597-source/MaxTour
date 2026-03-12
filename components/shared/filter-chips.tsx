'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TOUR_CATEGORIES, type TourCategory } from '@/types';

interface FilterChipsProps {
  selected?: string;
  onSelect: (category: string | undefined) => void;
}

export function FilterChips({ selected, onSelect }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      {TOUR_CATEGORIES.map((cat) => (
        <Badge
          key={cat}
          variant={selected === cat ? 'default' : 'secondary'}
          className={cn(
            'cursor-pointer whitespace-nowrap shrink-0 text-xs px-3 py-1',
            selected === cat && 'bg-primary text-primary-foreground'
          )}
          onClick={() => onSelect(selected === cat ? undefined : cat)}
        >
          {cat}
        </Badge>
      ))}
    </div>
  );
}
