'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { placeholderImage } from '@/lib/utils';
import { HorizontalScroll } from '@/components/shared/horizontal-scroll';
import type { Tour } from '@/types';

interface PopularDestinationsProps {
  tours?: Tour[];
}

export function PopularDestinations({ tours }: PopularDestinationsProps) {
  const { t } = useTranslation();

  if (!tours || tours.length === 0) return null;

  return (
    <section>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-foreground">{t.home.popularDestinations}</h3>
      </div>
      <div className="relative">
        <HorizontalScroll className="items-start gap-4 pb-7 pt-1" showControls itemsPerStep={6} bleed={false}>
          {tours.map((tour) => (
            <Link
              key={tour.id}
              href={`/tours/${tour.slug}`}
              className="group relative block shrink-0 w-[52vw] max-w-[280px] sm:w-[42vw] md:w-[260px] lg:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)] 2xl:w-[calc((100%-5rem)/6)]"
            >
              <div className="pointer-events-none absolute inset-x-5 -bottom-4 h-10 rounded-full bg-gradient-to-b from-slate-950/40 via-slate-900/15 to-transparent blur-lg" />
              <div className="relative overflow-hidden rounded-[1.5rem] bg-surface shadow-[0_24px_42px_-24px_rgba(15,23,42,0.75)] transition-transform duration-300 group-hover:-translate-y-0.5">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] bg-surface-container-low">
                  <Image
                    src={tour.cover_image_url || placeholderImage(200, 250, tour.title)}
                    alt={tour.title}
                    width={320}
                    height={400}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/20 to-transparent" />
                  <p className="absolute bottom-3 left-0 right-0 truncate px-2 text-center text-sm font-semibold text-white drop-shadow-md">
                    {tour.city || tour.country}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </HorizontalScroll>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-transparent via-background/75 to-background" />
      </div>
    </section>
  );
}
