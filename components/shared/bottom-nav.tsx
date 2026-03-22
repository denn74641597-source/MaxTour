'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Ticket, Heart, User } from 'lucide-react';
import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export const BottomNav = memo(function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const NAV_ITEMS = useMemo(() => [
    { href: '/', label: t.nav.explore, icon: Compass },
    { href: '/tours', label: t.nav.bookings, icon: Ticket },
    { href: '/favorites', label: t.nav.subscriptions, icon: Heart },
    { href: '/profile', label: t.nav.profile, icon: User },
  ], [t.nav]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav safe-area-pb">
      <div className="mx-auto flex items-center justify-around max-w-2xl py-2 px-6">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 transition-colors min-w-[48px] min-h-[48px] justify-center',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'fill-current')} />
              <span className={cn('text-[10px] uppercase tracking-wider', isActive ? 'font-bold' : 'font-medium')}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});
