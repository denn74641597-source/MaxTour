import { notFound } from 'next/navigation';
import { getAgencyBySlug, getAgencyReviews, getAgencyFollowersCount } from '@/features/agencies/queries';
import { getToursByAgency } from '@/features/tours/queries';
import { incrementAgencyViews } from '@/features/agencies/actions';
import { AgencyProfileContent } from './agency-profile-content';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) return { title: 'Agency Not Found' };

  const description = agency.description ?? `${agency.name} — travel agency`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  return {
    title: agency.name,
    description,
    openGraph: {
      title: agency.name,
      description,
      type: 'profile',
      url: `${appUrl}/agencies/${slug}`,
      ...(agency.logo_url ? { images: [{ url: agency.logo_url }] } : {}),
    },
  };
}

export default async function AgencyProfilePage({ params }: Props) {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) notFound();

  const [tours, reviews, , followersCount] = await Promise.all([
    getToursByAgency(agency.id),
    getAgencyReviews(agency.id),
    incrementAgencyViews(agency.id),
    getAgencyFollowersCount(agency.id),
  ]);

  return <AgencyProfileContent agency={agency} tours={tours} reviews={reviews} followersCount={followersCount} />;
}
