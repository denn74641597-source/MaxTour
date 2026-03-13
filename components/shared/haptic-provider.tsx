'use client';

import { useEffect } from 'react';
import { hapticFeedback } from '@/lib/telegram';

/**
 * Global haptic feedback provider.
 * Listens for clicks on ALL interactive elements (buttons, links, tabs, etc.)
 * and triggers vibration automatically — no need to add haptic to each element.
 */
export function HapticProvider() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Walk up the DOM to find the nearest interactive element
      const interactive = target.closest<HTMLElement>(
        'a, button, [role="button"], [role="tab"], [role="menuitem"], [role="link"], input[type="submit"], input[type="button"], [data-haptic]'
      );

      if (interactive) {
        // Skip disabled elements
        if (
          interactive.hasAttribute('disabled') ||
          interactive.getAttribute('aria-disabled') === 'true'
        ) {
          return;
        }

        hapticFeedback('light');
      }
    }

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, []);

  return null;
}
