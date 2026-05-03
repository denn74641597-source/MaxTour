export interface AdminAgencyOwner {
  id: string;
  full_name: string | null;
  telegram_username: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
}

export type AdminVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface AdminAgencyVerificationSummary {
  latestRequestId: string | null;
  latestStatus: AdminVerificationStatus | null;
  latestSubmittedAt: string | null;
  latestUpdatedAt: string | null;
  latestAdminNote: string | null;
  latestCertificateUrl: string | null;
}

export interface AdminAgencySubscriptionSummary {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  plan: {
    id: string;
    name: string;
    slug: string;
    priceMonthly: number;
    maxActiveTours: number;
    canFeature: boolean;
    hasPrioritySupport: boolean;
  } | null;
}

export interface AdminAgencyStats {
  totalTours: number;
  publishedTours: number;
  totalLeads: number;
  recentLeads30d: number;
  activePromotions: number;
  lastTourAt: string | null;
  lastLeadAt: string | null;
  lastActivityAt: string | null;
  missingFieldCount: number;
  missingFields: string[];
}

export interface AdminAgencyListRow {
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
  maxcoin_balance: number;
  profile_views: number;
  review_count: number;
  avg_rating: number;
  created_at: string;
  updated_at: string;
  owner: AdminAgencyOwner | null;
  stats: AdminAgencyStats;
  verification: AdminAgencyVerificationSummary;
  subscription: AdminAgencySubscriptionSummary | null;
}

export interface AdminAgencyTourPreview {
  id: string;
  agency_id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  country: string | null;
  city: string | null;
  price: number | null;
  currency: string | null;
  cover_image_url: string | null;
  departure_date: string | null;
  view_count: number | null;
}

export interface AdminAgencyLeadPreview {
  id: string;
  agency_id: string;
  tour_id: string | null;
  full_name: string;
  phone: string;
  telegram_username: string | null;
  status: string;
  people_count: number;
  comment: string | null;
  created_at: string;
  tour: {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    country: string | null;
    city: string | null;
    price: number | null;
    currency: string | null;
  } | null;
}

export interface AdminAgencyVerificationItem {
  id: string;
  agency_id: string;
  status: AdminVerificationStatus;
  admin_note: string | null;
  certificate_url: string | null;
  form_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AdminAgencyMaxcoinTransaction {
  id: string;
  agency_id: string;
  amount: number;
  type: string;
  description: string | null;
  tour_id: string | null;
  created_at: string;
}

export interface AdminAgencyPromotion {
  id: string;
  agency_id: string;
  tour_id: string;
  placement: string;
  cost_coins: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  tour: {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    status: string;
  } | null;
}

export interface AdminAgencyDetailPayload {
  agency: AdminAgencyListRow;
  tours: AdminAgencyTourPreview[];
  leads: AdminAgencyLeadPreview[];
  verificationRequests: AdminAgencyVerificationItem[];
  subscriptions: AdminAgencySubscriptionSummary[];
  maxcoinTransactions: AdminAgencyMaxcoinTransaction[];
  promotions: AdminAgencyPromotion[];
}

export interface AdminAgenciesOverviewPayload {
  generatedAt: string;
  agencies: AdminAgencyListRow[];
}

export interface AdminTourLeadSummary {
  count: number;
  latestLeadAt: string | null;
}

export interface AdminTourPromotionItem {
  id: string;
  tour_id: string;
  agency_id: string | null;
  placement: string | null;
  cost_coins: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string | null;
  status?: string | null;
}

export interface AdminTourPanelItem {
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
  price: number | null;
  old_price: number | null;
  currency: string | null;
  departure_date: string | null;
  departure_month: string | null;
  return_date: string | null;
  duration_days: number | null;
  duration_nights: number | null;
  seats_total: number | null;
  seats_left: number | null;
  view_count: number;
  is_featured: boolean;
  destinations: string[];
  included_services: string[];
  excluded_services: string[];
  extra_charges: Array<Record<string, unknown>>;
  variable_charges: Array<Record<string, unknown>>;
  what_to_bring: string[];
  hotels: Array<Record<string, unknown>>;
  hotel_images: string[];
  operator_phone: string | null;
  operator_telegram_username: string | null;
  additional_info: string | null;
  meeting_point: string | null;
  guide_name: string | null;
  guide_phone: string | null;
  domestic_category: string | null;
  agency: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    is_verified: boolean;
    is_approved: boolean;
    phone: string | null;
    telegram_username: string | null;
  } | null;
  images: Array<{
    id: string;
    image_url: string;
    sort_order: number | null;
  }>;
  promotions: AdminTourPromotionItem[];
  activePromotions: AdminTourPromotionItem[];
  leadSummary: AdminTourLeadSummary;
}

