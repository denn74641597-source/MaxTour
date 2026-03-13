'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Language } from './config';
import { DEFAULT_LANGUAGE } from './config';
import type { Translations } from './types';
import { uz } from './uz';
import { ru } from './ru';

const translations: Record<Language, Translations> = { uz, ru };

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: translations[DEFAULT_LANGUAGE],
});

const STORAGE_KEY = 'maxtour-lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  // Load persisted language on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored && (stored === 'uz' || stored === 'ru')) {
        setLanguageState(stored);
      }
    } catch {
      // localStorage not available (SSR or restricted)
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: translations[language],
  }), [language, setLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

/** Get translations for server components (returns default language) */
export function getTranslations(lang?: Language): Translations {
  return translations[lang ?? DEFAULT_LANGUAGE];
}
