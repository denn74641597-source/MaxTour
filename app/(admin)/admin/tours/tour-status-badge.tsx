'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TOUR_STATUS_META, toTourStatus } from './tour-admin-utils';

export function TourStatusBadge({ status }: { status: string }) {
  const key = toTourStatus(status);
  const meta = TOUR_STATUS_META[key];

  return (
    <Badge
      variant="outline"
      className={cn(
        'border px-2 py-0.5 text-[11px] font-semibold',
        meta.tone
      )}
    >
      {meta.label}
    </Badge>
  );
}
