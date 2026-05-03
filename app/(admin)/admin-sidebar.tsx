'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  Coins,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Star,
  Trash2,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { LANGUAGE_FLAGS, LANGUAGE_LABELS, LANGUAGES } from '@/lib/i18n/config';
import { createClient } from '@/lib/supabase/client';
import { Separator } from '@/components/ui/separator';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operations',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/agencies', label: 'Agencies', icon: Building2 },
      { href: '/admin/tours', label: 'Tours', icon: MapPin },
      { href: '/admin/users', label: 'Users', icon: UserCog },
      { href: '/admin/verification', label: 'Verification', icon: ShieldCheck },
      { href: '/admin/leads', label: 'Leads', icon: MessageSquareText },
    ],
  },
  {
    title: 'Growth',
    items: [
      { href: '/admin/coin-requests', label: 'Promotions / MaxCoin', icon: Coins },
      { href: '/admin/featured', label: 'Featured Promotions', icon: Star },
      { href: '/admin/subscriptions', label: 'Subscriptions', icon: Users },
    ],
  },
  {
    title: 'Safety',
    items: [
      { href: '/admin/account-deletions', label: 'Delete Account', icon: Trash2 },
      { href: '/admin/audit-log', label: 'Audit Log', icon: FileText },
    ],
  },
  {
    title: 'System',
    items: [{ href: '/admin/settings', label: 'Settings', icon: Settings }],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, setLanguage } = useTranslation();

  const isItemActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' }).catch(async () => {
      await supabase.auth.signOut();
    });
    router.push('/admin/login');
  };

  const closeMobileSidebar = () => setMobileOpen(false);

  const sidebarContent = (
    <div className="relative flex h-full flex-col overflow-hidden rounded-none border-r border-slate-800/70 bg-[radial-gradient(circle_at_top_left,rgba(22,101,187,0.25),transparent_42%),linear-gradient(180deg,#07101d,#090f1c_42%,#070d19)] text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] [background-size:26px_26px]" />

      <div className="relative p-5 pb-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-3 backdrop-blur-sm">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-black tracking-wide text-white shadow-[0_10px_22px_-12px_rgba(14,165,233,0.85)]">
            MT
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-wide text-white">MaxTour Remote</p>
            <p className="truncate text-[11px] font-medium text-slate-400">Operations Console</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-[11px] text-slate-400">
          <span>remote.mxtr.uz</span>
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            live
          </span>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto px-3 pb-3">
        {NAV_SECTIONS.map((section, sectionIdx) => (
          <div key={section.title} className={cn(sectionIdx > 0 && 'mt-4')}>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {section.title}
            </p>
            <nav className="space-y-1">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = isItemActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobileSidebar}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-0',
                      active
                        ? 'border-sky-400/30 bg-gradient-to-r from-sky-500/22 to-blue-500/15 text-white shadow-[0_12px_24px_-16px_rgba(56,189,248,0.95)]'
                        : 'border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-800/60 hover:text-white',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-200',
                        active ? 'text-sky-300' : 'text-slate-500 group-hover:text-slate-200',
                        !active && 'group-hover:-translate-y-[1px]',
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    <ArrowRight
                      className={cn(
                        'h-3.5 w-3.5 transition-all duration-200',
                        active
                          ? 'translate-x-0 text-sky-200 opacity-100'
                          : '-translate-x-1 text-slate-500 opacity-0 group-hover:translate-x-0 group-hover:opacity-100',
                      )}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="relative p-4 pt-3">
        <Separator className="mb-3 bg-slate-800/80" />
        <div className="mb-3 rounded-xl border border-slate-800 bg-slate-900/55 p-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-400">
            <Globe className="h-3.5 w-3.5" />
            Language
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  'rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors',
                  language === lang
                    ? 'border-sky-400/35 bg-sky-500/20 text-sky-100'
                    : 'border-slate-700 bg-slate-800/70 text-slate-400 hover:border-slate-500 hover:text-slate-100',
                )}
              >
                {LANGUAGE_FLAGS[lang]} {LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-2 rounded-xl border border-slate-800 bg-slate-900/45 px-3 py-2 text-[11px] text-slate-400">
          <p className="font-medium text-slate-200">Admin Session</p>
          <p className="mt-0.5">Role-protected control surface</p>
        </div>
        <button
          onClick={handleLogout}
          className="group flex w-full items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-200 transition-all duration-200 hover:bg-rose-500/20 hover:text-rose-100"
        >
          <span className="inline-flex items-center gap-2">
            <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Logout
          </span>
          <ArrowRight className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] md:block">
        {sidebarContent}
      </aside>

      <div className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/70 bg-slate-950/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 text-xs font-bold text-white">
              MT
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Admin</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Remote</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="rounded-lg border border-slate-700 bg-slate-900/60 p-2 text-slate-300 transition-colors hover:text-white"
            aria-label="Toggle admin sidebar"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity md:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={closeMobileSidebar}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[272px] transform transition-transform duration-300 ease-out md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>

      <div className="h-16 md:hidden" />
    </>
  );
}
