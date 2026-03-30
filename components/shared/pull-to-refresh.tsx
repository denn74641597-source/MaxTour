'use client';

import { useState, useRef, useCallback } from 'react';
import { hapticFeedback } from '@/lib/telegram';

const PULL_THRESHOLD = 80;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullStart = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) pullStart.current = e.touches[0].clientY;
    else pullStart.current = 0;
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pullStart.current || refreshing) return;
      const delta = Math.max(0, e.touches[0].clientY - pullStart.current);
      setPullY(Math.min(delta * 0.4, 100));
    },
    [refreshing],
  );

  const onTouchEnd = useCallback(() => {
    if (pullY >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      hapticFeedback('medium');
      window.location.reload();
    } else {
      setPullY(0);
    }
    pullStart.current = 0;
  }, [pullY, refreshing]);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="min-h-screen flex flex-col bg-background"
    >
      {/* Pull-to-refresh indicator — fixed at the very top of the screen */}
      {pullY > 0 && (
        <div
          className="fixed top-0 left-0 right-0 z-[100] flex justify-center items-end transition-all duration-150 overflow-hidden bg-background/80 backdrop-blur-sm"
          style={{
            height: pullY,
            paddingTop: 'var(--tg-safe-top, env(safe-area-inset-top, 0px))',
          }}
        >
          <div
            className={`w-6 h-6 mb-2 rounded-full border-2 border-primary border-t-transparent ${
              pullY >= PULL_THRESHOLD ? 'animate-spin' : ''
            }`}
            style={{
              transform: `rotate(${(pullY / PULL_THRESHOLD) * 360}deg)`,
            }}
          />
        </div>
      )}

      {/* Push content down while pulling */}
      {pullY > 0 && (
        <div
          className="shrink-0 transition-all duration-150"
          style={{ height: pullY }}
        />
      )}

      {children}
    </div>
  );
}
