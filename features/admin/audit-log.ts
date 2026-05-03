import 'server-only';

import { createAdminClient } from '@/lib/supabase/server';
import { notifySystemError } from '@/lib/telegram/admin-bot';
import { assertAdminAccess } from './guard';

type AuditCoverageMode = 'full' | 'partial' | 'unavailable';
type AuditStatus = 'success' | 'failed' | 'pending' | null;
type AuditSeverity = 'info' | 'warning' | 'error' | 'critical' | null;
type AuditEntityType =
  | 'user'
  | 'agency'
  | 'tour'
  | 'lead'
  | 'verification'
  | 'promotion'
  | 'maxcoin'
  | 'delete_account'
  | 'settings'
  | 'auth'
  | 'system';

interface AgencyRef {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  owner_id?: string | null;
  owner?:
    | {
        id?: string | null;
        full_name?: string | null;
        email?: string | null;
        role?: string | null;
      }
    | Array<{
        id?: string | null;
        full_name?: string | null;
        email?: string | null;
        role?: string | null;
      }>
    | null;
}

interface TourRef {
  id?: string | null;
  title?: string | null;
  slug?: string | null;
}

interface ProfileRef {
  id?: string | null;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
}

interface VerificationRow {
  id: string;
  agency_id: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  certificate_url: string | null;
  created_at: string;
  updated_at: string;
  form_data: Record<string, unknown> | null;
  agency: AgencyRef | AgencyRef[] | null;
}

interface CoinRequestRow {
  id: string;
  agency_id: string;
  coins: number | string;
  price_uzs: number | string;
  status: 'pending' | 'approved' | 'rejected' | string;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  agency: AgencyRef | AgencyRef[] | null;
}

interface MaxcoinTxRow {
  id: string;
  agency_id: string;
  amount: number | string;
  type: string;
  description: string | null;
  tour_id: string | null;
  created_at: string;
  agency: AgencyRef | AgencyRef[] | null;
  tour: TourRef | TourRef[] | null;
}

interface TourPromotionRow {
  id: string;
  tour_id: string;
  agency_id: string;
  placement: string;
  cost_coins: number | string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  status?: string | null;
  created_at: string;
  agency: AgencyRef | AgencyRef[] | null;
  tour: TourRef | TourRef[] | null;
}

interface AccountDeletionRow {
  id: string;
  user_id: string;
  agency_id: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | string;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  user: ProfileRef | ProfileRef[] | null;
  agency: AgencyRef | AgencyRef[] | null;
}

interface NotificationLogRow {
  id: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  recipient_count: number | null;
  preference_key: string | null;
  created_at: string;
}

export interface AdminAuditSourceSummary {
  key: string;
  label: string;
  table: string;
  available: boolean;
  count: number;
  description: string;
  eventTypes: string[];
  error: string | null;
}

export interface AdminAuditRelatedLink {
  label: string;
  href: string;
}

export interface AdminAuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actionType: string;
  entityType: AuditEntityType;
  entityId: string | null;
  targetSummary: string | null;
  status: AuditStatus;
  severity: AuditSeverity;
  sourceModule: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  highRisk: boolean;
  riskReasons: string[];
  metadata: Record<string, unknown> | null;
  relatedLinks: AdminAuditRelatedLink[];
}

export interface AdminAuditPayload {
  generatedAt: string;
  coverageMode: AuditCoverageMode;
  coverageTitle: string;
  coverageDescription: string;
  coveredAreas: string[];
  missingAreas: string[];
  backendRequirements: string[];
  sourceSummaries: AdminAuditSourceSummary[];
  events: AdminAuditEvent[];
  sourceErrors: string[];
}

type QueryResult<T> = {
  data: T[] | null;
  error: { message?: string; code?: string } | null;
};

type LoadedSource<T> = {
  rows: T[];
  available: boolean;
  error: string | null;
};

const REDACTED = '[REDACTED]';
const SENSITIVE_KEY_MARKERS = [
  'token',
  'secret',
  'password',
  'service_role',
  'apikey',
  'api_key',
  'authorization',
  'cookie',
  'refresh',
  'session',
  'jwt',
  'webhook',
  'bot',
  'private_key',
  'access_key',
];

