import { NextResponse } from 'next/server';

/**
 * API javoblarini standartlashtirilgan formatda qaytarish.
 * Barcha API route larda izchil format ta'minlanadi.
 */

/** Muvaffaqiyatli javob */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** Xato javob */
export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/** Validatsiya xatosi javob — Zod xatolarini o'z ichiga oladi */
export function apiValidationError(details: unknown) {
  return NextResponse.json(
    { success: false, error: 'Validation failed', details },
    { status: 400 }
  );
}

/** Rate limit javob */
export function apiRateLimited(retryAfterMs: number) {
  return NextResponse.json(
    { success: false, error: 'Too many requests' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
      },
    }
  );
}

/** Server xatosi — foydalanuvchiga ichki tafsilotlar ko'rsatilmaydi */
export function apiServerError(message = 'Internal server error') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 500 }
  );
}
