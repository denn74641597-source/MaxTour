import { createAdminClient } from '@/lib/supabase/server';
import { assertAdminAccess } from './guard';
import type {
  AdminLeadPanelItem,
  AdminLeadStatus,
  AdminLeadsPanelPayload,
  AdminAgenciesOverviewPayload,
  AdminAgencyDetailPayload,
  AdminAgencyLeadPreview,
  AdminAgencyListRow,
  AdminAgencyMaxcoinTransaction,
  AdminAgencyPromotion,
  AdminAgencySubscriptionSummary,
  AdminTourLeadSummary,
  AdminTourPanelItem,
  AdminTourPromotionItem,
  AdminToursPanelPayload,
  AdminAgencyTourPreview,
  AdminAgencyVerificationItem,
  AdminAgencyVerificationSummary,
  AdminVerificationStatus,
  AdminPromotionsMaxcoinPanelPayload,
  AdminPromotionPanelRecord,
  AdminPromotionRecordSource,
  AdminPromotionComputedStatus,
  AdminPromotionTourPreview,
  AdminPromotionAgencyPreview,
  AdminMaxcoinLedgerRecord,
  AdminCoinRequestPanelRecord,
  AdminAgencyBalancePanelRecord,
  AdminPromotionTierPanelRecord,
} from './types';

interface AgencyOwnerRaw {
  id: string;
  full_name: string | null;
  telegram_username: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
}

interface AgencyRowRaw {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  telegram_username: string | null;
  instagram_url: string | null;
  website_url: string | null;
  address: string | null;
  city: string | null;
  country: string;
  google_maps_url: string | null;
  inn: string | null;
  responsible_person: string | null;
  certificate_pdf_url: string | null;
  license_pdf_url: string | null;
  is_verified: boolean;
  is_approved: boolean;
  maxcoin_balance: number | string | null;
  maxcoin_bonus_balance?: number | string | null;
  maxcoin_bonus_earned_total?: number | string | null;
  profile_views: number | string | null;
  review_count: number | string | null;
  avg_rating: number | string | null;
  created_at: string;
  updated_at: string;
  owner: AgencyOwnerRaw | AgencyOwnerRaw[] | null;
}

interface TourRowRaw {
  id: string;
  agency_id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  country: string | null;
  city: string | null;
  price: number | string | null;
  currency: string | null;
  cover_image_url: string | null;
  departure_date?: string | null;
  view_count?: number | string | null;
}

interface TourPanelAgencyRaw {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_verified: boolean | null;
  is_approved: boolean | null;
  phone: string | null;
  telegram_username: string | null;
}

interface TourPanelImageRaw {
  id: string;
  image_url: string;
  sort_order: number | null;
}

interface TourPanelRowRaw {
  [key: string]: unknown;
  id: string;
  agency_id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  country: string | null;
  city: string | null;
  region: string | null;
  district: string | null;
  tour_type: string | null;
  category: string | null;
  short_description: string | null;
  full_description: string | null;
  cover_image_url: string | null;
  price: number | string | null;
  old_price: number | string | null;
  currency: string | null;
  departure_date: string | null;
  departure_month: string | null;
  return_date: string | null;
  duration_days: number | string | null;
  duration_nights: number | string | null;
  seats_total: number | string | null;
  seats_left: number | string | null;
  view_count: number | string | null;
  is_featured: boolean | null;
  destinations: unknown;
  included_services: unknown;
  excluded_services: unknown;
  extra_charges: unknown;
  variable_charges: unknown;
  what_to_bring: unknown;
  hotels: unknown;
  hotel_images: unknown;
  operator_phone: string | null;
  operator_telegram_username: string | null;
  additional_info: string | null;
  meeting_point: string | null;
  guide_name: string | null;
  guide_phone: string | null;
  domestic_category: string | null;
  agency: TourPanelAgencyRaw | null;
  images: TourPanelImageRaw[] | null;
}

interface TourLeadMetricRaw {
  tour_id: string | null;
  created_at: string | null;
}

interface TourPromotionMetricRaw {
  id: string;
  tour_id: string | null;
  agency_id: string | null;
  placement: string | null;
  cost_coins: number | string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean | null;
  created_at: string | null;
  status?: string | null;
}

interface LeadTourRaw {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  country: string | null;
  city: string | null;
  region?: string | null;
  district?: string | null;
  status?: string | null;
  price: number | string | null;
  currency: string | null;
}

interface LeadAgencyRaw {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  telegram_username: string | null;
  is_verified: boolean | null;
  is_approved: boolean | null;
}

interface LeadUserRaw {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  telegram_username: string | null;
  role: string | null;
}

interface LeadRowRaw {
  id: string;
  agency_id: string;
  tour_id: string | null;
  user_id?: string | null;
  full_name: string;
  phone: string;
  telegram_username: string | null;
  status: string;
  people_count: number | string | null;
  comment: string | null;
  created_at: string;
  updated_at?: string | null;
  tour?: LeadTourRaw | LeadTourRaw[] | null;
  agency?: LeadAgencyRaw | LeadAgencyRaw[] | null;
  user?: LeadUserRaw | LeadUserRaw[] | null;
}

interface VerificationRowRaw {
  id: string;
  agency_id: string;
  status: AdminVerificationStatus;
  admin_note: string | null;
  certificate_url: string | null;
  form_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface SubscriptionPlanRaw {
  id: string;
  name: string;
  slug: string;
  price_monthly: number | string | null;
  max_active_tours: number | string | null;
  can_feature: boolean | null;
  has_priority_support: boolean | null;
}

interface SubscriptionRowRaw {
  id: string;
  agency_id: string;
  status: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
  plan: SubscriptionPlanRaw | SubscriptionPlanRaw[] | null;
}

interface PromotionRowRaw {
  id: string;
  agency_id: string;
  tour_id: string;
  placement: string;
  cost_coins: number | string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  tour?: {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    status: string;
  } | Array<{
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    status: string;
  }> | null;
}

interface MaxcoinTransactionRaw {
  id: string;
  agency_id: string;
  amount: number | string;
  type: string;
  description: string | null;
  tour_id: string | null;
  wallet_type?: string | null;
  created_at: string;
}

interface PromotionPanelTourRaw {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  status: string | null;
  view_count?: number | string | null;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  district?: string | null;
}

interface PromotionPanelAgencyRaw {
  id: string;
  name: string;
  slug: string;
  is_verified: boolean | null;
  is_approved: boolean | null;
  maxcoin_balance: number | string | null;
  maxcoin_bonus_balance?: number | string | null;
  maxcoin_bonus_earned_total?: number | string | null;
  phone: string | null;
  telegram_username: string | null;
  responsible_person: string | null;
}

interface PromotionPanelTourPromotionRaw {
  id: string;
  agency_id: string | null;
  tour_id: string | null;
  placement: string | null;
  cost_coins: number | string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean | null;
  created_at: string | null;
  tour?: PromotionPanelTourRaw | PromotionPanelTourRaw[] | null;
  agency?: PromotionPanelAgencyRaw | PromotionPanelAgencyRaw[] | null;
}

interface PromotionPanelFeaturedItemRaw {
  id: string;
  agency_id: string | null;
  tour_id: string | null;
  placement_type: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
  tour?: PromotionPanelTourRaw | PromotionPanelTourRaw[] | null;
  agency?: PromotionPanelAgencyRaw | PromotionPanelAgencyRaw[] | null;
}

interface PromotionPanelTransactionRaw {
  id: string;
  agency_id: string | null;
  amount: number | string | null;
  type: string | null;
  description: string | null;
  tour_id: string | null;
  wallet_type?: string | null;
  created_at: string;
  agency?: PromotionPanelAgencyRaw | PromotionPanelAgencyRaw[] | null;
  tour?: PromotionPanelTourRaw | PromotionPanelTourRaw[] | null;
}

interface PromotionPanelCoinRequestRaw {
  id: string;
  agency_id: string | null;
  coins: number | string | null;
  price_uzs: number | string | null;
  status: string | null;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  agency?: PromotionPanelAgencyRaw | PromotionPanelAgencyRaw[] | null;
}

interface PromotionPanelAgencyBalanceRaw {
  id: string;
  name: string;
  slug: string;
  maxcoin_balance: number | string | null;
  maxcoin_bonus_balance?: number | string | null;
  maxcoin_bonus_earned_total?: number | string | null;
  is_verified: boolean | null;
  is_approved: boolean | null;
  phone: string | null;
  telegram_username: string | null;
  responsible_person: string | null;
  updated_at: string;
}

interface PromotionPanelTierRaw {
  id: string;
  placement: string | null;
  coins: number | string | null;
  days: number | string | null;
  sort_order: number | string | null;
  created_at: string;
}

interface PromotionLeadMetricRaw {
  tour_id: string | null;
  created_at: string | null;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const REQUIRED_AGENCY_PROFILE_FIELDS: Array<{ key: keyof AgencyRowRaw; label: string }> = [
  { key: 'description', label: 'Description' },
  { key: 'phone', label: 'Phone' },
  { key: 'logo_url', label: 'Logo' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'inn', label: 'INN' },
  { key: 'responsible_person', label: 'Responsible person' },
];

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizeLeadStatus(status: string | null | undefined): AdminLeadStatus {
  if (status === 'new') return 'new';
  if (status === 'contacted') return 'contacted';
  if (status === 'closed') return 'closed';
  if (status === 'won') return 'won';
  if (status === 'lost') return 'lost';
  return 'new';
}

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function toObjectArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object'
  );
}

