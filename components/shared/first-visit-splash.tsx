'use client';

import { useEffect, useState } from 'react';
import { MaxTourLoader } from './max-tour-loader';

const SPLASH_SEEN_KEY = 'maxtour_splash_seen_v1';
const SPLASH_DURATION_MS = 2200;

type FirstVisitSplashProps = {
  children: React.ReactNode;
};

export function FirstVisitSplash({ children }: FirstVisitSplashProps) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    let timeoutId: number | undefined;

    try {
      const seen = window.sessionStorage.getItem(SPLASH_SEEN_KEY) === '1';

      if (seen) {
        setShowSplash(false);
        return;
      }

      window.sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
      timeoutId = window.setTimeout(() => {
        setShowSplash(false);
      }, SPLASH_DURATION_MS);
    } catch {
      setShowSplash(false);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <MaxTourLoader className="h-64 w-64 md:h-72 md:w-72" />
          <p className="text-sm text-muted-foreground">MaxTour yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
