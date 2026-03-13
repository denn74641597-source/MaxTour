'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Heart, BadgeCheck } from 'lucide-react';
import { formatPrice, placeholderImage } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import type { Tour } from '@/types';

interface TourCardHorizontalProps {
  tour: Tour;
}

export function TourCardHorizontal({ tour }: TourCardHorizontalProps) {
  const { t } = useTranslation();
  const isVerified = tour.agency?.is_verified ?? false;

  return (
    <Link href={`/tours/${tour.slug}`}>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm flex border border-slate-100">
        {/* Image */}
        <div className="w-1/3 relative min-h-[120px]">
          <Image
            src={tour.cover_image_url || placeholderImage(300, 300, tour.title)}
            alt={tour.title}
            fill
            className="object-cover"
            sizes="120px"
          />
          {isVerified && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <BadgeCheck className="h-2.5 w-2.5" />
              {t.common.verified}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="w-2/3 p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-sm leading-tight line-clamp-2 flex-1 mr-2">
                {tour.title}
              </h4>
              <Heart className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {tour.city ? `${tour.city}, ` : ''}{tour.country}
            </p>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-lg font-bold text-primary">
                {formatPrice(tour.price, tour.currency)}
              </p>
            </div>
            <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold">
              {t.common.book}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