export interface AdminToursPanelHealth {
  lastUpdated: string;
  partialData: boolean;
  errors: string[];
}

export interface AdminToursPanelPayload {
  generatedAt: string;
  health: AdminToursPanelHealth;
  tours: AdminTourPanelItem[];
}

export type AdminPromotionRecordSource = 'tour_promotion' | 'featured_item';

export type AdminPromotionComputedStatus = 'active' | 'scheduled' | 'pending' | 'expired';

export interface AdminPromotionTourPreview {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  status: string | null;
  view_count: number | null;
  country: string | null;
  city: string | null;
  region: string | null;
  district: string | null;
}

export interface AdminPromotionAgencyPreview {
  id: string;
  name: string;
  slug: string;
  is_verified: boolean | null;
  is_approved: boolean | null;
  maxcoin_balance: number | null;
  phone: string | null;
  telegram_username: string | null;
  responsible_person: string | null;
}

export interface AdminPromotionPanelRecord {
  id: string;
  source: AdminPromotionRecordSource;
  sourceId: string;
  agency_id: string | null;
  tour_id: string | null;
  placement: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
  is_active: boolean | null;
  status: AdminPromotionComputedStatus;
  maxcoin_cost: number | null;
  lead_count: number;
  latest_lead_at: string | null;
  tour: AdminPromotionTourPreview | null;
  agency: AdminPromotionAgencyPreview | null;
}

export interface AdminMaxcoinLedgerRecord {
  id: string;
  agency_id: string | null;
  amount: number;
  type: string | null;
  description: string | null;
  tour_id: string | null;
  created_at: string;
  agency: AdminPromotionAgencyPreview | null;
  tour: AdminPromotionTourPreview | null;
}

export interface AdminCoinRequestPanelRecord {
  id: string;
  agency_id: string | null;
  coins: number;
  price_uzs: number;
  status: string;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  agency: AdminPromotionAgencyPreview | null;
}

export interface AdminAgencyBalancePanelRecord {
  id: string;
  name: string;
  slug: string;
  maxcoin_balance: number;
  is_verified: boolean;
  is_approved: boolean;
  phone: string | null;
  telegram_username: string | null;
  responsible_person: string | null;
  updated_at: string;
}

export interface AdminPromotionTierPanelRecord {
  id: string;
  placement: string;
  coins: number;
  days: number;
  sort_order: number;
  created_at: string;
}

export interface AdminPromotionsPanelHealth {
  lastUpdated: string;
  partialData: boolean;
  errors: string[];
}

export interface AdminPromotionsMaxcoinPanelPayload {
  generatedAt: string;
  health: AdminPromotionsPanelHealth;
  promotions: AdminPromotionPanelRecord[];
  maxcoinTransactions: AdminMaxcoinLedgerRecord[];
  coinRequests: AdminCoinRequestPanelRecord[];
  agencyBalances: AdminAgencyBalancePanelRecord[];
  promotionTiers: AdminPromotionTierPanelRecord[];
}

