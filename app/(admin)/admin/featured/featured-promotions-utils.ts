import type {
  AdminPromotionComputedStatus,
  AdminPromotionPanelRecord,
  AdminPromotionTierPanelRecord,
} from '@/features/admin/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const ENDING_SOON_DAYS = 7;

const FEATURED_PLACEMENT_VALUES = new Set([
  'featured',
  'recommended',
  'tavsiya',
  'main_banner',
  'featured_banner',
  'homepage_featured',
  'home_featured',
  'good_deals',
  'hot_tours',
  'hot_deals',
]);

const FEATURED_PLACEMENT_KEYWORDS = ['featured', 'recommend', 'tavsiya', 'banner'];

const KNOWN_SLOT_LIMITS: Record<string, number> = {
  featured: 10,
  hot_deals: 20,
  hot_tours: 20,
};

export type FeaturedSortKey =
  | 'active_first'
  | 'ending_soon'
  | 'newest'
  | 'oldest'
  | 'start_date'
  | 'end_date'
  | 'agency'
  | 'placement_type';

export type FeaturedIssueFilter =
  | 'all'
  | 'with_warnings'
  | 'ending_soon'
  | 'unverified_agency'
  | 'unpublished_tour'
  | 'missing_image'
  | 'over_capacity';

export type FeaturedWarningCode =
  | 'missing_tour'
  | 'missing_agency'
  | 'missing_image'
  | 'tour_not_published'
  | 'agency_unverified'
  | 'agency_unapproved'
  | 'invalid_date_range'
  | 'expired_but_active'
  | 'active_missing_placement'
  | 'missing_dates'
  | 'low_balance'
  | 'duplicate_placement';

export type WarningSeverity = 'low' | 'medium' | 'high';

export interface FeaturedWarning {
  code: FeaturedWarningCode;
  severity: WarningSeverity;
  message: string;
}

export interface FeaturedPlacementDetection {
  finalPlacements: string[];
  featuredItemPlacements: string[];
  keywordPlacements: string[];
  tierPlacements: string[];
}

export interface FeaturedPreparedPromotion extends AdminPromotionPanelRecord {
  placementKey: string | null;
  placementLabel: string;
  startsAtMs: number | null;
  endsAtMs: number | null;
  createdAtMs: number | null;
  durationDays: number | null;
  remainingDays: number | null;
  isEndingSoon: boolean;
  locationLabel: string | null;
  warnings: FeaturedWarning[];
  slotLimit: number | null;
  isOverCapacity: boolean;
  requiredPlacementCoins: number | null;
}

export interface FeaturedPlacementSummary {
  placement: string;
  placementLabel: string;
  total: number;
  active: number;
  scheduled: number;
  pending: number;
  expired: number;
  endingSoon: number;
  warnings: number;
  slotLimit: number | null;
  overCapacityBy: number;
}

