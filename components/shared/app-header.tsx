'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Ticket, Heart, User } from 'lucide-react';
import { LanguageSwitcher } from './language-switcher';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export function AppHeader({ rightSlot }: { rightSlot?: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { href: '/', label: t.nav.explore, icon: Compass },
    { href: '/tours', label: t.nav.bookings, icon: Ticket },
    { href: '/favorites', label: t.nav.subscriptions, icon: Heart },
    { href: '/profile', label: t.nav.profile, icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 glass-nav px-6 py-3" style={{ paddingTop: 'calc(var(--tg-safe-top, env(safe-area-inset-top, 0px)) + 12px)' }}>
      <div className="mx-auto flex items-center justify-between max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl">
        <Link href="/" className="flex items-center gap-2">
          <Compass className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">MaxTour</h1>
        </Link>

        {/* Desktop navigation — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'text-primary bg-primary/8'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive && 'stroke-[2.5px]')} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="dropdown" />
          {rightSlot}
        </div>
      </div>
    </header>
  );
}
