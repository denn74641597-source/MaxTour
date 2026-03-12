import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, MessageCircle, Globe, Instagram, Star } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SectionHeader } from '@/components/shared/section-header';
import { TourCard } from '@/components/shared/tour-card';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { getAgencyBySlug, getAgencyReviews } from '@/features/agencies/queries';
import { getToursByAgency } from '@/features/tours/queries';
import { placeholderImage } from '@/lib/utils';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) return { title: 'Agency Not Found' };
  return { title: agency.name, description: agency.description ?? `${agency.name} — travel agency` };
}

export default async function AgencyProfilePage({ params }: Props) {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) notFound();

  const [tours, reviews] = await Promise.all([
    getToursByAgency(agency.id),
    getAgencyReviews(agency.id),
  ]);

  const telegramLink = agency.telegram_username
    ? `https://t.me/${agency.telegram_username.replace('@', '')}`
    : null;

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Agency Header */}
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 rounded-full overflow-hidden bg-muted">
          <Image
            src={agency.logo_url || placeholderImage(100, 100, agency.name[0])}
            alt={agency.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-bold">{agency.name}</h1>
            {agency.is_verified && <VerifiedBadge />}
          </div>
          {agency.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {agency.city}, {agency.country}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {agency.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {agency.description}
        </p>
      )}

      {/* Contact Buttons */}
      <div className="flex gap-2 flex-wrap">
        {telegramLink && (
          <a href={telegramLink} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: 'sm' })}>
            <MessageCircle className="h-4 w-4 mr-1.5" />
            Telegram
          </a>
        )}
        {agency.phone && (
          <a href={`tel:${agency.phone}`} className={buttonVariants({ size: 'sm', variant: 'outline' })}>
            <Phone className="h-4 w-4 mr-1.5" />
            Call
          </a>
        )}
        {agency.instagram_url && (
          <a href={agency.instagram_url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
            <Instagram className="h-4 w-4 mr-1.5" />
            Instagram
          </a>
        )}
        {agency.website_url && (
          <a href={agency.website_url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
            <Globe className="h-4 w-4 mr-1.5" />
            Website
          </a>
        )}
      </div>

      <Separator />

      {/* Active Tours */}
      <section>
        <SectionHeader
          title="Active Tours"
          subtitle={`${tours.length} tour${tours.length !== 1 ? 's' : ''} available`}
        />
        {tours.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No active tours"
            description="This agency has no published tours at the moment."
          />
        )}
      </section>

      <Separator />

      {/* Reviews */}
      <section>
        <SectionHeader
          title="Reviews"
          subtitle={reviews.length > 0 ? `${reviews.length} reviews` : undefined}
        />
        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">
                      {(review as any).profile?.full_name ?? 'User'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        )}
      </section>
    </div>
  );
}
