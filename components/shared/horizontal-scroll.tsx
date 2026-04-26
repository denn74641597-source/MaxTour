'use client';

import { type MutableRefObject, type ReactNode, forwardRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMouseDragScroll } from '@/hooks/use-mouse-drag-scroll';

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
  /** Add negative margin + padding to bleed to container edges. Default: true */
  bleed?: boolean;
  /** Shows desktop left/right controls for mouse navigation. */
  showControls?: boolean;
  /** Optional scroll amount in pixels for each control click. */
  scrollStep?: number;
}

/**
 * A horizontal scroll container with mouse-drag support for desktop.
 * On mobile, native touch scroll works. On desktop, users can click-drag.
 */
export const HorizontalScroll = forwardRef<HTMLDivElement, HorizontalScrollProps>(
  function HorizontalScroll({ children, className, bleed = true, showControls = false, scrollStep }, _ref) {
    const dragRef = useMouseDragScroll<HTMLDivElement>();

    const setCombinedRef = (node: HTMLDivElement | null) => {
      dragRef.current = node;
      if (typeof _ref === 'function') {
        _ref(node);
      } else if (_ref) {
        (_ref as MutableRefObject<HTMLDivElement | null>).current = node;
      }
    };

    const scrollByStep = (direction: 'left' | 'right') => {
      const el = dragRef.current;
      if (!el) return;

      const distance = scrollStep ?? Math.round(el.clientWidth * 0.82);
      el.scrollBy({
        left: direction === 'left' ? -distance : distance,
        behavior: 'smooth',
      });
    };

    return (
      <div className="relative">
        {showControls && (
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollByStep('left')}
            className="flex absolute left-1 top-1/2 z-20 h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-surface/90 text-foreground shadow-[0_10px_24px_-14px_rgba(15,23,42,0.85)] backdrop-blur hover:bg-surface"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div
          ref={setCombinedRef}
          className={cn(
            'flex overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing',
            bleed && '-mx-6 px-6',
            showControls && 'md:px-14',
            className
          )}
        >
          {children}
        </div>

        {showControls && (
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollByStep('right')}
            className="flex absolute right-1 top-1/2 z-20 h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-surface/90 text-foreground shadow-[0_10px_24px_-14px_rgba(15,23,42,0.85)] backdrop-blur hover:bg-surface"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }
);
