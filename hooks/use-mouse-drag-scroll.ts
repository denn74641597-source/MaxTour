'use client';

import { useRef, useCallback, useEffect } from 'react';

interface UseMouseDragScrollOptions {
  /** Direction of scroll. Default: 'horizontal' */
  direction?: 'horizontal' | 'vertical';
  /** Minimum drag distance (px) before activating. Default: 5 */
  threshold?: number;
}

/**
 * Enables mouse-based drag-to-scroll on a scrollable container.
 * Touch devices use native scroll; this adds mouse (PC) support.
 */
export function useMouseDragScroll<T extends HTMLElement = HTMLDivElement>(
  options: UseMouseDragScrollOptions = {}
) {
  const { direction = 'horizontal', threshold = 5 } = options;
  const ref = useRef<T>(null);
  const state = useRef({
    isDown: false,
    isDragging: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const handleMouseDown = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    // Only on left mouse button
    if (e.button !== 0) return;
    state.current.isDown = true;
    state.current.isDragging = false;
    state.current.startX = e.pageX;
    state.current.startY = e.pageY;
    state.current.scrollLeft = el.scrollLeft;
    state.current.scrollTop = el.scrollTop;
    el.style.cursor = 'grab';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!state.current.isDown) return;
    const el = ref.current;
    if (!el) return;

    const dx = e.pageX - state.current.startX;
    const dy = e.pageY - state.current.startY;
    const dist = direction === 'horizontal' ? Math.abs(dx) : Math.abs(dy);

    if (!state.current.isDragging && dist > threshold) {
      state.current.isDragging = true;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    }

    if (state.current.isDragging) {
      e.preventDefault();
      if (direction === 'horizontal') {
        el.scrollLeft = state.current.scrollLeft - dx;
      } else {
        el.scrollTop = state.current.scrollTop - dy;
      }
    }
  }, [direction, threshold]);

  const handleMouseUp = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const wasDragging = state.current.isDragging;
    state.current.isDown = false;
    state.current.isDragging = false;
    el.style.cursor = '';
    el.style.userSelect = '';
    // Prevent click after drag
    if (wasDragging) {
      const blockClick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
      };
      el.addEventListener('click', blockClick, { capture: true, once: true });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (state.current.isDown) {
      handleMouseUp();
    }
  }, [handleMouseUp]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave]);

  return ref;
}
