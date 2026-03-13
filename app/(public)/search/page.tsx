import { getTours } from '@/features/tours/queries';
import { SearchContent } from './search-content';

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q ?? '';

  const tours = query ? await getTours({ search: query }) : [];

  return <SearchContent tours={tours} query={query} />;
}
