'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FluidTabs, type FluidTabItem } from '@/components/pioneerui/fluid-tabs';

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
  const activeTab = getActiveTabValue(pathname);

  const tabs = useMemo<FluidTabItem[]>(
    () => MENU_ITEMS.map(({ value, label }) => ({ value, label })),
    [],
  );

  return (
    <header
      className="sticky top-0 z-50 overflow-hidden border-b border-white/20 bg-[#2563EB] px-3 py-2 text-white"
      style={{ paddingTop: 'calc(var(--tg-safe-top, env(safe-area-inset-top, 0px)) + 8px)' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-500/45 via-blue-500/35 to-purple-500/45" />
      <div className="pointer-events-none absolute -left-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-white/25 blur-3xl" />
      <div className="relative mx-auto flex w-full max-w-6xl items-center gap-3">
        <h1 className="shrink-0 text-left text-lg font-bold tracking-tight sm:text-xl">MaxTour</h1>
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
          className="min-w-0 flex-1 [&_[role='tab']]:!text-white/90 [&_[role='tab']]:font-medium [&_[role='tab']]:text-xs sm:[&_[role='tab']]:text-sm [&_[role='tab'][aria-selected='true']]:!text-[#1D4ED8]"
          listClassName="w-full flex-nowrap justify-end gap-1 overflow-x-auto rounded-full bg-white/20 p-1 backdrop-blur-sm no-scrollbar [&_[role='tab']]:shrink-0"
        />
      </div>
    </header>
  );
}
