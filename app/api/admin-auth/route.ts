import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, rateLimitHeaders } from '@/lib/rate-limit';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD environment variable is not set');
}

/**
 * Timing-safe parol solishtirish — timing attack dan himoya qilish uchun.
 * Har doim bir xil vaqtda ishlaydi (parolning uzunligi yoki to'g'ri/noto'g'ri ekanligi farq qilmaydi).
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Uzunliklari farqli bo'lsa ham, timing leak bo'lmasligi uchun solishtirish davom etadi
    const encoder = new TextEncoder();
    const bufA = encoder.encode(a);
    const bufB = encoder.encode(b.padEnd(a.length, '\0').slice(0, a.length));
    let mismatch = a.length !== b.length ? 1 : 0;
    for (let i = 0; i < bufA.length; i++) {
      mismatch |= bufA[i] ^ bufB[i];
    }
    return mismatch === 0;
  }
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let mismatch = 0;
  for (let i = 0; i < bufA.length; i++) {
    mismatch |= bufA[i] ^ bufB[i];
  }
  return mismatch === 0;
}

export async function POST(request: NextRequest) {
  // Brute-force himoyasi: bir IP dan 1 daqiqada 5 ta urinish
  const ip = getClientIP(request.headers);
  const { allowed, remaining, retryAfterMs } = checkRateLimit(
    `admin-auth:${ip}`,
    5,
    60_000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: 'Juda koʻp urinish. Biroz kutib turing.' },
      { status: 429, headers: rateLimitHeaders(remaining, retryAfterMs) }
    );
  }

  const { password } = await request.json();

  // Umumiy xato xabari — attackerga parolning to'g'ri/noto'g'ri ekanligi haqida kam ma'lumot berish
  if (!password || !ADMIN_PASSWORD || !safeCompare(password, ADMIN_PASSWORD)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_authenticated', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_authenticated');
  return response;
}