function latestIso(values: Array<string | null | undefined>): string | null {
  let latestValue: string | null = null;
  let latestMs = Number.NEGATIVE_INFINITY;

  for (const value of values) {
    if (!value) continue;
    const ms = new Date(value).getTime();
    if (!Number.isFinite(ms)) continue;
    if (ms > latestMs) {
      latestMs = ms;
      latestValue = value;
    }
  }

  return latestValue;
}

function isValidIso(value: string | null | undefined): value is string {
  if (!value) return false;
  return Number.isFinite(new Date(value).getTime());
}

function computePromotionStatus(params: {
  startsAt: string | null | undefined;
  endsAt: string | null | undefined;
  isActive: boolean | null | undefined;
  nowMs: number;
}): AdminPromotionComputedStatus {
  const { startsAt, endsAt, isActive, nowMs } = params;
  const startMs = isValidIso(startsAt) ? new Date(startsAt).getTime() : null;
  const endMs = isValidIso(endsAt) ? new Date(endsAt).getTime() : null;

  if (endMs != null && endMs < nowMs) return 'expired';
  if (startMs != null && startMs > nowMs) return 'scheduled';
  if (isActive === true) return 'active';
  return 'pending';
}

function buildPromotionTourPreview(
  raw: PromotionPanelTourRaw | PromotionPanelTourRaw[] | null | undefined
): AdminPromotionTourPreview | null {
  const tour = firstOrNull(raw);
  if (!tour) return null;

  return {
    id: tour.id,
    title: tour.title,
    slug: tour.slug,
    cover_image_url: tour.cover_image_url,
    status: tour.status,
    view_count: tour.view_count == null ? null : toNumber(tour.view_count),
    country: tour.country ?? null,
    city: tour.city ?? null,
    region: tour.region ?? null,
    district: tour.district ?? null,
  };
}

function buildPromotionAgencyPreview(
  raw: PromotionPanelAgencyRaw | PromotionPanelAgencyRaw[] | null | undefined
): AdminPromotionAgencyPreview | null {
  const agency = firstOrNull(raw);
  if (!agency) return null;

  return {
    id: agency.id,
    name: agency.name,
    slug: agency.slug,
    is_verified: agency.is_verified,
    is_approved: agency.is_approved,
    maxcoin_balance: agency.maxcoin_balance == null ? null : toNumber(agency.maxcoin_balance),
    maxcoin_bonus_balance: agency.maxcoin_bonus_balance == null ? null : toNumber(agency.maxcoin_bonus_balance),
    maxcoin_bonus_earned_total: agency.maxcoin_bonus_earned_total == null ? null : toNumber(agency.maxcoin_bonus_earned_total),
    phone: agency.phone,
    telegram_username: agency.telegram_username,
    responsible_person: agency.responsible_person,
  };
}

function getMissingFields(agency: AgencyRowRaw): string[] {
  return REQUIRED_AGENCY_PROFILE_FIELDS
    .filter(({ key }) => {
      const value = agency[key];
      return value == null || (typeof value === 'string' && value.trim().length === 0);
    })
    .map(({ label }) => label);
}

function buildSubscriptionSummary(subscription: SubscriptionRowRaw): AdminAgencySubscriptionSummary {
  const plan = firstOrNull(subscription.plan);

  return {
    id: subscription.id,
    status: subscription.status,
    startsAt: subscription.starts_at,
    endsAt: subscription.ends_at,
    createdAt: subscription.created_at,
    plan: plan
      ? {
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          priceMonthly: toNumber(plan.price_monthly),
          maxActiveTours: toNumber(plan.max_active_tours),
          canFeature: Boolean(plan.can_feature),
          hasPrioritySupport: Boolean(plan.has_priority_support),
        }
      : null,
  };
}

function buildVerificationSummary(record: VerificationRowRaw | undefined): AdminAgencyVerificationSummary {
  if (!record) {
    return {
      latestRequestId: null,
      latestStatus: null,
      latestSubmittedAt: null,
      latestUpdatedAt: null,
      latestAdminNote: null,
      latestCertificateUrl: null,
    };
  }

  return {
    latestRequestId: record.id,
    latestStatus: record.status,
    latestSubmittedAt: record.created_at,
    latestUpdatedAt: record.updated_at,
    latestAdminNote: record.admin_note,
    latestCertificateUrl: record.certificate_url,
  };
}

function buildAgencyListRow(params: {
  agency: AgencyRowRaw;
  tours: TourRowRaw[];
  leads: LeadRowRaw[];
  latestVerification: VerificationRowRaw | undefined;
  latestSubscription: SubscriptionRowRaw | undefined;
  activePromotions: number;
}): AdminAgencyListRow {
  const { agency, tours, leads, latestVerification, latestSubscription, activePromotions } = params;
  const owner = firstOrNull(agency.owner);

  const now = Date.now();
  const recentLeads30d = leads.filter((lead) => {
    const createdMs = new Date(lead.created_at).getTime();
    return Number.isFinite(createdMs) && now - createdMs <= THIRTY_DAYS_MS;
  }).length;

  const lastTourAt = latestIso(tours.flatMap((tour) => [tour.updated_at, tour.created_at]));
  const lastLeadAt = latestIso(leads.map((lead) => lead.created_at));
  const lastActivityAt = latestIso([
    agency.updated_at,
    lastTourAt,
    lastLeadAt,
    latestVerification?.updated_at,
    latestVerification?.created_at,
    latestSubscription?.created_at,
  ]);

  const missingFields = getMissingFields(agency);

  return {
    id: agency.id,
    owner_id: agency.owner_id,
    name: agency.name,
    slug: agency.slug,
    description: agency.description,
    logo_url: agency.logo_url,
    phone: agency.phone,
    telegram_username: agency.telegram_username,
    instagram_url: agency.instagram_url,
    website_url: agency.website_url,
    address: agency.address,
    city: agency.city,
    country: agency.country,
    google_maps_url: agency.google_maps_url,
    inn: agency.inn,
    responsible_person: agency.responsible_person,
    certificate_pdf_url: agency.certificate_pdf_url,
    license_pdf_url: agency.license_pdf_url,
    is_verified: agency.is_verified,
    is_approved: agency.is_approved,
    maxcoin_balance: toNumber(agency.maxcoin_balance),
    profile_views: toNumber(agency.profile_views),
    review_count: toNumber(agency.review_count),
    avg_rating: toNumber(agency.avg_rating),
    created_at: agency.created_at,
    updated_at: agency.updated_at,
    owner: owner
      ? {
          id: owner.id,
          full_name: owner.full_name,
          telegram_username: owner.telegram_username,
          phone: owner.phone,
          email: owner.email,
          avatar_url: owner.avatar_url,
          role: owner.role,
        }
      : null,
    stats: {
      totalTours: tours.length,
      publishedTours: tours.filter((tour) => tour.status === 'published').length,
      totalLeads: leads.length,
      recentLeads30d,
      activePromotions,
      lastTourAt,
      lastLeadAt,
      lastActivityAt,
      missingFieldCount: missingFields.length,
      missingFields,
    },
    verification: buildVerificationSummary(latestVerification),
    subscription: latestSubscription ? buildSubscriptionSummary(latestSubscription) : null,
  };
}

function groupByAgencyId<T extends { agency_id: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const existing = map.get(row.agency_id);
    if (existing) {
      existing.push(row);
    } else {
      map.set(row.agency_id, [row]);
    }
  }
  return map;
}

/** Admin: get all agencies with approval status */
export async function getAllAgencies() {
  await assertAdminAccess();
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('agencies')
    .select('*, owner:profiles(full_name, telegram_username)')
    .order('created_at', { ascending: false });

  return data ?? [];
}

/** Admin: get all tours for moderation */
export async function getAllTours() {
  await assertAdminAccess();
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('tours')
    .select('*, agency:agencies(id, name, slug)')
    .order('created_at', { ascending: false });

  return data ?? [];
}

