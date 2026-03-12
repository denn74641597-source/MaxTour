import Link from 'next/link';
import { Plane } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Plane className="h-5 w-5 text-primary" />
          <span>MaxTour</span>
        </Link>
      </div>
    </header>
  );
}
