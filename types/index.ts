// Database types matching the Supabase schema

export type UserRole = 'user' | 'agency_manager' | 'admin';
export type TourStatus = 'draft' | 'pending' | 'published' | 'archived';
export type LeadStatus = 'new' | 'contacted' | 'closed' | 'won' | 'lost';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trial';
export type MealType = 'none' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive';
export type TransportType = 'flight' | 'bus' | 'train' | 'self' | 'mixed';
export type TourType = 'international' | 'domestic';
export type DomesticTourCategory = 'excursion' | 'nature' | 'historical' | 'pilgrimage' | 'recreation' | 'adventure';
export type Currency = 'USD' | 'UZS' | 'EUR';
export type TourCategoryTag =
  | 'family'
  | 'all_inclusive'
  | 'honeymoon'
  | 'umrah'
  | 'shopping'
  | 'group'
  | 'vip'
  | 'sanatorium'
  | 'medical'
  | 'aquapark'
  | 'cruise'
  | 'combo'
  | 'beach'
  | 'nature'
  | 'historical'
  | 'megapolis';
export type PlacementType = 'home_featured' | 'category_top' | 'search_boost';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  telegram_username: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agency {
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
  created_at: string;
  updated_at: string;
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface VerificationFormData {
  company_name: string;
  registered_name: string;
  country: string;
  office_address: string;
  work_phone: string;
  work_email: string;
  telegram_link: string;
  instagram_url: string;
  website_url: string;
  inn: string;
  registration_number: string;
  certificate_pdf_url: string;
  license_pdf_url: string;
}

export interface VerificationRequest {
  id: string;
  agency_id: string;
  certificate_url: string | null;
  form_data: VerificationFormData | null;
  status: VerificationStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  max_active_tours: number;
  can_feature: boolean;
  has_priority_support: boolean;
  created_at: string;
}

export interface AgencySubscription {
  id: string;
  agency_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  starts_at: string;
  ends_at: string;
  created_at: string;
  // Joined
  plan?: SubscriptionPlan;
}

export interface ComboHotelEntry {
  city: string;
  name: string;
  booking_url: string | null;
  image_url: string | null;
}

export interface ComboHotelVariant {
  price: number;
  hotels: ComboHotelEntry[];
}

export interface TourHotel {
  name: string;
  stars: number | null;
  price: number;
  description: string | null;
  booking_url: string | null;
  images: string[];
}

export interface Tour {
  id: string;
  agency_id: string;
  title: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  country: string;
  city: string | null;
  departure_date: string | null;
  departure_month: string | null;
  return_date: string | null;
  duration_days: number | null;
  duration_nights: number | null;
  price: number;
  old_price: number | null;
  currency: Currency;
  seats_total: number | null;
  seats_left: number | null;
  hotel_name: string | null;
  hotel_stars: number | null;
  hotel_booking_url: string | null;
  hotel_images: string[];
  hotels: TourHotel[];
  combo_hotels: ComboHotelVariant[];
  destinations: string[];
  airline: string | null;
  extra_charges: { name: string; amount: number; required?: boolean }[];
  variable_charges: { name: string; min_amount: number; max_amount: number; required?: boolean }[];
  meal_type: MealType;
  transport_type: TransportType;
  visa_required: boolean;
  included_services: string[];
  excluded_services: string[];
  status: TourStatus;
  is_featured: boolean;
  cover_image_url: string | null;
  operator_telegram_username: string | null;
  operator_phone: string | null;
  category: TourCategoryTag | null;
  additional_info: string | null;
  view_count: number;
  tour_type: TourType;
  domestic_category: DomesticTourCategory | null;
  region: string | null;
  district: string | null;
  meeting_point: string | null;
  what_to_bring: string[];
  guide_name: string | null;
  guide_phone: string | null;
  created_at: string;
  updated_at: string;
  // Translation columns (filled by translate-tour edge function via DeepL)
  title_uz: string | null;
  title_ru: string | null;
  description_uz: string | null;
  description_ru: string | null;
  included_services_uz: string[] | null;
  included_services_ru: string[] | null;
  extra_charges_uz: { name: string; amount: number; required?: boolean }[] | null;
  extra_charges_ru: { name: string; amount: number; required?: boolean }[] | null;
  variable_charges_uz: { name: string; min_amount: number; max_amount: number; required?: boolean }[] | null;
  variable_charges_ru: { name: string; min_amount: number; max_amount: number; required?: boolean }[] | null;
  source_language: string | null;
  translation_status: 'pending' | 'completed' | 'failed' | null;
  translation_error: string | null;
  // Joined
  agency?: Agency;
  images?: TourImage[];
}

export interface TourImage {
  id: string;
  tour_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface Lead {
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
  // Joined
  tour?: Tour;
}

export interface Review {
  id: string;
  agency_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  // Joined
  profile?: Profile;
}

export interface FeaturedItem {
  id: string;
  tour_id: string | null;
  agency_id: string | null;
  placement_type: PlacementType;
  starts_at: string;
  ends_at: string;
  created_at: string;
  // Joined
  tour?: Tour;
  agency?: Agency;
}

export interface Favorite {
  id: string;
  user_id: string;
  tour_id: string;
  created_at: string;
  // Joined
  tour?: Tour;
}

export interface AgencyFollow {
  id: string;
  user_id: string;
  agency_id: string;
  created_at: string;
}

export interface TourInterest {
  id: string;
  tour_id: string;
  agency_id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  telegram_username: string | null;
  source: string;
  created_at: string;
  // Joined
  tour?: Tour;
  profile?: Profile;
}

export interface CallTracking {
  id: string;
  tour_id: string | null;
  agency_id: string;
  user_id: string | null;
  created_at: string;
}

// Filter & search types
export interface TourFilters {
  search?: string;
  country?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  departureFrom?: string;
  departureTo?: string;
  transport?: TransportType;
  meal?: MealType;
  visaFree?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'newest' | 'popular';
  limit?: number;
}

// Tour category tags for filter chips
export const TOUR_CATEGORIES = [
  'family',
  'all_inclusive',
  'honeymoon',
  'umrah',
  'shopping',
  'group',
  'vip',
  'sanatorium',
  'medical',
  'aquapark',
  'cruise',
  'combo',
  'beach',
  'nature',
  'historical',
  'megapolis',
] as const;

export type TourCategory = (typeof TOUR_CATEGORIES)[number];

// MaxCoin types
export type MaxCoinTransactionType = 'purchase' | 'spend_featured' | 'spend_hot_deals' | 'spend_hot_tours' | 'bonus' | 'refund';
export type PromotionPlacement = 'featured' | 'hot_deals' | 'hot_tours';

export interface MaxCoinTransaction {
  id: string;
  agency_id: string;
  amount: number;
  type: MaxCoinTransactionType;
  description: string | null;
  tour_id: string | null;
  created_at: string;
}

export interface TourPromotion {
  id: string;
  tour_id: string;
  agency_id: string;
  placement: PromotionPlacement;
  cost_coins: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  tour?: Tour;
}

export interface PromotionTier {
  id: string;
  placement: PromotionPlacement;
  coins: number;
  days: number;
  sort_order: number;
  created_at: string;
}

export type CoinRequestStatus = 'pending' | 'approved' | 'rejected';

export interface CoinRequest {
  id: string;
  agency_id: string;
  coins: number;
  price_uzs: number;
  status: CoinRequestStatus;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  agency?: { name: string; slug: string; phone: string | null; telegram_username: string | null };
}

// =====================================================================
// Notification system types (notification_preferences, notification_log)
// =====================================================================

export const NOTIFICATION_PREFERENCE_KEYS = [
  // User preferences
  'new_tour_from_followed',
  'price_drop',
  'seats_low',
  'tour_cancelled',
  'departure_reminder',
  'hot_deals',
  'lead_confirmed',
  'lead_status_changed',
  'agency_verified_notify',
  'weekly_picks',
  // Agency preferences
  'new_lead',
  'daily_leads_summary',
  'pending_leads_reminder',
  'tour_approved',
  'tour_rejected',
  'tour_milestone',
  'seats_alert',
  'tour_expiring',
  'subscription_expiring',
  'subscription_expired',
  'new_review',
  'new_follower',
  'follower_milestone',
  'verification_update',
] as const;

export type NotificationPreferenceKey = (typeof NOTIFICATION_PREFERENCE_KEYS)[number];

export type NotificationPreferences = {
  user_id: string;
  created_at: string;
  updated_at: string;
} & Partial<Record<NotificationPreferenceKey, boolean>>;

export interface NotificationLogEntry {
  id: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  recipient_count: number;
  preference_key: NotificationPreferenceKey | string | null;
  created_at: string;
}
