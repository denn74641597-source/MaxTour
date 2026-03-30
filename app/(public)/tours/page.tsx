import { getTours, getActivePromotionsByType } from '@/features/tours/queries';
import { notifySystemError } from '@/lib/telegram/admin-bot';
import { ToursContent } from './tours-content';
import type { TourFilters } from '@/types';

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ToursPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters: TourFilters = {
    search: params.q,
    country: params.country,
    category: params.category,
    sortBy: (params.sort as TourFilters['sortBy']) ?? 'newest',
    visaFree: params.visaFree === 'true',
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    meal: params.meal as TourFilters['meal'],
    departureFrom: params.month ? `${new Date().getFullYear()}-${params.month}-01` : undefined,
    departureTo: params.month ? `${new Date().getFullYear()}-${params.month}-31` : undefined,
  };

  let tours: Awaited<ReturnType<typeof getTours>> = [];
  let promotions: { featured: string[]; hotDeals: string[]; hotTours: string[] } = { featured: [], hotDeals: [], hotTours: [] };
  try {
    [tours, promotions] = await Promise.all([
      getTours(filters),
      getActivePromotionsByType(),
    ]);
  } catch (error) {
    console.error('ToursPage data fetch error:', error);
    await notifySystemError({ source: 'Page: ToursPage', message: error instanceof Error ? error.message : 'Data fetch error' });
  }

  return <ToursContent tours={tours} promotions={promotions} />;
}
