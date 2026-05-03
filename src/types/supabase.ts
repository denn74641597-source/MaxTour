export const MOBILE_SUPABASE_TABLES = [
  'agencies',
  'agency_follows',
  'agency_subscriptions',
  'call_tracking',
  'coin_requests',
  'favorites',
  'leads',
  'maxcoin_transactions',
  'notification_preferences',
  'profiles',
  'promotion_tiers',
  'reviews',
  'subscription_plans',
  'tour_promotions',
  'tours',
  'verification_requests',
] as const;

export const MOBILE_SUPABASE_RPCS = [
  'get_verified_agencies_ranked',
  'get_agency_total_views',
  'get_agency_analytics',
  'get_featured_premium_tours_v1',
  'register_featured_impression_by_tour_v1',
  'register_featured_click_by_tour_v1',
  'get_fair_promoted_tours_v1',
  'get_hot_tours_ranked',
  'get_recommended_tours',
  'get_sponsored_tours',
  'get_tours_by_engagement',
  'increment_view_count',
  'search_tours_public_v1',
  'promote_tour_fair_v1',
  'promote_tour_featured_fair_v1',
] as const;

export const MOBILE_EDGE_FUNCTIONS = [
  'translate-tour',
  'request-account-deletion',
] as const;

export type MobileSupabaseTable = (typeof MOBILE_SUPABASE_TABLES)[number];
export type MobileSupabaseRpc = (typeof MOBILE_SUPABASE_RPCS)[number];
export type MobileEdgeFunction = (typeof MOBILE_EDGE_FUNCTIONS)[number];

export type UserRole = 'user' | 'agency_manager' | 'admin';
export type LeadStatus = 'new' | 'contacted' | 'closed' | 'won' | 'lost';
export type TourStatus = 'draft' | 'pending' | 'published' | 'archived';
export type PromotionPlacement = 'featured' | 'hot_deals' | 'hot_tours';

export interface ProfileRow {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  telegram_username: string | null;
  avatar_url: string | null;
  push_token: string | null;
  deletion_requested_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgencyRow {
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
  license_pdf_url: string | null;
  certificate_pdf_url: string | null;
  is_verified: boolean;
  is_approved: boolean;
  profile_views: number;
  avg_rating: number | null;
  review_count: number;
  maxcoin_balance?: number | null;
  created_at: string;
  updated_at: string;
}

export interface TourRow {
  id: string;
  agency_id: string;
  title: string;
  slug: string;
  country: string;
  city: string | null;
  price: number;
  currency: 'USD' | 'UZS' | 'EUR';
  status: TourStatus;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface LeadRow {
  id: string;
  tour_id: string;
  agency_id: string;
  user_id: string | null;
  full_name: string;
  phone: string;
  telegram_username: string | null;
  comment: string | null;
  people_count: number;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface VerificationRequestRow {
  id: string;
  agency_id: string;
  certificate_url: string | null;
  form_data: Record<string, unknown> | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromotionTierRow {
  id: string;
  placement: PromotionPlacement;
  coins: number;
  days: number;
  sort_order: number;
  created_at: string;
}

export interface SearchToursPublicParams {
  p_search_pattern: string | null;
  p_city_pattern: string | null;
  p_country_pattern: string | null;
  p_min_price: number | null;
  p_max_price: number | null;
  p_visa_free: boolean | null;
  p_transport_type: string | null;
  p_meal_type: string | null;
  p_category_pattern: string | null;
  p_sort_by: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'newest' | 'popular';
  p_limit: number;
  p_page: number;
  p_cursor_created_at: string | null;
  p_cursor_id: string | null;
  p_use_keyset: boolean;
}

export interface PromoteTourResult {
  success?: boolean;
  error?: string;
  errorCode?:
    | 'TIER_NOT_FOUND'
    | 'INSUFFICIENT_BALANCE'
    | 'TOUR_ALREADY_PROMOTED_OR_WAITLISTED'
    | 'AGENCY_ACTIVE_PLACEMENT_LOCKED'
    | 'PROMOTION_FAILED';
  lockUntil?: string;
  status?: 'active' | 'waitlist';
  chargedNow?: boolean;
  currentBalance?: number;
  newBalance?: number;
  required?: number;
  current?: number;
}

export interface NotificationPreferencesRow {
  user_id: string;
  created_at: string;
  updated_at: string;
  new_tour_from_followed?: boolean;
  price_drop?: boolean;
  seats_low?: boolean;
  tour_cancelled?: boolean;
  departure_reminder?: boolean;
  hot_deals?: boolean;
  lead_confirmed?: boolean;
  lead_status_changed?: boolean;
  agency_verified_notify?: boolean;
  weekly_picks?: boolean;
  new_lead?: boolean;
  daily_leads_summary?: boolean;
  pending_leads_reminder?: boolean;
  tour_approved?: boolean;
  tour_rejected?: boolean;
  tour_milestone?: boolean;
  seats_alert?: boolean;
  tour_expiring?: boolean;
  subscription_expiring?: boolean;
  subscription_expired?: boolean;
  new_review?: boolean;
  new_follower?: boolean;
  follower_milestone?: boolean;
  verification_update?: boolean;
}
