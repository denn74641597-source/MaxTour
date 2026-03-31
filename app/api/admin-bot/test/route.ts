import { NextResponse } from 'next/server';

/**
 * GET /api/admin-bot/test — sends a test message to admin chat.
 * Use to verify bot token and chat ID are working.
 */
export async function GET() {
  const token = process.env.ADMIN_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'ADMIN_BOT_TOKEN is not configured' }, { status: 500 });
  }
  const chatIds = [
    process.env.ADMIN_CHAT_ID,
    process.env.ADMIN_CHAT_ID_2,
  ].filter(Boolean) as string[];
  if (chatIds.length === 0) {
    return NextResponse.json({ error: 'ADMIN_CHAT_ID is not configured' }, { status: 500 });
  }

  const results = await Promise.all(
    chatIds.map(async (chatId) => {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ MaxTour Admin Bot ishlayapti!\n\nBu test xabar.',
          parse_mode: 'HTML',
        }),
      });
      return { chatId, data: await res.json() };
    })
  );

  return NextResponse.json({ ok: true, chatIds, results });
}
