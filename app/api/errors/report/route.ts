import { NextRequest, NextResponse } from 'next/server';
import { notifySystemError } from '@/lib/telegram/admin-bot';
import { checkRateLimit, getClientIP, rateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Spam himoyasi: bir IP dan 1 daqiqada 20 ta xato hisobot
  const ip = getClientIP(request.headers);
  const { allowed, remaining, retryAfterMs } = checkRateLimit(`errors:${ip}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json({ ok: true }, { status: 429, headers: rateLimitHeaders(remaining, retryAfterMs) });
  }

  try {
    const body = await request.json();
    const { source, message, stack, userId } = body;

    if (!source || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await notifySystemError({
      source: `Client: ${String(source).slice(0, 200)}`,
      message: String(message).slice(0, 500),
      stack: stack ? String(stack).slice(0, 1000) : undefined,
      userId: userId ? String(userId) : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
