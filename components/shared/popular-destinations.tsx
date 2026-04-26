'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { placeholderImage } from '@/lib/utils';
import { HorizontalScroll } from '@/components/shared/horizontal-scroll';
import { GlassCard } from '@/components/pioneerui/glass-card';
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
      <HorizontalScroll className="gap-4" showControls itemsPerStep={6} bleed={false}>
        {tours.map((tour) => (
          <Link
            key={tour.id}
            href={`/tours/${tour.slug}`}
            className="relative block shrink-0 w-[52vw] max-w-[280px] sm:w-[42vw] md:w-[260px] lg:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)] 2xl:w-[calc((100%-5rem)/6)]"
          >
            <div className="pointer-events-none absolute inset-x-5 -bottom-4 h-10 rounded-full bg-gradient-to-b from-slate-950/40 via-slate-900/15 to-transparent blur-lg" />
            <GlassCard
              className="w-full rounded-[1.6rem] p-[2px] shadow-[0_22px_42px_-25px_rgba(15,23,42,0.75)]"
              contentClassName="rounded-[1.4rem]"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.4rem] bg-surface-container-low">
                <Image
                  src={tour.cover_image_url || placeholderImage(200, 250, tour.title)}
                  alt={tour.title}
                  width={144}
                  height={180}
                  className="w-full h-full object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                {/* City name inside card at bottom */}
                <p className="absolute bottom-3 left-0 right-0 font-semibold text-sm text-white text-center truncate px-2 drop-shadow-md">
                  {tour.city || tour.country}
                </p>
              </div>
            </GlassCard>
          </Link>
        ))}
      </HorizontalScroll>
    </section>
  );
}
