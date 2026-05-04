import 'server-only';

import { evaluateDomainAccess } from '@/lib/routing/guards';
import { resolveDomainTarget } from '@/lib/routing/domains';
import { createAdminClient } from '@/lib/supabase/server';
import { assertAdminAccess } from './guard';
import type {
  AdminSettingCard,
  AdminSettingSection,
  AdminSettingsReadinessCard,
  AdminSettingsSnapshot,
  SettingState,
} from './settings-types';

const DAY_MS = 24 * 60 * 60 * 1000;

type CountQueryResult = {
  count: number | null;
  error: { message: string } | null;
};

type CountQueryBuilder = () => unknown;

function hasEnv(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

function envState(name: string): SettingState {
  return hasEnv(name) ? 'configured' : 'missing';
}

function maskToken(value: string | undefined): string {
  if (!value || value.trim().length === 0) return 'Not configured';
  const trimmed = value.trim();
  if (trimmed.length <= 10) return 'Configured (hidden)';
  return `${trimmed.slice(0, 6)}••••${trimmed.slice(-4)}`;
}

function summarizePublicUrl(value: string | undefined): string {
  if (!value || value.trim().length === 0) return 'Not configured';
  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return 'Configured';
  }
}

function summarizeSupabaseUrl(value: string | undefined): string {
  if (!value || value.trim().length === 0) return 'Not configured';
  try {
    const parsed = new URL(value);
    const host = parsed.host;
    if (host.length <= 18) return host;
    return `${host.slice(0, 7)}•••${host.slice(-10)}`;
  } catch {
    return 'Configured';
  }
}

async function countRows(label: string, query: CountQueryBuilder, loadErrors: string[]): Promise<number | null> {
  try {
    const result = (await query()) as CountQueryResult;
    const { count, error } = result;
    if (error) {
      loadErrors.push(`${label}: ${error.message}`);
      return null;
    }
    return typeof count === 'number' ? count : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    loadErrors.push(`${label}: ${message}`);
    return null;
  }
}

function settingCard(card: AdminSettingCard): AdminSettingCard {
  return card;
}

function settingSection(section: AdminSettingSection): AdminSettingSection {
  return section;
}

