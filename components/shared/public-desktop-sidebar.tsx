'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Map,
  Heart,
  User,
  BellRing,
  Building2,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useProfile } from '@/hooks';
import { LanguageSwitcher } from './language-switcher';
import { cn } from '@/lib/utils';
import { getAgencyPortalHref } from '@/lib/routing/domains';

/**
 * Public-facing left sidebar for desktop (>= lg).
 * Hidden on mobile/tablet — there the BottomNav + AppHeader handle navigation.
 */
export function PublicDesktopSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { profile } = useProfile();
  const agencyPanelHref = getAgencyPortalHref('/agency');

  const PRIMARY_ITEMS = [
    { href: '/', label: t.nav.explore, icon: Compass },
    { href: '/tours', label: t.nav.bookings, icon: Map },
    { href: '/favorites', label: t.nav.subscriptions, icon: Heart },
    { href: '/profile', label: t.nav.profile, icon: User },
  ];

  const SECONDARY_ITEMS = profile
    ? [
        { href: '/profile/notifications', label: t.notifications.title, icon: BellRing },
        ...(profile.role === 'agency_manager'
          ? [{ href: agencyPanelHref, label: t.nav.agencyPanel, icon: Building2 }]
          : []),
      ]
    : [];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen lg:border-r border-border/40 bg-card">
      <div className="px-6 py-5 flex items-center gap-2">
        <Compass className="h-7 w-7 text-primary" />
        <span className="text-xl font-bold tracking-tight">MaxTour</span>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 mt-2">
        {PRIMARY_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', active && 'stroke-[2.4px]')} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {SECONDARY_ITEMS.length > 0 && (
        <>
          <div className="mt-6 mb-2 px-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t.common.viewProfile}
          </div>
          <nav className="flex flex-col gap-0.5 px-3">
            {SECONDARY_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className={cn('h-5 w-5 shrink-0', active && 'stroke-[2.4px]')} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </>
      )}

      <div className="mt-auto px-3 pb-6">
        <div className="px-3 py-3 flex items-center justify-between gap-2">
          <LanguageSwitcher variant="dropdown" />
        </div>
        {profile && (
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm bg-muted/40 hover:bg-muted transition-colors"
          >
            <span className="h-9 w-9 rounded-full bg-primary/15 text-primary grid place-items-center text-sm font-semibold">
              {(profile.full_name ?? profile.email ?? '?').slice(0, 1).toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{profile.full_name ?? t.nav.profile}</div>
              <div className="text-[11px] text-muted-foreground truncate">{profile.email ?? profile.phone ?? ''}</div>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}
