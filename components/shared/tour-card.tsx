'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, MapPin, Clock, Users, Heart, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PriceBlock } from './price-block';
import { formatDate, placeholderImage, formatComboDestinations } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useFavorites } from '@/hooks/use-favorites';
import type { Tour } from '@/types';

interface TourCardProps {
  tour: Tour;
  /** Compact mode for horizontal scroll lists */
  compact?: boolean;
}

export function TourCard({ tour, compact }: TourCardProps) {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(tour.id);

  return (
    <Card
      className={
        compact
          ? 'min-w-[260px] snap-start overflow-hidden !pt-0'
          : 'overflow-hidden !pt-0'
      }
    >
      <Link href={`/tours/${tour.slug}`}>
        <div className="relative aspect-square w-full overflow-hidden">
          <Image
            src={tour.cover_image_url || placeholderImage(400, 500, tour.title)}
            alt={tour.title}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, 300px"
          />
          {tour.seats_left !== null && tour.seats_left <= 5 && tour.seats_left > 0 && (
            <Badge variant="destructive" className="absolute top-2 left-2 text-[10px]">
              {tour.seats_left} {t.common.seatsLeft}
            </Badge>
          )}
          {tour.is_featured && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center justify-center p-1 bg-gradient-to-br from-amber-400 to-yellow-500 backdrop-blur rounded-full shadow-lg">
                <Star className="h-3.5 w-3.5 text-white fill-white" />
              </span>
            </div>
          )}
        </div>

        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">
              {tour.title}
            </h3>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(tour.id); }}
              className="shrink-0 mt-0.5"
            >
              <Heart className={`h-4 w-4 ${liked ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {tour.tour_type === 'domestic'
                ? `${tour.district ? `${tour.district}, ` : ''}${tour.region || 'O\'zbekiston'}`
                : tour.destinations && tour.destinations.length > 1
                  ? formatComboDestinations(tour.destinations)
                  : `${tour.city ? `${tour.city}, ` : ''}${tour.country}`
              }
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {tour.duration_days && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {tour.duration_days} {t.common.days}{tour.duration_nights ? ` | ${tour.duration_nights} ${t.common.nights}` : ''}
              </span>
            )}
            {(tour.departure_date || tour.departure_month) && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {tour.departure_date
                  ? formatDate(tour.departure_date)
                  : (() => {
                      const [y, m] = (tour.departure_month as string).split('-');
                      return `${t.dateFormat.monthNames[m as keyof typeof t.dateFormat.monthNames] ?? m} ${y}`;
                    })()
                }
              </span>
            )}
            {tour.seats_left !== null && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {tour.seats_left} {t.common.seats}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <PriceBlock price={tour.price} currency={tour.currency} originalPrice={tour.old_price ?? undefined} />
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
