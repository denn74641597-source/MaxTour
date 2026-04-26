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
      className="sticky top-0 z-50 border-b border-white/20 bg-[#2563EB] px-4 pb-3 text-white"
      style={{ paddingTop: 'calc(var(--tg-safe-top, env(safe-area-inset-top, 0px)) + 12px)' }}
    >
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-center text-xl font-bold tracking-tight">MaxTour</h1>
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
          className="mt-3 w-full [&_[role='tab']]:!text-white/90 [&_[role='tab']]:font-medium [&_[role='tab'][aria-selected='true']]:!text-[#1D4ED8]"
          listClassName="mx-auto w-fit max-w-full flex-wrap justify-center rounded-full bg-white/20 p-1 backdrop-blur-sm"
        />
      </div>
    </header>
  );
}
