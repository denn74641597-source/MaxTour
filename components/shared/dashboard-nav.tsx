'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, MapPin, Users, CreditCard, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from './language-switcher';

export function DashboardNav({ type = 'agency' }: { type?: 'agency' | 'admin' }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const agencyNav = [
    { href: '/agency', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/agency/tours', label: t.nav.tours, icon: MapPin },
    { href: '/agency/leads', label: t.nav.leads, icon: Users },
    { href: '/agency/profile', label: t.nav.profile, icon: Building2 },
  ];

  const agencyNavFull = [
    ...agencyNav.slice(0, 3),
    { href: '/agency/subscription', label: t.nav.subscription, icon: CreditCard },
    { href: '/agency/profile', label: t.nav.profile, icon: Building2 },
  ];

  const adminItems = [
    { href: '/admin', label: t.nav.overview, icon: LayoutDashboard },
    { href: '/admin/agencies', label: t.nav.agencies, icon: Building2 },
    { href: '/admin/tours', label: t.nav.tours, icon: MapPin },
    { href: '/admin/featured', label: t.nav.featured, icon: CreditCard },
    { href: '/admin/subscriptions', label: t.nav.subscriptions, icon: Users },
  ];

  const sidebarItems = type === 'admin' ? adminItems : agencyNavFull;
  const bottomItems = type === 'admin' ? adminItems.slice(0, 4) : agencyNav;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block md:border-r md:w-56 md:min-h-screen bg-muted/30">
        <div className="p-4 flex items-center gap-2">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h2 className="font-semibold text-sm flex-1">
            {type === 'admin' ? t.nav.adminPanel : t.nav.agencyPanel}
          </h2>
          <LanguageSwitcher variant="dropdown" />
        </div>
        <nav className="flex flex-col gap-1 px-2 pb-4">
          {sidebarItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === pathname || (href !== '/agency' && href !== '/admin' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 safe-area-bottom">
        <nav className="flex items-center justify-around px-2 py-2">
          {bottomItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === pathname || (href !== '/agency' && href !== '/admin' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-indigo-600'
                    : 'text-slate-400'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'text-indigo-600')} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
