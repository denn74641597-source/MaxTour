'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FluidTabs, type FluidTabItem } from '@/components/pioneerui/fluid-tabs';
import { MaxTourLoader } from '@/components/shared/max-tour-loader';

const MENU_ITEMS = [
  { value: 'home', label: 'Bosh sahifa', href: '/' },
  { value: 'tours', label: 'Turlar', href: '/tours' },
  { value: 'subscriptions', label: 'Obunalar', href: '/favorites' },
  { value: 'profile', label: 'Profil', href: '/profile' },
];

function getActiveTabValue(pathname: string): string {
  if (pathname.startsWith('/tours')) return 'tours';
  if (pathname.startsWith('/favorites')) return 'subscriptions';
  if (pathname.startsWith('/profile')) return 'profile';
  return 'home';
}

export function PublicStickyHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const shouldAnimateEntrance = pathname === '/';
  const activeTab = getActiveTabValue(pathname);
  const [loaderSeed, setLoaderSeed] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setLoaderSeed((prev) => prev + 1);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const tabs = useMemo<FluidTabItem[]>(
    () => MENU_ITEMS.map(({ value, label }) => ({ value, label })),
    [],
  );

  return (
    <header
      className={`sticky top-0 z-50 overflow-hidden border-b border-white/20 bg-[#2563EB] px-3 py-2 text-white ${shouldAnimateEntrance ? 'home-enter-header' : ''}`}
      style={{ paddingTop: 'calc(var(--tg-safe-top, env(safe-area-inset-top, 0px)) + 8px)' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-500/45 via-blue-500/35 to-purple-500/45" />
      <div className="pointer-events-none absolute -left-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-white/25 blur-3xl" />
      <div className="relative mx-auto w-full max-w-[1480px]">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <div className="flex items-center gap-2 justify-self-start text-2xl leading-none sm:text-3xl">
            <h1 className="text-left font-extrabold tracking-tight">MaxTour</h1>
            <MaxTourLoader key={loaderSeed} loop={false} className="h-[1.5em] w-[1.5em] shrink-0" />
          </div>
          <div className="min-w-0 flex justify-center">
            <FluidTabs
              key={activeTab}
              tabs={tabs}
              defaultValue={activeTab}
              variant="pill"
              onChange={(value) => {
                const item = MENU_ITEMS.find((menuItem) => menuItem.value === value);
                if (item && item.href !== pathname) {
                  router.push(item.href);
                }
              }}
              className="w-[min(760px,calc(100vw-190px))] max-w-full [&_[role='tab']]:!text-white/95 [&_[role='tab']]:text-sm sm:[&_[role='tab']]:text-base [&_[role='tab']]:font-bold [&_[role='tab'][aria-selected='true']]:!text-[#1D4ED8]"
              listClassName="w-full flex-nowrap justify-center gap-2 overflow-x-auto rounded-full !bg-transparent !p-0 no-scrollbar [&_[role='tab']]:shrink-0"
            />
          </div>
          <div aria-hidden="true" className="flex items-center gap-2 justify-self-end select-none opacity-0 text-2xl leading-none sm:text-3xl">
            <span className="font-extrabold tracking-tight">MaxTour</span>
            <span className="h-[1.5em] w-[1.5em] shrink-0" />
          </div>
        </div>
      </div>
    </header>
  );
}
