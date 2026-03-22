'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { placeholderImage } from '@/lib/utils';
import type { Tour } from '@/types';

interface PopularDestinationsProps {
  tours?: Tour[];
}

export function PopularDestinations({ tours }: PopularDestinationsProps) {
  const { t } = useTranslation();

  if (!tours || tours.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">{t.home.popularDestinations}</h3>
        <Link href="/tours?sortBy=popular" className="text-primary text-sm font-semibold">
          {t.home.seeAll}
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
        {tours.map((tour) => (
          <Link
            key={tour.id}
            href={`/tours/${tour.slug}`}
            className="shrink-0"
          >
            <div className="w-28 h-28 rounded-[1.5rem] overflow-hidden mb-2 bg-surface-container-low shadow-ambient">
              <Image
                src={tour.cover_image_url || placeholderImage(200, 200, tour.title)}
                alt={tour.title}
                width={112}
                height={112}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="font-semibold text-sm text-foreground text-center truncate w-28">{tour.city || tour.country}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
