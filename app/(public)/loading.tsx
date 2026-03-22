import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="px-6 py-4 space-y-8">
      {/* Search bar skeleton */}
      <Skeleton className="w-full h-14 rounded-[1.5rem]" />

      {/* Filter chips skeleton */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-full shrink-0" />
        ))}
      </div>

      {/* Hero banner skeleton */}
      <Skeleton className="w-full aspect-[16/10] rounded-[1.5rem]" />

      {/* Popular destinations skeleton */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0">
              <Skeleton className="w-28 h-28 rounded-[1.5rem]" />
              <Skeleton className="h-4 w-16 mx-auto mt-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Agencies skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-5 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>

      {/* Hot deals skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-[1.5rem] shadow-ambient bg-surface p-4">
            <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
