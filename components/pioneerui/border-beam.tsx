import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BorderBeamProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  beamClassName?: string;
  duration?: number;
}

export function BorderBeam({
  children,
  className,
  contentClassName,
  beamClassName,
  duration = 6000,
}: BorderBeamProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-[inherit]', className)}>
      <div
        className={cn(
          'pointer-events-none absolute -inset-[140%] rounded-[inherit] bg-[conic-gradient(from_0deg,rgba(56,189,248,0)_0deg,rgba(56,189,248,0.95)_70deg,rgba(37,99,235,0.95)_140deg,rgba(99,102,241,0.92)_220deg,rgba(56,189,248,0)_300deg,rgba(56,189,248,0)_360deg)]',
          beamClassName,
        )}
        style={{ animation: `pioneer-border-beam-spin ${duration}ms linear infinite` }}
      />
      <div className={cn('relative m-[1.5px] rounded-[inherit]', contentClassName)}>{children}</div>
    </div>
  );
}
