'use client';

import { useEffect, useState } from 'react';
import { MaxTourLoader } from './max-tour-loader';

const SPLASH_SEEN_KEY = 'maxtour_splash_seen_v1';
const SPLASH_DURATION_MS = 2500;

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2563EB]">
        <div className="flex flex-col items-center">
          <MaxTourLoader className="h-[min(80vw,32rem)] w-[min(80vw,32rem)] md:h-[36rem] md:w-[36rem]" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
