'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Heart, Star } from 'lucide-react';
import { PriceBlock } from './price-block';
import { placeholderImage } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useFavorites } from '@/hooks/use-favorites';
import type { Tour } from '@/types';

interface TourCardProps {
  tour: Tour;
}

export function TourCard({ tour }: TourCardProps) {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(tour.id);

  return (
    <Link href={`/tours/${tour.slug}`} className="block">
      <div className="rounded-2xl overflow-hidden bg-surface shadow-ambient">
        <div className="relative aspect-square">
          <Image
            src={tour.cover_image_url || placeholderImage(400, 400, tour.title)}
            alt={tour.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 45vw, 200px"
          />
          {tour.is_featured && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center justify-center p-1 bg-gradient-to-br from-amber-400 to-yellow-500 backdrop-blur rounded-full shadow-lg">
                <Star className="h-3 w-3 text-white fill-white" />
              </span>
            </div>
          )}
        </div>
        <div className="p-2.5">
          <div className="flex items-start justify-between gap-1">
            <h4 className="text-xs font-bold text-foreground leading-tight line-clamp-1">{tour.title}</h4>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(tour.id); }}
              className="shrink-0 mt-0.5"
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5 truncate">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">
              {tour.tour_type === 'domestic'
                ? `${tour.district ? `${tour.district}, ` : ''}${tour.region || 'O\'zbekiston'}`
                : (() => {
                    const parts = [tour.city, ...(tour.destinations ?? [])].filter((c): c is string => Boolean(c));
                    const unique = [...new Set(parts.map(p => p.includes(' - ') ? p.split(' - ')[1] || p : p))];
                    return unique.length > 0 ? unique.join(', ') : tour.country;
                  })()
              }
            </span>
          </p>
          <div className="mt-1">
            <PriceBlock price={tour.price} currency={tour.currency} originalPrice={tour.old_price ?? undefined} />
          </div>
        </div>
      </div>
    </Link>
  );
}
