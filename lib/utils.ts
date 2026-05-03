import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format price with currency (uses space as thousand separator) */
export function formatPrice(price: number, currency?: string | null): string {
  const normalizedCurrency = typeof currency === 'string' && currency.trim().length > 0
    ? currency.trim().toUpperCase()
    : 'USD';

  if (normalizedCurrency === 'UZS') {
    return `${price.toLocaleString('en-US').replace(/,/g, ' ')} UZS`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 0,
    }).format(price).replace(/,/g, ' ');
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price).replace(/,/g, ' ');
  }
}

/** Format a number with space as thousand separator (no currency symbol) */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US').replace(/,/g, ' ');
}

/** Format date for display */
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

/** Generate a URL-friendly slug from text */
const CYRILLIC_MAP: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i',
  'й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t',
  'у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y',
  'ь':'','э':'e','ю':'yu','я':'ya',
  'ў':'o','қ':'q','ғ':'g','ҳ':'h',
};

export function slugify(text: string): string {
  const transliterated = text
    .toLowerCase()
    .split('')
    .map(ch => CYRILLIC_MAP[ch] ?? ch)
    .join('');

  return transliterated
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

/** Truncate text to a maximum length */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trimEnd() + '…';
}

/**
 * Format combo tour destinations.
 * Input: ["Indonesia - Bali", "Indonesia - Jakarta"] or ["Indonesia - Bali", "Malaysia - Kuala Lumpur"]
 * Output:
 *   Same country:   "Bali - Jakarta, Indonesia"
 *   Diff countries:  "Bali, Indonesia - Kuala Lumpur, Malaysia"
 */
export function formatComboDestinations(destinations: string[]): string {
  const parsed = destinations.map(d => {
    const parts = d.split(' - ');
    return { country: parts[0] || '', city: parts[1] || '' };
  });
  const countries = [...new Set(parsed.map(p => p.country).filter(Boolean))];
  const cities = parsed.map(p => p.city).filter(Boolean);

  if (countries.length === 1 && cities.length > 0) {
    return `${cities.join(' - ')}, ${countries[0]}`;
  }
  return parsed
    .map(p => (p.city ? `${p.city}, ${p.country}` : p.country))
    .join(' - ');
}

/** Format combo destinations showing only city names, comma-separated.
 * Supports both legacy "Country - City" format and new plain city name format. */
export function formatComboCities(destinations: string[]): string {
  const cities = destinations
    .map(d => {
      if (d.includes(' - ')) {
        const parts = d.split(' - ');
        return parts[1] || parts[0] || '';
      }
      return d;
    })
    .filter(Boolean);
  return cities.join(', ');
}

/** Placeholder image URL */

export function placeholderImage(width = 400, height = 300, text = 'MaxTour'): string {
  return `https://placehold.co/${width}x${height}/0ea5e9/white?text=${encodeURIComponent(text)}`;
}
