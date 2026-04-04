'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, MapPin, ShieldCheck, Coins,
  Star, Users, FileText, Settings, LogOut, Menu, X,
  ChevronRight, MessageSquareText, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { LANGUAGE_LABELS, LANGUAGE_FLAGS, LANGUAGES } from '@/lib/i18n/config';
import type { Language } from '@/lib/i18n/config';

const navItems = [
  { href: '/admin?mode=admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/agencies?mode=admin', label: 'Agencies', icon: Building2 },
  { href: '/admin/tours?mode=admin', label: 'Tours', icon: MapPin },
  { href: '/admin/leads?mode=admin', label: 'Tour Requests', icon: MessageSquareText },
  { href: '/admin/verification?mode=admin', label: 'Verification', icon: ShieldCheck },
  { href: '/admin/coin-requests?mode=admin', label: 'Coins', icon: Coins },
  { href: '/admin/featured?mode=admin', label: 'Promotions', icon: Star },
  { href: '/admin/subscriptions?mode=admin', label: 'Subscriptions', icon: Users },
  { href: '/admin/audit-log?mode=admin', label: 'Audit Log', icon: FileText },
  { href: '/admin/settings?mode=admin', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, setLanguage } = useTranslation();

  const isItemActive = (href: string) => {
    const path = href.split('?')[0];
    if (path === '/admin') return pathname === '/admin';
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await fetch('/api/admin-auth', { method: 'DELETE' });
    router.push('/');
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
            MT
          </div>
          <div>
            <h1 className="font-bold text-base">MaxTour</h1>
            <p className="text-[11px] text-slate-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Main Menu
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isItemActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                active
                  ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Language switcher + System status + logout */}
      <div className="p-4 border-t border-slate-700/50 space-y-3">
        {/* Language Switcher */}
        <div className="flex items-center gap-1.5 px-1">
          <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={cn(
                'flex-1 text-xs py-1.5 rounded-md transition-colors text-center',
                language === lang
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              {LANGUAGE_FLAGS[lang]} {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 rounded-lg">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">System: Optimal</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          <span>Chiqish</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-64 z-40">
        {sidebar}
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
              MT
            </div>
            <span className="font-semibold text-white text-sm">Admin</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 w-64 z-50">
            {sidebar}
          </aside>
        </>
      )}

      {/* Mobile top spacing */}
      <div className="md:hidden h-14" />
    </>
  );
}
