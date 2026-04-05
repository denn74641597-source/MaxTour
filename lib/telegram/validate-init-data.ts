/**
 * Telegram Mini App initData server-tomondan tekshirish.
 * Telegram Bot token yordamida HMAC-SHA256 orqali hash ni tekshiradi.
 *
 * Telegram docs: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */

/**
 * Telegram initData stringini server tomondan tekshiradi.
 * @param initData — Telegram WebApp.initData qiymati (URL-encoded string)
 * @param botToken — ADMIN_BOT_TOKEN (yoki boshqa bot token)
 * @returns { valid: boolean, user?: object, authDate?: number }
 */
export async function validateInitData(
  initData: string,
  botToken?: string
): Promise<{
  valid: boolean;
  user?: { id: number; first_name: string; last_name?: string; username?: string };
  authDate?: number;
}> {
  const token = botToken || process.env.ADMIN_BOT_TOKEN;
  if (!token || !initData) {
    return { valid: false };
  }

  try {
    // initData ni parse qilish
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { valid: false };

    // hash ni olib tashlash va qolgan parametrlarni alifbo tartibida saralash
    params.delete('hash');
    const entries = Array.from(params.entries());
    entries.sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

    // HMAC-SHA256 hisoblash: secret_key = HMAC-SHA256("WebAppData", bot_token)
    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const secretHash = await crypto.subtle.sign(
      'HMAC',
      secretKey,
      encoder.encode(token)
    );

    // data_check_string ni secret_hash bilan imzolash
    const dataKey = await crypto.subtle.importKey(
      'raw',
      secretHash,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign(
      'HMAC',
      dataKey,
      encoder.encode(dataCheckString)
    );

    // Hex formatga o'tkazish va solishtirish
    const computedHash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (computedHash !== hash) {
      return { valid: false };
    }

    // auth_date ni tekshirish (24 soatdan eski bo'lmasligi kerak)
    const authDate = Number(params.get('auth_date'));
    if (authDate && Date.now() / 1000 - authDate > 86400) {
      return { valid: false };
    }

    // User ma'lumotini parse qilish
    const userStr = params.get('user');
    let user: { id: number; first_name: string; last_name?: string; username?: string } | undefined;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch {
        // user parse xatosi — lekin hash to'g'ri, davom etamiz
      }
    }

    return { valid: true, user, authDate };
  } catch {
    return { valid: false };
  }
}