interface WarningContext {
  nowMs: number;
  duplicateLiveCount: number;
  requiredPlacementCoins: number | null;
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePlacement(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function parseDateMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const ms = parseDateMs(value);
  if (ms == null) return 'Not available';
  return new Date(ms).toLocaleString();
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const ms = parseDateMs(value);
  if (ms == null) return 'Not available';
  return new Date(ms).toLocaleDateString();
}

export function formatPlacementLabel(value: string | null | undefined): string {
  const normalized = normalizePlacement(value);
  if (!normalized) return 'Not provided';
  if (normalized === 'featured') return 'Featured';
  if (normalized === 'recommended') return 'Recommended';
  if (normalized === 'tavsiya') return 'Tavsiya';
  if (normalized === 'main_banner') return 'Main Banner';
  if (normalized === 'featured_banner') return 'Featured Banner';
  if (normalized === 'homepage_featured' || normalized === 'home_featured') return 'Homepage Featured';
  if (normalized === 'good_deals' || normalized === 'hot_deals') return 'Good Deals';
  if (normalized === 'hot_tours') return 'Hot Tours';
  return toTitleCase(normalized.replace(/_/g, ' '));
}

export function getStatusLabel(status: AdminPromotionComputedStatus): string {
  if (status === 'active') return 'Active';
  if (status === 'scheduled') return 'Scheduled';
  if (status === 'expired') return 'Expired';
  return 'Pending';
}

function isFeaturedPlacementCandidate(normalizedPlacement: string): boolean {
  if (FEATURED_PLACEMENT_VALUES.has(normalizedPlacement)) return true;
  return FEATURED_PLACEMENT_KEYWORDS.some((token) => normalizedPlacement.includes(token));
}

export function detectFeaturedPlacements(
  promotions: AdminPromotionPanelRecord[],
  tiers: AdminPromotionTierPanelRecord[]
): FeaturedPlacementDetection {
  const featuredItemPlacements = new Set<string>();
  const keywordPlacements = new Set<string>();
  const tierPlacements = new Set<string>();
  const allPlacements = new Set<string>();

  for (const item of promotions) {
    const placementKey = normalizePlacement(item.placement);
    if (!placementKey) continue;

    allPlacements.add(placementKey);
    if (item.source === 'featured_item') {
      featuredItemPlacements.add(placementKey);
    }
    if (isFeaturedPlacementCandidate(placementKey)) {
      keywordPlacements.add(placementKey);
    }
  }

  for (const tier of tiers) {
    const placementKey = normalizePlacement(tier.placement);
    if (!placementKey) continue;
    if (isFeaturedPlacementCandidate(placementKey)) {
      tierPlacements.add(placementKey);
    }
  }

  const final = new Set<string>([
    ...featuredItemPlacements,
    ...keywordPlacements,
    ...tierPlacements,
  ]);

  if (final.size === 0) {
    for (const placement of allPlacements) {
      final.add(placement);
    }
  }

  const toSorted = (values: Iterable<string>) => Array.from(values).sort((a, b) => a.localeCompare(b));
  return {
    finalPlacements: toSorted(final),
    featuredItemPlacements: toSorted(featuredItemPlacements),
    keywordPlacements: toSorted(keywordPlacements),
    tierPlacements: toSorted(tierPlacements),
  };
}

function buildPlacementMinCoinMap(
  tiers: AdminPromotionTierPanelRecord[]
): Map<string, number> {
  const map = new Map<string, number>();

  for (const tier of tiers) {
    const key = normalizePlacement(tier.placement);
    if (!key) continue;
    const previous = map.get(key);
    if (previous == null || tier.coins < previous) {
      map.set(key, tier.coins);
    }
  }

  return map;
}

function buildLocationLabel(promotion: AdminPromotionPanelRecord): string | null {
  const locationParts = [
    promotion.tour?.city,
    promotion.tour?.region,
    promotion.tour?.country,
  ].filter((value): value is string => Boolean(value && value.trim().length > 0));

  if (locationParts.length === 0) return null;
  return locationParts.join(', ');
}

function addWarning(
  warnings: FeaturedWarning[],
  code: FeaturedWarningCode,
  severity: WarningSeverity,
  message: string
) {
  warnings.push({ code, severity, message });
}

function buildWarnings(
  promotion: FeaturedPreparedPromotion,
  context: WarningContext
): FeaturedWarning[] {
  const warnings: FeaturedWarning[] = [];

  if (!promotion.tour) {
    addWarning(warnings, 'missing_tour', 'high', 'Campaign is linked to a missing tour record.');
  }
  if (!promotion.agency) {
    addWarning(warnings, 'missing_agency', 'high', 'Campaign is linked to a missing agency record.');
  }
  if (promotion.tour && !promotion.tour.cover_image_url) {
    addWarning(warnings, 'missing_image', 'medium', 'Linked tour has no cover image.');
  }
  if (promotion.tour?.status && promotion.tour.status !== 'published') {
    addWarning(
      warnings,
      'tour_not_published',
      'high',
      `Linked tour is not published (${promotion.tour.status}).`
    );
  }
  if (promotion.agency?.is_verified === false) {
    addWarning(warnings, 'agency_unverified', 'medium', 'Linked agency is not verified.');
  }
  if (promotion.agency?.is_approved === false) {
    addWarning(warnings, 'agency_unapproved', 'medium', 'Linked agency is not approved.');
  }
  if (promotion.startsAtMs != null && promotion.endsAtMs != null && promotion.startsAtMs > promotion.endsAtMs) {
    addWarning(warnings, 'invalid_date_range', 'high', 'Start date is after end date.');
  }
  if (promotion.endsAtMs != null && promotion.endsAtMs < context.nowMs && promotion.is_active === true) {
    addWarning(warnings, 'expired_but_active', 'high', 'Campaign is expired but still marked active.');
  }
  if (promotion.status === 'active' && !promotion.placementKey) {
    addWarning(
      warnings,
      'active_missing_placement',
      'high',
      'Active campaign has missing placement type.'
    );
  }
  if (promotion.startsAtMs == null || promotion.endsAtMs == null) {
    addWarning(warnings, 'missing_dates', 'medium', 'Campaign is missing start or end date.');
  }
  if (
    promotion.requiredPlacementCoins != null &&
    promotion.agency?.maxcoin_balance != null &&
    promotion.agency.maxcoin_balance < promotion.requiredPlacementCoins
  ) {
    addWarning(
      warnings,
      'low_balance',
      'medium',
      `Agency balance is below minimum ${promotion.requiredPlacementCoins} MC tier for this placement.`
    );
  }
  if (context.duplicateLiveCount > 1) {
    addWarning(
      warnings,
      'duplicate_placement',
      'high',
      'Multiple live campaigns detected for the same tour and placement.'
    );
  }

  return warnings;
}

function getLivePlacementKey(promotion: FeaturedPreparedPromotion): string | null {
  if (!promotion.placementKey || !promotion.tour_id) return null;
  if (promotion.status === 'expired') return null;
  return `${promotion.tour_id}::${promotion.placementKey}`;
}

export function prepareFeaturedPromotions(params: {
  promotions: AdminPromotionPanelRecord[];
  tiers: AdminPromotionTierPanelRecord[];
  placements: string[];
  nowMs?: number;
}): FeaturedPreparedPromotion[] {
  const { promotions, tiers, placements } = params;
  const nowMs = params.nowMs ?? Date.now();
  const placementSet = new Set(placements);
  const minCoinsByPlacement = buildPlacementMinCoinMap(tiers);

  const prepared = promotions
    .filter((promotion) => {
      if (promotion.source === 'featured_item') return true;
      const key = normalizePlacement(promotion.placement);
      return key != null && placementSet.has(key);
    })
    .map<FeaturedPreparedPromotion>((promotion) => {
      const startsAtMs = parseDateMs(promotion.starts_at);
      const endsAtMs = parseDateMs(promotion.ends_at);
      const createdAtMs = parseDateMs(promotion.created_at);
      const placementKey = normalizePlacement(promotion.placement);
      const requiredPlacementCoins =
        placementKey == null ? null : (minCoinsByPlacement.get(placementKey) ?? null);

      const durationDays =
        startsAtMs != null && endsAtMs != null
          ? Math.max(1, Math.ceil((endsAtMs - startsAtMs) / DAY_MS))
          : null;
      const remainingDays =
        endsAtMs != null ? Math.ceil((endsAtMs - nowMs) / DAY_MS) : null;
      const isEndingSoon =
        promotion.status === 'active' &&
        remainingDays != null &&
        remainingDays >= 0 &&
        remainingDays <= ENDING_SOON_DAYS;

      return {
        ...promotion,
        placementKey,
        placementLabel: formatPlacementLabel(placementKey),
        startsAtMs,
        endsAtMs,
        createdAtMs,
        durationDays,
        remainingDays,
        isEndingSoon,
        locationLabel: buildLocationLabel(promotion),
        warnings: [],
        slotLimit: placementKey ? (KNOWN_SLOT_LIMITS[placementKey] ?? null) : null,
        isOverCapacity: false,
        requiredPlacementCoins,
      };
    });

  const livePlacementCount = new Map<string, number>();
  for (const promotion of prepared) {
    const key = getLivePlacementKey(promotion);
    if (!key) continue;
    livePlacementCount.set(key, (livePlacementCount.get(key) ?? 0) + 1);
  }

  const activeByPlacement = new Map<string, number>();
  for (const promotion of prepared) {
    if (promotion.status !== 'active' || !promotion.placementKey) continue;
    activeByPlacement.set(
      promotion.placementKey,
      (activeByPlacement.get(promotion.placementKey) ?? 0) + 1
    );
  }

  return prepared.map((promotion) => {
    const duplicateKey = getLivePlacementKey(promotion);
    const duplicateLiveCount = duplicateKey ? (livePlacementCount.get(duplicateKey) ?? 0) : 0;
    const warnings = buildWarnings(promotion, {
      nowMs,
      duplicateLiveCount,
      requiredPlacementCoins: promotion.requiredPlacementCoins,
    });

    const activeCountForPlacement =
      promotion.placementKey == null ? 0 : (activeByPlacement.get(promotion.placementKey) ?? 0);
    const isOverCapacity =
      promotion.slotLimit != null &&
      promotion.status === 'active' &&
      activeCountForPlacement > promotion.slotLimit;

    return {
      ...promotion,
      warnings,
      isOverCapacity,
    };
  });
}

export function buildPlacementSummaries(
  promotions: FeaturedPreparedPromotion[]
): FeaturedPlacementSummary[] {
  const map = new Map<string, FeaturedPlacementSummary>();

  for (const promotion of promotions) {
    const key = promotion.placementKey ?? 'not_provided';
    const existing = map.get(key) ?? {
      placement: key,
      placementLabel: formatPlacementLabel(key),
      total: 0,
      active: 0,
      scheduled: 0,
      pending: 0,
      expired: 0,
      endingSoon: 0,
      warnings: 0,
      slotLimit: promotion.slotLimit,
      overCapacityBy: 0,
    };

    existing.total += 1;
    existing.warnings += promotion.warnings.length;
    if (promotion.status === 'active') existing.active += 1;
    if (promotion.status === 'scheduled') existing.scheduled += 1;
    if (promotion.status === 'pending') existing.pending += 1;
    if (promotion.status === 'expired') existing.expired += 1;
    if (promotion.isEndingSoon) existing.endingSoon += 1;

    if (existing.slotLimit == null && promotion.slotLimit != null) {
      existing.slotLimit = promotion.slotLimit;
    }
    if (existing.slotLimit != null && existing.active > existing.slotLimit) {
      existing.overCapacityBy = existing.active - existing.slotLimit;
    }

    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.active !== b.active) return b.active - a.active;
    return a.placementLabel.localeCompare(b.placementLabel);
  });
}

