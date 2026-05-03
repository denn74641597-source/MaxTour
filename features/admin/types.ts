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
