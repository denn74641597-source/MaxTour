import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format price with currency */
export function formatPrice(price: number, currency: string = 'USD'): string {
  if (currency === 'UZS') {
    return `${price.toLocaleString()} UZS`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price);
}

/** Format date for display */
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

/** Generate a URL-friendly slug from text */
export function slugify(text: string): string {
  return text
    .toLowerCase()
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

/** Placeholder image URL */
export function placeholderImage(width = 400, height = 300, text = 'MaxTour'): string {
  return `https://placehold.co/${width}x${height}/0ea5e9/white?text=${encodeURIComponent(text)}`;
}
