'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Heart, Zap, Flame } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { placeholderImage, formatComboDestinations } from '@/lib/utils';
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
      <div className="rounded-2xl overflow-hidden bg-surface shadow-ambient">
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
        <div className="p-2.5">
          <div className="flex items-start justify-between gap-1">
            <h4 className="text-xs font-bold text-foreground leading-tight line-clamp-2">{tour.title}</h4>
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
          <p className="text-sm font-bold text-primary mt-1">${tour.price.toLocaleString()}</p>
        </div>
      </div>
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
      <div className="rounded-2xl overflow-hidden bg-surface shadow-ambient">
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
        <div className="p-2.5">
          <div className="flex items-start justify-between gap-1">
            <h4 className="text-xs font-bold text-foreground leading-tight line-clamp-2">{tour.title}</h4>
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
          <p className="text-sm font-bold text-primary mt-1">${tour.price.toLocaleString()}</p>
        </div>
      </div>
    </Link>
  );
}

/* ─── Deferred section components (rendered via Suspense from page.tsx) ─── */

export function HomeHotDealsSection({ hotDeals }: { hotDeals: Tour[] }) {
  const { t } = useTranslation();
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">{t.home.hotDeals}</h3>
      </div>
      {hotDeals.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
          {hotDeals.map((tour) => (
            <div key={tour.id} className="shrink-0 w-[44vw] max-w-[200px]">
              <HotDealCard tour={tour} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={t.tours.noToursFound} description={t.tours.noToursHint} />
      )}
    </section>
  );
}

export function HomeHotToursSection({ hotTours }: { hotTours: Tour[] }) {
  const { t } = useTranslation();
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">{t.home.hotTours}</h3>
      </div>
      {hotTours.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
          {hotTours.map((tour) => (
            <div key={tour.id} className="shrink-0 w-[44vw] max-w-[200px]">
              <HotTourCard tour={tour} />
            </div>
          ))}
        </div>
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
    <section>
      <h3 className="text-lg font-bold text-foreground mb-4">{t.home.topRated}</h3>
      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
        {sorted.map((agency) => (
          <TopRatedAgencyCard key={agency.id} agency={agency} />
        ))}
      </div>
    </section>
  );
}

function TopRatedAgencyCard({ agency }: { agency: Agency }) {
  const { t } = useTranslation();
  const rating = agency.avg_rating ?? 0;

  return (
    <Link href={`/agencies/${agency.slug}`} className="shrink-0 w-40">
      <div className="bg-surface rounded-[1.5rem] p-4 flex flex-col items-center text-center shadow-ambient">
        <div className="w-16 h-16 rounded-full overflow-hidden mb-3 bg-primary/5 ring-2 ring-primary/10">
          <Image
            src={agency.logo_url || placeholderImage(100, 100, agency.name[0])}
            alt={agency.name}
            width={64}
            height={64}
            className="object-cover w-full h-full"
          />
        </div>
        <h4 className="font-bold text-sm text-foreground truncate w-full">{agency.name}</h4>
        <div className="flex items-center gap-0.5 mt-1.5 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i < Math.round(rating) ? 'text-tertiary fill-tertiary' : 'text-muted fill-muted'}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1 font-medium">{rating > 0 ? rating.toFixed(1) : ''}</span>
        </div>
        <span className="text-xs font-bold text-primary uppercase tracking-wide">{t.home.viewAgency}</span>
      </div>
    </Link>
  );
}
