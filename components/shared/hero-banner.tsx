'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';
import { formatPrice, placeholderImage } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import type { Tour } from '@/types';

interface HeroBannerProps {
  tour: Tour;
}

export function HeroBanner({ tour }: HeroBannerProps) {
  const { t } = useTranslation();

  const locationLabel = tour.tour_type === 'domestic'
    ? (tour.region || 'O\'zbekiston')
    : (tour.city || tour.country);

  return (
    <Link href={`/tours/${tour.slug}`}>
      <div className="relative overflow-hidden rounded-[1.5rem] bg-foreground group">
        <div className="aspect-[16/10] w-full relative">
          <Image
            src={tour.cover_image_url || placeholderImage(800, 500, tour.title)}
            alt={tour.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 672px"
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />
        </div>

        {/* Location badge */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-white px-3.5 py-1.5 rounded-full">
          <MapPin className="h-3.5 w-3.5" />
          <span className="label-meta text-[10px] font-semibold">{locationLabel}</span>
        </div>

        {/* Featured star badge */}
        {tour.is_featured && (
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center justify-center p-1.5 bg-gradient-to-br from-amber-400 to-yellow-500 backdrop-blur rounded-full shadow-lg">
              <Star className="h-4 w-4 text-white fill-white" />
            </span>
          </div>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h2 className="text-xl font-bold text-white leading-tight mb-4">
            {tour.title}
          </h2>
          <div className="flex items-end justify-between">
            <div>
              <span className="label-meta text-[10px] font-bold text-white/50">
                {t.home.priceLabel}
              </span>
              <p className="text-lg font-bold text-white">
                {formatPrice(tour.price, tour.currency)} <span className="text-sm font-normal text-white/60">{t.common.from}</span>
              </p>
            </div>
            <span className="bg-gradient-to-b from-primary to-primary-container text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-ambient">
              {t.common.viewDetails}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
