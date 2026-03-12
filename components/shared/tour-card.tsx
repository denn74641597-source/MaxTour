import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, MapPin, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from './verified-badge';
import { PriceBlock } from './price-block';
import { formatDate, placeholderImage } from '@/lib/utils';
import type { Tour } from '@/types';

interface TourCardProps {
  tour: Tour;
  /** Compact mode for horizontal scroll lists */
  compact?: boolean;
}

export function TourCard({ tour, compact }: TourCardProps) {
  const agencyName = tour.agency?.name ?? 'Agency';
  const isVerified = tour.agency?.is_verified ?? false;

  return (
    <Link href={`/tours/${tour.slug}`}>
      <Card
        className={
          compact
            ? 'min-w-[260px] snap-start overflow-hidden'
            : 'overflow-hidden'
        }
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={tour.cover_image_url || placeholderImage(400, 300, tour.title)}
            alt={tour.title}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, 300px"
          />
          {tour.is_featured && (
            <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[10px]">
              Featured
            </Badge>
          )}
          {tour.seats_left !== null && tour.seats_left <= 5 && tour.seats_left > 0 && (
            <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">
              {tour.seats_left} seats left
            </Badge>
          )}
        </div>

        <CardContent className="p-3 space-y-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {tour.title}
          </h3>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {tour.city ? `${tour.city}, ` : ''}
              {tour.country}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {tour.duration_days && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {tour.duration_days}d
              </span>
            )}
            {tour.departure_date && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {formatDate(tour.departure_date)}
              </span>
            )}
            {tour.seats_left !== null && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {tour.seats_left} left
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <PriceBlock price={tour.price} currency={tour.currency} />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="truncate max-w-[80px]">{agencyName}</span>
              {isVerified && <VerifiedBadge size="sm" />}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
