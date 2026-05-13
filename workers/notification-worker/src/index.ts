type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  INTERNAL_NOTIFICATION_SECRET: string;
  EXPO_ACCESS_TOKEN?: string;
}

interface ScheduledController {
  readonly cron: string;
  readonly scheduledTime: number;
  noRetry(): void;
}

interface ProcessRequestBody {
  batch_size?: number;
  source?: string;
}

interface OutboxRow {
  id: string;
  user_ids: string[] | null;
  preference_key: string | null;
  title: string;
  body: string;
  data: Record<string, Json> | null;
  attempts: number;
  max_attempts: number;
}

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
    [key: string]: Json;
  };
}

interface ProcessSummary {
  invocation_id: string;
  source: string;
  batch_size: number;
  claimed: number;
  sent: number;
  failed: number;
  skipped: number;
  invalid_token: number;
}

const INTERNAL_PROCESS_PATH = '/internal/notifications/process';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MAX_BATCH_SIZE = 100;
const DEFAULT_BATCH_SIZE = 50;
const MAX_EXPO_MESSAGES_PER_REQUEST = 100;
const EXPO_TOKEN_RE = /^Expo(nent)?PushToken\[[A-Za-z0-9._-]+\]$/;
const SAFE_PREF_KEY_RE = /^[a-z_][a-z0-9_]{0,63}$/;
const DEVICE_UNREGISTERED_ERRORS = new Set([
  'DeviceNotRegistered',
  'MismatchSenderId',
  'InvalidCredentials',
]);

function makeJson(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function normalizeBatchSize(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return DEFAULT_BATCH_SIZE;
  return Math.max(1, Math.min(MAX_BATCH_SIZE, Math.floor(raw)));
}

function readBearerOrSharedSecret(req: Request): string | null {
  const customHeader = req.headers.get('x-internal-notification-secret');
  if (customHeader && customHeader.trim()) return customHeader.trim();

  const auth = req.headers.get('authorization');
  if (!auth) return null;
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  return auth.slice('Bearer '.length).trim();
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function chunkArray<T>(items: T[], size: number): T[][];
function chunkArray<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function encodeInList(values: string[]): string {
  return `(${values.map((v) => `"${v}"`).join(',')})`;
}

function structuredLog(event: string, fields: Record<string, unknown>) {
  const payload = {
    ts: new Date().toISOString(),
    event,
    ...fields,
  };
  console.log(JSON.stringify(payload));
}

function extractPreferenceKey(row: OutboxRow): string | null {
  const fromRow = typeof row.preference_key === 'string' ? row.preference_key.trim() : '';
  if (fromRow) return fromRow;
  const fromData = row.data?.preference_key;
  return typeof fromData === 'string' && fromData.trim() ? fromData.trim() : null;
}

function extractUserIds(row: OutboxRow): string[] {
  const direct = Array.isArray(row.user_ids) ? row.user_ids : [];
  const fromDirect = direct.filter((v): v is string => typeof v === 'string' && isUuid(v));
  if (fromDirect.length > 0) return Array.from(new Set(fromDirect));

  const fromData = row.data?.user_ids;
  if (!Array.isArray(fromData)) return [];
  return Array.from(
    new Set(
      fromData.filter((v): v is string => typeof v === 'string' && isUuid(v)),
    ),
  );
}

async function supabaseFetch<T>(
  env: Env,
  path: string,
  init: RequestInit,
): Promise<T> {
  const base = env.SUPABASE_URL.replace(/\/+$/, '');
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`supabase_http_${res.status}:${raw.slice(0, 400)}`);
  }
  if (!raw) return [] as T;
  return JSON.parse(raw) as T;
}

async function rpcCall<T>(
  env: Env,
  rpcName: string,
  args: Record<string, Json>,
): Promise<T> {
  return supabaseFetch<T>(env, `/rest/v1/rpc/${rpcName}`, {
    method: 'POST',
    body: JSON.stringify(args),
    headers: {
      Prefer: 'return=representation',
    },
  });
}

