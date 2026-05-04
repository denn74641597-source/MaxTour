'use client';

import { useCallback, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n/config';
import { ADMIN_COMMON, type AdminCommonKey } from './common';
import { ADMIN_PAGES, type AdminPageKey } from './pages';
import { ADMIN_INLINE_EXACT, ADMIN_INLINE_WORDS } from './phrases';

function normalizePhrase(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const STATUS_KEY_MAP: Record<string, AdminCommonKey> = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  active: 'active',
  inactive: 'inactive',
  scheduled: 'scheduled',
  expired: 'expired',
  draft: 'draft',
  published: 'published',
  archived: 'archived',
  new: 'newStatus',
  contacted: 'contacted',
  closed: 'closed',
  won: 'won',
  lost: 'lost',
};

export function toAdminLanguage(language: Language): Language {
  return language === 'ru' ? 'ru' : 'uz';
}

export function translateAdminInlineText(value: string, language: Language): string {
  if (!value) return value;

  const adminLanguage = toAdminLanguage(language);
  const normalized = normalizePhrase(value);
  const exact = ADMIN_INLINE_EXACT[adminLanguage][normalized];
  if (exact) return exact;

  let output = value;

  const exactEntries = Object.entries(ADMIN_INLINE_EXACT[adminLanguage])
    .sort((a, b) => b[0].length - a[0].length);

  for (const [source, replacement] of exactEntries) {
    const pattern = new RegExp(escapeRegExp(source), 'gi');
    output = output.replace(pattern, replacement);
  }

  const wordEntries = Object.entries(ADMIN_INLINE_WORDS[adminLanguage])
    .sort((a, b) => b[0].length - a[0].length);

  for (const [source, replacement] of wordEntries) {
    const pattern = new RegExp(`\\b${escapeRegExp(source)}\\b`, 'gi');
    output = output.replace(pattern, replacement);
  }

  return output;
}

export function localizeAdminStatus(value: string | null | undefined, language: Language): string {
  if (!value) return '';
  const adminLanguage = toAdminLanguage(language);
  const normalized = value.trim().toLowerCase();
  const mappedKey = STATUS_KEY_MAP[normalized];
  if (mappedKey) {
    return ADMIN_COMMON[adminLanguage][mappedKey];
  }
  return translateAdminInlineText(value, adminLanguage);
}

export function useAdminI18n() {
  const { language, setLanguage } = useTranslation();
  const adminLanguage = toAdminLanguage(language);

  const tc = useCallback(
    (key: AdminCommonKey) => ADMIN_COMMON[adminLanguage][key],
    [adminLanguage]
  );

  const tp = useCallback(
    (key: AdminPageKey) => ADMIN_PAGES[adminLanguage][key],
    [adminLanguage]
  );

  const tInline = useCallback(
    (value: string) => translateAdminInlineText(value, adminLanguage),
    [adminLanguage]
  );

  const formatDateTime = useCallback(
    (value: string | null | undefined) => {
      if (!value) return tc('notAvailable');
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return tc('notAvailable');
      return date.toLocaleString(adminLanguage === 'ru' ? 'ru-RU' : 'uz-UZ', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    },
    [adminLanguage, tc]
  );

  const formatDate = useCallback(
    (value: string | null | undefined) => {
      if (!value) return tc('notAvailable');
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return tc('notAvailable');
      return date.toLocaleDateString(adminLanguage === 'ru' ? 'ru-RU' : 'uz-UZ', {
        dateStyle: 'medium',
      });
    },
    [adminLanguage, tc]
  );

  const formatNumberLocalized = useCallback(
    (value: number | null | undefined) => {
      if (value == null || !Number.isFinite(value)) return '0';
      return value.toLocaleString(adminLanguage === 'ru' ? 'ru-RU' : 'uz-UZ');
    },
    [adminLanguage]
  );

  return useMemo(
    () => ({
      language: adminLanguage,
      setLanguage,
      tc,
      tp,
      tInline,
      localizeStatus: (value: string | null | undefined) =>
        localizeAdminStatus(value, adminLanguage),
      formatDateTime,
      formatDate,
      formatNumberLocalized,
    }),
    [adminLanguage, formatDate, formatDateTime, formatNumberLocalized, setLanguage, tc, tp, tInline]
  );
}
