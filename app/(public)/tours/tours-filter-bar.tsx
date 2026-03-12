'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FilterChips } from '@/components/shared/filter-chips';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ToursFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') ?? undefined;
  const currentSort = searchParams.get('sort') ?? 'newest';

  function updateParams(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/tours?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <FilterChips
        selected={currentCategory}
        onSelect={(cat) => updateParams('category', cat)}
      />
      <div className="flex justify-end">
        <Select
          value={currentSort}
          onValueChange={(val) => updateParams('sort', val ?? undefined)}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low → High</SelectItem>
            <SelectItem value="price_desc">Price: High → Low</SelectItem>
            <SelectItem value="date_asc">Departure: Soonest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
