'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, MapPin, Users, CreditCard,
  Menu, MessageSquareText, UserCheck, BarChart3, Home, ShieldCheck, Megaphone, Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from './language-switcher';
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose,
} from '@/components/ui/sheet';

export function DashboardNav({ type = 'agency' }: { type?: 'agency' | 'admin' }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const agencyMobileNav = [
    { href: '/agency', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/agency/tours', label: t.nav.tours, icon: MapPin },
    { href: '/agency/interests', label: t.nav.interested, icon: UserCheck },
    { href: '/agency/leads', label: t.nav.requests, icon: MessageSquareText },
    { href: '/agency/analytics', label: t.analytics.title, icon: BarChart3 },
    { href: '/agency/advertising', label: t.nav.advertising, icon: Megaphone },
    { href: '/agency/verification', label: t.nav.verification, icon: ShieldCheck },
    { href: '/agency/subscription', label: t.nav.subscription, icon: CreditCard },
    { href: '/agency/profile', label: t.nav.profile, icon: Building2 },
  ];

  const agencyNavFull = [
    { href: '/agency', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/agency/tours', label: t.nav.tours, icon: MapPin },
    { href: '/agency/interests', label: t.nav.interested, icon: UserCheck },
    { href: '/agency/leads', label: t.nav.requests, icon: MessageSquareText },
    { href: '/agency/analytics', label: t.analytics.title, icon: BarChart3 },
    { href: '/agency/advertising', label: t.nav.advertising, icon: Megaphone },
    { href: '/agency/verification', label: t.nav.verification, icon: ShieldCheck },
    { href: '/agency/subscription', label: t.nav.subscription, icon: CreditCard },
    { href: '/agency/profile', label: t.nav.profile, icon: Building2 },
  ];

  const adminItems = [
    { href: '/admin', label: t.nav.overview, icon: LayoutDashboard },
    { href: '/admin/agencies', label: t.nav.agencies, icon: Building2 },
    { href: '/admin/tours', label: t.nav.tours, icon: MapPin },
    { href: '/admin/verification', label: t.nav.verification, icon: ShieldCheck },
    { href: '/admin/coin-requests', label: t.nav.coinRequests, icon: Coins },
    { href: '/admin/featured', label: t.nav.featured, icon: CreditCard },
    { href: '/admin/subscriptions', label: t.nav.subscriptions, icon: Users },
  ];

  const sidebarItems = type === 'admin' ? adminItems : agencyNavFull;
  const mobileItems = type === 'admin' ? adminItems : agencyMobileNav;

  const isItemActive = (href: string) =>
    href === pathname || (href !== '/agency' && href !== '/admin' && pathname.startsWith(href));

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block md:border-r md:w-56 md:min-h-screen bg-muted/30">
        <div className="p-4 flex items-center gap-2">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5">
            <Home className="h-4 w-4" />
            {t.nav.home}
          </Link>
          <div className="flex-1" />
          <LanguageSwitcher variant="dropdown" />
        </div>
        <nav className="flex flex-col gap-1 px-2 pb-4">
          {sidebarItems.map(({ href, label, icon: Icon }) => {
            const isActive = isItemActive(href);
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

      {/* Mobile top header with hamburger menu */}
      <div className="md:hidden sticky top-0 z-50 glass-nav" style={{ paddingTop: 'var(--tg-safe-top, env(safe-area-inset-top, 0px))' }}>
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <Home className="h-4 w-4" />
              {t.nav.home}
            </Link>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="p-2 -mr-2 rounded-xl hover:bg-muted transition-colors">
              <Menu className="h-5 w-5 text-foreground" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0" style={{ paddingTop: 'var(--tg-safe-top, env(safe-area-inset-top, 0px))' }}>
              <SheetHeader className="px-4 py-4">
                <SheetTitle className="text-base font-semibold">
                  {type === 'admin' ? t.nav.adminPanel : t.nav.agencyPanel}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3">
                {mobileItems.map(({ href, label, icon: Icon }) => {
                  const isActive = isItemActive(href);
                  return (
                    <SheetClose key={href} render={<span />}>
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                        <span>{label}</span>
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>
              <div className="mt-auto p-4">
                <LanguageSwitcher variant="dropdown" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
