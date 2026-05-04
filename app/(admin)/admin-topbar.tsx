'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Globe, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LANGUAGES, LANGUAGE_FLAGS } from '@/lib/i18n/config';
import { useAdminI18n } from '@/features/admin/i18n';

function resolvePageKey(pathname: string):
  | 'dashboard'
  | 'agencies'
  | 'tours'
  | 'users'
  | 'verification'
  | 'leads'
  | 'reklama'
  | 'maxcoin'
  | 'subscriptions'
  | 'deleteAccount'
  | 'auditLog'
  | 'settings'
  | 'adminLogin' {
  if (pathname.startsWith('/admin/agencies')) return 'agencies';
  if (pathname.startsWith('/admin/tours')) return 'tours';
  if (pathname.startsWith('/admin/users')) return 'users';
  if (pathname.startsWith('/admin/verification')) return 'verification';
  if (pathname.startsWith('/admin/leads')) return 'leads';
  if (pathname.startsWith('/admin/reklama')) return 'reklama';
  if (pathname.startsWith('/admin/maxcoin')) return 'maxcoin';
  if (pathname.startsWith('/admin/coin-requests')) return 'maxcoin';
  if (pathname.startsWith('/admin/featured')) return 'reklama';
  if (pathname.startsWith('/admin/subscriptions')) return 'subscriptions';
  if (pathname.startsWith('/admin/account-deletions')) return 'deleteAccount';
  if (pathname.startsWith('/admin/audit-log')) return 'auditLog';
  if (pathname.startsWith('/admin/settings')) return 'settings';
  if (pathname.startsWith('/admin/login')) return 'adminLogin';
  return 'dashboard';
}

export function AdminTopbar() {
  const pathname = usePathname();
  const { language, setLanguage, tc, tp } = useAdminI18n();

  const pageKey = useMemo(() => resolvePageKey(pathname), [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{tp(pageKey)}</p>
          <p className="truncate text-xs text-slate-500">{tp('platformOverview')}</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
            <Globe className="h-3.5 w-3.5" />
            {tc('language')}
          </span>
          <div className="grid grid-cols-2 gap-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={cn(
                  'rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                  language === lang
                    ? 'border-sky-300 bg-sky-100 text-sky-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                )}
              >
                {LANGUAGE_FLAGS[lang]} {lang === 'uz' ? tc('uzbek') : tc('russian')}
              </button>
            ))}
          </div>
          <span className="hidden items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-700 sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            {tc('active')}
          </span>
        </div>
      </div>
    </header>
  );
}
