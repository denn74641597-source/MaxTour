-- MaxTour MVP Schema
-- Run this migration against your Supabase project

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'agency_manager', 'admin')),
  full_name text,
  telegram_username text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================================
-- 2. AGENCIES
-- ============================================================
CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  phone text,
  telegram_username text,
  instagram_url text,
  website_url text,
  address text,
  city text,
  country text NOT NULL DEFAULT 'Uzbekistan',
  is_verified boolean NOT NULL DEFAULT false,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_owner ON agencies(owner_id);
CREATE INDEX IF NOT EXISTS idx_agencies_approved ON agencies(is_approved);

-- ============================================================
-- 3. SUBSCRIPTION PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  price_monthly numeric NOT NULL DEFAULT 0,
  max_active_tours integer NOT NULL DEFAULT 5,
  can_feature boolean NOT NULL DEFAULT false,
  has_priority_support boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. AGENCY SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS agency_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'trial')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agency_subscriptions_agency ON agency_subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_subscriptions_status ON agency_subscriptions(status);

-- ============================================================
-- 5. TOURS
-- ============================================================
CREATE TABLE IF NOT EXISTS tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text,
  full_description text,
  country text NOT NULL,
  city text,
  departure_date date,
  return_date date,
  duration_days integer,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'UZS', 'EUR')),
  seats_total integer,
  seats_left integer,
  hotel_name text,
  hotel_stars integer CHECK (hotel_stars IS NULL OR (hotel_stars >= 1 AND hotel_stars <= 5)),
  hotel_booking_url text,
  meal_type text NOT NULL DEFAULT 'none' CHECK (meal_type IN ('none', 'breakfast', 'half_board', 'full_board', 'all_inclusive')),
  transport_type text NOT NULL DEFAULT 'flight' CHECK (transport_type IN ('flight', 'bus', 'train', 'self', 'mixed')),
  visa_required boolean NOT NULL DEFAULT false,
  included_services jsonb DEFAULT '[]'::jsonb,
  excluded_services jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'archived')),
  is_featured boolean NOT NULL DEFAULT false,
  cover_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tours_slug ON tours(slug);
CREATE INDEX IF NOT EXISTS idx_tours_agency ON tours(agency_id);
CREATE INDEX IF NOT EXISTS idx_tours_status ON tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_country ON tours(country);
CREATE INDEX IF NOT EXISTS idx_tours_featured ON tours(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_tours_departure ON tours(departure_date);
CREATE INDEX IF NOT EXISTS idx_tours_price ON tours(price);

-- ============================================================
-- 6. TOUR IMAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS tour_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tour_images_tour ON tour_images(tour_id);

-- ============================================================
-- 7. LEADS
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  telegram_username text,
  comment text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed', 'won', 'lost')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_agency ON leads(agency_id);
CREATE INDEX IF NOT EXISTS idx_leads_tour ON leads(tour_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- ============================================================
-- 8. REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_agency ON reviews(agency_id);

-- ============================================================
-- 9. FEATURED ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS featured_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid REFERENCES tours(id) ON DELETE CASCADE,
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE,
  placement_type text NOT NULL DEFAULT 'home_featured' CHECK (placement_type IN ('home_featured', 'category_top', 'search_boost')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. FAVORITES
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tour_id uuid NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tour_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_agencies_updated_at ON agencies;
CREATE TRIGGER trg_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_tours_updated_at ON tours;
CREATE TRIGGER trg_tours_updated_at BEFORE UPDATE ON tours FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (MVP)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Agencies: public can read approved, owners can update own
DROP POLICY IF EXISTS "Approved agencies are viewable" ON agencies;
CREATE POLICY "Approved agencies are viewable" ON agencies FOR SELECT USING (is_approved = true OR owner_id = auth.uid());
DROP POLICY IF EXISTS "Agency owners can update" ON agencies;
CREATE POLICY "Agency owners can update" ON agencies FOR UPDATE USING (owner_id = auth.uid());
DROP POLICY IF EXISTS "Authenticated users can create agencies" ON agencies;
CREATE POLICY "Authenticated users can create agencies" ON agencies FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Tours: public can read published, agency owners can manage own, admin can see all
DROP POLICY IF EXISTS "Published tours are viewable" ON tours;
CREATE POLICY "Published tours are viewable" ON tours FOR SELECT USING (
  status = 'published'
  OR agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Agency owners can insert tours" ON tours;
CREATE POLICY "Agency owners can insert tours" ON tours FOR INSERT WITH CHECK (agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid()));
DROP POLICY IF EXISTS "Agency owners can update tours" ON tours;
CREATE POLICY "Agency owners can update tours" ON tours FOR UPDATE USING (
  agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Agency owners can delete tours" ON tours;
CREATE POLICY "Agency owners can delete tours" ON tours FOR DELETE USING (
  agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Tour images: same as tours
DROP POLICY IF EXISTS "Tour images are viewable" ON tour_images;
CREATE POLICY "Tour images are viewable" ON tour_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Agency owners can manage tour images" ON tour_images;
CREATE POLICY "Agency owners can manage tour images" ON tour_images FOR ALL USING (tour_id IN (SELECT id FROM tours WHERE agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())));

-- Leads: agency owners see their leads, users can insert
DROP POLICY IF EXISTS "Anyone can submit leads" ON leads;
CREATE POLICY "Anyone can submit leads" ON leads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Agency owners can view leads" ON leads;
CREATE POLICY "Agency owners can view leads" ON leads FOR SELECT USING (agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid()));
DROP POLICY IF EXISTS "Agency owners can update leads" ON leads;
CREATE POLICY "Agency owners can update leads" ON leads FOR UPDATE USING (agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid()));

-- Reviews: public read, authenticated write
DROP POLICY IF EXISTS "Reviews are viewable" ON reviews;
CREATE POLICY "Reviews are viewable" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can add reviews" ON reviews;
CREATE POLICY "Authenticated users can add reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Favorites: users manage own
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can add favorites" ON favorites;
CREATE POLICY "Users can add favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can remove favorites" ON favorites;
CREATE POLICY "Users can remove favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Subscription plans: public read
DROP POLICY IF EXISTS "Subscription plans are viewable" ON subscription_plans;
CREATE POLICY "Subscription plans are viewable" ON subscription_plans FOR SELECT USING (true);

-- Agency subscriptions: agency owners can view own
DROP POLICY IF EXISTS "Agency owners can view subscriptions" ON agency_subscriptions;
CREATE POLICY "Agency owners can view subscriptions" ON agency_subscriptions FOR SELECT USING (agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid()));

-- Featured items: public read
DROP POLICY IF EXISTS "Featured items are viewable" ON featured_items;
CREATE POLICY "Featured items are viewable" ON featured_items FOR SELECT USING (true);

-- ============================================================
-- NOTE: Admin access
-- For admin operations, use the service_role key (server-side only)
-- which bypasses RLS. This is the recommended Supabase pattern
-- for admin panels. See docs/rls-notes.md for detailed notes.
-- ============================================================