const MISSING_BACKEND_REQUIREMENTS = [
  'audit_logs table',
  'actor_id',
  'action',
  'entity_type',
  'entity_id',
  'status',
  'severity',
  'metadata JSONB',
  'created_at',
  'server-side logging from admin mutations',
  'RLS/admin-only read policy',
];

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function asNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function hasMissingTableSignature(error: { message?: string; code?: string } | null): boolean {
  const message = (error?.message ?? '').toLowerCase();
  const code = error?.code ?? '';
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    message.includes('does not exist') ||
    message.includes('could not find the table') ||
    message.includes('relation') && message.includes('does not exist')
  );
}

function sanitizeMetadata(value: unknown, depth = 0): unknown {
  if (value == null) return null;
  if (depth > 7) return '[MAX_DEPTH]';

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeMetadata(item, depth + 1));
  }

  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [rawKey, rawVal] of Object.entries(source).slice(0, 120)) {
      const key = rawKey.toLowerCase();
      const isSensitive = SENSITIVE_KEY_MARKERS.some((marker) => key.includes(marker));
      output[rawKey] = isSensitive ? REDACTED : sanitizeMetadata(rawVal, depth + 1);
    }
    return output;
  }

  if (typeof value === 'string') {
    if (/bearer\s+[a-z0-9\-._~+/]+=*/i.test(value)) return REDACTED;
    if (/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/.test(value)) return REDACTED;
    if (/(sk_live|sk_test|sbp_|service_role|refresh_token|access_token)/i.test(value)) return REDACTED;
    return value.length > 500 ? `${value.slice(0, 500)}...` : value;
  }

  return value;
}

function summarizeTarget(parts: Array<string | null | undefined>): string | null {
  const joined = parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part.length > 0)
    .join(' • ');

  return joined.length > 0 ? joined : null;
}

function severityOrder(value: AuditSeverity): number {
  if (value === 'critical') return 4;
  if (value === 'error') return 3;
  if (value === 'warning') return 2;
  if (value === 'info') return 1;
  return 0;
}

function buildRelatedLinks(entityType: AuditEntityType, ids: {
  entityId?: string | null;
  tourId?: string | null;
}): AdminAuditRelatedLink[] {
  if (entityType === 'tour' && ids.tourId) {
    return [
      { label: 'Open tour detail', href: `/admin/tours/${ids.tourId}` },
      { label: 'Open tours panel', href: '/admin/tours' },
    ];
  }

  if (entityType === 'verification') {
    return [{ label: 'Open verification queue', href: '/admin/verification' }];
  }

  if (entityType === 'maxcoin' || entityType === 'promotion') {
    return [
      { label: 'Open Promotions / MaxCoin', href: '/admin/coin-requests' },
      { label: 'Open Featured Promotions', href: '/admin/featured' },
    ];
  }

  if (entityType === 'delete_account') {
    return [{ label: 'Open Delete Account panel', href: '/admin/account-deletions' }];
  }

  if (entityType === 'agency') {
    return [{ label: 'Open agencies panel', href: '/admin/agencies' }];
  }

  if (entityType === 'user') {
    return [{ label: 'Open users panel', href: '/admin/users' }];
  }

  if (entityType === 'lead') {
    return [{ label: 'Open leads panel', href: '/admin/leads' }];
  }

  return [];
}

