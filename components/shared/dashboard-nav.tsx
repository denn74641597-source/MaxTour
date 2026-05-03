'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  CreditCard,
  Menu,
  UserCheck,
  BarChart3,
  Home,
  ShieldCheck,
  Megaphone,
  Coins,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from './language-switcher';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { createClient } from '@/lib/supabase/client';

type NavType = 'agency' | 'admin';

function useNavItems(type: NavType, t: ReturnType<typeof useTranslation>['t']) {
  const agencyItems = [
    { href: '/agency', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/agency/tours', label: t.nav.tours, icon: MapPin },
    { href: '/agency/leads', label: t.leadsPage.title, icon: Users },
    { href: '/agency/advertising', label: t.nav.advertising, icon: Megaphone },
    { href: '/agency/interests', label: t.nav.interested, icon: UserCheck },
    { href: '/agency/analytics', label: t.analytics.title, icon: BarChart3 },
    { href: '/agency/verification', label: t.nav.verification, icon: ShieldCheck },
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

  return type === 'admin' ? adminItems : agencyItems;
}

function isItemActive(pathname: string, href: string) {
  return href === pathname || (href !== '/agency' && href !== '/admin' && pathname.startsWith(href));
}

export function DashboardNav({ type = 'agency' }: { type?: NavType }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const items = useNavItems(type, t);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <aside className="hidden md:flex md:min-h-screen md:w-72 md:flex-col md:border-r md:border-slate-200/60 md:bg-white/70 md:p-5 md:backdrop-blur-sm">
      <div className="mb-5 flex items-center gap-2">
        <Link href="/" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
          <Home className="h-3.5 w-3.5" />
          {t.nav.home}
        </Link>
        <div className="ml-auto">
          <LanguageSwitcher variant="dropdown" />
        </div>
      </div>

      <div className="market-subtle-border rounded-2xl bg-white/85 p-2">
        <nav className="flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isItemActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'inline-flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-[linear-gradient(120deg,#0f648f,#0e7ca4)] text-white shadow-[0_16px_30px_-22px_rgba(14,88,128,0.85)]'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
          {type === 'agency' && (
            <button
              onClick={handleLogout}
              className="mt-2 inline-flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>{t.auth.logout}</span>
            </button>
          )}
        </nav>
      </div>
    </aside>
  );
}

export function DashboardMenuTrigger({ type = 'agency' }: { type?: NavType }) {
  return <DashboardMenuTriggerInner type={type} />;
}

function DashboardMenuTriggerInner({ type }: { type: NavType }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const items = useNavItems(type, t);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="rounded-xl border border-slate-200 bg-white/85 p-2 shadow-sm transition-colors hover:bg-white">
        <Menu className="h-5 w-5 text-slate-700" />
      </SheetTrigger>
      <SheetContent side="right" className="w-72 p-0">
        <SheetHeader className="border-b border-slate-200 px-4 py-4">
          <SheetTitle className="text-base font-semibold">
            {type === 'admin' ? t.nav.adminPanel : t.nav.agencyPanel}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-3">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isItemActive(pathname, href);
            return (
              <SheetClose key={href} render={<span />}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'inline-flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-[linear-gradient(120deg,#0f648f,#0e7ca4)] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              </SheetClose>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-slate-200 p-4">
          <LanguageSwitcher variant="dropdown" />
          {type === 'agency' && (
            <button
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-600"
            >
              <LogOut className="h-4 w-4" />
              {t.auth.logout}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
