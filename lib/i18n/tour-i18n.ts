import type { Language } from './config';
import type { Tour } from '@/types';

/**
 * Pick a translated tour field for the current UI language, falling back to the
 * source value when the translated copy is missing or empty.
 */
export function pickTourTitle(tour: Pick<Tour, 'title' | 'title_uz' | 'title_ru'>, lang: Language): string {
  if (lang === 'uz') return (tour.title_uz?.trim() || tour.title || '').trim();
  if (lang === 'ru') return (tour.title_ru?.trim() || tour.title || '').trim();
  return tour.title || '';
}

export function pickTourDescription(
  tour: Pick<Tour, 'full_description' | 'description_uz' | 'description_ru'>,
  lang: Language,
): string {
  if (lang === 'uz') return (tour.description_uz?.trim() || tour.full_description || '').trim();
  if (lang === 'ru') return (tour.description_ru?.trim() || tour.full_description || '').trim();
  return tour.full_description || '';
}

export function pickIncludedServices(
  tour: Pick<Tour, 'included_services' | 'included_services_uz' | 'included_services_ru'>,
  lang: Language,
): string[] {
  const fallback = tour.included_services ?? [];
  if (lang === 'uz') return tour.included_services_uz?.length ? tour.included_services_uz : fallback;
  if (lang === 'ru') return tour.included_services_ru?.length ? tour.included_services_ru : fallback;
  return fallback;
}

export function pickExtraCharges(
  tour: Pick<Tour, 'extra_charges' | 'extra_charges_uz' | 'extra_charges_ru'>,
  lang: Language,
): { name: string; amount: number; required?: boolean }[] {
  const fallback = tour.extra_charges ?? [];
  if (lang === 'uz') return tour.extra_charges_uz?.length ? tour.extra_charges_uz : fallback;
  if (lang === 'ru') return tour.extra_charges_ru?.length ? tour.extra_charges_ru : fallback;
  return fallback;
}

export function pickVariableCharges(
  tour: Pick<Tour, 'variable_charges' | 'variable_charges_uz' | 'variable_charges_ru'>,
  lang: Language,
): { name: string; min_amount: number; max_amount: number; required?: boolean }[] {
  const fallback = tour.variable_charges ?? [];
  if (lang === 'uz') return tour.variable_charges_uz?.length ? tour.variable_charges_uz : fallback;
  if (lang === 'ru') return tour.variable_charges_ru?.length ? tour.variable_charges_ru : fallback;
  return fallback;
}
