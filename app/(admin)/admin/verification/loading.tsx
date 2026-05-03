import { SectionShell } from '@/components/shared-ui';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminVerificationLoading() {
  return (
    <SectionShell className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="rounded-2xl border border-slate-200 py-4">
            <CardContent className="space-y-2 px-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-14" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border border-slate-200 py-3">
        <CardContent className="space-y-3 px-4">
          <Skeleton className="h-9 w-full" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-slate-200 py-2">
        <CardContent className="space-y-3 px-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    </SectionShell>
  );
}
