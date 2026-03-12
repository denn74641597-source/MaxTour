import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin, CalendarDays, Clock, Users, Hotel, Utensils, Plane,
  FileCheck, FileX, Share2, Heart, MessageCircle, ChevronRight, Star,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SectionHeader } from '@/components/shared/section-header';
import { TourCard } from '@/components/shared/tour-card';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import { PriceBlock } from '@/components/shared/price-block';
import { LeadForm } from '@/components/shared/lead-form';
import { getTourBySlug, getSimilarTours } from '@/features/tours/queries';
import { cn, formatDate, placeholderImage } from '@/lib/utils';
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

  const similarTours = await getSimilarTours(tour, 4);
  const agency = tour.agency;
  const images = tour.images ?? [];
  const allImages = [
    tour.cover_image_url || placeholderImage(800, 600, tour.title),
    ...images.map((img) => img.image_url),
  ];
  const includedServices = (tour.included_services as string[]) ?? [];
  const excludedServices = (tour.excluded_services as string[]) ?? [];

  const telegramLink = agency?.telegram_username
    ? `https://t.me/${agency.telegram_username.replace('@', '')}`
    : null;

  return (
    <div className="pb-6">
      {/* Image Gallery */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Image
          src={allImages[0]}
          alt={tour.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {tour.is_featured && (
          <Badge className="absolute top-3 left-3 bg-amber-500 text-white">
            Featured
          </Badge>
        )}
        {images.length > 0 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
            1/{allImages.length}
          </div>
        )}
      </div>

      {/* Additional thumbnail row */}
      {allImages.length > 1 && (
        <div className="flex gap-1. px-4 mt-2 overflow-x-auto no-scrollbar">
          {allImages.slice(1, 5).map((url, i) => (
            <div key={i} className="relative h-16 w-20 rounded-md overflow-hidden shrink-0 bg-muted">
              <Image src={url} alt={`${tour.title} ${i + 2}`} fill className="object-cover" sizes="80px" />
            </div>
          ))}
        </div>
      )}

      <div className="px-4 space-y-4 mt-4">
        {/* Title & Price */}
        <div>
          <h1 className="text-xl font-bold leading-tight">{tour.title}</h1>
          <div className="flex items-center gap-1. mt-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {tour.city ? `${tour.city}, ` : ''}
              {tour.country}
            </span>
          </div>
          <div className="mt-2">
            <PriceBlock price={tour.price} currency={tour.currency} className="text-lg" />
            <span className="text-xs text-muted-foreground ml-1">per person</span>
          </div>
        </div>

        {/* Key Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          {tour.duration_days && (
            <DetailItem icon={Clock} label="Duration" value={`${tour.duration_days} days`} />
          )}
          {tour.departure_date && (
            <DetailItem icon={CalendarDays} label="Departure" value={formatDate(tour.departure_date)} />
          )}
          {tour.seats_left !== null && (
            <DetailItem icon={Users} label="Seats Left" value={`${tour.seats_left}${tour.seats_total ? `/${tour.seats_total}` : ''}`} />
          )}
          {tour.hotel_name && (
            <DetailItem icon={Hotel} label="Hotel" value={`${tour.hotel_name}${tour.hotel_stars ? ` (${tour.hotel_stars}★)` : ''}`} />
          )}
          <DetailItem icon={Utensils} label="Meals" value={tour.meal_type.replace('_', ' ')} />
          <DetailItem icon={Plane} label="Transport" value={tour.transport_type} />
        </div>

        {tour.visa_required && (
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
            Visa Required
          </Badge>
        )}

        <Separator />

        {/* Description */}
        {tour.full_description && (
          <div>
            <h2 className="font-semibold mb-2">About This Tour</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {tour.full_description}
            </p>
          </div>
        )}

        {/* Included / Excluded */}
        {includedServices.length > 0 && (
          <div>
            <h2 className="font-semibold mb-2 flex items-center gap-1">
              <FileCheck className="h-4 w-4 text-emerald-500" /> Included
            </h2>
            <ul className="space-y-1">
              {includedServices.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {excludedServices.length > 0 && (
          <div>
            <h2 className="font-semibold mb-2 flex items-center gap-1">
              <FileX className="h-4 w-4 text-red-400" /> Not Included
            </h2>
            <ul className="space-y-1">
              {excludedServices.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✕</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        {/* Agency Card */}
        {agency && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted overflow-hidden relative">
                  <Image
                    src={agency.logo_url || placeholderImage(100, 100, agency.name[0])}
                    alt={agency.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm">{agency.name}</span>
                    {agency.is_verified && <VerifiedBadge size="sm" />}
                  </div>
                  {agency.phone && (
                    <p className="text-xs text-muted-foreground">{agency.phone}</p>
                  )}
                </div>
                <Link href={`/agencies/${agency.slug}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    View <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-2">
          {telegramLink && (
            <a href={telegramLink} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants(), 'flex-1')}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact on Telegram
            </a>
          )}
          <Button variant="outline" size="icon">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Lead Request Form */}
        <div>
          <h2 className="font-semibold mb-3">Leave a Request</h2>
          <LeadForm tourId={tour.id} agencyId={tour.agency_id} />
        </div>

        {/* Similar Tours */}
        {similarTours.length > 0 && (
          <section className="mt-6">
            <SectionHeader title="Similar Tours" />
            <div className="grid grid-cols-2 gap-3">
              {similarTours.map((t) => (
                <TourCard key={t.id} tour={t} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="font-medium capitalize">{value}</p>
      </div>
    </div>
  );
}
