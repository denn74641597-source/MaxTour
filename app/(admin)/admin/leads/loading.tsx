import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLeadsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-56" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-56 rounded-2xl" />
      <Skeleton className="h-[520px] rounded-2xl" />
    </div>
  );
}
