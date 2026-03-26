/**
 * Telegram Mini App integration utilities.
 *
 * The Telegram WebApp SDK is loaded via <script> in the layout.
 * These helpers provide typed access to the Telegram WebApp object.
 *
 * Full integration will be implemented when connecting to a real Telegram Bot.
 * For now, this provides a typed wrapper and fallback behavior for development.
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    auth_date: number;
    hash: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    setText: (text: string) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  };
  safeAreaInset?: { top: number; bottom: number; left: number; right: number };
  contentSafeAreaInset?: { top: number; bottom: number; left: number; right: number };
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  disableVerticalSwipes: () => void;
  enableVerticalSwipes: () => void;
  requestFullscreen?: () => void;
  isFullscreen?: boolean;
  showPopup: (params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text?: string;
    }>;
  }, callback?: (buttonId: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
}

/** Get the Telegram WebApp object, or null if not running inside Telegram */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

/** Check if the app is running inside a Telegram Mini App context */
export function isTelegramMiniApp(): boolean {
  return getTelegramWebApp() !== null;
}

/** Get the current Telegram user, or null */
export function getTelegramUser() {
  return getTelegramWebApp()?.initDataUnsafe?.user ?? null;
}

/** Initialize the Telegram Mini App (call on mount) */
export function initTelegramApp() {
  function applySafeArea(webapp: TelegramWebApp) {
    const sa = webapp.safeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 };
    const csa = webapp.contentSafeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 };
    const topInset = sa.top + csa.top;
    document.documentElement.style.setProperty('--tg-safe-top', `${topInset}px`);
    document.documentElement.style.setProperty('--tg-safe-bottom', `${sa.bottom}px`);
  }

  function applyTheme(webapp: TelegramWebApp) {
    const isDark = webapp.colorScheme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }

  function forceFullscreen(webapp: TelegramWebApp) {
    // Try the newer requestFullscreen API first, then fall back to expand
    try {
      if (typeof webapp.requestFullscreen === 'function' && !webapp.isFullscreen) {
        webapp.requestFullscreen();
      }
    } catch { /* some clients don't support it yet */ }
    if (!webapp.isExpanded) {
      webapp.expand();
    }
  }

  function init() {
    const webapp = getTelegramWebApp();
    if (webapp) {
      webapp.ready();
      forceFullscreen(webapp);
      if (typeof webapp.disableVerticalSwipes === 'function') {
        webapp.disableVerticalSwipes();
      }
      applySafeArea(webapp);
      applyTheme(webapp);

      // Re-expand whenever viewport changes (covers chat-open scenario)
      if (typeof webapp.onEvent === 'function') {
        webapp.onEvent('viewportChanged', () => {
          forceFullscreen(webapp);
          applySafeArea(webapp);
        });
        webapp.onEvent('safeAreaChanged', () => applySafeArea(webapp));
        webapp.onEvent('contentSafeAreaChanged', () => applySafeArea(webapp));
        webapp.onEvent('themeChanged', () => applyTheme(webapp));
      }

      // Delayed retry — some clients need a tick before fullscreen works
      setTimeout(() => forceFullscreen(webapp), 300);
      setTimeout(() => forceFullscreen(webapp), 1000);

      return true;
    }
    return false;
  }

  // Try immediately
  if (init()) return;

  // If not inside Telegram, follow system preference
  if (typeof window !== 'undefined' && !window.Telegram?.WebApp?.initData) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    document.documentElement.classList.toggle('dark', mq.matches);
    mq.addEventListener('change', (e) => {
      document.documentElement.classList.toggle('dark', e.matches);
    });
  }

  // SDK may not be loaded yet — poll until available (up to ~15s)
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (init() || attempts > 150) {
      clearInterval(interval);
    }
  }, 100);
}

/** Trigger haptic impact feedback (vibration) */
export function hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'light') {
  const webapp = getTelegramWebApp();
  if (webapp?.HapticFeedback) {
    webapp.HapticFeedback.impactOccurred(style);
    return;
  }
  // Fallback: Web Vibration API (Android browsers, etc.)
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const duration = style === 'light' ? 10 : style === 'medium' ? 25 : 50;
    navigator.vibrate(duration);
  }
}

/** Trigger haptic notification feedback */
export function hapticNotification(type: 'error' | 'success' | 'warning') {
  const webapp = getTelegramWebApp();
  if (webapp?.HapticFeedback) {
    webapp.HapticFeedback.notificationOccurred(type);
    return;
  }
  // Fallback: Web Vibration API
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const pattern = type === 'success' ? [10, 30, 10] : type === 'warning' ? [20, 20, 20] : [50, 30, 50];
    navigator.vibrate(pattern);
  }
}
