'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  CreditCard,
  Menu,
  BarChart3,
  Home,
  ShieldCheck,
  Megaphone,
  Coins,
  LogOut,
  UserCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from './language-switcher';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks';

type NavType = 'agency' | 'admin';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matchers?: string[];
};

function useNavItems(type: NavType, t: ReturnType<typeof useTranslation>['t']): NavItem[] {
  const agencyItems: NavItem[] = [
    { href: '/agency', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/agency/tours', label: t.nav.tours, icon: MapPin },
    {
      href: '/agency/requests',
      label: t.nav.requests,
      icon: Users,
      matchers: ['/agency/requests', '/agency/leads', '/agency/interests'],
    },
    { href: '/agency/advertising', label: t.nav.advertising, icon: Megaphone },
    { href: '/agency/analytics', label: t.analytics.title, icon: BarChart3 },
    { href: '/agency/verification', label: t.nav.verification, icon: ShieldCheck },
    { href: '/agency/profile', label: t.nav.profile, icon: Building2 },
  ];

  const adminItems: NavItem[] = [
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

function isItemActive(pathname: string, item: NavItem) {
  if (item.matchers?.some((matcher) => pathname === matcher || pathname.startsWith(`${matcher}/`))) {
    return true;
  }
  return item.href === pathname || (item.href !== '/agency' && item.href !== '/admin' && pathname.startsWith(item.href));
}

function getAgencyWorkspaceMeta(pathname: string, t: ReturnType<typeof useTranslation>['t']) {
  if (pathname.startsWith('/agency/tours')) {
    return { title: t.nav.tours, description: t.agency.manageTours };
  }
  if (pathname.startsWith('/agency/requests') || pathname.startsWith('/agency/leads') || pathname.startsWith('/agency/interests')) {
    return { title: t.nav.requests, description: `${t.leadsPage.title} & ${t.interestsPage.title}` };
  }
  if (pathname.startsWith('/agency/advertising')) {
    return { title: t.nav.advertising, description: t.maxcoin.subtitle };
  }
  if (pathname.startsWith('/agency/analytics')) {
    return { title: t.analytics.title, description: t.analytics.subtitle };
  }
  if (pathname.startsWith('/agency/verification')) {
    return { title: t.nav.verification, description: t.verification.description };
  }
  if (pathname.startsWith('/agency/profile')) {
    return { title: t.nav.profile, description: t.auth.editProfile };
  }
  return { title: t.nav.dashboard, description: t.agency.welcomeBack };
}

function roleLabel(role: string | null | undefined, t: ReturnType<typeof useTranslation>['t']) {
  if (role === 'admin') return t.auth.roleAdmin;
  if (role === 'agency_manager') return t.auth.roleAgency;
  return t.auth.roleUser;
}

export function AgencyWorkspaceTopbar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { profile, loading } = useProfile();
  const meta = useMemo(() => getAgencyWorkspaceMeta(pathname, t), [pathname, t]);

  return (
    <header className="hidden md:flex items-center justify-between rounded-3xl border border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur-sm shadow-[0_22px_46px_-34px_rgba(15,23,42,0.45)]">
      <div className="min-w-0">
        <p className="truncate text-base font-bold text-slate-900">{meta.title}</p>
        <p className="truncate text-xs text-slate-500">{meta.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <LanguageSwitcher variant="dropdown" />
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/90 px-2.5 py-1.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-white text-slate-600 shadow-sm">
            <UserCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            {loading ? (
              <div className="h-2.5 w-20 animate-pulse rounded-full bg-slate-200" />
            ) : (
              <p className="truncate text-xs font-semibold text-slate-800">
                {profile?.full_name ?? profile?.email ?? t.nav.profile}
              </p>
            )}
            <p className="text-[11px] text-slate-500">
              {roleLabel(profile?.role, t)}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export function DashboardNav({ type = 'agency' }: { type?: NavType }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { profile } = useProfile();
  const items = useNavItems(type, t);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <aside className="hidden md:flex md:min-h-screen md:w-80 md:flex-col md:border-r md:border-slate-200/75 md:bg-white/78 md:p-5 md:backdrop-blur-sm">
      <div className="mb-4 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.65)]">
        <div className="mb-3 flex items-center gap-2">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            <Home className="h-3.5 w-3.5" />
            {t.nav.home}
          </Link>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {t.nav.agencyPanel}
        </p>
      </div>

      <div className="market-subtle-border rounded-2xl bg-white/88 p-2">
        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all',
                  active
                    ? 'bg-[linear-gradient(120deg,#0f648f,#0e7ca4)] text-white shadow-[0_18px_36px_-24px_rgba(14,88,128,0.85)]'
                    : 'text-slate-600 hover:-translate-y-[1px] hover:bg-slate-100/85 hover:text-slate-900',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-2">
        {type === 'agency' && profile && (
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-slate-800">{profile.full_name ?? profile.email}</p>
            <p className="text-xs text-slate-500">{roleLabel(profile.role, t)}</p>
          </div>
        )}
        {type === 'agency' && (
          <button
            onClick={handleLogout}
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>{t.auth.logout}</span>
          </button>
        )}
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
  const { profile } = useProfile();
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
          {items.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(pathname, item);
            return (
              <SheetClose key={item.href} render={<span />}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'inline-flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-[linear-gradient(120deg,#0f648f,#0e7ca4)] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </SheetClose>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-slate-200 p-4">
          <LanguageSwitcher variant="dropdown" />
          {type === 'agency' && profile && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="truncate text-sm font-semibold text-slate-800">{profile.full_name ?? profile.email}</p>
              <p className="text-xs text-slate-500">{roleLabel(profile.role, t)}</p>
            </div>
          )}
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
