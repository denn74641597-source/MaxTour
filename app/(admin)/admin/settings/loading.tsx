import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSettingsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-3 h-4 w-[32rem] max-w-full" />
        <Skeleton className="mt-4 h-4 w-56" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <Skeleton className="h-5 w-72" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-4/5" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-2xl" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="mt-2 h-4 w-96 max-w-full" />
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              <Skeleton className="h-44 rounded-xl" />
              <Skeleton className="h-44 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
