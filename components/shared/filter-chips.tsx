'use client';

import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/telegram';
import { TOUR_CATEGORIES } from '@/types';
import { useTranslation } from '@/lib/i18n';
import {
  Umbrella, HeartHandshake, Users, Heart, Wallet,
  Crown, ShieldCheck, Mountain, Landmark,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Beach: Umbrella,
  Umrah: Landmark,
  Family: Users,
  Honeymoon: Heart,
  Budget: Wallet,
  Premium: Crown,
  'Visa-free': ShieldCheck,
  Adventure: Mountain,
  Cultural: Landmark,
};

interface FilterChipsProps {
  selected?: string;
  onSelect: (category: string | undefined) => void;
}

export function FilterChips({ selected, onSelect }: FilterChipsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
      {TOUR_CATEGORIES.map((cat) => {
        const Icon = CATEGORY_ICONS[cat] ?? HeartHandshake;
        const isActive = selected === cat;
        const label = t.categories[cat] ?? cat;
        return (
          <button
            key={cat}
            onClick={() => { hapticFeedback('light'); onSelect(isActive ? undefined : cat); }}
            className={cn(
              'flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-white font-semibold'
                : 'bg-white text-slate-700 border border-slate-100 hover:border-primary/30'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
