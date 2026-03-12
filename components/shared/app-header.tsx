import Link from 'next/link';
import { Globe, Bell } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#f6f6f8]/80 backdrop-blur-md px-4 py-3">
      <div className="mx-auto flex items-center justify-between max-w-2xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center">
            <Globe className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-primary">MaxTour</h1>
        </Link>
        <button className="relative p-2 rounded-full hover:bg-primary/10 transition-colors">
          <Bell className="h-5 w-5 text-slate-700" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
      </div>
    </header>
  );
}