/** Admin: tours panel payload with metrics and relations for operations UI */
export async function getAdminToursPanelData(): Promise<AdminToursPanelPayload> {
  await assertAdminAccess();
  const supabase = await createAdminClient();
  const generatedAt = new Date().toISOString();
  const errors: string[] = [];

  const toursResult = await supabase
    .from('tours')
    .select(
      '*, agency:agencies(id, name, slug, logo_url, is_verified, is_approved, phone, telegram_username), images:tour_images(id, image_url, sort_order)'
    )
    .order('created_at', { ascending: false });

  if (toursResult.error) {
    return {
      generatedAt,
      health: {
        lastUpdated: generatedAt,
        partialData: true,
        errors: [toursResult.error.message],
      },
      tours: [],
    };
  }

  const rawTours = (toursResult.data ?? []) as TourPanelRowRaw[];
  const tourIds = rawTours.map((tour) => tour.id).filter(Boolean);

  let leadRows: TourLeadMetricRaw[] = [];
  let promotionRows: TourPromotionMetricRaw[] = [];

  if (tourIds.length > 0) {
    const [leadsResult, promotionsResult] = await Promise.all([
      supabase.from('leads').select('tour_id, created_at').in('tour_id', tourIds),
      supabase
        .from('tour_promotions')
        .select(
          'id, tour_id, agency_id, placement, cost_coins, starts_at, ends_at, is_active, created_at'
        )
        .in('tour_id', tourIds)
        .order('created_at', { ascending: false }),
    ]);

    if (leadsResult.error) {
      errors.push(`Leads metrics unavailable: ${leadsResult.error.message}`);
    } else {
      leadRows = (leadsResult.data ?? []) as TourLeadMetricRaw[];
    }

    if (promotionsResult.error) {
      errors.push(`Promotion metrics unavailable: ${promotionsResult.error.message}`);
    } else {
      promotionRows = (promotionsResult.data ?? []) as TourPromotionMetricRaw[];
    }
  }

  const leadSummaryByTour = new Map<string, AdminTourLeadSummary>();
  for (const row of leadRows) {
    if (!row.tour_id) continue;
    const previous = leadSummaryByTour.get(row.tour_id) ?? {
      count: 0,
      latestLeadAt: null,
    };
    const latestLeadAt = latestIso([previous.latestLeadAt, row.created_at]);
    leadSummaryByTour.set(row.tour_id, {
      count: previous.count + 1,
      latestLeadAt,
    });
  }

  const promotionsByTour = new Map<string, AdminTourPromotionItem[]>();
  for (const row of promotionRows) {
    if (!row.tour_id) continue;
    const existing = promotionsByTour.get(row.tour_id) ?? [];
    existing.push({
      id: row.id,
      tour_id: row.tour_id,
      agency_id: row.agency_id,
      placement: row.placement,
      cost_coins: toNumber(row.cost_coins),
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      is_active: row.is_active === true,
      created_at: row.created_at,
      status: row.status ?? null,
    });
    promotionsByTour.set(row.tour_id, existing);
  }

  const nowIso = new Date().toISOString();

  const tours: AdminTourPanelItem[] = rawTours.map((tour) => {
    const promotions = promotionsByTour.get(tour.id) ?? [];
    const activePromotions = promotions.filter((promotion) => {
      if (!promotion.is_active) return false;
      if (!promotion.ends_at) return true;
      return promotion.ends_at >= nowIso;
    });

    return {
      ...tour,
      price: tour.price == null ? null : toNumber(tour.price),
      old_price: tour.old_price == null ? null : toNumber(tour.old_price),
      duration_days: tour.duration_days == null ? null : toNumber(tour.duration_days),
      duration_nights: tour.duration_nights == null ? null : toNumber(tour.duration_nights),
      seats_total: tour.seats_total == null ? null : toNumber(tour.seats_total),
      seats_left: tour.seats_left == null ? null : toNumber(tour.seats_left),
      view_count: toNumber(tour.view_count),
      is_featured: tour.is_featured === true,
      destinations: toStringArray(tour.destinations),
      included_services: toStringArray(tour.included_services),
      excluded_services: toStringArray(tour.excluded_services),
      extra_charges: toObjectArray(tour.extra_charges),
      variable_charges: toObjectArray(tour.variable_charges),
      what_to_bring: toStringArray(tour.what_to_bring),
      hotels: toObjectArray(tour.hotels),
      hotel_images: toStringArray(tour.hotel_images),
      agency: tour.agency
        ? {
            id: tour.agency.id,
            name: tour.agency.name,
            slug: tour.agency.slug,
            logo_url: tour.agency.logo_url,
            is_verified: Boolean(tour.agency.is_verified),
            is_approved: Boolean(tour.agency.is_approved),
            phone: tour.agency.phone,
            telegram_username: tour.agency.telegram_username,
          }
        : null,
      images: (tour.images ?? [])
        .slice()
        .sort((a, b) => toNumber(a.sort_order) - toNumber(b.sort_order))
        .map((image) => ({
          id: image.id,
          image_url: image.image_url,
          sort_order: image.sort_order,
        })),
      promotions,
      activePromotions,
      leadSummary: leadSummaryByTour.get(tour.id) ?? { count: 0, latestLeadAt: null },
    } satisfies AdminTourPanelItem;
  });

  return {
    generatedAt,
    health: {
      lastUpdated: generatedAt,
      partialData: errors.length > 0,
      errors,
    },
    tours,
  };
}

/** Admin: get a single tour by ID with full details */
export async function getAdminTourById(id: string) {
  await assertAdminAccess();
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('tours')
    .select('*, agency:agencies(id, name, slug, logo_url, is_verified, is_approved, phone, telegram_username), images:tour_images(id, image_url, sort_order)')
    .eq('id', id)
    .single();

  return data;
}

/** Admin: approve or reject an agency */
export async function setAgencyApproval(agencyId: string, approved: boolean) {
  await assertAdminAccess();
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('agencies')
    .update({ is_approved: approved, updated_at: new Date().toISOString() })
    .eq('id', agencyId);

  if (error) throw error;
}

/** Admin: update tour status (publish/reject) */
export async function setTourStatus(tourId: string, status: string) {
  await assertAdminAccess();
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('tours')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', tourId);

  if (error) throw error;
}

/** Admin: get subscription overview */
export async function getSubscriptionOverview() {
  await assertAdminAccess();
  const supabase = await createAdminClient();
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price_monthly', { ascending: true });

  const { data: subscriptions } = await supabase
    .from('agency_subscriptions')
    .select('*, agency:agencies(name, slug), plan:subscription_plans(name, price_monthly)')
    .order('created_at', { ascending: false });

  return { plans: plans ?? [], subscriptions: subscriptions ?? [] };
}

/** Admin: get featured items */
export async function getFeaturedItems() {
  await assertAdminAccess();
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('featured_items')
    .select('*, tour:tours(id, title, slug), agency:agencies(id, name, slug)')
    .order('starts_at', { ascending: false });

  return data ?? [];
}