export type AdminLeadStatus = 'new' | 'contacted' | 'closed' | 'won' | 'lost';

export interface AdminLeadUserSnapshot {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  telegram_username: string | null;
  role: string | null;
}

export interface AdminLeadTourSnapshot {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  district: string | null;
  status: string | null;
  price: number | null;
  currency: string | null;
}

export interface AdminLeadAgencySnapshot {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  telegram_username: string | null;
  is_verified: boolean;
  is_approved: boolean;
}

export interface AdminLeadPanelItem {
  id: string;
  user_id: string | null;
  agency_id: string;
  tour_id: string | null;
  full_name: string;
  phone: string;
  telegram_username: string | null;
  status: AdminLeadStatus;
  people_count: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  user: AdminLeadUserSnapshot | null;
  tour: AdminLeadTourSnapshot | null;
  agency: AdminLeadAgencySnapshot | null;
}

export interface AdminLeadsPanelHealth {
  lastUpdated: string;
  partialData: boolean;
  errors: string[];
}

export interface AdminLeadsPanelPayload {
  generatedAt: string;
  health: AdminLeadsPanelHealth;
  leads: AdminLeadPanelItem[];
}

export type AdminUserRole = 'user' | 'agency_manager' | 'admin';

export type AdminUserActivityStatus = 'active_30d' | 'quiet_90d' | 'dormant_90d';
export type AdminUserAccountState = 'active' | 'deletion_requested';

export interface AdminUserAgencySummary {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUserFavoritePreview {
  id: string;
  tour_id: string;
  created_at: string;
  tour: {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    status: string;
    country: string | null;
    city: string | null;
  } | null;
}

export interface AdminUserLeadPreview {
  id: string;
  tour_id: string | null;
  agency_id: string;
  status: string;
  created_at: string;
  full_name: string;
  phone: string;
  tour: {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    status: string;
  } | null;
  agency: {
    id: string;
    name: string;
    slug: string;
    is_verified: boolean;
    is_approved: boolean;
  } | null;
}

export interface AdminUserReviewPreview {
  id: string;
  agency_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  agency: {
    id: string;
    name: string;
    slug: string;
    is_verified: boolean;
    is_approved: boolean;
  } | null;
}

export interface AdminUserManagedTourPreview {
  id: string;
  agency_id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  cover_image_url: string | null;
  view_count: number;
  country: string | null;
  city: string | null;
}

export interface AdminUserQuality {
  completenessPercent: number;
  missingFields: string[];
  hasDuplicateEmail: boolean;
  hasDuplicatePhone: boolean;
  noActivityAfterRegistration: boolean;
  missingAgencyForManager: boolean;
  warnings: string[];
}

export interface AdminUserStats {
  favoritesCount: number;
  leadsCount: number;
  reviewsCount: number;
  managedAgencyCount: number;
  toursCreatedCount: number;
  totalTourViews: number;
  lastActivityAt: string | null;
  activityStatus: AdminUserActivityStatus;
}

export interface AdminUserPanelRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  telegram_username: string | null;
  avatar_url: string | null;
  role: AdminUserRole;
  created_at: string;
  updated_at: string;
  deletion_requested_at: string | null;
  accountState: AdminUserAccountState;
  linkedAgencies: AdminUserAgencySummary[];
  locationLabel: string | null;
  stats: AdminUserStats;
  quality: AdminUserQuality;
  favoritesPreview: AdminUserFavoritePreview[];
  leadsPreview: AdminUserLeadPreview[];
  reviewsPreview: AdminUserReviewPreview[];
  managedToursPreview: AdminUserManagedTourPreview[];
}

export interface AdminUsersPanelHealth {
  partialData: boolean;
  errors: string[];
  unavailableMetrics: string[];
}

export interface AdminUsersPanelPayload {
  generatedAt: string;
  health: AdminUsersPanelHealth;
  users: AdminUserPanelRow[];
}
