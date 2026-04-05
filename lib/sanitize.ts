/**
 * Input sanitizatsiya — XSS hujumlaridan himoya.
 * HTML teglarini va xavfli belgilarni olib tashlaydi/escape qiladi.
 */

/**
 * HTML teglarini olib tashlash — oddiy matn maydonlari uchun.
 * Faqat ko'rinadigan matnni saqlaydi.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * XSS uchun xavfli belgilarni HTML entity ga aylantirish.
 * Ma'lumot HTML kontekstida ko'rsatiladigan joylarda ishlatiladi.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Foydalanuvchi kiritgan umumiy matnni tozalash.
 * HTML teglarini olib tashlaydi va boshlanish/tugash bo'shliqlarini tozalaydi.
 */
export function sanitizeText(input: string, maxLength = 1000): string {
  return stripHtml(input).slice(0, maxLength).trim();
}

/**
 * Telefon raqamini tozalash — faqat raqamlar va + belgisi.
 */
export function sanitizePhone(input: string): string {
  return input.replace(/[^\d+\-\s()]/g, '').trim();
}

/**
 * URL ni tekshirish — faqat http/https protokolini ruxsat berish.
 * javascript:, data:, vbscript: va boshqa xavfli sxemalar bloklanadi.
 */
export function sanitizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}
