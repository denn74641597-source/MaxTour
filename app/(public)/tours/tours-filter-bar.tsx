'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const FILTER_CHIPS = [
  { key: 'all', label: 'All Destinations' },
  { key: 'price', label: 'Price Range', hasDropdown: true },
  { key: 'duration', label: 'Duration', hasDropdown: true },
  { key: 'verified', label: 'Verified', icon: BadgeCheck },
] as const;

export function ToursFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get('filter') ?? 'all';

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
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
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
                : 'bg-slate-100 text-slate-600 border border-transparent hover:border-slate-200'
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
