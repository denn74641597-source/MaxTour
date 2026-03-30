/**
 * Telegram Admin Bot — sends notifications to admin with inline approve/reject buttons.
 * Callback queries are processed via /api/admin-bot/webhook route.
 */

function getBotToken() {
  return process.env.ADMIN_BOT_TOKEN || '8690380624:AAEWMibPtoXovf9W3avF-hPz9iM7PqU82Mc';
}

function getAdminChatIds(): string[] {
  const ids = [process.env.ADMIN_CHAT_ID || '496829881'];
  const id2 = process.env.ADMIN_CHAT_ID_2 || '7298088133';
  if (id2) ids.push(id2);
  return ids;
}

interface InlineButton {
  text: string;
  callback_data: string;
}

// ─── Error deduplication (in-memory, 1 hour TTL) ───
const sentErrors = new Map<string, number>();
const DEDUPE_TTL = 60 * 60 * 1000; // 1 hour

function makeErrorKey(source: string, message: string): string {
  return `${source}::${message.slice(0, 200)}`;
}

function isDuplicate(key: string): boolean {
  const lastSent = sentErrors.get(key);
  if (lastSent && Date.now() - lastSent < DEDUPE_TTL) return true;
  sentErrors.set(key, Date.now());
  // Cleanup old keys to avoid memory leak
  if (sentErrors.size > 500) {
    const now = Date.now();
    for (const [k, v] of sentErrors) {
      if (now - v > DEDUPE_TTL) sentErrors.delete(k);
    }
  }
  return false;
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

  const res = await fetch(`https://api.telegram.org/bot${getBotToken()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error('Telegram sendMessage error:', await res.text());
  }
}

async function sendToAdmins(text: string, buttons?: InlineButton[][]) {
  await Promise.all(getAdminChatIds().map(id => sendMessage(id, text, buttons)));
}

async function sendPhotoToAdmins(photoUrl: string, caption: string, buttons?: InlineButton[][]) {
  await Promise.all(getAdminChatIds().map(id => sendPhoto(id, photoUrl, caption, buttons)));
}

async function editMessageText(
  chatId: string,
  messageId: number,
  text: string
) {
  await fetch(`https://api.telegram.org/bot${getBotToken()}/editMessageText`, {
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

// Helper: meal type labels
const mealLabels: Record<string, string> = {
  none: 'Yo\'q',
  breakfast: 'Nonushta',
  half_board: 'Yarim pansion',
  full_board: 'To\'liq pansion',
  all_inclusive: 'Hammasi kiritilgan',
};

// Helper: transport type labels
const transportLabels: Record<string, string> = {
  flight: 'Samolyot ✈️',
  bus: 'Avtobus 🚌',
  train: 'Poezd 🚂',
  self: 'Mustaqil 🚗',
  mixed: 'Aralash 🔄',
};

async function sendPhoto(
  chatId: string,
  photoUrl: string,
  caption: string,
  buttons?: InlineButton[][]
) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: 'HTML',
  };

  if (buttons?.length) {
    body.reply_markup = { inline_keyboard: buttons };
  }

  const res = await fetch(`https://api.telegram.org/bot${getBotToken()}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error('Telegram sendPhoto error:', await res.text());
  }
}

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

  await sendToAdmins(text, buttons);
}

export async function notifyCoinRequest(
  requestId: string,
  agencyName: string,
  coins: number,
  priceUzs: number,
  phone?: string | null,
  telegram?: string | null
) {
  let text =
    `💰 <b>MaxCoin sotib olish so'rovi</b>\n\n` +
    `🏢 Agentlik: <b>${agencyName}</b>\n` +
    `🪙 Miqdor: ${coins} MC\n` +
    `💵 Narx: ${priceUzs.toLocaleString()} UZS\n`;

  if (phone) text += `📞 Telefon: ${phone}\n`;
  if (telegram) text += `✈️ Telegram: @${telegram.replace('@', '')}\n`;

  text += `🆔 So'rov: <code>${requestId}</code>`;

  const buttons = [
    [
      { text: '✅ Tasdiqlash', callback_data: `coin_approve:${requestId}` },
      { text: '❌ Rad etish', callback_data: `coin_reject:${requestId}` },
    ],
  ];

  await sendToAdmins(text, buttons);
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

  await sendToAdmins(text, buttons);
}

interface TourNotificationData {
  id: string;
  title: string;
  agencyName: string;
  country: string;
  city?: string | null;
  price: number;
  old_price?: number | null;
  currency: string;
  duration_days?: number | null;
  duration_nights?: number | null;
  departure_date?: string | null;
  departure_month?: string | null;
  return_date?: string | null;
  seats_total?: number | null;
  seats_left?: number | null;
  meal_type?: string | null;
  transport_type?: string | null;
  visa_required?: boolean;
  hotel_name?: string | null;
  hotel_stars?: number | null;
  hotels?: { name: string; stars: number | null; price: number }[];
  included_services?: string[];
  extra_charges?: { name: string; amount: number }[];
  variable_charges?: { name: string; min_amount: number; max_amount: number }[];
  operator_telegram_username?: string | null;
  operator_phone?: string | null;
  cover_image_url?: string | null;
  destinations?: string[];
  tour_type?: string | null;
  category?: string | null;
  additional_info?: string | null;
  what_to_bring?: string[];
  guide_name?: string | null;
  guide_phone?: string | null;
  meeting_point?: string | null;
  short_description?: string | null;
}

export async function notifyTourPending(tour: TourNotificationData) {
  // Build detailed message
  let text = `📝 <b>Tur nashr uchun yuborildi</b>\n\n`;
  text += `🗺 <b>${tour.title}</b>\n`;
  text += `🏢 Agentlik: ${tour.agencyName}\n`;
  text += `📍 ${tour.country}${tour.city ? ` / ${tour.city}` : ''}\n`;

  if (tour.destinations?.length) {
    text += `🌍 Yo'nalishlar: ${tour.destinations.join(', ')}\n`;
  }

  text += `\n💵 <b>Narx: ${tour.price.toLocaleString()} ${tour.currency}</b>`;
  if (tour.old_price) text += ` <s>${tour.old_price.toLocaleString()}</s>`;
  text += `\n`;

  if (tour.duration_days || tour.duration_nights) {
    text += `⏱ Davomiylik: `;
    if (tour.duration_days) text += `${tour.duration_days} kun`;
    if (tour.duration_nights) text += ` / ${tour.duration_nights} kecha`;
    text += `\n`;
  }

  if (tour.departure_date) text += `📅 Jo'nash: ${tour.departure_date}\n`;
  if (tour.departure_month && !tour.departure_date) text += `📅 Oy: ${tour.departure_month}\n`;
  if (tour.return_date) text += `📅 Qaytish: ${tour.return_date}\n`;

  if (tour.seats_total || tour.seats_left) {
    text += `💺 O'rinlar: ${tour.seats_left ?? '—'} / ${tour.seats_total ?? '—'}\n`;
  }

  if (tour.transport_type) {
    text += `🚀 Transport: ${transportLabels[tour.transport_type] || tour.transport_type}\n`;
  }
  if (tour.meal_type && tour.meal_type !== 'none') {
    text += `🍽 Ovqat: ${mealLabels[tour.meal_type] || tour.meal_type}\n`;
  }
  text += `🛂 Viza: ${tour.visa_required ? 'Talab qilinadi' : 'Talab qilinmaydi'}\n`;

  // Hotels
  if (tour.hotel_name) {
    text += `\n🏨 Mehmonxona: ${tour.hotel_name}`;
    if (tour.hotel_stars) text += ` ${'⭐'.repeat(tour.hotel_stars)}`;
    text += `\n`;
  }
  if (tour.hotels?.length) {
    text += `\n🏨 <b>Mehmonxonalar:</b>\n`;
    for (const h of tour.hotels) {
      text += `  • ${h.name}`;
      if (h.stars) text += ` ${'⭐'.repeat(h.stars)}`;
      text += ` — ${h.price.toLocaleString()} ${tour.currency}\n`;
    }
  }

  // Services
  if (tour.included_services?.length) {
    text += `\n✅ <b>Xizmatlar:</b>\n`;
    for (const s of tour.included_services) {
      text += `  • ${s}\n`;
    }
  }

  // Extra charges
  if (tour.extra_charges?.length) {
    text += `\n💳 <b>Qo'shimcha to'lovlar:</b>\n`;
    for (const c of tour.extra_charges) {
      text += `  • ${c.name}: ${c.amount.toLocaleString()} ${tour.currency}\n`;
    }
  }

  // Variable charges
  if (tour.variable_charges?.length) {
    text += `\n📊 <b>O'zgaruvchan to'lovlar:</b>\n`;
    for (const c of tour.variable_charges) {
      text += `  • ${c.name}: ${c.min_amount.toLocaleString()}–${c.max_amount.toLocaleString()} ${tour.currency}\n`;
    }
  }

  // Domestic tour specific
  if (tour.meeting_point) text += `\n📌 Uchrashuv joyi: ${tour.meeting_point}\n`;
  if (tour.guide_name) {
    text += `👤 Gid: ${tour.guide_name}`;
    if (tour.guide_phone) text += ` (${tour.guide_phone})`;
    text += `\n`;
  }
  if (tour.what_to_bring?.length) {
    text += `🎒 Olib kelish: ${tour.what_to_bring.join(', ')}\n`;
  }

  // Operator contact
  if (tour.operator_phone || tour.operator_telegram_username) {
    text += `\n📞 <b>Operator:</b>\n`;
    if (tour.operator_phone) text += `  Tel: ${tour.operator_phone}\n`;
    if (tour.operator_telegram_username) text += `  TG: @${tour.operator_telegram_username.replace('@', '')}\n`;
  }

  if (tour.short_description) {
    text += `\n📋 ${tour.short_description}\n`;
  }
  if (tour.additional_info) {
    text += `\nℹ️ ${tour.additional_info}\n`;
  }

  text += `\n🆔 ID: <code>${tour.id}</code>`;

  const buttons = [
    [
      { text: '✅ Nashr qilish', callback_data: `tour_publish:${tour.id}` },
      { text: '❌ Rad etish', callback_data: `tour_reject:${tour.id}` },
    ],
  ];

  // Send cover image if available, otherwise plain text
  if (tour.cover_image_url) {
    // Photo caption max 1024 chars — if text is too long, send photo + separate message
    if (text.length <= 1024) {
      await sendPhotoToAdmins(tour.cover_image_url, text, buttons);
    } else {
      await sendPhotoToAdmins(tour.cover_image_url, `🗺 <b>${tour.title}</b>\n🏢 ${tour.agencyName}`);
      await sendToAdmins(text, buttons);
    }
  } else {
    await sendToAdmins(text, buttons);
  }
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

// ─── System error notification (with deduplication) ───

function sanitize(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Send a system error notification to admin via Telegram.
 * Same error (by source + message) is sent only once per hour.
 * Never throws — safe to call anywhere.
 */
export async function notifySystemError(opts: {
  source: string;       // e.g. "API /api/leads", "Action submitLead", "Client /tours"
  message: string;      // error message
  stack?: string;       // optional stack trace (truncated)
  userId?: string;      // optional user ID
  extra?: string;       // optional additional context
}) {
  try {
    const key = makeErrorKey(opts.source, opts.message);
    if (isDuplicate(key)) return;

    let text = `🚨 <b>Xatolik!</b>\n\n`;
    text += `📍 <b>${sanitize(opts.source)}</b>\n`;
    text += `❌ ${sanitize(opts.message)}\n`;
    if (opts.userId) text += `👤 User: <code>${sanitize(opts.userId)}</code>\n`;
    if (opts.extra) text += `📋 ${sanitize(opts.extra)}\n`;
    if (opts.stack) {
      const shortStack = opts.stack.split('\n').slice(0, 4).join('\n');
      text += `\n<pre>${sanitize(shortStack)}</pre>`;
    }

    // Trim to Telegram max (4096 chars)
    if (text.length > 4000) text = text.slice(0, 4000) + '\n...';

    await sendToAdmins(text);
  } catch {
    // Never crash the app because of error reporting
  }
}
