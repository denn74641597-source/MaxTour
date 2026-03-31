'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Heart, Zap, Flame } from 'lucide-react';
import { SearchBar } from '@/components/shared/search-bar';
import { AgencyCard } from '@/components/shared/agency-card';
import { HeroBanner } from '@/components/shared/hero-banner';
import { PopularDestinations } from '@/components/shared/popular-destinations';
import { EmptyState } from '@/components/shared/empty-state';
import { placeholderImage, formatComboDestinations } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useHomeFavorites } from './home-favorites-provider';
import { hapticFeedback } from '@/lib/telegram';
import { TOUR_CATEGORIES } from '@/types';
import type { Tour, Agency } from '@/types';

interface HomeContentProps {
  featuredTours: Tour[];
  popularTours?: Tour[];
}

/** Shuffle array (Fisher-Yates) returning a new array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick `limit` random tours from `all` */
function pickRandom(all: Tour[], limit: number): Tour[] {
  if (all.length === 0) return [];
  return shuffle(all).slice(0, limit);
}

export function HomeContent({ featuredTours, popularTours = [] }: HomeContentProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Search Bar */}
      <div className="mt-4 mb-5">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 pb-1">
          {TOUR_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/tours?category=${cat}`}
              className="shrink-0 px-4 py-2 rounded-full bg-surface ghost-border text-sm font-medium text-foreground hover:bg-primary/5 hover:border-primary transition-all"
            >
              {t.tourCategories[cat]}
            </Link>
          ))}
        </div>
      </div>

      {/* Hero Banner — rotates featured tours every 5s */}
      {featuredTours.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-bold text-foreground mb-4">{t.home.recommendedTours}</h3>
          <RotatingHero tours={featuredTours} />
        </div>
      )}

      {/* Popular Destinations (dynamic - most viewed tours) */}
      <div className="mb-10">
        <PopularDestinations tours={popularTours} />
      </div>
    </>
  );
}

/* ─── Deferred section components (rendered via Suspense from page.tsx) ─── */

export function HomeAgenciesSection({ agencies }: { agencies: Agency[] }) {
  const { t } = useTranslation();
  if (agencies.length === 0) return null;
  return (
    <section className="mb-10">
      <h3 className="text-lg font-bold text-foreground mb-4">{t.home.verifiedAgencies}</h3>
      <div className="flex gap-5 overflow-x-auto no-scrollbar items-start py-1 -mx-6 px-6">
        {agencies.map((agency) => (
          <AgencyCard key={agency.id} agency={agency} />
        ))}
      </div>
    </section>
  );
}

export function HomeHotDealsSection({ hotDeals }: { hotDeals: Tour[] }) {
  const { t } = useTranslation();
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">{t.home.hotDeals}</h3>
      </div>
      {hotDeals.length > 0 ? (
        <RotatingGrid allTours={hotDeals} limit={20} CardComponent={HotDealCard} />
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
        <RotatingGrid allTours={hotTours} limit={20} CardComponent={HotTourCard} />
      ) : (
        <EmptyState title={t.tours.noToursFound} description={t.tours.noToursHint} />
      )}
    </section>
  );
}

export function HomeTopRatedSection({ topAgencies }: { topAgencies: Agency[] }) {
  const { t } = useTranslation();
  if (topAgencies.length === 0) return null;
  return (
    <section>
      <h3 className="text-lg font-bold text-foreground mb-4">{t.home.topRated}</h3>
      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
        {topAgencies.map((agency) => (
          <TopRatedAgencyCard key={agency.id} agency={agency} />
        ))}
      </div>
    </section>
  );
}

/** Rotating Hero Banner — picks random 10 from featured, auto-rotates every 5s, supports swipe */
function RotatingHero({ tours }: { tours: Tour[] }) {
  const [current, setCurrent] = useState(() => pickRandom(tours, 10));
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const touchStart = useRef(0);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((newIdx: number) => {
    setFading(true);
    setTimeout(() => {
      setIdx(newIdx);
      setFading(false);
    }, 200);
  }, []);

  const goNext = useCallback(() => {
    const next = idx + 1;
    if (next >= current.length) {
      setCurrent(pickRandom(tours, 10));
      goTo(0);
    } else {
      goTo(next);
    }
  }, [idx, current.length, tours, goTo]);

  const goPrev = useCallback(() => {
    goTo(idx > 0 ? idx - 1 : current.length - 1);
  }, [idx, current.length, goTo]);

  // Auto-rotate
  useEffect(() => {
    autoTimer.current = setInterval(goNext, 5000);
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
  }, [goNext]);

  // Reset timer on manual interaction
  const resetTimer = useCallback(() => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    autoTimer.current = setInterval(goNext, 5000);
  }, [goNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      hapticFeedback('light');
      if (diff > 0) goNext(); else goPrev();
      resetTimer();
    }
  };

  const tour = current[idx] ?? tours[0];
  if (!tour) return null;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}>
        <HeroBanner tour={tour} featured />
      </div>
      {/* Dots indicator */}
      {current.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {current.map((_, i) => (
            <button
              key={i}
              onClick={() => { goTo(i); resetTimer(); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === idx ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Rotating 2x2 Grid — picks random `limit` tours, groups into pages of 4, auto-rotates */
function RotatingGrid({
  allTours,
  limit,
  CardComponent,
}: {
  allTours: Tour[];
  limit: number;
  CardComponent: React.ComponentType<{ tour: Tour }>;
}) {
  const [display, setDisplay] = useState(() => pickRandom(allTours, limit));
  const [pageIdx, setPageIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const touchStart = useRef(0);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalPages = Math.ceil(display.length / 4);

  const goToPage = useCallback((newPage: number) => {
    setFading(true);
    setTimeout(() => {
      setPageIdx(newPage);
      setFading(false);
    }, 200);
  }, []);

  const goNext = useCallback(() => {
    const next = pageIdx + 1;
    if (next >= totalPages) {
      setDisplay(pickRandom(allTours, limit));
      goToPage(0);
    } else {
      goToPage(next);
    }
  }, [pageIdx, totalPages, allTours, limit, goToPage]);

  const goPrev = useCallback(() => {
    goToPage(pageIdx > 0 ? pageIdx - 1 : totalPages - 1);
  }, [pageIdx, totalPages, goToPage]);

  // Auto-rotate
  useEffect(() => {
    if (totalPages <= 1) return;
    autoTimer.current = setInterval(goNext, 3000);
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
  }, [goNext, totalPages]);

  const resetTimer = useCallback(() => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    if (totalPages > 1) autoTimer.current = setInterval(goNext, 3000);
  }, [goNext, totalPages]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      hapticFeedback('light');
      if (diff > 0) goNext(); else goPrev();
      resetTimer();
    }
  };

  const pageTours = display.slice(pageIdx * 4, pageIdx * 4 + 4);
  const rows = Math.ceil(pageTours.length / 2);

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div
        className={`grid grid-cols-2 gap-3 transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}
        style={{ gridTemplateRows: `repeat(${rows}, auto)` }}
      >
        {pageTours.map((tour) => (
          <CardComponent key={tour.id} tour={tour} />
        ))}
      </div>
      {/* Page dots */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => { goToPage(i); resetTimer(); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === pageIdx ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Hot Deal Card — shows tour name, location, and price */
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

/** Hot Tour Card — same layout as HotDealCard, only icon differs */
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
