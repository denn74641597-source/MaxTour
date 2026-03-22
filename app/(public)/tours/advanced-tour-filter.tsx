'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { MealType } from '@/types';

const MONTHS = [
  { value: '01', labelKey: 'Yanvar' },
  { value: '02', labelKey: 'Fevral' },
  { value: '03', labelKey: 'Mart' },
  { value: '04', labelKey: 'Aprel' },
  { value: '05', labelKey: 'May' },
  { value: '06', labelKey: 'Iyun' },
  { value: '07', labelKey: 'Iyul' },
  { value: '08', labelKey: 'Avgust' },
  { value: '09', labelKey: 'Sentabr' },
  { value: '10', labelKey: 'Oktabr' },
  { value: '11', labelKey: 'Noyabr' },
  { value: '12', labelKey: 'Dekabr' },
];

const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Nonushta' },
  { value: 'half_board', label: 'Yarim pansion' },
  { value: 'full_board', label: 'To\'liq pansion' },
  { value: 'all_inclusive', label: 'Hammasi kiritilgan' },
];

export function AdvancedTourFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const [destination, setDestination] = useState(searchParams.get('country') ?? '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const [month, setMonth] = useState(searchParams.get('month') ?? '');
  const [meal, setMeal] = useState(searchParams.get('meal') ?? '');

  function handleSearch() {
    const params = new URLSearchParams();
    if (destination) params.set('country', destination);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (month) params.set('month', month);
    if (meal) params.set('meal', meal);
    router.push(`/tours?${params.toString()}`);
    setExpanded(false);
  }

  function handleReset() {
    setDestination('');
    setMinPrice('');
    setMaxPrice('');
    setMonth('');
    setMeal('');
    router.push('/tours');
    setExpanded(false);
  }

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl font-bold text-sm shadow-ambient hover:shadow-ambient-lg transition-all"
      >
        <Sparkles className="h-4 w-4" />
        {t.tourFilter.findPerfectTour}
      </button>

      {expanded && (
        <div className="mt-3 bg-surface rounded-[1.5rem] shadow-ambient-lg p-4 space-y-4">
          {/* Destination */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              {t.tourFilter.destination}
            </label>
            <Input
              placeholder={t.tourFilter.destinationPlaceholder}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          {/* Budget Range */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              {t.tourFilter.budget} ($)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={t.tourFilter.budgetFrom}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder={t.tourFilter.budgetTo}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Month */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              {t.tourFilter.month}
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {MONTHS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMonth(month === m.value ? '' : m.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    month === m.value
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-muted-foreground hover:bg-muted'
                  )}
                >
                  {m.labelKey}
                </button>
              ))}
            </div>
          </div>

          {/* Meal Type */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              {t.tourFilter.boardType}
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {MEAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMeal(meal === opt.value ? '' : opt.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    meal === opt.value
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-muted-foreground hover:bg-muted'
                  )}
                >
                  {t.mealTypes[opt.value as keyof typeof t.mealTypes]}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSearch} className="flex-1 gap-2">
              <Search className="h-4 w-4" />
              {t.tourFilter.searchTours}
            </Button>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <X className="h-4 w-4" />
              {t.tourFilter.resetFilters}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
