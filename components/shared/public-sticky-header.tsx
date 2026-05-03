'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Ticket, Heart, User, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from './language-switcher';
import { MaxTourLoader } from './max-tour-loader';

const NAV_ITEMS = [
  { href: '/', key: 'explore', icon: Compass },
  { href: '/tours', key: 'bookings', icon: Ticket },
  { href: '/favorites', key: 'subscriptions', icon: Heart },
  { href: '/profile', key: 'profile', icon: User },
] as const;

export function PublicStickyHeader() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/40 bg-[linear-gradient(120deg,rgba(10,88,138,0.96),rgba(6,107,154,0.92),rgba(17,84,122,0.95))] text-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.75)]"
      style={{ paddingTop: 'calc(var(--tg-safe-top, env(safe-area-inset-top, 0px)) + 8px)' }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.35),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(255,255,255,0.22),transparent_33%)]" />
      <div className="relative mx-auto flex w-full max-w-[1480px] items-center justify-between gap-4 px-4 py-3 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="text-2xl font-extrabold tracking-tight">MaxTour</span>
          <MaxTourLoader loop={false} className="h-8 w-8 shrink-0 opacity-90" />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full bg-white/14 p-1 backdrop-blur-sm md:flex">
          {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-white text-[#0e5a86]'
                    : 'text-white/90 hover:bg-white/16 hover:text-white',
                )}
              >
                <Icon className="h-4 w-4" />
                {t.nav[key]}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <LanguageSwitcher variant="dropdown" />
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#0f5f8f] shadow-sm transition-colors hover:bg-white/90 sm:px-4 sm:text-sm"
          >
            <Building2 className="h-4 w-4" />
            Agency
          </Link>
        </div>
      </div>
    </header>
  );
}