function sortableMs(value: number | null, fallback = 0): number {
  return value == null ? fallback : value;
}

function statusPriority(status: AdminPromotionComputedStatus): number {
  if (status === 'active') return 0;
  if (status === 'scheduled') return 1;
  if (status === 'pending') return 2;
  return 3;
}

export function sortFeaturedPromotions(
  promotions: FeaturedPreparedPromotion[],
  sortBy: FeaturedSortKey
): FeaturedPreparedPromotion[] {
  const sorted = [...promotions];
  sorted.sort((left, right) => {
    if (sortBy === 'active_first') {
      const statusDiff = statusPriority(left.status) - statusPriority(right.status);
      if (statusDiff !== 0) return statusDiff;
      return sortableMs(right.createdAtMs) - sortableMs(left.createdAtMs);
    }
    if (sortBy === 'ending_soon') {
      const leftDays = left.remainingDays ?? Number.POSITIVE_INFINITY;
      const rightDays = right.remainingDays ?? Number.POSITIVE_INFINITY;
      if (leftDays !== rightDays) return leftDays - rightDays;
      return sortableMs(right.createdAtMs) - sortableMs(left.createdAtMs);
    }
    if (sortBy === 'oldest') {
      return sortableMs(left.createdAtMs, Number.POSITIVE_INFINITY) - sortableMs(right.createdAtMs, Number.POSITIVE_INFINITY);
    }
    if (sortBy === 'start_date') {
      return sortableMs(left.startsAtMs, Number.POSITIVE_INFINITY) - sortableMs(right.startsAtMs, Number.POSITIVE_INFINITY);
    }
    if (sortBy === 'end_date') {
      return sortableMs(left.endsAtMs, Number.POSITIVE_INFINITY) - sortableMs(right.endsAtMs, Number.POSITIVE_INFINITY);
    }
    if (sortBy === 'agency') {
      const leftAgency = left.agency?.name ?? '';
      const rightAgency = right.agency?.name ?? '';
      return leftAgency.localeCompare(rightAgency);
    }
    if (sortBy === 'placement_type') {
      return left.placementLabel.localeCompare(right.placementLabel);
    }
    return sortableMs(right.createdAtMs) - sortableMs(left.createdAtMs);
  });
  return sorted;
}

export function getTourPublicLink(promotion: AdminPromotionPanelRecord): string | null {
  const slug = promotion.tour?.slug;
  if (!slug) return null;
  return `/tours/${slug}`;
}

export function getTourAdminLink(promotion: AdminPromotionPanelRecord): string | null {
  const tourId = promotion.tour?.id ?? promotion.tour_id;
  if (!tourId) return null;
  return `/admin/tours/${tourId}`;
}

export function getAgencyAdminLink(promotion: AdminPromotionPanelRecord): string {
  const agencyId = promotion.agency?.id ?? promotion.agency_id;
  if (!agencyId) return '/admin/agencies';
  return `/admin/agencies?agencyId=${agencyId}`;
}
