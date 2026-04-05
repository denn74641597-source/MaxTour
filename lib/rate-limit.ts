/**
 * In-memory rate limiter — Cloudflare Workers/Edge uchun oddiy sliding-window hisobchi.
 * Har bir isolate (worker instance) o'z xotirasida ishlaydi.
 * Token-bucket algoritmidan foydalanadi: har bir IP uchun belgilangan vaqt
 * oynasida ruxsat etilgan so'rovlar soni cheklanadi.
 */

interface RateLimitEntry {
  /** So'rovlar vaqtlari (timestamp) */
  timestamps: number[];
}

// IP → urinishlar xaritasi
const store = new Map<string, RateLimitEntry>();

// Xotirani tozalash uchun ohirgi vaqt
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000; // Har 60 soniyada eski yozuvlarni tozalash

/**
 * IP manzilni aniqlash — Cloudflare headerlari + standart fallbacklar
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

/**
 * Rate limit tekshiruvi
 * @param key — unikal kalit (masalan: `admin-auth:${ip}`)
 * @param maxRequests — ruxsat etilgan maksimal so'rovlar soni
 * @param windowMs — vaqt oynasi (ms)
 * @returns { allowed: boolean, remaining: number, retryAfterMs: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();

  // Vaqti-vaqti bilan eski yozuvlarni tozalash (xotira oqishining oldini olish)
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    lastCleanup = now;
    for (const [k, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
      if (entry.timestamps.length === 0) store.delete(k);
    }
  }

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Faqat joriy oyna ichidagi so'rovlarni saqlash
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    // Limit oshirildi — eng eski so'rov + oyna tugashini hisoblash
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(retryAfterMs, 1000),
    };
  }

  // Ruxsat berildi
  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    retryAfterMs: 0,
  };
}

/**
 * Rate limit javob headerlarini yaratish
 */
export function rateLimitHeaders(
  remaining: number,
  retryAfterMs: number
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': String(remaining),
  };
  if (retryAfterMs > 0) {
    headers['Retry-After'] = String(Math.ceil(retryAfterMs / 1000));
  }
  return headers;
}
