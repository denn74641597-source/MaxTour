'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { HeroBanner } from '@/components/shared/hero-banner';
import { HorizontalScroll } from '@/components/shared/horizontal-scroll';
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
