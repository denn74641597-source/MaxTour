'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
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
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 group">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        </div>

        {/* Location badge */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-full">
          <MapPin className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold uppercase tracking-wide">{locationLabel}</span>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 className="text-xl font-bold text-white leading-tight mb-3">
            {tour.title}
          </h2>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                {t.home.priceLabel}
              </span>
              <p className="text-lg font-bold text-white">
                {formatPrice(tour.price, tour.currency)} <span className="text-sm font-normal text-white/70">{t.common.from}</span>
              </p>
            </div>
            <span className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg">
              {t.common.viewDetails}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
