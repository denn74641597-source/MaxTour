'use client';

import { type ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useMouseDragScroll } from '@/hooks/use-mouse-drag-scroll';

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
  /** Add negative margin + padding to bleed to container edges. Default: true */
  bleed?: boolean;
}

/**
 * A horizontal scroll container with mouse-drag support for desktop.
 * On mobile, native touch scroll works. On desktop, users can click-drag.
 */
export const HorizontalScroll = forwardRef<HTMLDivElement, HorizontalScrollProps>(
  function HorizontalScroll({ children, className, bleed = true }, _ref) {
    const dragRef = useMouseDragScroll<HTMLDivElement>();

    return (
      <div
        ref={dragRef}
        className={cn(
          'flex overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing',
          bleed && '-mx-6 px-6',
          className
        )}
      >
        {children}
      </div>
    );
  }
);
