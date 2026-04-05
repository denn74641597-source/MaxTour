/**
 * Markazlashgan logger — tuzilgan (structured) log yozish uchun.
 * Cloudflare Workers muhitida console.log/error ishlaydi,
 * lekin tizimli format bilan loglash kuzatishni osonlashtiradi.
 *
 * Loglar JSON formatda chiqariladi — Cloudflare Dashboard va
 * boshqa monitoring vositalarida qidirish va filtrlash oson bo'ladi.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  source: string;
  message: string;
  extra?: Record<string, unknown>;
  timestamp: string;
}

function formatEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Info darajadagi log — oddiy operatsiyalar uchun
 */
export function logInfo(source: string, message: string, extra?: Record<string, unknown>) {
  const entry: LogEntry = {
    level: 'info',
    source,
    message,
    extra,
    timestamp: new Date().toISOString(),
  };
  console.log(formatEntry(entry));
}

/**
 * Warning darajadagi log — kutilmagan, lekin jiddiy bo'lmagan holatlar
 */
export function logWarn(source: string, message: string, extra?: Record<string, unknown>) {
  const entry: LogEntry = {
    level: 'warn',
    source,
    message,
    extra,
    timestamp: new Date().toISOString(),
  };
  console.warn(formatEntry(entry));
}

/**
 * Error darajadagi log — xatolar va muammolar
 */
export function logError(source: string, message: string, extra?: Record<string, unknown>) {
  const entry: LogEntry = {
    level: 'error',
    source,
    message,
    extra,
    timestamp: new Date().toISOString(),
  };
  console.error(formatEntry(entry));
}

/**
 * Error obyektidan xabar va stack olish
 */
export function errorToExtra(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      errorMessage: err.message,
      stack: err.stack?.split('\n').slice(0, 5).join('\n'),
    };
  }
  return { errorMessage: String(err) };
}
