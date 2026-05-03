import { Skeleton } from '@/components/ui/skeleton';

export default function AdminAgenciesLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Skeleton key={idx} className="h-24 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-14 rounded-2xl" />

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="space-y-2">
          {Array.from({ length: 9 }).map((_, idx) => (
            <Skeleton key={idx} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
