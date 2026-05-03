'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { notifySystemError } from '@/lib/telegram/admin-bot';
import { assertAdminAccess } from '@/features/admin/guard';
import type { UserRole } from '@/types';

export type AccountDeletionRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type AccountDeletionRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AccountDeletionRiskSeverity = 'info' | 'warning' | 'danger';

interface RequestUserJoin {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  deletion_requested_at?: string | null;
}

interface RequestAgencyJoin {
  id?: string | null;
  name?: string | null;
  owner_id?: string | null;
  is_verified?: boolean | null;
  is_approved?: boolean | null;
  maxcoin_balance?: number | string | null;
  deletion_requested_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface AdminProfileLookupRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  deletion_requested_at: string | null;
}

interface BaseDeletionRow {
  requestId: string | null;
  userId: string;
  requestStatus: AccountDeletionRequestStatus | null;
  reason: string | null;
  requestedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  adminNotes: string | null;
  userFullName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  userRole: UserRole;
  userCreatedAt: string | null;
  userUpdatedAt: string | null;
  userDeletionRequestedAt: string | null;
  requestAgencyId: string | null;
  requestAgencyName: string | null;
}

interface AgencySnapshot {
  id: string;
  ownerId: string | null;
  name: string | null;
  isVerified: boolean;
  isApproved: boolean;
  maxcoinBalance: number;
  deletionRequestedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface AgencyImpact {
  totalTours: number;
  activeTours: number;
  totalLeads: number;
  pendingLeads: number;
  activePromotions: number;
  activeFeaturedPromotions: number | null;
  maxcoinBalance: number;
  maxcoinLedgerEntries: number;
  unresolvedVerificationCount: number;
  latestTourAt: string | null;
  latestLeadAt: string | null;
  latestPromotionAt: string | null;
  latestFeaturedPromotionAt: string | null;
  latestMaxcoinTxAt: string | null;
  latestVerificationAt: string | null;
}

interface UserImpact {
  leads: number;
  favorites: number;
  reviews: number;
  latestLeadAt: string | null;
  latestFavoriteAt: string | null;
  latestReviewAt: string | null;
}

export interface AccountDeletionRiskFlag {
  key: string;
  label: string;
  severity: AccountDeletionRiskSeverity;
  detail: string;
}

export interface AccountDeletionPanelItem {
  requestId: string | null;
  requestStatus: AccountDeletionRequestStatus | null;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reason: string | null;
  adminNotes: string | null;
  user: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    role: UserRole;
    createdAt: string | null;
    updatedAt: string | null;
    deletionRequestedAt: string | null;
  };
  agency: {
    id: string | null;
    name: string | null;
    isVerified: boolean | null;
    isApproved: boolean | null;
    linkedCount: number;
  };
  impact: {
    totalTours: number;
    activeTours: number;
    totalLeads: number;
    pendingLeads: number;
    userLeads: number;
    favorites: number;
    reviews: number;
    activePromotions: number;
    activeFeaturedPromotions: number | null;
    maxcoinBalance: number;
    maxcoinLedgerEntries: number;
    unresolvedVerificationCount: number;
    bookingsOrdersCount: number | null;
    latestActivityAt: string | null;
    linkedDataCount: number;
  };
  risk: {
    score: number;
    level: AccountDeletionRiskLevel;
    isHighRisk: boolean;
    flags: AccountDeletionRiskFlag[];
  };
  capabilities: {
    canRejectRequest: boolean;
    canProcessDeletion: boolean;
    processBlockedReason: string;
  };
}

