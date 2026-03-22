import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

const VARIANT_STYLES: Record<StatusVariant, string> = {
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-tertiary/15 text-tertiary dark:bg-tertiary/30 dark:text-tertiary',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  default: 'bg-secondary text-secondary-foreground',
};

// Map common status values to visual variants
const STATUS_MAP: Record<string, StatusVariant> = {
  // Tour status
  published: 'success',
  draft: 'default',
  pending: 'warning',
  archived: 'info',
  // Lead status
  new: 'info',
  contacted: 'warning',
  closed: 'default',
  won: 'success',
  lost: 'error',
  // Subscription status
  active: 'success',
  expired: 'error',
  cancelled: 'error',
  trial: 'info',
  // Approval
  approved: 'success',
  rejected: 'error',
  verified: 'info',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const variant = STATUS_MAP[status.toLowerCase()] ?? 'default';

  return (
    <Badge
      variant="secondary"
      className={cn(
        'text-[11px] font-medium capitalize border-0',
        VARIANT_STYLES[variant],
        className
      )}
    >
      {label ?? status}
    </Badge>
  );
}
