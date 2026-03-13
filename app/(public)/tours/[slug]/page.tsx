import { notFound } from 'next/navigation';
import { getTourBySlug } from '@/features/tours/queries';
import { TourDetailContent } from './tour-detail-content';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) return { title: 'Tour Not Found' };
  return {
    title: tour.title,
    description: tour.short_description ?? `${tour.title} — ${tour.country}`,
  };
}

export default async function TourDetailsPage({ params }: Props) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  return <TourDetailContent tour={tour} />;
}
