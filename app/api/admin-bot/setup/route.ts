import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin-bot/setup — sets/shows Telegram webhook URL.
 * Call once after deploy: https://your-domain.com/api/admin-bot/setup
 */
export async function GET(request: NextRequest) {
  const token = process.env.ADMIN_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'ADMIN_BOT_TOKEN is not configured' }, { status: 500 });
  }

  const host = request.headers.get('host') || 'localhost:3000';
  const proto = host.includes('localhost') ? 'http' : 'https';
  const webhookUrl = `${proto}://${host}/api/admin-bot/webhook`;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  });

  const data = await res.json();
  return NextResponse.json({ webhookUrl, telegram: data });
}
