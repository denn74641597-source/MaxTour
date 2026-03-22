import { getTours } from '@/features/tours/queries';
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
  try {
    tours = await getTours(filters);
  } catch (error) {
    console.error('ToursPage data fetch error:', error);
  }

  return <ToursContent tours={tours} />;
}
