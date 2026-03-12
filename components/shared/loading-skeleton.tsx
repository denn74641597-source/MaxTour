import { Skeleton } from '@/components/ui/skeleton';

export function TourCardSkeleton() {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex justify-between pt-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function TourListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <TourCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function AgencyCardSkeleton() {
  return (
    <div className="min-w-[180px] rounded-lg border p-4 flex flex-col items-center gap-2">
      <Skeleton className="h-14 w-14 rounded-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}
