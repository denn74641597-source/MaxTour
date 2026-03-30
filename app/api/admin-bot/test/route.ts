import { NextResponse } from 'next/server';

/**
 * GET /api/admin-bot/test — sends a test message to admin chat.
 * Use to verify bot token and chat ID are working.
 */
export async function GET() {
  const token = process.env.ADMIN_BOT_TOKEN || '8690380624:AAEWMibPtoXovf9W3avF-hPz9iM7PqU82Mc';
  const chatIds = [
    process.env.ADMIN_CHAT_ID || '496829881',
    process.env.ADMIN_CHAT_ID_2 || '7298088133',
  ].filter(Boolean);

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

  return NextResponse.json({ token_prefix: token.substring(0, 10) + '...', chatIds, results });
}
