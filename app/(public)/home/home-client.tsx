'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Lottie from 'lottie-react';
import { HeroBanner } from '@/components/shared/hero-banner';
import { HorizontalScroll } from '@/components/shared/horizontal-scroll';
import { BorderBeam } from '@/components/pioneerui/border-beam';
import mapAnimation from '@/Animation/Map.json';
import { placeholderImage } from '@/lib/utils';
import { pickTourTitle } from '@/lib/i18n/tour-i18n';
import { useTranslation } from '@/lib/i18n';
import { hapticFeedback } from '@/lib/telegram';
import { TOUR_CATEGORIES } from '@/types';
import type { Tour } from '@/types';

/* ─── Helpers ─── */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(all: Tour[], limit: number): Tour[] {
  if (all.length === 0) return [];
  return shuffle(all).slice(0, limit);
}

/* ─── Category Chips (translated) ─── */

export function CategoryChips() {
  const { t } = useTranslation();
  return (
    <HorizontalScroll className="gap-2 pb-1">
      {TOUR_CATEGORIES.map((cat) => (
        <Link
          key={cat}
          href={`/tours?category=${cat}`}
          className="shrink-0 px-4 py-2 rounded-full bg-surface ghost-border text-sm font-medium text-foreground hover:bg-primary/5 hover:border-primary transition-all"
        >
          {t.tourCategories[cat]}
        </Link>
      ))}
    </HorizontalScroll>
  );
}

/* ─── Agencies Section Heading (translated) ─── */

export function AgenciesHeading() {
  const { t } = useTranslation();
  return <h3 className="text-lg font-bold text-foreground mb-4">{t.home.verifiedAgencies}</h3>;
}

interface MapHeroShowcaseProps {
  tours: Tour[];
  fallbackTours?: Tour[];
}

function getTourLocation(tour: Tour): string {
  if (tour.tour_type === 'domestic') {
    return [tour.district, tour.region || 'O\'zbekiston'].filter(Boolean).join(', ');
  }

  const places = [tour.city, ...(tour.destinations ?? [])].filter((item): item is string => Boolean(item));
  const uniquePlaces = [...new Set(places.map((place) => (place.includes(' - ') ? place.split(' - ')[1] || place : place)))];
  return uniquePlaces.length > 0 ? uniquePlaces.join(', ') : (tour.country || 'Dunyo bo\'ylab');
}

export function MapHeroShowcase({ tours, fallbackTours = [] }: MapHeroShowcaseProps) {
  const { t, language } = useTranslation();

  const recommendedTour = tours[0] ?? fallbackTours[0] ?? null;
  const advertisingTour = tours[1] ?? fallbackTours[1] ?? fallbackTours[0] ?? recommendedTour;

  return (
    <section className="relative mb-8 md:mb-10">
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden bg-[#2563EB] home-enter-map home-enter-delay-map">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-500/45 via-blue-500/35 to-purple-500/45" />
        <div className="pointer-events-none absolute -left-16 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-white/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-8 h-44 w-44 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%] bg-gradient-to-b from-transparent via-slate-900/20 to-slate-950/50" />

        <div className="relative mx-auto w-full max-w-6xl px-6 pt-0 md:px-8 lg:px-10">
          <div className="relative mx-auto h-[220px] w-full max-w-5xl overflow-hidden md:h-[300px] lg:h-[340px]">
            <Lottie
              animationData={mapAnimation}
              loop
              className="h-full w-full"
              rendererSettings={{
                preserveAspectRatio: 'xMidYMid slice',
              }}
            />
          </div>
        </div>
      </div>

      <div className="relative z-20 -mt-9 md:-mt-12 lg:-mt-14 home-enter-up home-enter-delay-1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {recommendedTour ? (
            <OverlayTourCard
              tour={recommendedTour}
              language={language}
              badge={t.home.recommendedTours}
            />
          ) : (
            <OverlayFallbackCard badge={t.home.recommendedTours} />
          )}

          {advertisingTour ? (
            <OverlayTourCard
              tour={advertisingTour}
              language={language}
              badge={t.nav.advertising}
            />
          ) : (
            <OverlayFallbackCard badge={t.nav.advertising} />
          )}
        </div>
      </div>
    </section>
  );
}

function OverlayTourCard({ tour, language, badge }: { tour: Tour; language: 'uz' | 'ru'; badge: string }) {
  const title = pickTourTitle(tour, language);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-8 -bottom-5 h-12 rounded-full bg-gradient-to-b from-slate-950/40 via-slate-900/15 to-transparent blur-xl" />
      <BorderBeam className="rounded-[1.6rem]" contentClassName="rounded-[1.6rem]" duration={5400}>
        <Link href={`/tours/${tour.slug}`} className="group relative block overflow-hidden rounded-[1.6rem] bg-surface shadow-[0_24px_45px_-28px_rgba(15,23,42,0.8)]">
          <div className="relative aspect-[16/10] w-full">
            <Image
              src={tour.cover_image_url || placeholderImage(800, 500, title)}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/5" />
            <span className="label-meta absolute left-3 top-3 inline-flex rounded-full bg-black/45 px-3 py-1 text-[10px] font-bold tracking-[0.08em] text-white backdrop-blur-sm">
              {badge}
            </span>
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="line-clamp-2 text-base font-bold leading-tight text-white md:text-lg">{title}</p>
              <p className="mt-1 text-xs text-white/80">{getTourLocation(tour)}</p>
            </div>
          </div>
        </Link>
      </BorderBeam>
    </div>
  );
}

function OverlayFallbackCard({ badge }: { badge: string }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-8 -bottom-5 h-12 rounded-full bg-gradient-to-b from-slate-950/40 via-slate-900/15 to-transparent blur-xl" />
      <BorderBeam className="rounded-[1.6rem]" contentClassName="rounded-[1.6rem]" duration={5400}>
        <div className="relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 px-5 py-9 text-white shadow-[0_24px_45px_-28px_rgba(15,23,42,0.8)]">
          <span className="label-meta inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold tracking-[0.08em]">
            {badge}
          </span>
        </div>
      </BorderBeam>
    </div>
  );
}

/* ─── Rotating Hero Banner — picks random 10, auto-rotates every 5s, supports swipe + mouse drag ─── */

export function RotatingHero({ tours }: { tours: Tour[] }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(() => pickRandom(tours, 10));
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const pointerStart = useRef(0);
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

  // Unified pointer handlers (touch + mouse)
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStart.current = e.clientX;
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    const diff = pointerStart.current - e.clientX;
    if (Math.abs(diff) > 50) {
      hapticFeedback('light');
      if (diff > 0) goNext(); else goPrev();
      resetTimer();
    }
  };

  const tour = current[idx] ?? tours[0];
  if (!tour) return null;

  return (
    <>
      <h3 className="text-lg font-bold text-foreground mb-4">{t.home.recommendedTours}</h3>
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="cursor-grab active:cursor-grabbing select-none"
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
    </>
  );
}
