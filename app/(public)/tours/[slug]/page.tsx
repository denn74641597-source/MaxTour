import { notFound } from 'next/navigation';
import { getTourBySlug, getSimilarTours, incrementTourViewCount } from '@/features/tours/queries';
import { TourDetailContent } from './tour-detail-content';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) return { title: 'Tour Not Found' };

  const description = tour.short_description ?? `${tour.title} — ${tour.country}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  return {
    title: tour.title,
    description,
    openGraph: {
      title: tour.title,
      description,
      type: 'article',
      url: `${appUrl}/tours/${slug}`,
      ...(tour.cover_image_url ? { images: [{ url: tour.cover_image_url }] } : {}),
    },
  };
}

export default async function TourDetailsPage({ params }: Props) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  // Increment view count (fire-and-forget, don't block render)
  incrementTourViewCount(tour.id).catch(() => {});

  const similarTours = await getSimilarTours(tour, 6);

  return <TourDetailContent tour={tour} similarTours={similarTours} />;
}
