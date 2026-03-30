/**
 * Telegram Admin Bot — sends notifications to admin with inline approve/reject buttons.
 * Callback queries are processed via /api/admin-bot/webhook route.
 */

const BOT_TOKEN = process.env.ADMIN_BOT_TOKEN || '8690380624:AAEWMibPtoXovf9W3avF-hPz9iM7PqU82Mc';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '496829881';

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface InlineButton {
  text: string;
  callback_data: string;
}

async function sendMessage(
  chatId: string,
  text: string,
  buttons?: InlineButton[][]
) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };

  if (buttons?.length) {
    body.reply_markup = { inline_keyboard: buttons };
  }

  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error('Telegram sendMessage error:', await res.text());
  }
}

async function editMessageText(
  chatId: string,
  messageId: number,
  text: string
) {
  await fetch(`${API_BASE}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
    }),
  });
}

// ─── Notification senders ───

export async function notifyVerificationRequest(
  requestId: string,
  agencyId: string,
  agencyName: string,
  companyName: string
) {
  const text =
    `🔔 <b>Yangi verifikatsiya so'rovi</b>\n\n` +
    `🏢 Agentlik: <b>${agencyName}</b>\n` +
    `📋 Kompaniya: ${companyName}\n` +
    `🆔 So'rov: <code>${requestId}</code>`;

  const buttons = [
    [
      { text: '✅ Tasdiqlash', callback_data: `verify_approve:${requestId}:${agencyId}` },
      { text: '❌ Rad etish', callback_data: `verify_reject:${requestId}:${agencyId}` },
    ],
  ];

  await sendMessage(ADMIN_CHAT_ID, text, buttons);
}

export async function notifyCoinRequest(
  requestId: string,
  agencyName: string,
  coins: number,
  priceUzs: number
) {
  const text =
    `💰 <b>MaxCoin sotib olish so'rovi</b>\n\n` +
    `🏢 Agentlik: <b>${agencyName}</b>\n` +
    `🪙 Miqdor: ${coins} MC\n` +
    `💵 Narx: ${priceUzs.toLocaleString()} UZS\n` +
    `🆔 So'rov: <code>${requestId}</code>`;

  const buttons = [
    [
      { text: '✅ Tasdiqlash', callback_data: `coin_approve:${requestId}` },
      { text: '❌ Rad etish', callback_data: `coin_reject:${requestId}` },
    ],
  ];

  await sendMessage(ADMIN_CHAT_ID, text, buttons);
}

export async function notifyAgencyRegistration(
  agencyId: string,
  agencyName: string,
  ownerName: string
) {
  const text =
    `🆕 <b>Yangi agentlik ro'yxatdan o'tdi</b>\n\n` +
    `🏢 Nomi: <b>${agencyName}</b>\n` +
    `👤 Egasi: ${ownerName}\n` +
    `🆔 ID: <code>${agencyId}</code>`;

  const buttons = [
    [
      { text: '✅ Tasdiqlash', callback_data: `agency_approve:${agencyId}` },
      { text: '❌ Rad etish', callback_data: `agency_reject:${agencyId}` },
    ],
  ];

  await sendMessage(ADMIN_CHAT_ID, text, buttons);
}

export async function notifyTourPending(
  tourId: string,
  tourTitle: string,
  agencyName: string
) {
  const text =
    `📝 <b>Tur nashr uchun yuborildi</b>\n\n` +
    `🗺 Tur: <b>${tourTitle}</b>\n` +
    `🏢 Agentlik: ${agencyName}\n` +
    `🆔 ID: <code>${tourId}</code>`;

  const buttons = [
    [
      { text: '✅ Nashr qilish', callback_data: `tour_publish:${tourId}` },
      { text: '❌ Rad etish', callback_data: `tour_reject:${tourId}` },
    ],
  ];

  await sendMessage(ADMIN_CHAT_ID, text, buttons);
}

// ─── Callback result editor ───

export async function editCallbackMessage(
  chatId: string,
  messageId: number,
  originalText: string,
  decision: string
) {
  const statusLine = decision === 'approved'
    ? '\n\n✅ <b>TASDIQLANDI</b>'
    : '\n\n❌ <b>RAD ETILDI</b>';

  await editMessageText(chatId, messageId, originalText + statusLine);
}
