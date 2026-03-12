'use client';

import { useRouter } from 'next/navigation';
import { FilterChips } from '@/components/shared/filter-chips';

export function HomeFilterChipsClient() {
  const router = useRouter();

  function handleSelect(category: string | undefined) {
    if (category) {
      router.push(`/tours?category=${encodeURIComponent(category)}`);
    }
  }

  return <FilterChips onSelect={handleSelect} />;
}
