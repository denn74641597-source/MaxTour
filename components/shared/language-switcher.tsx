'use client';

import { useTranslation } from '@/lib/i18n';
import { LANGUAGES, LANGUAGE_LABELS, LANGUAGE_FLAGS } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/telegram';
import type { Language } from '@/lib/i18n';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'toggle' | 'dropdown';
}

export function LanguageSwitcher({ className, variant = 'toggle' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useTranslation();

  if (variant === 'toggle') {
    return (
      <div className={cn('flex items-center bg-slate-100 rounded-full p-0.5', className)}>
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => { hapticFeedback('light'); setLanguage(lang as Language); }}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
              language === lang
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <span className="text-sm">{LANGUAGE_FLAGS[lang as Language]}</span>
            <span>{LANGUAGE_LABELS[lang as Language]}</span>
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant - simple toggle
  const nextLang = language === 'uz' ? 'ru' : 'uz';
  return (
    <button
      onClick={() => { hapticFeedback('light'); setLanguage(nextLang); }}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 transition-colors',
        className
      )}
    >
      <span className="text-sm">{LANGUAGE_FLAGS[nextLang]}</span>
      <span>{LANGUAGE_LABELS[nextLang]}</span>
    </button>
  );
}
