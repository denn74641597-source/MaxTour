import { Skeleton } from '@/components/ui/skeleton';

export default function AdminAuditLogLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-[620px] max-w-full" />
      </div>

      <Skeleton className="h-40 w-full rounded-2xl" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} className="h-28 w-full rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-44 w-full rounded-2xl" />
      <Skeleton className="h-[460px] w-full rounded-2xl" />
      <Skeleton className="h-[260px] w-full rounded-2xl" />
    </div>
  );
}
