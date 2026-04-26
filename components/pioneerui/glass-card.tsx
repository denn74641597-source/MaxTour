import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function GlassCard({ children, className, contentClassName }: GlassCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/45 bg-white/16 backdrop-blur-xl dark:border-white/20 dark:bg-white/8',
        className,
      )}
    >
      <div className={cn('relative rounded-[inherit]', contentClassName)}>{children}</div>
    </div>
  );
}
