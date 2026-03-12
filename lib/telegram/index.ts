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
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
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
  const webapp = getTelegramWebApp();
  if (webapp) {
    webapp.ready();
    webapp.expand();
  }
}
