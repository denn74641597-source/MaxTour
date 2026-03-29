'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, ArrowRight, MapPin } from 'lucide-react';
import { formatPrice, formatDate, placeholderImage } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import type { Tour } from '@/types';

interface TourCardHorizontalProps {
  tour: Tour;
}

export function TourCardHorizontal({ tour }: TourCardHorizontalProps) {
  const { t } = useTranslation();

  return (
    <Link href={`/tours/${tour.slug}`}>
      <div className="bg-surface rounded-[1.5rem] overflow-hidden shadow-ambient flex items-center p-4 gap-4">
        {/* Image */}
        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-surface-container-low">
          <Image
            src={tour.cover_image_url || placeholderImage(200, 200, tour.title)}
            alt={tour.title}
            width={96}
            height={96}
            className="object-cover w-full h-full"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm leading-tight line-clamp-2 text-foreground">
            {tour.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-0.5 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {(() => {
                if (tour.tour_type === 'domestic') return [tour.district, tour.region || 'O\'zbekiston'].filter(Boolean).join(', ');
                const parts = [tour.city, ...(tour.destinations ?? [])].filter((c): c is string => Boolean(c));
                const unique = [...new Set(parts.map(p => p.includes(' - ') ? p.split(' - ')[1] || p : p))];
                return unique.length > 0 ? unique.join(', ') : tour.country;
              })()}
            </span>
          </p>
          {tour.departure_date && (
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <CalendarDays className="h-3 w-3 shrink-0" />
              {formatDate(tour.departure_date)}
            </p>
          )}
          <div className="mt-2">
            {tour.old_price && tour.old_price > tour.price && (
              <p className="text-xs text-destructive/70 line-through font-medium">
                {formatPrice(tour.old_price, tour.currency)}
              </p>
            )}
            <p className="text-base font-bold text-primary">
              {formatPrice(tour.price, tour.currency)}
            </p>
          </div>
        </div>

        {/* Arrow button */}
        <div className="shrink-0">
          <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>
    </Link>
  );
}
