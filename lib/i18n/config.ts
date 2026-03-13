export const LANGUAGES = ['uz', 'ru'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'uz';

export const LANGUAGE_LABELS: Record<Language, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
};

export const LANGUAGE_FLAGS: Record<Language, string> = {
  uz: '🇺🇿',
  ru: '🇷🇺',
};