export async function getAdminSettingsSnapshot(): Promise<AdminSettingsSnapshot> {
  await assertAdminAccess();

  const supabase = await createAdminClient();
  const generatedAt = new Date().toISOString();
  const loadErrors: string[] = [];

  const nowIso = new Date().toISOString();
  const last24hIso = new Date(Date.now() - DAY_MS).toISOString();

  const [
    adminUsersCount,
    pendingVerificationCount,
    pendingToursCount,
    publishedToursCount,
    activePromotionsCount,
    activeFeaturedCount,
    pendingDeletionCount,
    notificationOutbox24h,
  ] = await Promise.all([
    countRows(
      'Admin users count',
      () => supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
      loadErrors,
    ),
    countRows(
      'Verification queue count',
      () => supabase
        .from('verification_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      loadErrors,
    ),
    countRows(
      'Pending tours count',
      () => supabase.from('tours').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      loadErrors,
    ),
    countRows(
      'Published tours count',
      () => supabase.from('tours').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      loadErrors,
    ),
    countRows(
      'Active promotions count',
      () => supabase
        .from('tour_promotions')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('ends_at', nowIso),
      loadErrors,
    ),
    countRows(
      'Featured placements count',
      () => supabase
        .from('featured_items')
        .select('id', { count: 'exact', head: true })
        .gte('ends_at', nowIso),
      loadErrors,
    ),
    countRows(
      'Pending account deletion count',
      () => supabase
        .from('account_deletion_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      loadErrors,
    ),
    countRows(
      'Notification outbox count (24h)',
      () => supabase
        .from('notification_log')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', last24hIso),
      loadErrors,
    ),
  ]);

  const promotionTiersResult = await supabase
    .from('promotion_tiers')
    .select('placement, coins, days, sort_order')
    .order('sort_order', { ascending: true });

  const toursCoverageResult = await supabase
    .from('tours')
    .select('country, category, region')
    .limit(500);

  if (promotionTiersResult.error) {
    loadErrors.push(`Promotion tiers: ${promotionTiersResult.error.message}`);
  }

  if (toursCoverageResult.error) {
    loadErrors.push(`Marketplace coverage sample: ${toursCoverageResult.error.message}`);
  }

  const promotionTiers = (promotionTiersResult.data ?? []) as Array<{
    placement: string | null;
    coins: number | null;
    days: number | null;
  }>;

  const tierPlacementSet = new Set(
    promotionTiers
      .map((row) => row.placement)
      .filter((value): value is string => typeof value === 'string' && value.length > 0),
  );

  const tiersSummary =
    promotionTiers.length > 0
      ? `${promotionTiers.length} tiers across ${tierPlacementSet.size} placements`
      : 'No tier rows found';

  const toursCoverageRows = (toursCoverageResult.data ?? []) as Array<{
    country: string | null;
    category: string | null;
    region: string | null;
  }>;

  const countrySet = new Set(
    toursCoverageRows
      .map((row) => row.country)
      .filter((value): value is string => typeof value === 'string' && value.length > 0),
  );

  const categorySet = new Set(
    toursCoverageRows
      .map((row) => row.category)
      .filter((value): value is string => typeof value === 'string' && value.length > 0),
  );

  const regionSet = new Set(
    toursCoverageRows
      .map((row) => row.region)
      .filter((value): value is string => typeof value === 'string' && value.length > 0),
  );

  const publicAppName = process.env.NEXT_PUBLIC_APP_NAME?.trim();
  const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const serviceRoleConfigured = hasEnv('SUPABASE_SERVICE_ROLE_KEY');
  const adminBotTokenConfigured = hasEnv('ADMIN_BOT_TOKEN');
  const adminBotWebhookSecretConfigured = hasEnv('ADMIN_BOT_WEBHOOK_SECRET');
  const adminChat1Configured = hasEnv('ADMIN_CHAT_ID');
  const adminChat2Configured = hasEnv('ADMIN_CHAT_ID_2');
  const anyAdminChatConfigured = adminChat1Configured || adminChat2Configured;

  const mxtrTarget = resolveDomainTarget('mxtr.uz');
  const wwwTarget = resolveDomainTarget('www.mxtr.uz');
  const remoteTarget = resolveDomainTarget('remote.mxtr.uz');

  const publicAdminGate = evaluateDomainAccess('/admin', mxtrTarget);
  const remoteRootGate = evaluateDomainAccess('/', remoteTarget);
  const remoteNonAdminGate = evaluateDomainAccess('/tours', remoteTarget);

  const domainSplitLooksConfigured =
    mxtrTarget === 'mxtr' &&
    wwwTarget === 'mxtr' &&
    remoteTarget === 'remote' &&
    !publicAdminGate.allow &&
    !remoteRootGate.allow &&
    remoteRootGate.redirectPath === '/admin' &&
    !remoteNonAdminGate.allow &&
    remoteNonAdminGate.redirectPath === '/admin';

  const editableCount = 0;

  const generalPlatform = settingSection({
    id: 'general-platform',
    title: 'General Platform',
    description: 'Public platform identity and runtime configuration visibility.',
    cards: [
      settingCard({
        id: 'app-name',
        name: 'App Name',
        description: 'Public application name available to frontend bundles.',
        value: publicAppName || 'Not configured',
        state: publicAppName ? 'configured' : 'missing',
        editability: 'read_only',
        source: 'env',
        risk: 'low',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'public-app-url',
        name: 'Public App URL',
        description: 'Primary public domain used for web links and callbacks.',
        value: summarizePublicUrl(publicAppUrl),
        state: publicAppUrl ? 'configured' : 'missing',
        editability: 'read_only',
        source: 'env',
        risk: 'medium',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'admin-domain',
        name: 'Admin Domain',
        description: 'Admin surface is expected to run only on configured admin domain.',
        value: 'Configured in routing config',
        state: 'expected',
        editability: 'read_only',
        source: 'docs',
        risk: 'high',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'runtime-target',
        name: 'Runtime Target',
        description: 'Deployment runtime inferred from project configuration files.',
        value: 'Next.js App Router + OpenNext + Cloudflare Workers',
        state: 'expected',
        editability: 'read_only',
        source: 'code',
        risk: 'medium',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'maintenance-mode',
        name: 'Maintenance Mode',
        description: 'No safe backend field or server action detected for maintenance toggles.',
        value: 'Not available (backend flow missing)',
        state: 'not_available',
        editability: 'read_only',
        source: 'unknown',
        risk: 'critical',
        lastUpdatedAt: null,
        sensitive: false,
        backendRequirement:
          'Provide an admin-safe server endpoint with audited persistence for maintenance state.',
      }),
    ],
  });

  const adminAccess = settingSection({
    id: 'admin-access',
    title: 'Admin Access',
    description: 'Role gating and domain restrictions for admin entry points.',
    cards: [
      settingCard({
        id: 'role-requirement',
        name: 'Admin Role Requirement',
        description: 'Admin access is granted only when profiles.role is admin.',
        value: "profiles.role = 'admin'",
        state: 'configured',
        editability: 'read_only',
        source: 'code',
        risk: 'high',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'active-admin-users',
        name: 'Active Admin Users (count)',
        description: 'Current number of profiles with admin role in this runtime environment.',
        value: adminUsersCount == null ? 'Unknown' : String(adminUsersCount),
        state: adminUsersCount == null ? 'unknown' : 'configured',
        editability: 'read_only',
        source: 'database',
        risk: 'medium',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'public-admin-block',
        name: '/admin on Public Domain',
        description: 'Expected behavior from middleware/domain guards.',
        value: !publicAdminGate.allow
          ? 'Blocked (expected by config)'
          : 'Unexpected: not blocked by guard',
        state: !publicAdminGate.allow ? 'expected' : 'unknown',
        editability: 'read_only',
        source: 'code',
        risk: 'critical',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'remote-domain-routing',
        name: 'Admin Domain Routing',
        description: 'Expected host routing on admin domain for root and non-admin routes.',
        value:
          !remoteRootGate.allow && remoteRootGate.redirectPath === '/admin'
            ? 'Root and non-admin paths redirect to /admin (expected)'
            : 'Unknown / requires runtime verification',
        state:
          !remoteRootGate.allow && remoteRootGate.redirectPath === '/admin'
            ? 'expected'
            : 'unknown',
        editability: 'read_only',
        source: 'code',
        risk: 'high',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
    ],
  });

  const marketplaceControls = settingSection({
    id: 'marketplace-controls',
    title: 'Marketplace Controls',
    description: 'Moderation and listing behavior visibility using existing data sources.',
    cards: [
      settingCard({
        id: 'agency-verification-queue',
        name: 'Agency Verification Queue',
        description: 'Pending verification requests waiting for admin decision.',
        value:
          pendingVerificationCount == null
            ? 'Unknown'
            : `${pendingVerificationCount} pending request(s)`,
        state: pendingVerificationCount == null ? 'unknown' : 'configured',
        editability: 'read_only',
        source: 'database',
        risk: 'high',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'tour-moderation-queue',
        name: 'Tour Moderation Queue',
        description: 'Pending tours that require admin moderation.',
        value: pendingToursCount == null ? 'Unknown' : `${pendingToursCount} pending tour(s)`,
        state: pendingToursCount == null ? 'unknown' : 'configured',
        editability: 'read_only',
        source: 'database',
        risk: 'high',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'default-listing-visibility',
        name: 'Default Listing Visibility',
        description: 'Public visibility is constrained by published tour status + approval assumptions.',
        value:
          publishedToursCount == null
            ? "Published-only visibility expected (count unavailable)"
            : `${publishedToursCount} published tour(s) currently visible by status policy`,
        state: publishedToursCount == null ? 'expected' : 'configured',
        editability: 'read_only',
        source: 'docs',
        risk: 'high',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'marketplace-regions-categories',
        name: 'Regions/Categories Coverage',
        description: 'Observed coverage sample from tours table (up to 500 rows).',
        value:
          toursCoverageRows.length === 0
            ? 'Not available'
            : `${countrySet.size} countries, ${regionSet.size} regions, ${categorySet.size} categories`,
        state: toursCoverageRows.length === 0 ? 'unknown' : 'configured',
        editability: 'read_only',
        source: 'database',
        risk: 'medium',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
    ],
  });

  const promotionsAndMaxcoin = settingSection({
    id: 'promotions-maxcoin',
    title: 'Promotions / MaxCoin',
    description: 'Promotion inventory and MaxCoin-related operating policy visibility.',
    cards: [
      settingCard({
        id: 'promotion-tier-catalog',
        name: 'Promotion Tier Catalog',
        description: 'Promotion tiers are read from promotion_tiers table.',
        value: tiersSummary,
        state: promotionTiers.length > 0 ? 'configured' : 'not_available',
        editability: 'read_only',
        source: 'database',
        risk: 'medium',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'promotion-placement-types',
        name: 'Promotion Placement Types',
        description: 'Unique placement values currently available in promotion tiers.',
        value:
          tierPlacementSet.size > 0
            ? Array.from(tierPlacementSet).join(', ')
            : 'Not available',
        state: tierPlacementSet.size > 0 ? 'configured' : 'unknown',
        editability: 'read_only',
        source: 'database',
        risk: 'medium',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'active-promotion-slots',
        name: 'Active Promotion Slots',
        description: 'Currently active tour promotions and featured placements.',
        value:
          activePromotionsCount == null || activeFeaturedCount == null
            ? 'Unknown'
            : `${activePromotionsCount} tour promotion(s), ${activeFeaturedCount} featured item(s)`,
        state:
          activePromotionsCount == null || activeFeaturedCount == null
            ? 'unknown'
            : 'configured',
        editability: 'read_only',
        source: 'database',
        risk: 'medium',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'maxcoin-pricing-policy',
        name: 'MaxCoin Pricing Policy',
        description: 'Pricing control is currently code-managed and not editable from admin settings.',
        value: 'Code-managed (read-only)',
        state: 'configured',
        editability: 'read_only',
        source: 'code',
        risk: 'high',
        lastUpdatedAt: generatedAt,
        sensitive: false,
        backendRequirement:
          'Add an admin-safe pricing configuration endpoint with strict validation and audit logging.',
      }),
    ],
  });

  const notificationsAndAlerts = settingSection({
    id: 'notifications-alerts',
    title: 'Notifications / Admin Alerts',
    description: 'Admin alerting and notification pipeline readiness without exposing secret values.',
    cards: [
      settingCard({
        id: 'telegram-alerts-token',
        name: 'Telegram Admin Bot Token',
        description: 'Secret token for admin bot notifications (never displayed).',
        value: adminBotTokenConfigured ? 'Configured' : 'Missing',
        state: adminBotTokenConfigured ? 'configured' : 'missing',
        editability: 'read_only',
        source: 'env',
        risk: 'critical',
        lastUpdatedAt: generatedAt,
        sensitive: true,
        sensitiveNote: 'Token value is intentionally hidden.',
      }),
      settingCard({
        id: 'admin-chat-routing',
        name: 'Admin Chat Routing',
        description: 'At least one admin chat ID is required for bot delivery.',
        value: anyAdminChatConfigured ? 'Configured' : 'Missing',
        state: anyAdminChatConfigured ? 'configured' : 'missing',
        editability: 'read_only',
        source: 'env',
        risk: 'high',
        lastUpdatedAt: generatedAt,
        sensitive: true,
        sensitiveNote: 'Chat IDs are intentionally hidden.',
      }),
      settingCard({
        id: 'admin-webhook-secret',
        name: 'Admin Bot Webhook Secret',
        description: 'Optional secret header validation for Telegram webhook route.',
        value: adminBotWebhookSecretConfigured ? 'Configured' : 'Missing/Optional',
        state: adminBotWebhookSecretConfigured ? 'configured' : 'missing',
        editability: 'read_only',
        source: 'env',
        risk: 'high',
        lastUpdatedAt: generatedAt,
        sensitive: true,
        sensitiveNote: 'Webhook secret is intentionally hidden.',
      }),
      settingCard({
        id: 'notification-outbox-status',
        name: 'Notification Outbox Activity (24h)',
        description: 'Rows seen in notification_log over the last 24 hours.',
        value:
          notificationOutbox24h == null
            ? 'Unknown'
            : `${notificationOutbox24h} row(s) in notification_log`,
        state: notificationOutbox24h == null ? 'unknown' : 'configured',
        editability: 'read_only',
        source: 'database',
        risk: 'medium',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'webhook-route-readiness',
        name: 'Webhook Route Readiness',
        description: 'Admin webhook API routes exist in codebase; live endpoint status not checked here.',
        value: 'Expected by code: /api/admin-bot/webhook',
        state: 'expected',
        editability: 'read_only',
        source: 'code',
        risk: 'medium',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
    ],
  });

  const securityAndCompliance = settingSection({
    id: 'security-compliance',
    title: 'Security / Compliance',
    description: 'Security posture and compliance readiness indicators for admin operations.',
    cards: [
      settingCard({
        id: 'service-role-key-status',
        name: 'Service Role Key',
        description: 'Server-only Supabase key used for admin-safe operations.',
        value: serviceRoleConfigured ? 'Configured (hidden)' : 'Missing',
        state: serviceRoleConfigured ? 'configured' : 'missing',
        editability: 'read_only',
        source: 'env',
        risk: 'critical',
        lastUpdatedAt: generatedAt,
        sensitive: true,
        sensitiveNote: 'Service role key is intentionally hidden and never exposed to browser.',
      }),
      settingCard({
        id: 'rls-readiness',
        name: 'RLS Readiness',
        description: 'Project documentation indicates RLS-enabled tables with service-role bypass only server-side.',
        value: 'Expected by docs (see docs/rls-notes.md)',
        state: 'expected',
        editability: 'read_only',
        source: 'docs',
        risk: 'high',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'audit-log-status',
        name: 'Audit Log Coverage',
        description: 'Audit panel exists, but persistent admin action trail is not fully wired.',
        value: 'Partial / placeholder-based',
        state: 'not_available',
        editability: 'read_only',
        source: 'code',
        risk: 'critical',
        lastUpdatedAt: null,
        sensitive: false,
        backendRequirement:
          'Persist admin action events with actor, action, target, before/after payload, and timestamp.',
      }),
      settingCard({
        id: 'account-deletion-flow-status',
        name: 'Account Deletion Flow',
        description: 'Server-side account deletion workflow is implemented for admin review actions.',
        value:
          pendingDeletionCount == null
            ? 'Configured (queue count unavailable)'
            : `Configured (${pendingDeletionCount} pending request(s))`,
        state: pendingDeletionCount == null ? 'expected' : 'configured',
        editability: 'read_only',
        source: 'code',
        risk: 'critical',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'admin-action-audit-trail',
        name: 'Settings Change Audit Trail',
        description: 'No dedicated settings-change audit trail was detected.',
        value: 'Not configured',
        state: 'missing',
        editability: 'read_only',
        source: 'unknown',
        risk: 'critical',
        lastUpdatedAt: null,
        sensitive: false,
        backendRequirement:
          'Add immutable audit logging for every settings mutation before enabling edit controls.',
      }),
    ],
  });

  const systemReadiness = settingSection({
    id: 'system-readiness',
    title: 'System Readiness',
    description: 'Environment variable presence and domain/routing readiness checks.',
    cards: [
      settingCard({
        id: 'env-next-public-app-name',
        name: 'NEXT_PUBLIC_APP_NAME',
        description: 'Public branding variable.',
        value: publicAppName || 'Missing',
        state: envState('NEXT_PUBLIC_APP_NAME'),
        editability: 'read_only',
        source: 'env',
        risk: 'low',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'env-next-public-app-url',
        name: 'NEXT_PUBLIC_APP_URL',
        description: 'Public base URL for frontend/runtime callbacks.',
        value: summarizePublicUrl(publicAppUrl),
        state: envState('NEXT_PUBLIC_APP_URL'),
        editability: 'read_only',
        source: 'env',
        risk: 'medium',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'env-next-public-supabase-url',
        name: 'NEXT_PUBLIC_SUPABASE_URL',
        description: 'Supabase project URL (displayed as masked host only).',
        value: summarizeSupabaseUrl(publicSupabaseUrl),
        state: envState('NEXT_PUBLIC_SUPABASE_URL'),
        editability: 'read_only',
        source: 'env',
        risk: 'high',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'env-next-public-supabase-anon-key',
        name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        description: 'Public anon key used by browser clients (masked preview only).',
        value: maskToken(publicSupabaseAnonKey),
        state: envState('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
        editability: 'read_only',
        source: 'env',
        risk: 'high',
        lastUpdatedAt: generatedAt,
        sensitive: true,
        sensitiveNote: 'Key is partially masked.',
      }),
      settingCard({
        id: 'env-service-role',
        name: 'SUPABASE_SERVICE_ROLE_KEY',
        description: 'Server-only secret key status.',
        value: serviceRoleConfigured ? 'Configured' : 'Missing',
        state: serviceRoleConfigured ? 'configured' : 'missing',
        editability: 'read_only',
        source: 'env',
        risk: 'critical',
        lastUpdatedAt: generatedAt,
        sensitive: true,
        sensitiveNote: 'Never displayed in UI.',
      }),
      settingCard({
        id: 'env-admin-bot-token',
        name: 'ADMIN_BOT_TOKEN',
        description: 'Telegram bot token status.',
        value: adminBotTokenConfigured ? 'Configured' : 'Missing',
        state: adminBotTokenConfigured ? 'configured' : 'missing',
        editability: 'read_only',
        source: 'env',
        risk: 'critical',
        lastUpdatedAt: generatedAt,
        sensitive: true,
        sensitiveNote: 'Never displayed in UI.',
      }),
      settingCard({
        id: 'env-admin-bot-webhook-secret',
        name: 'ADMIN_BOT_WEBHOOK_SECRET',
        description: 'Webhook secret header validation status.',
        value: adminBotWebhookSecretConfigured ? 'Configured' : 'Missing/Optional',
        state: adminBotWebhookSecretConfigured ? 'configured' : 'missing',
        editability: 'read_only',
        source: 'env',
        risk: 'high',
        lastUpdatedAt: generatedAt,
        sensitive: true,
        sensitiveNote: 'Never displayed in UI.',
      }),
      settingCard({
        id: 'env-admin-chat-id',
        name: 'ADMIN_CHAT_ID',
        description: 'Primary admin chat target status.',
        value: adminChat1Configured ? 'Configured' : 'Missing',
        state: adminChat1Configured ? 'configured' : 'missing',
        editability: 'read_only',
        source: 'env',
        risk: 'high',
        lastUpdatedAt: generatedAt,
        sensitive: true,
        sensitiveNote: 'Never displayed in UI.',
      }),
      settingCard({
        id: 'env-admin-chat-id-2',
        name: 'ADMIN_CHAT_ID_2',
        description: 'Secondary admin chat target status.',
        value: adminChat2Configured ? 'Configured' : 'Missing/Optional',
        state: adminChat2Configured ? 'configured' : 'missing',
        editability: 'read_only',
        source: 'env',
        risk: 'medium',
        lastUpdatedAt: generatedAt,
        sensitive: true,
        sensitiveNote: 'Never displayed in UI.',
      }),
      settingCard({
        id: 'domain-split-readiness',
        name: 'Domain Split Readiness',
        description: 'Public/admin domain split inferred from routing config.',
        value: domainSplitLooksConfigured
          ? 'Expected by config: public domain/public routes, admin domain/admin routes'
          : 'Unknown / verify runtime configuration',
        state: domainSplitLooksConfigured ? 'expected' : 'unknown',
        editability: 'read_only',
        source: 'docs',
        risk: 'critical',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
      settingCard({
        id: 'build-command-reference',
        name: 'Build/Deploy Commands',
        description: 'Reference commands from package scripts and deployment docs.',
        value: 'Local: npm run dev | Build: npm run build:cf | Deploy: npm run deploy:cf',
        state: 'expected',
        editability: 'read_only',
        source: 'code',
        risk: 'low',
        lastUpdatedAt: generatedAt,
        sensitive: false,
      }),
    ],
  });

  const sections: AdminSettingSection[] = [
    generalPlatform,
    adminAccess,
    marketplaceControls,
    promotionsAndMaxcoin,
    notificationsAndAlerts,
    securityAndCompliance,
    systemReadiness,
  ];

  const readOnlyCount = sections.reduce((total, section) => total + section.cards.length, 0);

  const warnings: string[] = [
    'Settings backend for safe admin mutations is not configured. All settings controls remain read-only.',
    'Audit logging is partial: admin audit panel currently relies on placeholder data and lacks persistent action trail coverage.',
    'Dangerous production setting edits are intentionally disabled until an audited server-side settings flow exists.',
    'Secret status checks are based on current runtime only; cross-environment values (staging/production) must be verified in platform dashboards.',
    'Production configuration must be managed via Cloudflare and Supabase dashboards, not from this UI.',
    'Live DNS/routing verification is not executed here; domain routing statuses are expected by code/docs configuration.',
  ];

  if (!serviceRoleConfigured) {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY is missing in current runtime. Admin-safe data operations may fail.');
  }

  if (!adminBotTokenConfigured || !anyAdminChatConfigured) {
    warnings.push('Admin alert routing is incomplete: Telegram bot token/chat IDs are partially missing.');
  }

  const missingBackendRequirements: string[] = [
    'A dedicated admin-safe settings persistence layer with allowlisted fields and server-side validation.',
    'Server actions or RPC endpoints for global settings updates (marketplace defaults, notification policies, promotion policy), with transactional safety.',
    'Immutable audit logging for every settings mutation (actor, timestamp, before/after values, reason).',
    'High-risk change confirmation workflow with rollback strategy before enabling editable controls.',
  ];

  const limitations: string[] = [
    'No existing global settings table/RPC/action was found for safe settings mutations in this project snapshot.',
    'Secret values are intentionally hidden; only configured/missing state is shown.',
    'Domain and redirect checks are configuration-based expectations, not live network probes.',
    'Notification outbox status depends on notification_log table availability and permissions in this environment.',
  ];

  const readiness: AdminSettingsReadinessCard[] = [
    {
      id: 'readiness-domain',
      title: 'Admin Domain Configured',
      value: domainSplitLooksConfigured ? 'Expected by config' : 'Unknown',
      state: domainSplitLooksConfigured ? 'expected' : 'unknown',
      note: 'Configured admin domain should serve admin and redirect non-admin paths to /admin.',
    },
    {
      id: 'readiness-supabase',
      title: 'Supabase Connectivity',
      value: loadErrors.some((item) => item.includes('profiles')) ? 'Partial/Unknown' : 'Available',
      state: loadErrors.some((item) => item.includes('profiles')) ? 'unknown' : 'configured',
      note: 'Based on current admin snapshot queries.',
    },
    {
      id: 'readiness-audit',
      title: 'Audit Logging Status',
      value: 'Partial',
      state: 'not_available',
      note: 'Audit panel exists but persistent admin action events are incomplete.',
    },
    {
      id: 'readiness-account-delete',
      title: 'Account Deletion Flow',
      value: pendingDeletionCount == null ? 'Configured (count unknown)' : 'Configured',
      state: pendingDeletionCount == null ? 'expected' : 'configured',
      note:
        pendingDeletionCount == null
          ? 'Server-side flow exists; queue count could not be fetched.'
          : `${pendingDeletionCount} pending request(s).`,
    },
    {
      id: 'readiness-alerts',
      title: 'Notification Alerts',
      value:
        adminBotTokenConfigured && anyAdminChatConfigured
          ? 'Configured'
          : 'Partial/Not Configured',
      state:
        adminBotTokenConfigured && anyAdminChatConfigured ? 'configured' : 'missing',
      note: 'Token/chat IDs status only; values are hidden.',
    },
    {
      id: 'readiness-settings-backend',
      title: 'Settings Backend Status',
      value: 'Partial backend detected (read-only)',
      state: 'expected',
      note: 'Data sources exist, but no safe global settings mutation flow was found.',
    },
  ];

  return {
    generatedAt,
    lastUpdatedAt: generatedAt,
    mode: 'read_only',
    backendCoverage: 'partial',
    editableCount,
    readOnlyCount,
    sections,
    readiness,
    warnings,
    missingBackendRequirements,
    limitations,
    loadErrors,
  };
}
