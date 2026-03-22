'use client';

import { useTranslation } from '@/lib/i18n';
import { LANGUAGES, LANGUAGE_LABELS, LANGUAGE_FLAGS } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Language } from '@/lib/i18n';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'toggle' | 'dropdown';
}

export function LanguageSwitcher({ className, variant = 'toggle' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useTranslation();

  if (variant === 'toggle') {
    return (
      <div className={cn('flex items-center bg-surface-container-low rounded-full p-0.5', className)}>
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang as Language)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
              language === lang
                ? 'bg-surface text-foreground shadow-ambient'
                : 'text-muted-foreground hover:text-foreground'
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
      onClick={() => setLanguage(nextLang)}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-container-low hover:bg-surface-container-high transition-colors',
        className
      )}
    >
      <span className="text-sm">{LANGUAGE_FLAGS[nextLang]}</span>
      <span className="text-muted-foreground">{LANGUAGE_LABELS[nextLang]}</span>
    </button>
  );
}
