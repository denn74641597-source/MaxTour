'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Heart, Zap, Flame } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { HorizontalScroll } from '@/components/shared/horizontal-scroll';
import { TiltCard } from '@/components/pioneerui/tilt-card';
import { GlowCard } from '@/components/pioneerui/glow-card';
import { placeholderImage, formatComboDestinations, formatPrice } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useHomeFavorites } from './home-favorites-provider';
import type { Tour, Agency } from '@/types';

/* ─── Tour Cards ─── */

function HotDealCard({ tour }: { tour: Tour }) {
  const { isFavorite, toggleFavorite } = useHomeFavorites();
  const liked = isFavorite(tour.id);
  const location = tour.tour_type === 'domestic'
    ? `${tour.district ? `${tour.district}, ` : ''}${tour.region || 'O\'zbekiston'}`
    : tour.destinations && tour.destinations.length > 1
      ? formatComboDestinations(tour.destinations)
      : `${tour.city ? `${tour.city}, ` : ''}${tour.country}`;

  return (
    <Link href={`/tours/${tour.slug}`} className="block">
      <TiltCard className="rounded-2xl" maxTilt={7} scale={1.016}>
        <div className="rounded-2xl overflow-hidden bg-surface shadow-[0_24px_42px_-24px_rgba(15,23,42,0.75)]">
          <div className="relative aspect-square">
            <Image
              src={tour.cover_image_url || placeholderImage(400, 400, tour.title)}
              alt={tour.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 45vw, 200px"
            />
            {/* Lightning icon */}
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center justify-center p-1 bg-gradient-to-br from-blue-400 to-indigo-500 backdrop-blur rounded-full shadow-lg">
                <Zap className="h-3 w-3 text-white fill-white" />
              </span>
            </div>
          </div>

          <GlowCard
            className="px-2 pb-2 pt-1"
            contentClassName="rounded-xl bg-surface"
            glowClassName="inset-x-3"
          >
            <div className="p-2.5">
              <div className="flex items-start justify-between gap-1">
                <h4 className="text-xs font-bold text-foreground leading-tight line-clamp-2 min-h-[30px]">{tour.title}</h4>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(tour.id); }}
                  className="shrink-0 mt-0.5"
                >
                  <Heart className={`h-3.5 w-3.5 ${liked ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5 truncate">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{location}</span>
              </p>
              <p className="text-sm font-bold text-primary mt-1">{formatPrice(tour.price, tour.currency)}</p>
            </div>
          </GlowCard>
        </div>
      </TiltCard>
    </Link>
  );
}

function HotTourCard({ tour }: { tour: Tour }) {
  const { isFavorite, toggleFavorite } = useHomeFavorites();
  const liked = isFavorite(tour.id);
  const location = tour.tour_type === 'domestic'
    ? `${tour.district ? `${tour.district}, ` : ''}${tour.region || 'O\'zbekiston'}`
    : tour.destinations && tour.destinations.length > 1
      ? formatComboDestinations(tour.destinations)
      : `${tour.city ? `${tour.city}, ` : ''}${tour.country}`;

  return (
    <Link href={`/tours/${tour.slug}`} className="block">
      <TiltCard className="rounded-2xl" maxTilt={7} scale={1.016}>
        <div className="rounded-2xl overflow-hidden bg-surface shadow-[0_24px_42px_-24px_rgba(15,23,42,0.75)]">
          <div className="relative aspect-square">
            <Image
              src={tour.cover_image_url || placeholderImage(400, 400, tour.title)}
              alt={tour.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 45vw, 200px"
            />
            {/* Fire icon */}
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center justify-center p-1 bg-gradient-to-br from-orange-400 to-red-500 backdrop-blur rounded-full shadow-lg">
                <Flame className="h-3 w-3 text-white fill-white" />
              </span>
            </div>
          </div>
          <GlowCard
            className="px-2 pb-2 pt-1"
            contentClassName="rounded-xl bg-surface"
            glowClassName="inset-x-3"
          >
            <div className="p-2.5">
              <div className="flex items-start justify-between gap-1">
                <h4 className="text-xs font-bold text-foreground leading-tight line-clamp-2 min-h-[30px]">{tour.title}</h4>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(tour.id); }}
                  className="shrink-0 mt-0.5"
                >
                  <Heart className={`h-3.5 w-3.5 ${liked ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5 truncate">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{location}</span>
              </p>
              <p className="text-sm font-bold text-primary mt-1">{formatPrice(tour.price, tour.currency)}</p>
            </div>
          </GlowCard>
        </div>
      </TiltCard>
    </Link>
  );
}

/* ─── Deferred section components (rendered via Suspense from page.tsx) ─── */

export function HomeHotDealsSection({ hotDeals }: { hotDeals: Tour[] }) {
  const { t } = useTranslation();
  return (
    <section className="mb-10 home-enter-up home-enter-delay-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">{t.home.hotDeals}</h3>
      </div>
      {hotDeals.length > 0 ? (
        <HorizontalScroll className="gap-3 pb-2">
          {hotDeals.map((tour) => (
            <div key={tour.id} className="shrink-0 w-[44vw] max-w-[200px] md:w-[200px]">
              <HotDealCard tour={tour} />
            </div>
          ))}
        </HorizontalScroll>
      ) : (
        <EmptyState title={t.tours.noToursFound} description={t.tours.noToursHint} />
      )}
    </section>
  );
}

export function HomeHotToursSection({ hotTours }: { hotTours: Tour[] }) {
  const { t } = useTranslation();
  return (
    <section className="mb-10 home-enter-up home-enter-delay-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">{t.home.hotTours}</h3>
      </div>
      {hotTours.length > 0 ? (
        <HorizontalScroll className="gap-3 pb-2">
          {hotTours.map((tour) => (
            <div key={tour.id} className="shrink-0 w-[44vw] max-w-[200px] md:w-[200px]">
              <HotTourCard tour={tour} />
            </div>
          ))}
        </HorizontalScroll>
      ) : (
        <EmptyState title={t.tours.noToursFound} description={t.tours.noToursHint} />
      )}
    </section>
  );
}

export function HomeTopRatedSection({ topAgencies }: { topAgencies: Agency[] }) {
  const { t } = useTranslation();
  if (topAgencies.length === 0) return null;
  // Sort by rating descending (highest first)
  const sorted = [...topAgencies].sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
  return (
    <section className="home-enter-up home-enter-delay-6">
      <h3 className="text-lg font-bold text-foreground mb-4">{t.home.topRated}</h3>
      <HorizontalScroll className="gap-4 pb-2">
        {sorted.map((agency) => (
          <TopRatedAgencyCard key={agency.id} agency={agency} />
        ))}
      </HorizontalScroll>
    </section>
  );
}

function TopRatedAgencyCard({ agency }: { agency: Agency }) {
  const { t } = useTranslation();
  const rating = agency.avg_rating ?? 0;

  return (
    <Link href={`/agencies/${agency.slug}`} className="shrink-0 w-40 block">
      <GlowCard
        className="rounded-[1.5rem]"
        contentClassName="rounded-[1.5rem] bg-surface p-4 flex flex-col items-center text-center shadow-[0_24px_42px_-24px_rgba(15,23,42,0.75)]"
        glowClassName="inset-x-6 -bottom-3 h-10"
      >
        <div className="w-16 h-16 rounded-full overflow-hidden mb-3 bg-primary/5 ring-2 ring-primary/10 shadow-[0_12px_22px_-12px_rgba(15,23,42,0.62)]">
          {agency.logo_url ? (
            <Image
              src={agency.logo_url}
              alt={agency.name}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center">
              <span className="text-white font-bold text-xl">{agency.name?.[0]?.toUpperCase() || 'M'}</span>
            </div>
          )}
        </div>
        <h4 className="font-bold text-sm text-foreground truncate w-full">{agency.name}</h4>
        <div className="flex items-center gap-0.5 mt-1.5 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i < Math.round(rating) ? 'text-tertiary fill-tertiary' : 'text-muted fill-muted'}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1 font-semibold">{rating.toFixed(1)}</span>
        </div>
        {(agency.review_count ?? 0) > 0 && (
          <span className="text-[10px] text-muted-foreground mb-1">
            {agency.review_count} {t.agencyProfile.reviews}
          </span>
        )}
        <span className="text-xs font-bold text-primary uppercase tracking-wide">{t.home.viewAgency}</span>
      </GlowCard>
    </Link>
  );
}