async function getPushTokensForUsers(
  env: Env,
  userIds: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const chunks = chunkArray(userIds, 200);

  for (const ids of chunks) {
    const params = new URLSearchParams({
      select: 'id,push_token',
      id: `in.${encodeInList(ids)}`,
      push_token: 'not.is.null',
    });
    const rows = await supabaseFetch<Array<{ id: string; push_token: string | null }>>(
      env,
      `/rest/v1/profiles?${params.toString()}`,
      { method: 'GET' },
    );
    for (const row of rows) {
      if (typeof row.push_token === 'string' && EXPO_TOKEN_RE.test(row.push_token)) {
        result.set(row.id, row.push_token);
      }
    }
  }

  return result;
}

async function getOptedOutUserIds(
  env: Env,
  userIds: string[],
  preferenceKey: string | null,
): Promise<Set<string>> {
  if (!preferenceKey || !SAFE_PREF_KEY_RE.test(preferenceKey)) {
    return new Set();
  }

  const optedOut = new Set<string>();
  const chunks = chunkArray(userIds, 200);

  for (const ids of chunks) {
    const params = new URLSearchParams({
      select: 'user_id',
      user_id: `in.${encodeInList(ids)}`,
      [preferenceKey]: 'eq.false',
    });
    const rows = await supabaseFetch<Array<{ user_id: string }>>(
      env,
      `/rest/v1/notification_preferences?${params.toString()}`,
      { method: 'GET' },
    );
    for (const row of rows) {
      if (isUuid(row.user_id)) optedOut.add(row.user_id);
    }
  }

  return optedOut;
}

async function clearInvalidPushToken(
  env: Env,
  userId: string,
  token: string,
  rowId: string,
  invocationId: string,
) {
  try {
    const params = new URLSearchParams({
      id: `eq.${userId}`,
      push_token: `eq.${token}`,
    });
    await supabaseFetch(env, `/rest/v1/profiles?${params.toString()}`, {
      method: 'PATCH',
      body: JSON.stringify({ push_token: null }),
      headers: { Prefer: 'return=minimal' },
    });
    structuredLog('invalid_token', {
      invocation_id: invocationId,
      row_id: rowId,
      user_id: userId,
      token_tail: token.slice(-10),
    });
  } catch (error) {
    structuredLog('invalid_token_cleanup_error', {
      invocation_id: invocationId,
      row_id: rowId,
      user_id: userId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function markRowSent(env: Env, rowId: string) {
  await rpcCall(env, 'mark_notification_sent', { p_id: rowId });
}

async function markRowFailed(
  env: Env,
  rowId: string,
  reason: string,
  retryAfterSeconds?: number | null,
) {
  const safeRetrySeconds =
    typeof retryAfterSeconds === 'number' && Number.isFinite(retryAfterSeconds)
      ? Math.max(1, Math.floor(retryAfterSeconds))
      : null;

  await rpcCall(env, 'mark_notification_failed', {
    p_id: rowId,
    p_error: reason.slice(0, 1000),
    p_retry_after_seconds: safeRetrySeconds,
  });
}

async function markRowSkipped(env: Env, rowId: string, reason: string) {
  await rpcCall(env, 'mark_notification_skipped', { p_id: rowId, p_reason: reason.slice(0, 1000) });
}

async function sendExpoBatch(
  env: Env,
  messages: Array<{
    to: string;
    title: string;
    body: string;
    data: Record<string, Json>;
    sound: 'default';
    priority: 'high';
    channelId: 'default';
  }>,
): Promise<ExpoTicket[]> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
  };
  if (env.EXPO_ACCESS_TOKEN && env.EXPO_ACCESS_TOKEN.trim()) {
    headers.authorization = `Bearer ${env.EXPO_ACCESS_TOKEN.trim()}`;
  }

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  });

  const raw = await res.text();
  let parsed: { data?: ExpoTicket[]; errors?: Array<{ message?: string; code?: string }> } = {};
  try {
    parsed = raw ? (JSON.parse(raw) as typeof parsed) : {};
  } catch {
    /* ignore parse and treat as failure below */
  }

  if (!res.ok) {
    const detail = parsed.errors?.[0]?.message || raw || `http_${res.status}`;
    throw new Error(`expo_http_${res.status}:${detail.slice(0, 300)}`);
  }

  const tickets = Array.isArray(parsed.data) ? parsed.data : [];
  if (tickets.length !== messages.length) {
    throw new Error(`expo_ticket_mismatch:expected_${messages.length}:got_${tickets.length}`);
  }
  return tickets;
}

