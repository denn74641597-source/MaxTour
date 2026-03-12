'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, ListFilter, Heart, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Explore', icon: Compass },
  { href: '/tours', label: 'Catalog', icon: ListFilter },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/agency', label: 'My Tours', icon: Wallet },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-pb">
      <div className="mx-auto flex items-center justify-around max-w-2xl py-2 px-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'fill-current')} />
              <span className={cn('text-[10px]', isActive ? 'font-semibold' : 'font-medium')}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