export interface AccountDeletionPanelPayload {
  generatedAt: string;
  currentAdminId: string;
  requestsAvailable: boolean;
  deletionEnabled: boolean;
  deletionFlowName: string | null;
  deletionDisabledReason: string;
  missingBackendRequirements: string[];
  health: {
    partialData: boolean;
    errors: string[];
  };
  items: AccountDeletionPanelItem[];
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizeRole(role: string | null | undefined): UserRole {
  if (role === 'admin' || role === 'agency_manager' || role === 'user') {
    return role;
  }
  return 'user';
}

function normalizeStatus(status: string | null | undefined): AccountDeletionRequestStatus | null {
  if (status === 'pending' || status === 'approved' || status === 'rejected' || status === 'cancelled') {
    return status;
  }
  return null;
}

function latestIso(values: Array<string | null | undefined>): string | null {
  let latest: string | null = null;
  let latestMs = Number.NEGATIVE_INFINITY;

  for (const value of values) {
    if (!value) continue;
    const ms = new Date(value).getTime();
    if (!Number.isFinite(ms)) continue;
    if (ms > latestMs) {
      latestMs = ms;
      latest = value;
    }
  }

  return latest;
}

function withinLastDays(value: string | null, days: number): boolean {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return false;
  const now = Date.now();
  const diffMs = now - timestamp;
  const maxMs = days * 24 * 60 * 60 * 1000;
  return diffMs >= 0 && diffMs <= maxMs;
}

function makeEmptyAgencyImpact(): AgencyImpact {
  return {
    totalTours: 0,
    activeTours: 0,
    totalLeads: 0,
    pendingLeads: 0,
    activePromotions: 0,
    activeFeaturedPromotions: null,
    maxcoinBalance: 0,
    maxcoinLedgerEntries: 0,
    unresolvedVerificationCount: 0,
    latestTourAt: null,
    latestLeadAt: null,
    latestPromotionAt: null,
    latestFeaturedPromotionAt: null,
    latestMaxcoinTxAt: null,
    latestVerificationAt: null,
  };
}

function makeEmptyUserImpact(): UserImpact {
  return {
    leads: 0,
    favorites: 0,
    reviews: 0,
    latestLeadAt: null,
    latestFavoriteAt: null,
    latestReviewAt: null,
  };
}

function computeRisk(input: {
  userRole: UserRole;
  userId: string;
  currentAdminId: string;
  agencyCount: number;
  impact: AccountDeletionPanelItem['impact'];
}): {
  score: number;
  level: AccountDeletionRiskLevel;
  isHighRisk: boolean;
  flags: AccountDeletionRiskFlag[];
} {
  const flags: AccountDeletionRiskFlag[] = [];
  let score = 0;

  if (input.userRole === 'admin') {
    score += 8;
    flags.push({
      key: 'target_admin',
      label: 'Target is admin',
      severity: 'danger',
      detail: 'Deletion of admin profiles must remain blocked until explicit backend guard exists.',
    });
  }

  if (input.userId === input.currentAdminId) {
    score += 10;
    flags.push({
      key: 'self_delete',
      label: 'Self-delete target',
      severity: 'danger',
      detail: 'Current signed-in admin matches request target. Self-delete must never be processed from this panel.',
    });
  }

  if (input.userRole === 'agency_manager') {
    score += 4;
    flags.push({
      key: 'agency_manager',
      label: 'Agency manager account',
      severity: 'warning',
      detail: 'Agency-linked account can impact tours, leads, promotions, and verification data.',
    });
  }

  if (input.agencyCount > 0) {
    score += 2;
    flags.push({
      key: 'owns_agency',
      label: 'Owns linked agency',
      severity: 'warning',
      detail: 'Target user has one or more linked agencies.',
    });
  }

  if (input.impact.activeTours > 0) {
    score += 4;
    flags.push({
      key: 'active_tours',
      label: 'Agency has active tours',
      severity: 'danger',
      detail: `${input.impact.activeTours} active tour(s) currently linked to this account.`,
    });
  }

  if (input.impact.activePromotions > 0) {
    score += 3;
    flags.push({
      key: 'active_promotions',
      label: 'Agency has active promotions',
      severity: 'warning',
      detail: `${input.impact.activePromotions} active promotion(s) found.`,
    });
  }

  if ((input.impact.activeFeaturedPromotions ?? 0) > 0) {
    score += 2;
    flags.push({
      key: 'active_featured_promotions',
      label: 'Agency has active featured promotions',
      severity: 'warning',
      detail: `${input.impact.activeFeaturedPromotions} active featured placement(s) found.`,
    });
  }

  if (input.impact.pendingLeads > 0) {
    score += 3;
    flags.push({
      key: 'pending_leads',
      label: 'Pending leads detected',
      severity: 'warning',
      detail: `${input.impact.pendingLeads} lead(s) still in new/contacted state.`,
    });
  }

  if (input.impact.maxcoinBalance > 0) {
    score += 2;
    flags.push({
      key: 'maxcoin_balance',
      label: 'MaxCoin balance remains',
      severity: 'warning',
      detail: `Linked agency balance is ${input.impact.maxcoinBalance}.`,
    });
  }

  if (input.impact.userLeads > 0) {
    score += 1;
    flags.push({
      key: 'user_leads',
      label: 'User has lead history',
      severity: 'info',
      detail: `${input.impact.userLeads} user-associated lead(s) found.`,
    });
  }

  if (input.impact.unresolvedVerificationCount > 0) {
    score += 2;
    flags.push({
      key: 'unresolved_verification',
      label: 'Unresolved verification',
      severity: 'warning',
      detail: `${input.impact.unresolvedVerificationCount} pending verification request(s) still open.`,
    });
  }

  if (withinLastDays(input.impact.latestActivityAt, 30)) {
    score += 1;
    flags.push({
      key: 'recent_activity',
      label: 'Recent activity',
      severity: 'info',
      detail: 'Latest linked activity occurred within the last 30 days.',
    });
  }

  if (input.impact.linkedDataCount > 0) {
    score += 1;
    flags.push({
      key: 'orphan_risk',
      label: 'Potential orphan risk',
      severity: 'warning',
      detail: 'Linked records exist and require explicit backend cascade guarantees.',
    });
  }

  const hasCriticalFlag =
    flags.some((flag) => flag.key === 'target_admin' || flag.key === 'self_delete');
  const dangerCount = flags.filter((flag) => flag.severity === 'danger').length;

  let level: AccountDeletionRiskLevel = 'low';
  if (hasCriticalFlag) {
    level = 'critical';
  } else if (score >= 9 || dangerCount >= 2) {
    level = 'high';
  } else if (score >= 4) {
    level = 'medium';
  }

  return {
    score,
    level,
    isHighRisk: level === 'high' || level === 'critical',
    flags,
  };
}

function buildDisabledDeletionReason(): string {
  return 'Deletion backend flow is intentionally disabled in this web admin panel until a vetted, admin-safe server flow is wired for explicit risk controls.';
}

function backendRequirements(): string[] {
  return [
    'Expose a dedicated admin-safe deletion processor (Edge Function or server endpoint) for web admin usage with verified admin JWT checks.',
    'Enforce backend hard guards that block deleting admin targets and prevent current-admin self-delete.',
    'Provide deterministic impact-preview contract (counts + affected entities) before irreversible processing.',
    'Guarantee auditable reviewer identity (`reviewed_by`) and idempotent request locking for double-submit protection.',
    'Define partial-failure recovery/compensation behavior for storage and relational cleanup operations.',
  ];
}

export async function getAccountDeletionPanelData(): Promise<AccountDeletionPanelPayload> {
  const { userId: currentAdminId } = await assertAdminAccess();
  const admin = await createAdminClient();
  const generatedAt = new Date().toISOString();
  const errors: string[] = [];

  const payloadBase: Omit<AccountDeletionPanelPayload, 'health' | 'items' | 'requestsAvailable'> = {
    generatedAt,
    currentAdminId,
    deletionEnabled: false,
    deletionFlowName: null,
    deletionDisabledReason: buildDisabledDeletionReason(),
    missingBackendRequirements: backendRequirements(),
  };

  let requestsAvailable = true;

  const requestResponse = await admin
    .from('account_deletion_requests')
    .select(`
      id,
      user_id,
      agency_id,
      reason,
      status,
      requested_at,
      reviewed_by,
      reviewed_at,
      admin_notes,
      user:profiles!account_deletion_requests_user_id_fkey(
        full_name,
        email,
        phone,
        role,
        created_at,
        updated_at,
        deletion_requested_at
      ),
      agency:agencies(
        id,
        name,
        owner_id,
        is_verified,
        is_approved,
        maxcoin_balance,
        deletion_requested_at,
        created_at,
        updated_at
      )
    `)
    .order('requested_at', { ascending: false });

  const sourceRows: BaseDeletionRow[] = [];

  if (requestResponse.error) {
    requestsAvailable = false;
    errors.push(`account_deletion_requests unavailable: ${requestResponse.error.message}`);

    const fallbackUsers = await admin
      .from('profiles')
      .select('id, full_name, email, phone, role, created_at, updated_at, deletion_requested_at')
      .order('created_at', { ascending: false })
      .limit(300);

    if (fallbackUsers.error) {
      errors.push(`profiles fallback failed: ${fallbackUsers.error.message}`);
    } else {
      const profiles = (fallbackUsers.data ?? []) as AdminProfileLookupRow[];
      for (const profile of profiles) {
        sourceRows.push({
          requestId: null,
          userId: profile.id,
          requestStatus: null,
          reason: null,
          requestedAt: profile.deletion_requested_at ?? profile.created_at,
          reviewedBy: null,
          reviewedAt: null,
          adminNotes: null,
          userFullName: profile.full_name,
          userEmail: profile.email,
          userPhone: profile.phone,
          userRole: normalizeRole(profile.role),
          userCreatedAt: profile.created_at,
          userUpdatedAt: profile.updated_at,
          userDeletionRequestedAt: profile.deletion_requested_at,
          requestAgencyId: null,
          requestAgencyName: null,
        });
      }
    }
  } else {
    for (const row of requestResponse.data ?? []) {
      const raw = row as Record<string, unknown>;
      const rawUserValue = raw.user as RequestUserJoin | RequestUserJoin[] | null | undefined;
      const rawAgencyValue = raw.agency as RequestAgencyJoin | RequestAgencyJoin[] | null | undefined;
      const user = Array.isArray(rawUserValue) ? (rawUserValue[0] ?? null) : (rawUserValue ?? null);
      const agency = Array.isArray(rawAgencyValue)
        ? (rawAgencyValue[0] ?? null)
        : (rawAgencyValue ?? null);

      const userId = String(raw.user_id ?? '');
      if (!userId) continue;

      sourceRows.push({
        requestId: String(raw.id ?? ''),
        userId,
        requestStatus: normalizeStatus((raw.status as string | null | undefined) ?? null),
        reason: (raw.reason as string | null) ?? null,
        requestedAt: String(raw.requested_at ?? ''),
        reviewedBy: (raw.reviewed_by as string | null) ?? null,
        reviewedAt: (raw.reviewed_at as string | null) ?? null,
        adminNotes: (raw.admin_notes as string | null) ?? null,
        userFullName: user?.full_name ?? null,
        userEmail: user?.email ?? null,
        userPhone: user?.phone ?? null,
        userRole: normalizeRole(user?.role ?? null),
        userCreatedAt: user?.created_at ?? null,
        userUpdatedAt: user?.updated_at ?? null,
        userDeletionRequestedAt: user?.deletion_requested_at ?? null,
        requestAgencyId: (raw.agency_id as string | null) ?? (agency?.id ?? null),
        requestAgencyName: agency?.name ?? null,
      });
    }
  }

  if (sourceRows.length === 0) {
    return {
      ...payloadBase,
      requestsAvailable,
      health: {
        partialData: errors.length > 0,
        errors,
      },
      items: [],
    };
  }

  const userIds = Array.from(new Set(sourceRows.map((row) => row.userId)));
  const requestAgencyIds = Array.from(
    new Set(
      sourceRows
        .map((row) => row.requestAgencyId)
        .filter((value): value is string => Boolean(value))
    )
  );

  const agenciesById = new Map<string, AgencySnapshot>();
  const agenciesByOwnerId = new Map<string, AgencySnapshot[]>();

  async function appendAgenciesByQuery(queryType: 'owner' | 'id', ids: string[]) {
    if (ids.length === 0) return;
    const response = queryType === 'owner'
      ? await admin
        .from('agencies')
        .select('id, owner_id, name, is_verified, is_approved, maxcoin_balance, deletion_requested_at, created_at, updated_at')
        .in('owner_id', ids)
      : await admin
        .from('agencies')
        .select('id, owner_id, name, is_verified, is_approved, maxcoin_balance, deletion_requested_at, created_at, updated_at')
        .in('id', ids);

    if (response.error) {
      errors.push(`agencies.${queryType} query failed: ${response.error.message}`);
      return;
    }

    for (const row of response.data ?? []) {
      const raw = row as Record<string, unknown>;
      const snapshot: AgencySnapshot = {
        id: String(raw.id),
        ownerId: (raw.owner_id as string | null) ?? null,
        name: (raw.name as string | null) ?? null,
        isVerified: raw.is_verified === true,
        isApproved: raw.is_approved === true,
        maxcoinBalance: toNumber(raw.maxcoin_balance as number | string | null | undefined),
        deletionRequestedAt: (raw.deletion_requested_at as string | null) ?? null,
        createdAt: (raw.created_at as string | null) ?? null,
        updatedAt: (raw.updated_at as string | null) ?? null,
      };
      agenciesById.set(snapshot.id, snapshot);
    }
  }

  await appendAgenciesByQuery('owner', userIds);
  await appendAgenciesByQuery('id', requestAgencyIds);

  for (const agency of agenciesById.values()) {
    if (!agency.ownerId) continue;
    const list = agenciesByOwnerId.get(agency.ownerId) ?? [];
    list.push(agency);
    agenciesByOwnerId.set(agency.ownerId, list);
  }

  const relevantAgencyIds = Array.from(
    new Set(
      sourceRows
        .flatMap((row) => {
          const direct = row.requestAgencyId ? [row.requestAgencyId] : [];
          const ownerLinked = agenciesByOwnerId.get(row.userId)?.map((agency) => agency.id) ?? [];
          return [...direct, ...ownerLinked];
        })
        .filter((value): value is string => Boolean(value))
    )
  );

  const agencyImpactById = new Map<string, AgencyImpact>();
  for (const agencyId of relevantAgencyIds) {
    const baseImpact = makeEmptyAgencyImpact();
    baseImpact.maxcoinBalance = agenciesById.get(agencyId)?.maxcoinBalance ?? 0;
    agencyImpactById.set(agencyId, baseImpact);
  }

  const userImpactById = new Map<string, UserImpact>();
  for (const userId of userIds) {
    userImpactById.set(userId, makeEmptyUserImpact());
  }

  const nowIso = new Date().toISOString();

  if (relevantAgencyIds.length > 0) {
    const [toursResult, leadsByAgencyResult, promotionsResult, maxcoinResult, verificationResult, featuredResult] =
      await Promise.all([
        admin
          .from('tours')
          .select('id, agency_id, status, created_at, updated_at')
          .in('agency_id', relevantAgencyIds),
        admin
          .from('leads')
          .select('id, agency_id, status, created_at')
          .in('agency_id', relevantAgencyIds),
        admin
          .from('tour_promotions')
          .select('id, agency_id, is_active, ends_at, created_at')
          .in('agency_id', relevantAgencyIds),
        admin
          .from('maxcoin_transactions')
          .select('id, agency_id, created_at')
          .in('agency_id', relevantAgencyIds),
        admin
          .from('verification_requests')
          .select('id, agency_id, status, created_at, updated_at')
          .in('agency_id', relevantAgencyIds),
        admin
          .from('featured_items')
          .select('id, agency_id, starts_at, ends_at, created_at')
          .in('agency_id', relevantAgencyIds),
      ]);

    if (toursResult.error) {
      errors.push(`tours impact query failed: ${toursResult.error.message}`);
    } else {
      for (const row of toursResult.data ?? []) {
        const raw = row as Record<string, unknown>;
        const agencyId = String(raw.agency_id ?? '');
        if (!agencyId) continue;
        const impact = agencyImpactById.get(agencyId) ?? makeEmptyAgencyImpact();
        impact.totalTours += 1;
        const status = String(raw.status ?? '');
        if (status === 'pending' || status === 'published') {
          impact.activeTours += 1;
        }
        impact.latestTourAt = latestIso([
          impact.latestTourAt,
          (raw.updated_at as string | null) ?? null,
          (raw.created_at as string | null) ?? null,
        ]);
        agencyImpactById.set(agencyId, impact);
      }
    }

    if (leadsByAgencyResult.error) {
      errors.push(`leads (agency) impact query failed: ${leadsByAgencyResult.error.message}`);
    } else {
      for (const row of leadsByAgencyResult.data ?? []) {
        const raw = row as Record<string, unknown>;
        const agencyId = String(raw.agency_id ?? '');
        if (!agencyId) continue;
        const impact = agencyImpactById.get(agencyId) ?? makeEmptyAgencyImpact();
        impact.totalLeads += 1;
        const status = String(raw.status ?? '');
        if (status === 'new' || status === 'contacted') {
          impact.pendingLeads += 1;
        }
        impact.latestLeadAt = latestIso([
          impact.latestLeadAt,
          (raw.created_at as string | null) ?? null,
        ]);
        agencyImpactById.set(agencyId, impact);
      }
    }

    if (promotionsResult.error) {
      errors.push(`tour_promotions impact query failed: ${promotionsResult.error.message}`);
    } else {
      for (const row of promotionsResult.data ?? []) {
        const raw = row as Record<string, unknown>;
        const agencyId = String(raw.agency_id ?? '');
        if (!agencyId) continue;
        const impact = agencyImpactById.get(agencyId) ?? makeEmptyAgencyImpact();
        const isActive = raw.is_active === true;
        const endsAt = (raw.ends_at as string | null) ?? null;
        const activeNow = isActive && (!endsAt || endsAt >= nowIso);
        if (activeNow) {
          impact.activePromotions += 1;
        }
        impact.latestPromotionAt = latestIso([
          impact.latestPromotionAt,
          (raw.created_at as string | null) ?? null,
        ]);
        agencyImpactById.set(agencyId, impact);
      }
    }

    if (maxcoinResult.error) {
      errors.push(`maxcoin_transactions impact query failed: ${maxcoinResult.error.message}`);
    } else {
      for (const row of maxcoinResult.data ?? []) {
        const raw = row as Record<string, unknown>;
        const agencyId = String(raw.agency_id ?? '');
        if (!agencyId) continue;
        const impact = agencyImpactById.get(agencyId) ?? makeEmptyAgencyImpact();
        impact.maxcoinLedgerEntries += 1;
        impact.latestMaxcoinTxAt = latestIso([
          impact.latestMaxcoinTxAt,
          (raw.created_at as string | null) ?? null,
        ]);
        agencyImpactById.set(agencyId, impact);
      }
    }

    if (verificationResult.error) {
      errors.push(`verification_requests impact query failed: ${verificationResult.error.message}`);
    } else {
      for (const row of verificationResult.data ?? []) {
        const raw = row as Record<string, unknown>;
        const agencyId = String(raw.agency_id ?? '');
        if (!agencyId) continue;
        const impact = agencyImpactById.get(agencyId) ?? makeEmptyAgencyImpact();
        const status = String(raw.status ?? '');
        if (status === 'pending') {
          impact.unresolvedVerificationCount += 1;
        }
        impact.latestVerificationAt = latestIso([
          impact.latestVerificationAt,
          (raw.updated_at as string | null) ?? null,
          (raw.created_at as string | null) ?? null,
        ]);
        agencyImpactById.set(agencyId, impact);
      }
    }

    if (featuredResult.error) {
      const code = (featuredResult.error as { code?: string }).code;
      if (code === '42P01' || code === 'PGRST205') {
        for (const agencyId of relevantAgencyIds) {
          const impact = agencyImpactById.get(agencyId) ?? makeEmptyAgencyImpact();
          impact.activeFeaturedPromotions = null;
          agencyImpactById.set(agencyId, impact);
        }
      } else {
        errors.push(`featured_items impact query failed: ${featuredResult.error.message}`);
      }
    } else {
      for (const agencyId of relevantAgencyIds) {
        const impact = agencyImpactById.get(agencyId) ?? makeEmptyAgencyImpact();
        if (impact.activeFeaturedPromotions == null) {
          impact.activeFeaturedPromotions = 0;
          agencyImpactById.set(agencyId, impact);
        }
      }

      for (const row of featuredResult.data ?? []) {
        const raw = row as Record<string, unknown>;
        const agencyId = String(raw.agency_id ?? '');
        if (!agencyId) continue;
        const impact = agencyImpactById.get(agencyId) ?? makeEmptyAgencyImpact();
        if (impact.activeFeaturedPromotions == null) {
          impact.activeFeaturedPromotions = 0;
        }
        const endsAt = (raw.ends_at as string | null) ?? null;
        const startsAt = (raw.starts_at as string | null) ?? null;
        const isActiveNow = (!startsAt || startsAt <= nowIso) && (!endsAt || endsAt >= nowIso);
        if (isActiveNow) {
          impact.activeFeaturedPromotions += 1;
        }
        impact.latestFeaturedPromotionAt = latestIso([
          impact.latestFeaturedPromotionAt,
          (raw.created_at as string | null) ?? null,
          startsAt,
          endsAt,
        ]);
        agencyImpactById.set(agencyId, impact);
      }
    }
  }

  if (userIds.length > 0) {
    const [userLeadsResult, favoritesResult, reviewsResult] = await Promise.all([
      admin
        .from('leads')
        .select('id, user_id, created_at')
        .in('user_id', userIds),
      admin
        .from('favorites')
        .select('id, user_id, created_at')
        .in('user_id', userIds),
      admin
        .from('reviews')
        .select('id, user_id, created_at')
        .in('user_id', userIds),
    ]);

    if (userLeadsResult.error) {
      errors.push(`leads (user) impact query failed: ${userLeadsResult.error.message}`);
    } else {
      for (const row of userLeadsResult.data ?? []) {
        const raw = row as Record<string, unknown>;
        const userId = String(raw.user_id ?? '');
        if (!userId) continue;
        const impact = userImpactById.get(userId) ?? makeEmptyUserImpact();
        impact.leads += 1;
        impact.latestLeadAt = latestIso([impact.latestLeadAt, (raw.created_at as string | null) ?? null]);
        userImpactById.set(userId, impact);
      }
    }

    if (favoritesResult.error) {
      errors.push(`favorites impact query failed: ${favoritesResult.error.message}`);
    } else {
      for (const row of favoritesResult.data ?? []) {
        const raw = row as Record<string, unknown>;
        const userId = String(raw.user_id ?? '');
        if (!userId) continue;
        const impact = userImpactById.get(userId) ?? makeEmptyUserImpact();
        impact.favorites += 1;
        impact.latestFavoriteAt = latestIso([
          impact.latestFavoriteAt,
          (raw.created_at as string | null) ?? null,
        ]);
        userImpactById.set(userId, impact);
      }
    }

    if (reviewsResult.error) {
      errors.push(`reviews impact query failed: ${reviewsResult.error.message}`);
    } else {
      for (const row of reviewsResult.data ?? []) {
        const raw = row as Record<string, unknown>;
        const userId = String(raw.user_id ?? '');
        if (!userId) continue;
        const impact = userImpactById.get(userId) ?? makeEmptyUserImpact();
        impact.reviews += 1;
        impact.latestReviewAt = latestIso([
          impact.latestReviewAt,
          (raw.created_at as string | null) ?? null,
        ]);
        userImpactById.set(userId, impact);
      }
    }
  }

  const items: AccountDeletionPanelItem[] = sourceRows.map((row) => {
    const ownerAgencies = agenciesByOwnerId.get(row.userId) ?? [];
    const requestedAgency = row.requestAgencyId ? agenciesById.get(row.requestAgencyId) ?? null : null;

    const linkedAgencies = (() => {
      const byId = new Map<string, AgencySnapshot>();
      if (requestedAgency) byId.set(requestedAgency.id, requestedAgency);
      for (const agency of ownerAgencies) byId.set(agency.id, agency);
      return Array.from(byId.values());
    })();

    const primaryAgency = requestedAgency ?? ownerAgencies[0] ?? null;

    const agencyImpact = linkedAgencies.reduce<AgencyImpact>((acc, agency) => {
      const impact = agencyImpactById.get(agency.id) ?? makeEmptyAgencyImpact();
      acc.totalTours += impact.totalTours;
      acc.activeTours += impact.activeTours;
      acc.totalLeads += impact.totalLeads;
      acc.pendingLeads += impact.pendingLeads;
      acc.activePromotions += impact.activePromotions;
      acc.maxcoinBalance += impact.maxcoinBalance;
      acc.maxcoinLedgerEntries += impact.maxcoinLedgerEntries;
      acc.unresolvedVerificationCount += impact.unresolvedVerificationCount;
      acc.latestTourAt = latestIso([acc.latestTourAt, impact.latestTourAt]);
      acc.latestLeadAt = latestIso([acc.latestLeadAt, impact.latestLeadAt]);
      acc.latestPromotionAt = latestIso([acc.latestPromotionAt, impact.latestPromotionAt]);
      acc.latestMaxcoinTxAt = latestIso([acc.latestMaxcoinTxAt, impact.latestMaxcoinTxAt]);
      acc.latestVerificationAt = latestIso([acc.latestVerificationAt, impact.latestVerificationAt]);

      if (acc.activeFeaturedPromotions == null || impact.activeFeaturedPromotions == null) {
        acc.activeFeaturedPromotions = null;
      } else {
        acc.activeFeaturedPromotions += impact.activeFeaturedPromotions;
      }
      acc.latestFeaturedPromotionAt = latestIso([
        acc.latestFeaturedPromotionAt,
        impact.latestFeaturedPromotionAt,
      ]);
      return acc;
    }, {
      ...makeEmptyAgencyImpact(),
      activeFeaturedPromotions: 0,
    });

    if (linkedAgencies.length === 0) {
      agencyImpact.activeFeaturedPromotions = null;
    }

    const userImpact = userImpactById.get(row.userId) ?? makeEmptyUserImpact();

    const latestActivityAt = latestIso([
      row.requestedAt,
      row.userUpdatedAt,
      row.userDeletionRequestedAt,
      agencyImpact.latestTourAt,
      agencyImpact.latestLeadAt,
      agencyImpact.latestPromotionAt,
      agencyImpact.latestFeaturedPromotionAt,
      agencyImpact.latestMaxcoinTxAt,
      agencyImpact.latestVerificationAt,
      userImpact.latestLeadAt,
      userImpact.latestFavoriteAt,
      userImpact.latestReviewAt,
      primaryAgency?.updatedAt ?? null,
      primaryAgency?.deletionRequestedAt ?? null,
    ]);

    const linkedDataCount =
      agencyImpact.totalTours +
      agencyImpact.totalLeads +
      userImpact.leads +
      userImpact.favorites +
      userImpact.reviews +
      agencyImpact.activePromotions +
      (agencyImpact.activeFeaturedPromotions ?? 0) +
      agencyImpact.maxcoinLedgerEntries +
      agencyImpact.unresolvedVerificationCount;

    const impact: AccountDeletionPanelItem['impact'] = {
      totalTours: agencyImpact.totalTours,
      activeTours: agencyImpact.activeTours,
      totalLeads: agencyImpact.totalLeads,
      pendingLeads: agencyImpact.pendingLeads,
      userLeads: userImpact.leads,
      favorites: userImpact.favorites,
      reviews: userImpact.reviews,
      activePromotions: agencyImpact.activePromotions,
      activeFeaturedPromotions: agencyImpact.activeFeaturedPromotions,
      maxcoinBalance: agencyImpact.maxcoinBalance,
      maxcoinLedgerEntries: agencyImpact.maxcoinLedgerEntries,
      unresolvedVerificationCount: agencyImpact.unresolvedVerificationCount,
      bookingsOrdersCount: null,
      latestActivityAt,
      linkedDataCount,
    };

    const risk = computeRisk({
      userRole: row.userRole,
      userId: row.userId,
      currentAdminId,
      agencyCount: linkedAgencies.length,
      impact,
    });

    return {
      requestId: row.requestId,
      requestStatus: row.requestStatus,
      requestedAt: row.requestedAt,
      reviewedAt: row.reviewedAt,
      reviewedBy: row.reviewedBy,
      reason: row.reason,
      adminNotes: row.adminNotes,
      user: {
        id: row.userId,
        fullName: row.userFullName,
        email: row.userEmail,
        phone: row.userPhone,
        role: row.userRole,
        createdAt: row.userCreatedAt,
        updatedAt: row.userUpdatedAt,
        deletionRequestedAt: row.userDeletionRequestedAt,
      },
      agency: {
        id: primaryAgency?.id ?? row.requestAgencyId ?? null,
        name: primaryAgency?.name ?? row.requestAgencyName ?? null,
        isVerified: primaryAgency ? primaryAgency.isVerified : null,
        isApproved: primaryAgency ? primaryAgency.isApproved : null,
        linkedCount: linkedAgencies.length,
      },
      impact,
      risk,
      capabilities: {
        canRejectRequest: Boolean(row.requestId && row.requestStatus === 'pending'),
        canProcessDeletion: false,
        processBlockedReason: buildDisabledDeletionReason(),
      },
    };
  });

  return {
    ...payloadBase,
    requestsAvailable,
    health: {
      partialData: errors.length > 0,
      errors,
    },
    items,
  };
}

export async function approveDeletionRequestAction() {
  await assertAdminAccess();
  return {
    error:
      'Deletion processing is disabled in this admin panel. A vetted backend flow is required before enabling hard-delete operations.',
  };
}

export async function rejectDeletionRequestAction(requestId: string, adminNotes?: string) {
  const { userId: reviewerId } = await assertAdminAccess();
  const admin = await createAdminClient();

  if (!requestId) {
    return { error: 'Request ID is required' };
  }

  const { data: request, error: requestError } = await admin
    .from('account_deletion_requests')
    .select('id, user_id, agency_id, status')
    .eq('id', requestId)
    .maybeSingle();

  if (requestError || !request) {
    return { error: 'Request not found' };
  }

  if (request.status !== 'pending') {
    return { error: `Request is already ${request.status}` };
  }

  const trimmedNotes = adminNotes?.trim();

  const { error: updateError } = await admin
    .from('account_deletion_requests')
    .update({
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      admin_notes: trimmedNotes ? trimmedNotes.slice(0, 2000) : null,
    })
    .eq('id', requestId);

  if (updateError) {
    await notifySystemError({
      source: 'Action: rejectDeletionRequestAction',
      message: updateError.message,
      extra: `Request: ${requestId}`,
    });
    return { error: updateError.message };
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      deletion_requested_at: null,
      deletion_request_id: null,
    })
    .eq('id', request.user_id as string);

  if (profileError) {
    await notifySystemError({
      source: 'Action: rejectDeletionRequestAction (profile reset)',
      message: profileError.message,
      extra: `Request: ${requestId}`,
    });
    return { error: profileError.message };
  }

  if (request.agency_id) {
    const { error: agencyError } = await admin
      .from('agencies')
      .update({ deletion_requested_at: null })
      .eq('id', request.agency_id as string);

    if (agencyError) {
      await notifySystemError({
        source: 'Action: rejectDeletionRequestAction (agency reset)',
        message: agencyError.message,
        extra: `Agency: ${String(request.agency_id)}`,
      });
      return { error: agencyError.message };
    }
  }

  return { success: true };
}
