'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, MapPin, Users, CreditCard, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AGENCY_NAV = [
  { href: '/agency', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agency/profile', label: 'Profile', icon: Building2 },
  { href: '/agency/tours', label: 'Tours', icon: MapPin },
  { href: '/agency/leads', label: 'Leads', icon: Users },
  { href: '/agency/subscription', label: 'Subscription', icon: CreditCard },
];

export function DashboardNav({ type = 'agency' }: { type?: 'agency' | 'admin' }) {
  const pathname = usePathname();

  const items = type === 'admin'
    ? [
        { href: '/admin', label: 'Overview', icon: LayoutDashboard },
        { href: '/admin/agencies', label: 'Agencies', icon: Building2 },
        { href: '/admin/tours', label: 'Tours', icon: MapPin },
        { href: '/admin/featured', label: 'Featured', icon: CreditCard },
        { href: '/admin/subscriptions', label: 'Subscriptions', icon: Users },
      ]
    : AGENCY_NAV;

  return (
    <aside className="w-full border-b md:border-b-0 md:border-r md:w-56 md:min-h-screen bg-muted/30">
      <div className="p-4 flex items-center gap-2">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h2 className="font-semibold text-sm">
          {type === 'admin' ? 'Admin Panel' : 'Agency Panel'}
        </h2>
      </div>
      <nav className="flex md:flex-col overflow-x-auto md:overflow-x-visible gap-1 px-2 pb-2 md:pb-4">
        {items.map(({ href, label, icon: Icon }) => {
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
  );
}
