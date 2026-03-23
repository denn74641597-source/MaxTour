'use client';

import Link from 'next/link';
import { Compass } from 'lucide-react';
import { LanguageSwitcher } from './language-switcher';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 glass-nav px-6 py-3" style={{ paddingTop: 'calc(var(--tg-safe-top, env(safe-area-inset-top, 0px)) + 12px)' }}>
      <div className="mx-auto flex items-center justify-between max-w-2xl">
        <Link href="/" className="flex items-center gap-2">
          <Compass className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">MaxTour</h1>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="dropdown" />
        </div>
      </div>
    </header>
  );
}
