import { NextRequest, NextResponse } from 'next/server';
import { notifySystemError } from '@/lib/telegram/admin-bot';

export async function POST(request: NextRequest) {
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
