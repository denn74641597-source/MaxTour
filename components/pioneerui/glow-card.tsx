import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  glowClassName?: string;
}

export function GlowCard({ children, className, contentClassName, glowClassName }: GlowCardProps) {
  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'pointer-events-none absolute inset-x-4 -bottom-2 h-9 rounded-full bg-gradient-to-r from-cyan-400/35 via-blue-500/30 to-indigo-500/35 blur-xl',
          glowClassName,
        )}
      />
      <div className={cn('relative rounded-[inherit]', contentClassName)}>{children}</div>
    </div>
  );
}