async function loadSourceRows<T>(
  query: () => Promise<QueryResult<T>>
): Promise<LoadedSource<T>> {
  try {
    const { data, error } = await query();
    if (error) {
      if (hasMissingTableSignature(error)) {
        return { rows: [], available: false, error: error.message ?? 'Source table not found' };
      }
      return { rows: [], available: false, error: error.message ?? 'Unknown query error' };
    }
    return { rows: data ?? [], available: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown query failure';
    return { rows: [], available: false, error: message };
  }
}

export async function getAdminAuditPayload(): Promise<AdminAuditPayload> {
  await assertAdminAccess();
  const admin = await createAdminClient();
  const generatedAt = new Date().toISOString();

  const [
    verificationSource,
    coinRequestSource,
    maxcoinSource,
    promotionSource,
    deletionSource,
    notificationLogSource,
  ] = await Promise.all([
    loadSourceRows<VerificationRow>(async () =>
      await admin
        .from('verification_requests')
        .select(
          'id, agency_id, status, admin_note, certificate_url, created_at, updated_at, form_data, agency:agencies(id, name, slug, owner_id, owner:profiles(id, full_name, email, role))'
        )
        .order('created_at', { ascending: false })
        .limit(400)
    ),
    loadSourceRows<CoinRequestRow>(async () =>
      await admin
        .from('coin_requests')
        .select('id, agency_id, coins, price_uzs, status, admin_note, created_at, resolved_at, agency:agencies(id, name, slug)')
        .order('created_at', { ascending: false })
        .limit(500)
    ),
    loadSourceRows<MaxcoinTxRow>(async () =>
      await admin
        .from('maxcoin_transactions')
        .select(
          'id, agency_id, amount, type, description, tour_id, created_at, agency:agencies(id, name, slug), tour:tours(id, title, slug)'
        )
        .order('created_at', { ascending: false })
        .limit(700)
    ),
    loadSourceRows<TourPromotionRow>(async () =>
      await admin
        .from('tour_promotions')
        .select(
          'id, tour_id, agency_id, placement, cost_coins, starts_at, ends_at, is_active, status, created_at, agency:agencies(id, name, slug), tour:tours(id, title, slug)'
        )
        .order('created_at', { ascending: false })
        .limit(600)
    ),
    loadSourceRows<AccountDeletionRow>(async () =>
      await admin
        .from('account_deletion_requests')
        .select(
          'id, user_id, agency_id, reason, status, requested_at, reviewed_by, reviewed_at, admin_notes, user:profiles!account_deletion_requests_user_id_fkey(id, full_name, email, role), agency:agencies(id, name, slug)'
        )
        .order('requested_at', { ascending: false })
        .limit(400)
    ),
    loadSourceRows<NotificationLogRow>(async () =>
      await admin
        .from('notification_log')
        .select('id, title, body, data, recipient_count, preference_key, created_at')
        .order('created_at', { ascending: false })
        .limit(300)
    ),
  ]);

  const events: AdminAuditEvent[] = [];

  for (const row of verificationSource.rows) {
    const agency = firstOrNull(row.agency);
    const owner = agency ? firstOrNull(agency.owner) : null;

    events.push({
      id: `verification:${row.id}:submitted`,
      timestamp: row.created_at,
      action: 'Verification request submitted',
      actionType: 'verification.request_submitted',
      entityType: 'verification',
      entityId: row.id,
      targetSummary: summarizeTarget([agency?.name, agency?.slug]),
      status: 'pending',
      severity: 'info',
      sourceModule: 'verification',
      actorId: owner?.id ?? agency?.owner_id ?? null,
      actorName: owner?.full_name ?? agency?.name ?? null,
      actorEmail: owner?.email ?? null,
      actorRole: owner?.role ?? 'agency_manager',
      highRisk: false,
      riskReasons: [],
      metadata: sanitizeMetadata({
        request_status: row.status,
        has_admin_note: Boolean(row.admin_note),
        has_form_data: Boolean(row.form_data),
      }) as Record<string, unknown>,
      relatedLinks: buildRelatedLinks('verification', { entityId: row.id }),
    });

    if (row.status !== 'pending') {
      const approved = row.status === 'approved';
      events.push({
        id: `verification:${row.id}:decision`,
        timestamp: row.updated_at,
        action: approved ? 'Verification approved' : 'Verification rejected',
        actionType: approved ? 'verification.approved' : 'verification.rejected',
        entityType: 'verification',
        entityId: row.id,
        targetSummary: summarizeTarget([agency?.name, agency?.slug]),
        status: 'success',
        severity: approved ? 'warning' : 'critical',
        sourceModule: 'verification',
        actorId: null,
        actorName: null,
        actorEmail: null,
        actorRole: 'admin',
        highRisk: true,
        riskReasons: ['Verification moderation decision'],
        metadata: sanitizeMetadata({
          status: row.status,
          admin_note: row.admin_note,
          form_data: row.form_data,
        }) as Record<string, unknown>,
        relatedLinks: buildRelatedLinks('verification', { entityId: row.id }),
      });
    }
  }

  for (const row of coinRequestSource.rows) {
    const agency = firstOrNull(row.agency);
    const coinAmount = asNumber(row.coins);
    const priceUzs = asNumber(row.price_uzs);

    events.push({
      id: `coin_request:${row.id}:submitted`,
      timestamp: row.created_at,
      action: 'MaxCoin purchase request submitted',
      actionType: 'maxcoin.request_submitted',
      entityType: 'maxcoin',
      entityId: row.id,
      targetSummary: summarizeTarget([agency?.name, `${coinAmount} MC`]),
      status: row.status === 'pending' ? 'pending' : 'success',
      severity: 'info',
      sourceModule: 'maxcoin',
      actorId: agency?.owner_id ?? null,
      actorName: agency?.name ?? null,
      actorEmail: null,
      actorRole: 'agency_manager',
      highRisk: false,
      riskReasons: [],
      metadata: sanitizeMetadata({
        status: row.status,
        coins: coinAmount,
        price_uzs: priceUzs,
        admin_note: row.admin_note,
      }) as Record<string, unknown>,
      relatedLinks: buildRelatedLinks('maxcoin', { entityId: row.id }),
    });

    if (row.resolved_at && row.status !== 'pending') {
      const approved = row.status === 'approved';
      events.push({
        id: `coin_request:${row.id}:resolved`,
        timestamp: row.resolved_at,
        action: approved ? 'MaxCoin request approved' : 'MaxCoin request rejected',
        actionType: approved ? 'maxcoin.request_approved' : 'maxcoin.request_rejected',
        entityType: 'maxcoin',
        entityId: row.id,
        targetSummary: summarizeTarget([agency?.name, `${coinAmount} MC`]),
        status: 'success',
        severity: approved ? 'warning' : 'warning',
        sourceModule: 'maxcoin',
        actorId: null,
        actorName: null,
        actorEmail: null,
        actorRole: 'admin',
        highRisk: true,
        riskReasons: ['Financial moderation decision'],
        metadata: sanitizeMetadata({
          status: row.status,
          admin_note: row.admin_note,
          coins: coinAmount,
        }) as Record<string, unknown>,
        relatedLinks: buildRelatedLinks('maxcoin', { entityId: row.id }),
      });
    }
  }

  for (const row of maxcoinSource.rows) {
    const agency = firstOrNull(row.agency);
    const tour = firstOrNull(row.tour);
    const amount = asNumber(row.amount);
    const isDebit = amount < 0;

    events.push({
      id: `maxcoin_tx:${row.id}`,
      timestamp: row.created_at,
      action: isDebit ? 'MaxCoin debited' : 'MaxCoin credited',
      actionType: isDebit ? 'maxcoin.debit' : 'maxcoin.credit',
      entityType: 'maxcoin',
      entityId: row.id,
      targetSummary: summarizeTarget([
        agency?.name,
        tour?.title,
        `${amount > 0 ? '+' : ''}${amount} MC`,
      ]),
      status: 'success',
      severity: isDebit ? 'warning' : 'info',
      sourceModule: 'maxcoin',
      actorId: null,
      actorName: null,
      actorEmail: null,
      actorRole: null,
      highRisk: isDebit,
      riskReasons: isDebit ? ['MaxCoin balance reduction'] : [],
      metadata: sanitizeMetadata({
        type: row.type,
        amount,
        description: row.description,
        tour_id: row.tour_id,
      }) as Record<string, unknown>,
      relatedLinks: buildRelatedLinks('maxcoin', { entityId: row.id }),
    });
  }

  for (const row of promotionSource.rows) {
    const agency = firstOrNull(row.agency);
    const tour = firstOrNull(row.tour);
    const currentStatus = row.status ?? (row.is_active ? 'active' : 'inactive');

    events.push({
      id: `promotion:${row.id}`,
      timestamp: row.created_at,
      action: 'Tour promotion record created',
      actionType: 'promotion.created',
      entityType: 'promotion',
      entityId: row.id,
      targetSummary: summarizeTarget([tour?.title, agency?.name, row.placement]),
      status: 'success',
      severity: row.is_active ? 'info' : 'warning',
      sourceModule: 'promotions',
      actorId: null,
      actorName: null,
      actorEmail: null,
      actorRole: null,
      highRisk: false,
      riskReasons: [],
      metadata: sanitizeMetadata({
        placement: row.placement,
        cost_coins: asNumber(row.cost_coins),
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        is_active: row.is_active,
        status: currentStatus,
        agency_id: row.agency_id,
        tour_id: row.tour_id,
      }) as Record<string, unknown>,
      relatedLinks: buildRelatedLinks('promotion', { entityId: row.id, tourId: row.tour_id }),
    });
  }

  for (const row of deletionSource.rows) {
    const user = firstOrNull(row.user);
    const agency = firstOrNull(row.agency);
    const target = summarizeTarget([user?.full_name, user?.email, agency?.name]);

    events.push({
      id: `delete_request:${row.id}:submitted`,
      timestamp: row.requested_at,
      action: 'Account deletion requested',
      actionType: 'delete_account.request_submitted',
      entityType: 'delete_account',
      entityId: row.id,
      targetSummary: target,
      status: row.status === 'pending' ? 'pending' : 'success',
      severity: 'warning',
      sourceModule: 'account_deletion',
      actorId: row.user_id,
      actorName: user?.full_name ?? null,
      actorEmail: user?.email ?? null,
      actorRole: user?.role ?? 'user',
      highRisk: true,
      riskReasons: ['Account deletion workflow initiated'],
      metadata: sanitizeMetadata({
        request_status: row.status,
        reason: row.reason,
        agency_id: row.agency_id,
      }) as Record<string, unknown>,
      relatedLinks: buildRelatedLinks('delete_account', { entityId: row.id }),
    });

    if (row.reviewed_at && row.status !== 'pending') {
      events.push({
        id: `delete_request:${row.id}:reviewed`,
        timestamp: row.reviewed_at,
        action:
          row.status === 'approved'
            ? 'Account deletion approved and processed'
            : row.status === 'rejected'
              ? 'Account deletion request rejected'
              : 'Account deletion request reviewed',
        actionType:
          row.status === 'approved'
            ? 'delete_account.approved'
            : row.status === 'rejected'
              ? 'delete_account.rejected'
              : 'delete_account.reviewed',
        entityType: 'delete_account',
        entityId: row.id,
        targetSummary: target,
        status: 'success',
        severity: row.status === 'approved' ? 'critical' : 'warning',
        sourceModule: 'account_deletion',
        actorId: row.reviewed_by,
        actorName: null,
        actorEmail: null,
        actorRole: 'admin',
        highRisk: true,
        riskReasons:
          row.status === 'approved'
            ? ['Destructive action approved']
            : ['Deletion moderation decision'],
        metadata: sanitizeMetadata({
          reviewed_by: row.reviewed_by,
          admin_notes: row.admin_notes,
          status: row.status,
        }) as Record<string, unknown>,
        relatedLinks: buildRelatedLinks('delete_account', { entityId: row.id }),
      });
    }
  }

  for (const row of notificationLogSource.rows) {
    const title = row.title || '';
    const body = row.body || '';
    const merged = `${title} ${body}`.toLowerCase();
    const errorLike =
      merged.includes('error') ||
      merged.includes('failed') ||
      merged.includes('exception');

    events.push({
      id: `notification_log:${row.id}`,
      timestamp: row.created_at,
      action: 'Notification batch recorded',
      actionType: 'system.notification_logged',
      entityType: 'system',
      entityId: row.id,
      targetSummary: summarizeTarget([title, `${row.recipient_count ?? 0} recipients`]),
      status: errorLike ? 'failed' : 'success',
      severity: errorLike ? 'error' : 'info',
      sourceModule: 'notifications',
      actorId: null,
      actorName: 'System',
      actorEmail: null,
      actorRole: 'system',
      highRisk: errorLike,
      riskReasons: errorLike ? ['Operational error-like notification event'] : [],
      metadata: sanitizeMetadata({
        title,
        body,
        preference_key: row.preference_key,
        recipient_count: row.recipient_count,
        data: row.data,
      }) as Record<string, unknown>,
      relatedLinks: buildRelatedLinks('system', { entityId: row.id }),
    });
  }

  const sourceSummaries: AdminAuditSourceSummary[] = [
    {
      key: 'verification_requests',
      label: 'Verification decisions',
      table: 'verification_requests',
      available: verificationSource.available,
      count: verificationSource.rows.length,
      description: 'Agency verification request lifecycle and moderation outcomes.',
      eventTypes: ['request_submitted', 'approved/rejected'],
      error: verificationSource.error,
    },
    {
      key: 'coin_requests',
      label: 'Promotion/MaxCoin requests',
      table: 'coin_requests',
      available: coinRequestSource.available,
      count: coinRequestSource.rows.length,
      description: 'Agency coin purchase requests and admin resolution status.',
      eventTypes: ['request_submitted', 'request_approved/rejected'],
      error: coinRequestSource.error,
    },
    {
      key: 'maxcoin_transactions',
      label: 'MaxCoin ledger',
      table: 'maxcoin_transactions',
      available: maxcoinSource.available,
      count: maxcoinSource.rows.length,
      description: 'Balance credit/debit ledger entries used for financial traceability.',
      eventTypes: ['credit', 'debit'],
      error: maxcoinSource.error,
    },
    {
      key: 'tour_promotions',
      label: 'Promotion lifecycle',
      table: 'tour_promotions',
      available: promotionSource.available,
      count: promotionSource.rows.length,
      description: 'Promotion records for tours, including placement and active windows.',
      eventTypes: ['promotion_created'],
      error: promotionSource.error,
    },
    {
      key: 'account_deletion_requests',
      label: 'Delete account moderation',
      table: 'account_deletion_requests',
      available: deletionSource.available,
      count: deletionSource.rows.length,
      description: 'Account deletion requests and review decisions when table is present.',
      eventTypes: ['request_submitted', 'approved/rejected'],
      error: deletionSource.error,
    },
    {
      key: 'notification_log',
      label: 'Operational notification log',
      table: 'notification_log',
      available: notificationLogSource.available,
      count: notificationLogSource.rows.length,
      description: 'System notification batches and operational delivery traces.',
      eventTypes: ['notification_logged'],
      error: notificationLogSource.error,
    },
  ];

  const availableSources = sourceSummaries.filter((source) => source.available);
  const sourceErrors = sourceSummaries
    .filter((source) => source.error)
    .map((source) => `${source.table}: ${source.error}`);

  events.sort((a, b) => {
    const timeDiff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    if (timeDiff !== 0) return timeDiff;
    return severityOrder(b.severity) - severityOrder(a.severity);
  });

  let coverageMode: AuditCoverageMode = 'partial';
  let coverageTitle = 'Partial audit coverage';
  let coverageDescription =
    'No canonical audit_logs table was found. This panel shows a derived operational audit timeline from real admin-related tables only.';

  if (availableSources.length === 0) {
    coverageMode = 'unavailable';
    coverageTitle = 'Audit logging is not configured yet';
    coverageDescription =
      'No readable audit/event source tables were discovered for this admin environment.';
  }

  const coveredAreas = [
    verificationSource.available ? 'Verification request decisions' : null,
    coinRequestSource.available ? 'MaxCoin request moderation' : null,
    maxcoinSource.available ? 'MaxCoin ledger activity' : null,
    promotionSource.available ? 'Tour promotion records' : null,
    deletionSource.available ? 'Account deletion review flow' : null,
    notificationLogSource.available ? 'Notification operations traces' : null,
  ].filter((item): item is string => Boolean(item));

  const missingAreas = [
    'Admin login/auth session events',
    'Generic admin settings/config changes',
    'Canonical actor-centric audit event stream',
    deletionSource.available ? null : 'Account deletion request trail (source not available)',
    notificationLogSource.available ? null : 'Operational error/event log source',
  ].filter((item): item is string => Boolean(item));

  if (coverageMode === 'unavailable') {
    try {
      await notifySystemError({
        source: 'Query: getAdminAuditPayload',
        message: 'No audit sources available for admin audit panel',
      });
    } catch {
      // best-effort diagnostic only
    }
  }

  return {
    generatedAt,
    coverageMode,
    coverageTitle,
    coverageDescription,
    coveredAreas,
    missingAreas,
    backendRequirements: coverageMode === 'unavailable' ? MISSING_BACKEND_REQUIREMENTS : [],
    sourceSummaries,
    events,
    sourceErrors,
  };
}
