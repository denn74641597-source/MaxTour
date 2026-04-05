'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useMouseDragScroll } from '@/hooks/use-mouse-drag-scroll';

export function ToursFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get('filter') ?? 'all';
  const { t } = useTranslation();
  const scrollRef = useMouseDragScroll<HTMLDivElement>();

  const FILTER_CHIPS = [
    { key: 'all', label: t.tours.allDestinations },
    { key: 'price', label: t.tours.priceRange, hasDropdown: true },
    { key: 'duration', label: t.tours.filterDuration, hasDropdown: true },
    { key: 'verified', label: t.tours.filterVerified, icon: VerifiedBadge },
  ] as const;

  function handleFilter(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === 'all') {
      params.delete('filter');
      params.delete('verified');
    } else if (key === 'verified') {
      const current = params.get('verified');
      if (current === 'true') {
        params.delete('verified');
      } else {
        params.set('verified', 'true');
      }
    } else {
      params.set('filter', key);
    }
    router.push(`/tours?${params.toString()}`);
  }

  const isVerifiedActive = searchParams.get('verified') === 'true';

  return (
    <div ref={scrollRef} className="flex gap-2 overflow-x-auto no-scrollbar py-1 cursor-grab active:cursor-grabbing">
      {FILTER_CHIPS.map((chip) => {
        const isActive =
          chip.key === 'all'
            ? !searchParams.get('filter') && !isVerifiedActive
            : chip.key === 'verified'
              ? isVerifiedActive
              : activeFilter === chip.key;

        return (
          <button
            key={chip.key}
            onClick={() => handleFilter(chip.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0',
              isActive
                ? 'bg-primary text-white font-semibold'
                : 'bg-secondary text-muted-foreground hover:bg-muted'
            )}
          >
            {chip.label}
            {'hasDropdown' in chip && chip.hasDropdown && (
              <ChevronDown className="h-3 w-3" />
            )}
            {'icon' in chip && chip.icon && (
              <chip.icon className="h-3 w-3" />
            )}
          </button>
        );
      })}
    </div>
  );
}
