import Link from 'next/link';
import { Compass, CircleUserRound } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
      <div className="mx-auto flex items-center justify-between max-w-2xl">
        <Link href="/" className="flex items-center gap-2">
          <Compass className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">MaxTour</h1>
        </Link>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
          <CircleUserRound className="h-6 w-6 text-slate-600" />
        </button>
      </div>
    </header>
  );
}
