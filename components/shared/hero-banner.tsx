'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { formatPrice, placeholderImage } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import type { Tour } from '@/types';

interface HeroBannerProps {
  tour: Tour;
}

export function HeroBanner({ tour }: HeroBannerProps) {
  const { t } = useTranslation();

  return (
    <Link href={`/tours/${tour.slug}`}>
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 group">
        <div className="aspect-[16/9] w-full relative">
          <Image
            src={tour.cover_image_url || placeholderImage(800, 450, tour.title)}
            alt={tour.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 672px"
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 p-6">
          <span className="inline-block bg-primary px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-2">
            {t.common.featured}
          </span>
          <h2 className="text-2xl font-bold text-white leading-tight">
            {tour.title}
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            {formatPrice(tour.price, tour.currency)} {t.common.perPerson}
          </p>
        </div>

        {/* Arrow button */}
        <button className="absolute bottom-6 right-6 bg-white text-primary rounded-full p-2 shadow-lg hover:bg-primary hover:text-white transition-colors">
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </Link>
  );
}