async function processRow(env: Env, row: OutboxRow, invocationId: string): Promise<'sent' | 'failed' | 'skipped'> {
  const userIds = extractUserIds(row);
  const preferenceKey = extractPreferenceKey(row);

  if (userIds.length === 0) {
    await markRowSkipped(env, row.id, 'no_user_ids');
    structuredLog('skipped', {
      invocation_id: invocationId,
      row_id: row.id,
      reason: 'no_user_ids',
    });
    return 'skipped';
  }

  let eligibleUserIds = userIds;
  if (preferenceKey) {
    const optedOut = await getOptedOutUserIds(env, userIds, preferenceKey);
    eligibleUserIds = userIds.filter((id) => !optedOut.has(id));
  }

  if (eligibleUserIds.length === 0) {
    await markRowSkipped(env, row.id, 'all_users_opted_out');
    structuredLog('skipped', {
      invocation_id: invocationId,
      row_id: row.id,
      reason: 'all_users_opted_out',
      preference_key: preferenceKey ?? null,
    });
    return 'skipped';
  }

  const tokenByUser = await getPushTokensForUsers(env, eligibleUserIds);
  if (tokenByUser.size === 0) {
    await markRowSkipped(env, row.id, 'no_valid_push_tokens');
    structuredLog('skipped', {
      invocation_id: invocationId,
      row_id: row.id,
      reason: 'no_valid_push_tokens',
      eligible_users: eligibleUserIds.length,
    });
    return 'skipped';
  }

  const pairs = Array.from(tokenByUser.entries()); // [userId, token]
  const payloadData =
    row.data && typeof row.data === 'object' && !Array.isArray(row.data)
      ? row.data
      : {};

  const messages = pairs.map(([, token]) => ({
    to: token,
    title: row.title,
    body: row.body,
    data: payloadData,
    sound: 'default' as const,
    priority: 'high' as const,
    channelId: 'default' as const,
  }));

  let hadTransientError = false;
  let hadAcceptedTicket = false;

  for (const [chunkIndex, msgChunk] of chunkArray(messages, MAX_EXPO_MESSAGES_PER_REQUEST).entries()) {
    const pairChunk = pairs.slice(
      chunkIndex * MAX_EXPO_MESSAGES_PER_REQUEST,
      chunkIndex * MAX_EXPO_MESSAGES_PER_REQUEST + msgChunk.length,
    );

    let tickets: ExpoTicket[];
    try {
      tickets = await sendExpoBatch(env, msgChunk);
    } catch (error) {
      hadTransientError = true;
      structuredLog('expo_error', {
        invocation_id: invocationId,
        row_id: row.id,
        message: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    for (let i = 0; i < tickets.length; i += 1) {
      const ticket = tickets[i];
      const [userId, token] = pairChunk[i];

      if (ticket.status === 'ok' && ticket.id) {
        hadAcceptedTicket = true;
        continue;
      }

      const expoErrorCode =
        typeof ticket.details?.error === 'string' ? ticket.details.error : '';
      const ticketMessage = ticket.message ?? 'expo_ticket_error';

      if (DEVICE_UNREGISTERED_ERRORS.has(expoErrorCode)) {
        await clearInvalidPushToken(env, userId, token, row.id, invocationId);
        continue;
      }

      hadTransientError = true;
      structuredLog('expo_error', {
        invocation_id: invocationId,
        row_id: row.id,
        user_id: userId,
        token_tail: token.slice(-10),
        expo_error: expoErrorCode || null,
        message: ticketMessage,
      });
    }
  }

  if (hadTransientError) {
    await markRowFailed(env, row.id, 'expo_or_network_failure');
    structuredLog('failed', {
      invocation_id: invocationId,
      row_id: row.id,
      reason: 'expo_or_network_failure',
      attempts: row.attempts,
      max_attempts: row.max_attempts,
    });
    return 'failed';
  }

  if (!hadAcceptedTicket) {
    await markRowSkipped(env, row.id, 'no_accepted_expo_tickets');
    structuredLog('skipped', {
      invocation_id: invocationId,
      row_id: row.id,
      reason: 'no_accepted_expo_tickets',
    });
    return 'skipped';
  }

  await markRowSent(env, row.id);
  structuredLog('sent', {
    invocation_id: invocationId,
    row_id: row.id,
    accepted_tickets: true,
  });
  return 'sent';
}

async function processOutbox(
  env: Env,
  source: string,
  requestedBatchSize: number,
  invocationId: string,
): Promise<ProcessSummary> {
  const batchSize = normalizeBatchSize(requestedBatchSize);

  const claimed = await rpcCall<OutboxRow[]>(env, 'claim_notification_outbox', {
    p_batch_size: batchSize,
    p_worker_id: invocationId,
  });

  structuredLog('claimed', {
    invocation_id: invocationId,
    source,
    batch_size: batchSize,
    claimed: claimed.length,
  });

  const summary: ProcessSummary = {
    invocation_id: invocationId,
    source,
    batch_size: batchSize,
    claimed: claimed.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    invalid_token: 0,
  };

  for (const row of claimed) {
    try {
      const result = await processRow(env, row, invocationId);
      if (result === 'sent') summary.sent += 1;
      if (result === 'failed') summary.failed += 1;
      if (result === 'skipped') summary.skipped += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await markRowFailed(env, row.id, message);
      summary.failed += 1;
      structuredLog('failed', {
        invocation_id: invocationId,
        row_id: row.id,
        reason: 'worker_exception',
        message,
      });
    }
  }

  return summary;
}

function assertRequiredEnv(env: Env) {
  const missing: string[] = [];
  if (!env.SUPABASE_URL?.trim()) missing.push('SUPABASE_URL');
  if (!env.SUPABASE_SERVICE_ROLE_KEY?.trim()) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!env.INTERNAL_NOTIFICATION_SECRET?.trim()) missing.push('INTERNAL_NOTIFICATION_SECRET');
  if (missing.length > 0) {
    throw new Error(`missing_env:${missing.join(',')}`);
  }
}

async function handleInternalProcess(req: Request, env: Env): Promise<Response> {
  try {
    assertRequiredEnv(env);
  } catch (error) {
    structuredLog('failed', {
      event_scope: 'config',
      message: error instanceof Error ? error.message : String(error),
    });
    return makeJson({ error: 'server_misconfiguration' }, 500);
  }

  const providedSecret = readBearerOrSharedSecret(req);
  if (!providedSecret || providedSecret !== env.INTERNAL_NOTIFICATION_SECRET) {
    return makeJson({ error: 'unauthorized' }, 401);
  }

  let body: ProcessRequestBody = {};
  try {
    body = (await req.json()) as ProcessRequestBody;
  } catch {
    body = {};
  }

  const invocationId = crypto.randomUUID();
  const source = typeof body.source === 'string' && body.source.trim() ? body.source.trim() : 'http';
  const batchSize = normalizeBatchSize(body.batch_size);

  try {
    const summary = await processOutbox(env, source, batchSize, invocationId);
    return makeJson({ ...summary }, 200);
  } catch (error) {
    structuredLog('failed', {
      invocation_id: invocationId,
      event_scope: 'process_outbox',
      message: error instanceof Error ? error.message : String(error),
    });
    return makeJson(
      {
        error: 'internal_error',
        invocation_id: invocationId,
      },
      500,
    );
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === 'POST' && url.pathname === INTERNAL_PROCESS_PATH) {
      return handleInternalProcess(req, env);
    }
    return makeJson({ error: 'not_found' }, 404);
  },

  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    const invocationId = crypto.randomUUID();
    try {
      assertRequiredEnv(env);
      const summary = await processOutbox(env, 'cron', DEFAULT_BATCH_SIZE, invocationId);
      structuredLog('cron_complete', { ...summary });
    } catch (error) {
      structuredLog('failed', {
        invocation_id: invocationId,
        source: 'cron',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  },
};
