'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  className?: string;
  innerClassName?: string;
  frontClassName?: string;
  backClassName?: string;
}

export function FlipCard({
  front,
  back,
  className,
  innerClassName,
  frontClassName,
  backClassName,
}: FlipCardProps) {
  return (
    <div className={cn('group h-full w-full [perspective:1200px]', className)}>
      <div
        className={cn(
          'relative h-full w-full transition-transform duration-700 ease-out [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus-within:[transform:rotateY(180deg)]',
          innerClassName,
        )}
      >
        <div className={cn('absolute inset-0 [backface-visibility:hidden]', frontClassName)}>{front}</div>
        <div
          className={cn(
            'absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]',
            backClassName,
          )}
        >
          {back}
        </div>
      </div>
    </div>
  );
}