/** Admin: dashboard stats */
export async function getAdminStats() {
  await assertAdminAccess();
  const supabase = await createAdminClient();

  const [agencies, tours, leads, users, subscriptions, pendingCoinRequests] = await Promise.all([
    supabase.from('agencies').select('id', { count: 'exact', head: true }),
    supabase.from('tours').select('id', { count: 'exact', head: true }),
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('agency_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('coin_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  return {
    totalAgencies: agencies.count ?? 0,
    totalTours: tours.count ?? 0,
    totalLeads: leads.count ?? 0,
    totalUsers: users.count ?? 0,
    activeSubscriptions: subscriptions.count ?? 0,
    pendingCoinRequests: pendingCoinRequests.count ?? 0,
  };
}

export interface AdminDashboardData {
  generatedAt: string;
  summary: {
    totalUsers: number;
    totalAgencies: number;
    totalTours: number;
    totalLeads: number;
    newLeads7d: number;
    pendingModerationItems: number;
    pendingTours: number;
    pendingAgencyApprovals: number;
    pendingVerificationRequests: number;
    pendingCoinRequests: number;
    pendingAccountDeletionRequests: number;
    activeSubscriptions: number;
    activePromotions: number;
    expiringPromotions7d: number;
    maxCoinActivity7d: number;
    estimatedMonthlyRevenue: number | null;
  };
  breakdowns: {
    usersByRole: {
      user: number;
      agency_manager: number;
      admin: number;
    };
    toursByStatus: {
      draft: number;
      pending: number;
      published: number;
      archived: number;
    };
    leadsByStatus: {
      new: number;
      contacted: number;
      closed: number;
      won: number;
      lost: number;
    };
    agencies: {
      approved: number;
      pending: number;
      verified: number;
      unverified: number;
      withActiveSubscription: number;
    };
  };
  actionCenter: Array<{
    key: string;
    title: string;
    description: string;
    count: number;
    href: string;
    severity: 'high' | 'medium' | 'low' | 'neutral';
  }>;
  recent: {
    tours: Array<{
      id: string;
      title: string;
      slug: string;
      status: string;
      created_at: string;
      view_count: number;
      agency_name: string | null;
      agency_slug: string | null;
    }>;
    agencies: Array<{
      id: string;
      name: string;
      slug: string;
      city: string | null;
      country: string | null;
      is_approved: boolean;
      is_verified: boolean;
      created_at: string;
    }>;
    leads: Array<{
      id: string;
      full_name: string;
      status: string;
      people_count: number;
      created_at: string;
      agency_name: string | null;
      tour_title: string | null;
    }>;
    verificationQueue: Array<{
      id: string;
      status: string;
      created_at: string;
      agency_id: string;
      agency_name: string | null;
    }>;
    pendingTours: Array<{
      id: string;
      title: string;
      slug: string;
      created_at: string;
      agency_name: string | null;
    }>;
  };
  quality: {
    topViewedTours: Array<{
      id: string;
      title: string;
      slug: string;
      view_count: number;
      status: string;
      agency_name: string | null;
    }>;
    incompleteTours: Array<{
      id: string;
      title: string;
      slug: string;
      status: string;
      issues: string[];
      created_at: string;
    }>;
    expiringSubscriptions: Array<{
      id: string;
      agency_name: string | null;
      plan_name: string | null;
      ends_at: string | null;
      price_monthly: number | null;
    }>;
    expiringPromotions: Array<{
      id: string;
      placement_type: string | null;
      ends_at: string | null;
      tour_title: string | null;
      agency_name: string | null;
    }>;
  };
  warnings: string[];
  unavailable: string[];
}

function pushDashboardMessage(target: string[], message: string) {
  if (!target.includes(message)) target.push(message);
}

type CountQueryResult = {
  count: number | null;
  error: { message?: string } | null;
};

function relationName(value: unknown, fallback: string | null = null): string | null {
  if (Array.isArray(value)) {
    const first = value[0];
    if (first && typeof first === 'object' && 'name' in first) {
      return typeof (first as { name?: unknown }).name === 'string'
        ? ((first as { name: string }).name)
        : fallback;
    }
    return fallback;
  }

  if (value && typeof value === 'object' && 'name' in value) {
    return typeof (value as { name?: unknown }).name === 'string'
      ? ((value as { name: string }).name)
      : fallback;
  }

  return fallback;
}

function relationSlug(value: unknown, fallback: string | null = null): string | null {
  if (Array.isArray(value)) {
    const first = value[0];
    if (first && typeof first === 'object' && 'slug' in first) {
      return typeof (first as { slug?: unknown }).slug === 'string'
        ? ((first as { slug: string }).slug)
        : fallback;
    }
    return fallback;
  }

  if (value && typeof value === 'object' && 'slug' in value) {
    return typeof (value as { slug?: unknown }).slug === 'string'
      ? ((value as { slug: string }).slug)
      : fallback;
  }

  return fallback;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await assertAdminAccess();
  const supabase = await createAdminClient();

  const warnings: string[] = [];
  const unavailable: string[] = [];

  const now = new Date();
  const nowIso = now.toISOString();
  const sevenDaysAgoIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAheadIso = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAheadIso = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const countOrZero = async (label: string, query: PromiseLike<CountQueryResult>) => {
    const { count, error } = await query;
    if (error) {
      pushDashboardMessage(warnings, `${label}: ${error.message ?? 'Unknown error'}`);
      pushDashboardMessage(unavailable, label);
      return 0;
    }
    return count ?? 0;
  };

  const [
    totalUsers,
    totalAgencies,
    totalTours,
    totalLeads,
    roleUserCount,
    roleAgencyManagerCount,
    roleAdminCount,
    toursDraftCount,
    toursPendingCount,
    toursPublishedCount,
    toursArchivedCount,
    leadsNewCount,
    leadsContactedCount,
    leadsClosedCount,
    leadsWonCount,
    leadsLostCount,
    pendingAgencyApprovals,
    verifiedAgenciesCount,
    pendingVerificationRequests,
    pendingCoinRequests,
    pendingAccountDeletionRequests,
    newLeads7d,
    maxCoinActivity7d,
    activePromotions,
    expiringPromotions7d,
  ] = await Promise.all([
    countOrZero('profiles.total', supabase.from('profiles').select('id', { head: true, count: 'exact' })),
    countOrZero('agencies.total', supabase.from('agencies').select('id', { head: true, count: 'exact' })),
    countOrZero('tours.total', supabase.from('tours').select('id', { head: true, count: 'exact' })),
    countOrZero('leads.total', supabase.from('leads').select('id', { head: true, count: 'exact' })),
    countOrZero('profiles.role.user', supabase.from('profiles').select('id', { head: true, count: 'exact' }).eq('role', 'user')),
    countOrZero('profiles.role.agency_manager', supabase.from('profiles').select('id', { head: true, count: 'exact' }).eq('role', 'agency_manager')),
    countOrZero('profiles.role.admin', supabase.from('profiles').select('id', { head: true, count: 'exact' }).eq('role', 'admin')),
    countOrZero('tours.status.draft', supabase.from('tours').select('id', { head: true, count: 'exact' }).eq('status', 'draft')),
    countOrZero('tours.status.pending', supabase.from('tours').select('id', { head: true, count: 'exact' }).eq('status', 'pending')),
    countOrZero('tours.status.published', supabase.from('tours').select('id', { head: true, count: 'exact' }).eq('status', 'published')),
    countOrZero('tours.status.archived', supabase.from('tours').select('id', { head: true, count: 'exact' }).eq('status', 'archived')),
    countOrZero('leads.status.new', supabase.from('leads').select('id', { head: true, count: 'exact' }).eq('status', 'new')),
    countOrZero('leads.status.contacted', supabase.from('leads').select('id', { head: true, count: 'exact' }).eq('status', 'contacted')),
    countOrZero('leads.status.closed', supabase.from('leads').select('id', { head: true, count: 'exact' }).eq('status', 'closed')),
    countOrZero('leads.status.won', supabase.from('leads').select('id', { head: true, count: 'exact' }).eq('status', 'won')),
    countOrZero('leads.status.lost', supabase.from('leads').select('id', { head: true, count: 'exact' }).eq('status', 'lost')),
    countOrZero('agencies.pending_approval', supabase.from('agencies').select('id', { head: true, count: 'exact' }).eq('is_approved', false)),
    countOrZero('agencies.verified', supabase.from('agencies').select('id', { head: true, count: 'exact' }).eq('is_verified', true)),
    countOrZero('verification_requests.pending', supabase.from('verification_requests').select('id', { head: true, count: 'exact' }).eq('status', 'pending')),
    countOrZero('coin_requests.pending', supabase.from('coin_requests').select('id', { head: true, count: 'exact' }).eq('status', 'pending')),
    countOrZero('account_deletion_requests.pending', supabase.from('account_deletion_requests').select('id', { head: true, count: 'exact' }).eq('status', 'pending')),
    countOrZero('leads.new_7d', supabase.from('leads').select('id', { head: true, count: 'exact' }).gte('created_at', sevenDaysAgoIso)),
    countOrZero('maxcoin_transactions.activity_7d', supabase.from('maxcoin_transactions').select('id', { head: true, count: 'exact' }).gte('created_at', sevenDaysAgoIso)),
    countOrZero('featured_items.active', supabase.from('featured_items').select('id', { head: true, count: 'exact' }).gt('ends_at', nowIso)),
    countOrZero('featured_items.expiring_7d', supabase.from('featured_items').select('id', { head: true, count: 'exact' }).gt('ends_at', nowIso).lte('ends_at', sevenDaysAheadIso)),
  ]);

  const [
    recentToursResponse,
    recentAgenciesResponse,
    recentLeadsResponse,
    verificationQueueResponse,
    pendingToursResponse,
    topViewedToursResponse,
    qualityToursResponse,
    expiringPromotionsResponse,
    activeSubscriptionsResponse,
    expiringSubscriptionsResponse,
  ] = await Promise.all([
    supabase
      .from('tours')
      .select('id, title, slug, status, created_at, view_count, agency:agencies(name, slug)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('agencies')
      .select('id, name, slug, city, country, is_approved, is_verified, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('leads')
      .select('id, full_name, status, people_count, created_at, agency:agencies(name), tour:tours(title)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('verification_requests')
      .select('id, status, created_at, agency_id, agency:agencies(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('tours')
      .select('id, title, slug, status, created_at, agency:agencies(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('tours')
      .select('id, title, slug, status, view_count, agency:agencies(name)')
      .order('view_count', { ascending: false })
      .limit(8),
    supabase
      .from('tours')
      .select('id, title, slug, status, cover_image_url, short_description, included_services, created_at')
      .order('created_at', { ascending: false })
      .limit(120),
    supabase
      .from('featured_items')
      .select('id, placement_type, ends_at, tour:tours(title), agency:agencies(name)')
      .gt('ends_at', nowIso)
      .lte('ends_at', sevenDaysAheadIso)
      .order('ends_at', { ascending: true })
      .limit(10),
    supabase
      .from('agency_subscriptions')
      .select('id, agency_id, status, ends_at, plan:subscription_plans(price_monthly, name)')
      .eq('status', 'active')
      .order('ends_at', { ascending: true }),
    supabase
      .from('agency_subscriptions')
      .select('id, status, ends_at, agency:agencies(name), plan:subscription_plans(price_monthly, name)')
      .eq('status', 'active')
      .gt('ends_at', nowIso)
      .lte('ends_at', fourteenDaysAheadIso)
      .order('ends_at', { ascending: true })
      .limit(10),
  ]);

  const queryErrors: Array<[string, { message?: string } | null]> = [
    ['tours.recent', recentToursResponse.error],
    ['agencies.recent', recentAgenciesResponse.error],
    ['leads.recent', recentLeadsResponse.error],
    ['verification_requests.queue', verificationQueueResponse.error],
    ['tours.pending_list', pendingToursResponse.error],
    ['tours.top_viewed', topViewedToursResponse.error],
    ['tours.quality_scan', qualityToursResponse.error],
    ['featured_items.expiring', expiringPromotionsResponse.error],
    ['agency_subscriptions.active', activeSubscriptionsResponse.error],
    ['agency_subscriptions.expiring', expiringSubscriptionsResponse.error],
  ];

  for (const [label, error] of queryErrors) {
    if (!error) continue;
    pushDashboardMessage(warnings, `${label}: ${error.message ?? 'Unknown error'}`);
    pushDashboardMessage(unavailable, label);
  }

  const recentTours = (recentToursResponse.data ?? []).map((item: any) => ({
    id: item.id as string,
    title: item.title as string,
    slug: item.slug as string,
    status: item.status as string,
    created_at: item.created_at as string,
    view_count: Number(item.view_count ?? 0),
    agency_name: relationName(item.agency),
    agency_slug: relationSlug(item.agency),
  }));

  const recentAgencies = (recentAgenciesResponse.data ?? []).map((item: any) => ({
    id: item.id as string,
    name: item.name as string,
    slug: item.slug as string,
    city: (item.city as string | null) ?? null,
    country: (item.country as string | null) ?? null,
    is_approved: Boolean(item.is_approved),
    is_verified: Boolean(item.is_verified),
    created_at: item.created_at as string,
  }));

  const recentLeads = (recentLeadsResponse.data ?? []).map((item: any) => ({
    id: item.id as string,
    full_name: item.full_name as string,
    status: item.status as string,
    people_count: Number(item.people_count ?? 1),
    created_at: item.created_at as string,
    agency_name: relationName(item.agency),
    tour_title: relationName(item.tour),
  }));

  const verificationQueue = (verificationQueueResponse.data ?? []).map((item: any) => ({
    id: item.id as string,
    status: item.status as string,
    created_at: item.created_at as string,
    agency_id: item.agency_id as string,
    agency_name: relationName(item.agency),
  }));

  const pendingTours = (pendingToursResponse.data ?? []).map((item: any) => ({
    id: item.id as string,
    title: item.title as string,
    slug: item.slug as string,
    created_at: item.created_at as string,
    agency_name: relationName(item.agency),
  }));

  const topViewedTours = (topViewedToursResponse.data ?? []).map((item: any) => ({
    id: item.id as string,
    title: item.title as string,
    slug: item.slug as string,
    view_count: Number(item.view_count ?? 0),
    status: item.status as string,
    agency_name: relationName(item.agency),
  }));

  const incompleteTours = (qualityToursResponse.data ?? [])
    .map((item: any) => {
      const issues: string[] = [];
      if (!item.cover_image_url) issues.push('No cover image');
      if (!item.short_description) issues.push('No short description');
      const includedServices = Array.isArray(item.included_services) ? item.included_services : [];
      if (includedServices.length === 0) issues.push('No included services');
      return {
        id: item.id as string,
        title: item.title as string,
        slug: item.slug as string,
        status: item.status as string,
        created_at: item.created_at as string,
        issues,
      };
    })
    .filter((item) => item.issues.length > 0)
    .slice(0, 10);

  const expiringPromotions = (expiringPromotionsResponse.data ?? []).map((item: any) => ({
    id: item.id as string,
    placement_type: (item.placement_type as string | null) ?? null,
    ends_at: (item.ends_at as string | null) ?? null,
    tour_title: relationName(item.tour),
    agency_name: relationName(item.agency),
  }));

  const activeSubscriptionsRaw = activeSubscriptionsResponse.data ?? [];
  const activeSubscriptionAgencyIds = new Set(
    activeSubscriptionsRaw
      .map((item: any) => item.agency_id as string | null)
      .filter((id: string | null): id is string => Boolean(id))
  );

  const activeSubscriptions = activeSubscriptionAgencyIds.size;
  const estimatedMonthlyRevenue = activeSubscriptionsRaw.reduce((sum: number, item: any) => {
    const planValue = Array.isArray(item.plan) ? item.plan[0] : item.plan;
    const price = toNumber((planValue as { price_monthly?: number | string | null } | null)?.price_monthly ?? null);
    return sum + price;
  }, 0);

  const expiringSubscriptions = (expiringSubscriptionsResponse.data ?? []).map((item: any) => {
    const agencyValue = Array.isArray(item.agency) ? item.agency[0] : item.agency;
    const planValue = Array.isArray(item.plan) ? item.plan[0] : item.plan;
    return {
      id: item.id as string,
      agency_name: relationName(agencyValue),
      plan_name: relationName(planValue),
      ends_at: (item.ends_at as string | null) ?? null,
      price_monthly: toNumber((planValue as { price_monthly?: number | string | null } | null)?.price_monthly ?? null),
    };
  });

  const pendingModerationItems =
    toursPendingCount +
    pendingAgencyApprovals +
    pendingVerificationRequests +
    pendingCoinRequests +
    pendingAccountDeletionRequests;

  const actionCenter: AdminDashboardData['actionCenter'] = [
    {
      key: 'pending-tours',
      title: 'Pending Tours',
      description: 'Tours waiting for moderation approval',
      count: toursPendingCount,
      href: '/admin/tours',
      severity: toursPendingCount > 0 ? 'high' : 'neutral',
    },
    {
      key: 'pending-agencies',
      title: 'Pending Agencies',
      description: 'Agencies waiting for initial approval',
      count: pendingAgencyApprovals,
      href: '/admin/agencies',
      severity: pendingAgencyApprovals > 0 ? 'high' : 'neutral',
    },
    {
      key: 'verification-queue',
      title: 'Verification Queue',
      description: 'Submitted documents waiting admin decision',
      count: pendingVerificationRequests,
      href: '/admin/verification',
      severity: pendingVerificationRequests > 0 ? 'medium' : 'neutral',
    },
    {
      key: 'new-leads',
      title: 'New Leads (7d)',
      description: 'Recent traveler inquiries received',
      count: newLeads7d,
      href: '/admin/leads',
      severity: newLeads7d > 0 ? 'low' : 'neutral',
    },
    {
      key: 'coin-requests',
      title: 'Pending MaxCoin Requests',
      description: 'Coin top-up requests needing approval',
      count: pendingCoinRequests,
      href: '/admin/coin-requests',
      severity: pendingCoinRequests > 0 ? 'medium' : 'neutral',
    },
    {
      key: 'delete-requests',
      title: 'Delete Account Requests',
      description: 'User deletion requests awaiting review',
      count: pendingAccountDeletionRequests,
      href: '/admin/account-deletions',
      severity: pendingAccountDeletionRequests > 0 ? 'high' : 'neutral',
    },
  ];

  return {
    generatedAt: nowIso,
    summary: {
      totalUsers,
      totalAgencies,
      totalTours,
      totalLeads,
      newLeads7d,
      pendingModerationItems,
      pendingTours: toursPendingCount,
      pendingAgencyApprovals,
      pendingVerificationRequests,
      pendingCoinRequests,
      pendingAccountDeletionRequests,
      activeSubscriptions,
      activePromotions,
      expiringPromotions7d,
      maxCoinActivity7d,
      estimatedMonthlyRevenue: activeSubscriptionsRaw.length > 0 ? estimatedMonthlyRevenue : null,
    },
    breakdowns: {
      usersByRole: {
        user: roleUserCount,
        agency_manager: roleAgencyManagerCount,
        admin: roleAdminCount,
      },
      toursByStatus: {
        draft: toursDraftCount,
        pending: toursPendingCount,
        published: toursPublishedCount,
        archived: toursArchivedCount,
      },
      leadsByStatus: {
        new: leadsNewCount,
        contacted: leadsContactedCount,
        closed: leadsClosedCount,
        won: leadsWonCount,
        lost: leadsLostCount,
      },
      agencies: {
        approved: totalAgencies - pendingAgencyApprovals,
        pending: pendingAgencyApprovals,
        verified: verifiedAgenciesCount,
        unverified: totalAgencies - verifiedAgenciesCount,
        withActiveSubscription: activeSubscriptions,
      },
    },
    actionCenter,
    recent: {
      tours: recentTours,
      agencies: recentAgencies,
      leads: recentLeads,
      verificationQueue,
      pendingTours,
    },
    quality: {
      topViewedTours,
      incompleteTours,
      expiringSubscriptions,
      expiringPromotions,
    },
    warnings,
    unavailable,
  };
}

/** Admin: get coin purchase requests */
export async function getCoinRequests(status?: string) {
  await assertAdminAccess();
  const supabase = await createAdminClient();
  let query = supabase
    .from('coin_requests')
    .select('*, agency:agencies(name, slug, phone, telegram_username)')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data } = await query;
  return data ?? [];
}

/** Admin: leads operations payload with safe relations and health metadata */
export async function getAdminLeadsPanelData(): Promise<AdminLeadsPanelPayload> {
  await assertAdminAccess();
  const supabase = await createAdminClient();
  const generatedAt = new Date().toISOString();

  const leadsResult = await supabase
    .from('leads')
    .select(
      'id, user_id, agency_id, tour_id, full_name, phone, telegram_username, status, people_count, comment, created_at, updated_at, tour:tours(id, title, slug, cover_image_url, country, city, region, district, status, price, currency), agency:agencies(id, name, slug, phone, telegram_username, is_verified, is_approved), user:profiles(id, full_name, phone, email, telegram_username, role)'
    )
    .order('created_at', { ascending: false });

  if (leadsResult.error) {
    return {
      generatedAt,
      health: {
        lastUpdated: generatedAt,
        partialData: true,
        errors: [leadsResult.error.message],
      },
      leads: [],
    };
  }

  const rawLeads = (leadsResult.data ?? []) as LeadRowRaw[];

  const leads: AdminLeadPanelItem[] = rawLeads.map((lead) => {
    const leadTour = firstOrNull(lead.tour);
    const leadAgency = firstOrNull(lead.agency);
    const leadUser = firstOrNull(lead.user);

    return {
      id: lead.id,
      user_id: lead.user_id ?? null,
      agency_id: lead.agency_id,
      tour_id: lead.tour_id,
      full_name: lead.full_name,
      phone: lead.phone,
      telegram_username: lead.telegram_username,
      status: normalizeLeadStatus(lead.status),
      people_count: toNumber(lead.people_count),
      comment: lead.comment,
      created_at: lead.created_at,
      updated_at: lead.updated_at ?? lead.created_at,
      tour: leadTour
        ? {
            id: leadTour.id,
            title: leadTour.title,
            slug: leadTour.slug,
            cover_image_url: leadTour.cover_image_url,
            country: leadTour.country,
            city: leadTour.city,
            region: leadTour.region ?? null,
            district: leadTour.district ?? null,
            status: leadTour.status ?? null,
            price: leadTour.price == null ? null : toNumber(leadTour.price),
            currency: leadTour.currency,
          }
        : null,
      agency: leadAgency
        ? {
            id: leadAgency.id,
            name: leadAgency.name,
            slug: leadAgency.slug,
            phone: leadAgency.phone,
            telegram_username: leadAgency.telegram_username,
            is_verified: leadAgency.is_verified === true,
            is_approved: leadAgency.is_approved === true,
          }
        : null,
      user: leadUser
        ? {
            id: leadUser.id,
            full_name: leadUser.full_name,
            phone: leadUser.phone,
            email: leadUser.email,
            telegram_username: leadUser.telegram_username,
            role: leadUser.role,
          }
        : null,
    } satisfies AdminLeadPanelItem;
  });

  return {
    generatedAt,
    health: {
      lastUpdated: generatedAt,
      partialData: false,
      errors: [],
    },
    leads,
  };
}

/** Admin: compatibility query retained for existing callers */
export async function getAllLeads() {
  const payload = await getAdminLeadsPanelData();
  return payload.leads;
}

/** Admin: users list (profiles) */
export async function getAllUsers() {
  await assertAdminAccess();
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(500);

  return data ?? [];
}

/** Admin: agencies overview payload with real metrics for list/search/filter/sort */
export async function getAdminAgenciesOverview(): Promise<AdminAgenciesOverviewPayload> {
  await assertAdminAccess();
  const supabase = await createAdminClient();

  const [agenciesResult, toursResult, leadsResult, verificationResult, subscriptionsResult, promotionsResult] = await Promise.all([
    supabase
      .from('agencies')
      .select('id, owner_id, name, slug, description, logo_url, phone, telegram_username, instagram_url, website_url, address, city, country, google_maps_url, inn, responsible_person, certificate_pdf_url, license_pdf_url, is_verified, is_approved, maxcoin_balance, profile_views, review_count, avg_rating, created_at, updated_at, owner:profiles(id, full_name, telegram_username, phone, email, avatar_url, role)')
      .order('created_at', { ascending: false }),
    supabase
      .from('tours')
      .select('id, agency_id, title, slug, status, created_at, updated_at, country, city, price, currency, cover_image_url'),
    supabase
      .from('leads')
      .select('id, agency_id, tour_id, full_name, phone, telegram_username, status, people_count, comment, created_at'),
    supabase
      .from('verification_requests')
      .select('id, agency_id, status, admin_note, certificate_url, form_data, created_at, updated_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('agency_subscriptions')
      .select('id, agency_id, status, starts_at, ends_at, created_at, plan:subscription_plans(id, name, slug, price_monthly, max_active_tours, can_feature, has_priority_support)')
      .order('created_at', { ascending: false }),
    supabase
      .from('tour_promotions')
      .select('id, agency_id, is_active, ends_at'),
  ]);

  if (agenciesResult.error) throw agenciesResult.error;
  if (toursResult.error) throw toursResult.error;
  if (leadsResult.error) throw leadsResult.error;
  if (verificationResult.error) throw verificationResult.error;
  if (subscriptionsResult.error) throw subscriptionsResult.error;
  if (promotionsResult.error) throw promotionsResult.error;

  const agencies = (agenciesResult.data ?? []) as AgencyRowRaw[];
  const tours = (toursResult.data ?? []) as TourRowRaw[];
  const leads = (leadsResult.data ?? []) as LeadRowRaw[];
  const verificationRequests = (verificationResult.data ?? []) as VerificationRowRaw[];
  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRowRaw[];
  const promotions = (promotionsResult.data ?? []) as Array<{
    id: string;
    agency_id: string;
    is_active: boolean;
    ends_at: string;
  }>;

  const toursByAgency = groupByAgencyId(tours);
  const leadsByAgency = groupByAgencyId(leads);

  const latestVerificationByAgency = new Map<string, VerificationRowRaw>();
  for (const request of verificationRequests) {
    if (!latestVerificationByAgency.has(request.agency_id)) {
      latestVerificationByAgency.set(request.agency_id, request);
    }
  }

  const latestSubscriptionByAgency = new Map<string, SubscriptionRowRaw>();
  for (const subscription of subscriptions) {
    if (!latestSubscriptionByAgency.has(subscription.agency_id)) {
      latestSubscriptionByAgency.set(subscription.agency_id, subscription);
    }
  }

  const now = Date.now();
  const activePromotionCountByAgency = new Map<string, number>();
  for (const promotion of promotions) {
    const isActiveNow = promotion.is_active && new Date(promotion.ends_at).getTime() >= now;
    if (!isActiveNow) continue;

    const previous = activePromotionCountByAgency.get(promotion.agency_id) ?? 0;
    activePromotionCountByAgency.set(promotion.agency_id, previous + 1);
  }

  const rows: AdminAgencyListRow[] = agencies.map((agency) =>
    buildAgencyListRow({
      agency,
      tours: toursByAgency.get(agency.id) ?? [],
      leads: leadsByAgency.get(agency.id) ?? [],
      latestVerification: latestVerificationByAgency.get(agency.id),
      latestSubscription: latestSubscriptionByAgency.get(agency.id),
      activePromotions: activePromotionCountByAgency.get(agency.id) ?? 0,
    })
  );

  return {
    generatedAt: new Date().toISOString(),
    agencies: rows,
  };
}

/** Admin: full drill-down payload for a single agency */
export async function getAdminAgencyDetailById(agencyId: string): Promise<AdminAgencyDetailPayload | null> {
  await assertAdminAccess();
  const supabase = await createAdminClient();

  const [agencyResult, toursResult, leadsResult, verificationResult, subscriptionsResult, maxcoinResult, promotionsResult] = await Promise.all([
    supabase
      .from('agencies')
      .select('id, owner_id, name, slug, description, logo_url, phone, telegram_username, instagram_url, website_url, address, city, country, google_maps_url, inn, responsible_person, certificate_pdf_url, license_pdf_url, is_verified, is_approved, maxcoin_balance, profile_views, review_count, avg_rating, created_at, updated_at, owner:profiles(id, full_name, telegram_username, phone, email, avatar_url, role)')
      .eq('id', agencyId)
      .maybeSingle(),
    supabase
      .from('tours')
      .select('id, agency_id, title, slug, status, created_at, updated_at, country, city, price, currency, cover_image_url, departure_date, view_count')
      .eq('agency_id', agencyId)
      .order('updated_at', { ascending: false }),
    supabase
      .from('leads')
      .select('id, agency_id, tour_id, full_name, phone, telegram_username, status, people_count, comment, created_at, tour:tours(id, title, slug, cover_image_url, country, city, price, currency)')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false }),
    supabase
      .from('verification_requests')
      .select('id, agency_id, status, admin_note, certificate_url, form_data, created_at, updated_at')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false }),
    supabase
      .from('agency_subscriptions')
      .select('id, agency_id, status, starts_at, ends_at, created_at, plan:subscription_plans(id, name, slug, price_monthly, max_active_tours, can_feature, has_priority_support)')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false }),
    supabase
      .from('maxcoin_transactions')
      .select('id, agency_id, amount, type, description, tour_id, created_at')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('tour_promotions')
      .select('id, agency_id, tour_id, placement, cost_coins, starts_at, ends_at, is_active, created_at, tour:tours(id, title, slug, cover_image_url, status)')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  if (agencyResult.error) throw agencyResult.error;
  if (toursResult.error) throw toursResult.error;
  if (leadsResult.error) throw leadsResult.error;
  if (verificationResult.error) throw verificationResult.error;
  if (subscriptionsResult.error) throw subscriptionsResult.error;
  if (maxcoinResult.error) throw maxcoinResult.error;
  if (promotionsResult.error) throw promotionsResult.error;

  const agencyRaw = agencyResult.data as AgencyRowRaw | null;
  if (!agencyRaw) return null;

  const tours = (toursResult.data ?? []) as TourRowRaw[];
  const leads = (leadsResult.data ?? []) as LeadRowRaw[];
  const verificationRequests = (verificationResult.data ?? []) as VerificationRowRaw[];
  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRowRaw[];
  const maxcoinTransactions = (maxcoinResult.data ?? []) as MaxcoinTransactionRaw[];
  const promotions = (promotionsResult.data ?? []) as PromotionRowRaw[];

  const now = Date.now();
  const activePromotions = promotions.filter((promotion) => {
    return promotion.is_active && new Date(promotion.ends_at).getTime() >= now;
  }).length;

  const agency = buildAgencyListRow({
    agency: agencyRaw,
    tours,
    leads,
    latestVerification: verificationRequests[0],
    latestSubscription: subscriptions[0],
    activePromotions,
  });

  const toursPreview: AdminAgencyTourPreview[] = tours.map((tour) => ({
    id: tour.id,
    agency_id: tour.agency_id,
    title: tour.title,
    slug: tour.slug,
    status: tour.status,
    created_at: tour.created_at,
    updated_at: tour.updated_at,
    country: tour.country,
    city: tour.city,
    price: tour.price == null ? null : toNumber(tour.price),
    currency: tour.currency,
    cover_image_url: tour.cover_image_url,
    departure_date: tour.departure_date ?? null,
    view_count: tour.view_count == null ? null : toNumber(tour.view_count),
  }));

  const leadsPreview: AdminAgencyLeadPreview[] = leads.map((lead) => {
    const leadTour = firstOrNull(lead.tour);
    return {
      id: lead.id,
      agency_id: lead.agency_id,
      tour_id: lead.tour_id,
      full_name: lead.full_name,
      phone: lead.phone,
      telegram_username: lead.telegram_username,
      status: lead.status,
      people_count: toNumber(lead.people_count),
      comment: lead.comment,
      created_at: lead.created_at,
      tour: leadTour
        ? {
            id: leadTour.id,
            title: leadTour.title,
            slug: leadTour.slug,
            cover_image_url: leadTour.cover_image_url,
            country: leadTour.country,
            city: leadTour.city,
            price: leadTour.price == null ? null : toNumber(leadTour.price),
            currency: leadTour.currency,
          }
        : null,
    };
  });

  const verificationItems: AdminAgencyVerificationItem[] = verificationRequests.map((item) => ({
    id: item.id,
    agency_id: item.agency_id,
    status: item.status,
    admin_note: item.admin_note,
    certificate_url: item.certificate_url,
    form_data: item.form_data,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));

  const subscriptionItems: AdminAgencySubscriptionSummary[] = subscriptions.map((subscription) =>
    buildSubscriptionSummary(subscription)
  );

  const maxcoinItems: AdminAgencyMaxcoinTransaction[] = maxcoinTransactions.map((transaction) => ({
    id: transaction.id,
    agency_id: transaction.agency_id,
    amount: toNumber(transaction.amount),
    type: transaction.type,
    description: transaction.description,
    tour_id: transaction.tour_id,
    created_at: transaction.created_at,
  }));

  const promotionItems: AdminAgencyPromotion[] = promotions.map((promotion) => {
    const promotionTour = firstOrNull(promotion.tour);
    return {
      id: promotion.id,
      agency_id: promotion.agency_id,
      tour_id: promotion.tour_id,
      placement: promotion.placement,
      cost_coins: toNumber(promotion.cost_coins),
      starts_at: promotion.starts_at,
      ends_at: promotion.ends_at,
      is_active: promotion.is_active,
      created_at: promotion.created_at,
      tour: promotionTour
        ? {
            id: promotionTour.id,
            title: promotionTour.title,
            slug: promotionTour.slug,
            cover_image_url: promotionTour.cover_image_url,
            status: promotionTour.status,
          }
        : null,
    };
  });

  return {
    agency,
    tours: toursPreview,
    leads: leadsPreview,
    verificationRequests: verificationItems,
    subscriptions: subscriptionItems,
    maxcoinTransactions: maxcoinItems,
    promotions: promotionItems,
  };
}

type AdminPromotionsPanelMode = 'full' | 'featured';

interface AdminPromotionsMaxcoinPanelOptions {
  mode?: AdminPromotionsPanelMode;
}

/** Admin: Promotions / MaxCoin operations payload */
export async function getAdminPromotionsMaxcoinPanelData(
  options: AdminPromotionsMaxcoinPanelOptions = {}
): Promise<AdminPromotionsMaxcoinPanelPayload> {
  await assertAdminAccess();
  const supabase = await createAdminClient();
  const generatedAt = new Date().toISOString();
  const errors: string[] = [];
  const mode = options.mode ?? 'full';
  const includeFinancialData = mode === 'full';
  const tourPromotionsLimit = mode === 'featured' ? 320 : 600;
  const featuredItemsLimit = mode === 'featured' ? 240 : 300;

  const [
    tourPromotionsResult,
    featuredItemsResult,
    promotionTiersResult,
  ] = await Promise.all([
    supabase
      .from('tour_promotions')
      .select(
        'id, agency_id, tour_id, placement, cost_coins, starts_at, ends_at, is_active, created_at, wallet_type, tour:tours(id, title, slug, cover_image_url, status, view_count, country, city, region, district), agency:agencies(id, name, slug, is_verified, is_approved, maxcoin_balance, maxcoin_bonus_balance, maxcoin_bonus_earned_total, phone, telegram_username, responsible_person)'
      )
      .order('created_at', { ascending: false })
      .limit(tourPromotionsLimit),
    supabase
      .from('featured_items')
      .select(
        'id, agency_id, tour_id, placement_type, starts_at, ends_at, created_at, tour:tours(id, title, slug, cover_image_url, status, view_count, country, city, region, district), agency:agencies(id, name, slug, is_verified, is_approved, maxcoin_balance, maxcoin_bonus_balance, maxcoin_bonus_earned_total, phone, telegram_username, responsible_person)'
      )
      .order('starts_at', { ascending: false })
      .limit(featuredItemsLimit),
    supabase
      .from('promotion_tiers')
      .select('id, placement, coins, days, sort_order, created_at')
      .order('sort_order', { ascending: true }),
  ]);

  if (tourPromotionsResult.error) {
    errors.push(`tour_promotions: ${tourPromotionsResult.error.message}`);
  }
  if (featuredItemsResult.error) {
    errors.push(`featured_items: ${featuredItemsResult.error.message}`);
  }
  if (promotionTiersResult.error) {
    errors.push(`promotion_tiers: ${promotionTiersResult.error.message}`);
  }

  const tourPromotions = (tourPromotionsResult.data ?? []) as PromotionPanelTourPromotionRaw[];
  const featuredItems = (featuredItemsResult.data ?? []) as PromotionPanelFeaturedItemRaw[];
  let maxcoinTransactionsRaw: PromotionPanelTransactionRaw[] = [];
  let coinRequestsRaw: PromotionPanelCoinRequestRaw[] = [];
  let agencyBalancesRaw: PromotionPanelAgencyBalanceRaw[] = [];
  const promotionTiersRaw = (promotionTiersResult.data ?? []) as PromotionPanelTierRaw[];

  if (includeFinancialData) {
    const [
      maxcoinTransactionsResult,
      coinRequestsResult,
      agencyBalancesResult,
    ] = await Promise.all([
      supabase
        .from('maxcoin_transactions')
        .select(
          'id, agency_id, amount, type, description, tour_id, wallet_type, created_at, agency:agencies(id, name, slug, is_verified, is_approved, maxcoin_balance, maxcoin_bonus_balance, maxcoin_bonus_earned_total, phone, telegram_username, responsible_person), tour:tours(id, title, slug, cover_image_url, status, view_count, country, city, region, district)'
        )
        .order('created_at', { ascending: false })
        .limit(600),
      supabase
        .from('coin_requests')
        .select(
          'id, agency_id, coins, price_uzs, status, admin_note, created_at, resolved_at, agency:agencies(id, name, slug, is_verified, is_approved, maxcoin_balance, maxcoin_bonus_balance, maxcoin_bonus_earned_total, phone, telegram_username, responsible_person)'
        )
        .order('created_at', { ascending: false })
        .limit(400),
      supabase
        .from('agencies')
        .select(
          'id, name, slug, maxcoin_balance, maxcoin_bonus_balance, maxcoin_bonus_earned_total, is_verified, is_approved, phone, telegram_username, responsible_person, updated_at'
        )
        .order('updated_at', { ascending: false })
        .limit(1200),
    ]);

    if (maxcoinTransactionsResult.error) {
      errors.push(`maxcoin_transactions: ${maxcoinTransactionsResult.error.message}`);
    }
    if (coinRequestsResult.error) {
      errors.push(`coin_requests: ${coinRequestsResult.error.message}`);
    }
    if (agencyBalancesResult.error) {
      errors.push(`agencies: ${agencyBalancesResult.error.message}`);
    }

    maxcoinTransactionsRaw = (maxcoinTransactionsResult.data ?? []) as PromotionPanelTransactionRaw[];
    coinRequestsRaw = (coinRequestsResult.data ?? []) as PromotionPanelCoinRequestRaw[];
    agencyBalancesRaw = (agencyBalancesResult.data ?? []) as PromotionPanelAgencyBalanceRaw[];
  }

  const nowMs = Date.now();

  const promotions: AdminPromotionPanelRecord[] = [
    ...tourPromotions.map((item) => {
      const source: AdminPromotionRecordSource = 'tour_promotion';
      return {
        id: `${source}:${item.id}`,
        source,
        sourceId: item.id,
        agency_id: item.agency_id,
        tour_id: item.tour_id,
        placement: item.placement,
        starts_at: item.starts_at,
        ends_at: item.ends_at,
        created_at: item.created_at,
        is_active: item.is_active,
        status: computePromotionStatus({
          startsAt: item.starts_at,
          endsAt: item.ends_at,
          isActive: item.is_active,
          nowMs,
        }),
        maxcoin_cost: item.cost_coins == null ? null : toNumber(item.cost_coins),
        lead_count: 0,
        latest_lead_at: null,
        tour: buildPromotionTourPreview(item.tour),
        agency: buildPromotionAgencyPreview(item.agency),
      };
    }),
    ...featuredItems.map((item) => {
      const source: AdminPromotionRecordSource = 'featured_item';
      return {
        id: `${source}:${item.id}`,
        source,
        sourceId: item.id,
        agency_id: item.agency_id,
        tour_id: item.tour_id,
        placement: item.placement_type,
        starts_at: item.starts_at,
        ends_at: item.ends_at,
        created_at: item.created_at,
        is_active: null,
        status: computePromotionStatus({
          startsAt: item.starts_at,
          endsAt: item.ends_at,
          isActive: true,
          nowMs,
        }),
        maxcoin_cost: null,
        lead_count: 0,
        latest_lead_at: null,
        tour: buildPromotionTourPreview(item.tour),
        agency: buildPromotionAgencyPreview(item.agency),
      };
    }),
  ].sort((a, b) => {
    const left = isValidIso(a.created_at)
      ? new Date(a.created_at).getTime()
      : isValidIso(a.starts_at)
        ? new Date(a.starts_at).getTime()
        : 0;
    const right = isValidIso(b.created_at)
      ? new Date(b.created_at).getTime()
      : isValidIso(b.starts_at)
        ? new Date(b.starts_at).getTime()
        : 0;
    return right - left;
  });

  const promotedTourIds = Array.from(
    new Set(
      promotions
        .map((item) => item.tour_id)
        .filter((tourId): tourId is string => Boolean(tourId))
    )
  );

  const leadSummaryByTour = new Map<string, { count: number; latestLeadAt: string | null }>();
  if (promotedTourIds.length > 0) {
    const leadsResult = await supabase
      .from('leads')
      .select('tour_id, created_at')
      .in('tour_id', promotedTourIds);

    if (leadsResult.error) {
      errors.push(`leads: ${leadsResult.error.message}`);
    } else {
      const leadRows = (leadsResult.data ?? []) as PromotionLeadMetricRaw[];
      for (const row of leadRows) {
        if (!row.tour_id) continue;
        const previous = leadSummaryByTour.get(row.tour_id) ?? {
          count: 0,
          latestLeadAt: null,
        };
        leadSummaryByTour.set(row.tour_id, {
          count: previous.count + 1,
          latestLeadAt: latestIso([previous.latestLeadAt, row.created_at]),
        });
      }
    }
  }

  const promotionsWithLeads: AdminPromotionPanelRecord[] = promotions.map((item) => {
    const leadSummary = item.tour_id ? leadSummaryByTour.get(item.tour_id) : undefined;
    return {
      ...item,
      lead_count: leadSummary?.count ?? 0,
      latest_lead_at: leadSummary?.latestLeadAt ?? null,
    };
  });

  const maxcoinTransactions: AdminMaxcoinLedgerRecord[] = maxcoinTransactionsRaw.map((item) => ({
    id: item.id,
    agency_id: item.agency_id,
    amount: toNumber(item.amount),
    type: item.type,
    description: item.description,
    tour_id: item.tour_id,
    wallet_type: item.wallet_type === 'bonus' ? 'bonus' : 'main',
    created_at: item.created_at,
    agency: buildPromotionAgencyPreview(item.agency),
    tour: buildPromotionTourPreview(item.tour),
  }));

  const coinRequests: AdminCoinRequestPanelRecord[] = coinRequestsRaw.map((item) => ({
    id: item.id,
    agency_id: item.agency_id,
    coins: toNumber(item.coins),
    price_uzs: toNumber(item.price_uzs),
    status: item.status ?? 'pending',
    admin_note: item.admin_note,
    created_at: item.created_at,
    resolved_at: item.resolved_at,
    agency: buildPromotionAgencyPreview(item.agency),
  }));

  const agencyBalances: AdminAgencyBalancePanelRecord[] = agencyBalancesRaw.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    maxcoin_balance: toNumber(item.maxcoin_balance),
    maxcoin_bonus_balance: toNumber(item.maxcoin_bonus_balance),
    maxcoin_bonus_earned_total: toNumber(item.maxcoin_bonus_earned_total),
    is_verified: item.is_verified === true,
    is_approved: item.is_approved === true,
    phone: item.phone,
    telegram_username: item.telegram_username,
    responsible_person: item.responsible_person,
    updated_at: item.updated_at,
  }));

  const bonusSummary = {
    totalBonusBalance: agencyBalances.reduce((sum, row) => sum + row.maxcoin_bonus_balance, 0),
    totalBonusEarned: agencyBalances.reduce((sum, row) => sum + row.maxcoin_bonus_earned_total, 0),
    totalBonusGranted: maxcoinTransactions
      .filter((row) => row.wallet_type === 'bonus' && row.amount > 0)
      .reduce((sum, row) => sum + row.amount, 0),
    totalBonusSpent: maxcoinTransactions
      .filter((row) => row.wallet_type === 'bonus' && row.amount < 0)
      .reduce((sum, row) => sum + Math.abs(row.amount), 0),
    agenciesWithBonusBalance: agencyBalances.filter((row) => row.maxcoin_bonus_balance > 0).length,
  };

  const seenTierKeys = new Set<string>();
  const promotionTiers: AdminPromotionTierPanelRecord[] = promotionTiersRaw
    .filter((item) => item.placement != null)
    .filter((item) => {
      const key = `${item.placement}_${toNumber(item.days)}`;
      if (seenTierKeys.has(key)) return false;
      seenTierKeys.add(key);
      return true;
    })
    .map((item) => ({
      id: item.id,
      placement: item.placement ?? 'unknown',
      coins: toNumber(item.coins),
      days: toNumber(item.days),
      sort_order: toNumber(item.sort_order),
      created_at: item.created_at,
    }));

  return {
    generatedAt,
    health: {
      lastUpdated: generatedAt,
      partialData: errors.length > 0,
      errors,
    },
    promotions: promotionsWithLeads,
    maxcoinTransactions,
    coinRequests,
    agencyBalances,
    promotionTiers,
    bonusSummary,
  };
}
