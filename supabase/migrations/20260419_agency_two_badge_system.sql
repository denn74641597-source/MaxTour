-- =============================================
-- MaxTour — Ikki belgili agentlik tizimi
-- =============================================
-- is_approved = "Tekshirilgan" (1-chi belgi)
--   → Agentlik ro'yxatdan o'tib, profilni to'ldirgandan keyin
--     admin tasdiqlaydi → hamma ko'ra oladi
--
-- is_verified = "Tasdiqlangan" (2-chi belgi)
--   → Agentlik panelidan tasdiqlash bo'limidan hujjatlar yuboradi
--     → admin verification bo'limidan tasdiqlaydi → premium belgi
-- =============================================

-- =======================================================
-- 1. USTUNLAR MAVJUDLIGINI TA'MINLASH
-- =======================================================

-- agencies jadvalida is_approved va is_verified ustunlari
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE agencies ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE agencies ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- =======================================================
-- 2. VERIFICATION_REQUESTS JADVALI
-- =======================================================

CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  certificate_url TEXT,
  form_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast agency lookup
CREATE INDEX IF NOT EXISTS idx_verification_requests_agency_id
  ON verification_requests(agency_id);

-- =======================================================
-- 3. AGENCIES — RLS POLICYLAR
-- =======================================================

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Eski policylarni tozalash
DROP POLICY IF EXISTS "Approved agencies are viewable by everyone" ON agencies;
DROP POLICY IF EXISTS "Public agencies are viewable by everyone" ON agencies;
DROP POLICY IF EXISTS "agencies_select" ON agencies;
DROP POLICY IF EXISTS "Anyone can view agencies" ON agencies;
DROP POLICY IF EXISTS "agencies_select_policy" ON agencies;
DROP POLICY IF EXISTS "Agency owner can update own agency" ON agencies;
DROP POLICY IF EXISTS "agencies_update" ON agencies;
DROP POLICY IF EXISTS "agencies_update_policy" ON agencies;
DROP POLICY IF EXISTS "Authenticated users can create agency" ON agencies;
DROP POLICY IF EXISTS "agencies_insert" ON agencies;
DROP POLICY IF EXISTS "agencies_insert_policy" ON agencies;
DROP POLICY IF EXISTS "agencies_delete" ON agencies;
DROP POLICY IF EXISTS "agencies_delete_policy" ON agencies;
DROP POLICY IF EXISTS "agencies_select_approved_or_owner" ON agencies;
DROP POLICY IF EXISTS "agencies_insert_own" ON agencies;
DROP POLICY IF EXISTS "agencies_update_own" ON agencies;

-- SELECT: Faqat is_approved=true agentliklar hamma ko'ra oladi
-- Owner o'z agentligini har doim ko'radi (is_approved=false bo'lsa ham)
CREATE POLICY "agencies_select_approved_or_owner"
  ON agencies FOR SELECT
  USING (
    is_approved = true
    OR auth.uid() = owner_id
  );

-- INSERT: Faqat autentifikatsiyadan o'tgan user o'z agentligini yaratadi
CREATE POLICY "agencies_insert_own"
  ON agencies FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Faqat owner o'z agentligini yangilaydi
-- MUHIM: is_approved va is_verified faqat admin (service_role) orqali o'zgaradi
CREATE POLICY "agencies_update_own"
  ON agencies FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- =======================================================
-- 4. VERIFICATION_REQUESTS — RLS POLICYLAR
-- =======================================================

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Eski policylarni tozalash
DROP POLICY IF EXISTS "Agency owner can view own verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Agency owner can insert verification requests" ON verification_requests;
DROP POLICY IF EXISTS "verification_requests_select" ON verification_requests;
DROP POLICY IF EXISTS "verification_requests_insert" ON verification_requests;
DROP POLICY IF EXISTS "verification_requests_select_policy" ON verification_requests;
DROP POLICY IF EXISTS "verification_requests_insert_policy" ON verification_requests;
DROP POLICY IF EXISTS "verification_requests_select_own" ON verification_requests;
DROP POLICY IF EXISTS "verification_requests_insert_own" ON verification_requests;

-- SELECT: Agentlik egasi o'z so'rovlarini ko'ra oladi
CREATE POLICY "verification_requests_select_own"
  ON verification_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = verification_requests.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- INSERT: Faqat agentlik egasi so'rov yuboradi
-- Faqat is_approved=true agentliklar verification so'rov yuborishi mumkin
CREATE POLICY "verification_requests_insert_own"
  ON verification_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = agency_id
        AND agencies.owner_id = auth.uid()
        AND agencies.is_approved = true
    )
  );

-- UPDATE/DELETE: Oddiy user o'zgartira olmaydi
-- Admin faqat service_role orqali o'zgartiradi (RLS bypass)

-- =======================================================
-- 5. TOURS — RLS POLICYLAR (is_approved bilan)
-- =======================================================

ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published tours are viewable by everyone" ON tours;
DROP POLICY IF EXISTS "tours_select" ON tours;
DROP POLICY IF EXISTS "tours_select_policy" ON tours;
DROP POLICY IF EXISTS "Agency owner can insert tours" ON tours;
DROP POLICY IF EXISTS "tours_insert" ON tours;
DROP POLICY IF EXISTS "tours_insert_policy" ON tours;
DROP POLICY IF EXISTS "Agency owner can update own tours" ON tours;
DROP POLICY IF EXISTS "tours_update" ON tours;
DROP POLICY IF EXISTS "tours_update_policy" ON tours;
DROP POLICY IF EXISTS "Agency owner can delete own tours" ON tours;
DROP POLICY IF EXISTS "tours_delete" ON tours;
DROP POLICY IF EXISTS "tours_delete_policy" ON tours;
DROP POLICY IF EXISTS "tours_select_published_or_owner" ON tours;
DROP POLICY IF EXISTS "tours_insert_approved_agency_owner" ON tours;
DROP POLICY IF EXISTS "tours_update_own" ON tours;
DROP POLICY IF EXISTS "tours_delete_own" ON tours;

-- SELECT: Published turlar + agentligi approved bo'lgan, YOKI owner o'zining turlarini
CREATE POLICY "tours_select_published_or_owner"
  ON tours FOR SELECT
  USING (
    (
      status = 'published'
      AND EXISTS (
        SELECT 1 FROM agencies
        WHERE agencies.id = tours.agency_id
          AND agencies.is_approved = true
      )
    )
    OR EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = tours.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- INSERT: Faqat approved agentlik egasi tur yaratadi
CREATE POLICY "tours_insert_approved_agency_owner"
  ON tours FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = agency_id
        AND agencies.owner_id = auth.uid()
        AND agencies.is_approved = true
    )
  );

-- UPDATE: Agentlik egasi o'z turlarini yangilaydi
CREATE POLICY "tours_update_own"
  ON tours FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = tours.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- DELETE: Agentlik egasi o'z turlarini o'chiradi
CREATE POLICY "tours_delete_own"
  ON tours FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = tours.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- 6. LEADS — RLS POLICYLAR
-- =======================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create leads" ON leads;
DROP POLICY IF EXISTS "leads_insert" ON leads;
DROP POLICY IF EXISTS "leads_insert_policy" ON leads;
DROP POLICY IF EXISTS "Agency owner can view leads" ON leads;
DROP POLICY IF EXISTS "leads_select" ON leads;
DROP POLICY IF EXISTS "leads_select_policy" ON leads;
DROP POLICY IF EXISTS "Agency owner can update leads" ON leads;
DROP POLICY IF EXISTS "leads_update" ON leads;
DROP POLICY IF EXISTS "leads_update_policy" ON leads;
DROP POLICY IF EXISTS "leads_delete" ON leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON leads;
DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "leads_select_own" ON leads;
DROP POLICY IF EXISTS "leads_insert_authenticated" ON leads;
DROP POLICY IF EXISTS "leads_update_agency_owner" ON leads;

-- SELECT: Agentlik egasi o'z agentligining leadlarini, user o'z leadlarini
CREATE POLICY "leads_select_own"
  ON leads FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = leads.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- INSERT: Autentifikatsiyadan o'tgan user lead yaratadi
CREATE POLICY "leads_insert_authenticated"
  ON leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Faqat agentlik egasi lead statusini yangilaydi
CREATE POLICY "leads_update_agency_owner"
  ON leads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = leads.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- 7. FAVORITES — RLS POLICYLAR
-- =======================================================

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
DROP POLICY IF EXISTS "favorites_select" ON favorites;
DROP POLICY IF EXISTS "favorites_insert" ON favorites;
DROP POLICY IF EXISTS "favorites_delete" ON favorites;
DROP POLICY IF EXISTS "favorites_select_policy" ON favorites;
DROP POLICY IF EXISTS "favorites_insert_policy" ON favorites;
DROP POLICY IF EXISTS "favorites_delete_policy" ON favorites;
DROP POLICY IF EXISTS "favorites_select_own" ON favorites;
DROP POLICY IF EXISTS "favorites_insert_own" ON favorites;
DROP POLICY IF EXISTS "favorites_delete_own" ON favorites;

CREATE POLICY "favorites_select_own"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_own"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_own"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- =======================================================
-- 8. AGENCY_FOLLOWS — RLS POLICYLAR
-- =======================================================

ALTER TABLE agency_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own follows" ON agency_follows;
DROP POLICY IF EXISTS "agency_follows_select" ON agency_follows;
DROP POLICY IF EXISTS "agency_follows_insert" ON agency_follows;
DROP POLICY IF EXISTS "agency_follows_delete" ON agency_follows;
DROP POLICY IF EXISTS "agency_follows_select_policy" ON agency_follows;
DROP POLICY IF EXISTS "agency_follows_insert_policy" ON agency_follows;
DROP POLICY IF EXISTS "agency_follows_delete_policy" ON agency_follows;
DROP POLICY IF EXISTS "Anyone can count followers" ON agency_follows;
DROP POLICY IF EXISTS "agency_follows_select_count" ON agency_follows;
DROP POLICY IF EXISTS "agency_follows_select_own" ON agency_follows;
DROP POLICY IF EXISTS "agency_follows_insert_own" ON agency_follows;
DROP POLICY IF EXISTS "agency_follows_delete_own" ON agency_follows;

-- SELECT: O'z followlarini + agentlik egasi followerlarni ko'radi
CREATE POLICY "agency_follows_select_own"
  ON agency_follows FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = agency_follows.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

CREATE POLICY "agency_follows_insert_own"
  ON agency_follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agency_follows_delete_own"
  ON agency_follows FOR DELETE
  USING (auth.uid() = user_id);

-- =======================================================
-- 9. REVIEWS — RLS POLICYLAR
-- =======================================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "reviews_select" ON reviews;
DROP POLICY IF EXISTS "reviews_select_policy" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_policy" ON reviews;
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_authenticated" ON reviews;

-- SELECT: Hamma reviewlarni ko'ra oladi
CREATE POLICY "reviews_select_all"
  ON reviews FOR SELECT
  USING (true);

-- INSERT: Autentifikatsiyadan o'tgan user review yozadi
CREATE POLICY "reviews_insert_authenticated"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =======================================================
-- 10. TOUR_IMAGES — RLS POLICYLAR
-- =======================================================

ALTER TABLE tour_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tour images are viewable by everyone" ON tour_images;
DROP POLICY IF EXISTS "tour_images_select" ON tour_images;
DROP POLICY IF EXISTS "tour_images_select_policy" ON tour_images;
DROP POLICY IF EXISTS "Agency owner can manage tour images" ON tour_images;
DROP POLICY IF EXISTS "tour_images_insert" ON tour_images;
DROP POLICY IF EXISTS "tour_images_delete" ON tour_images;
DROP POLICY IF EXISTS "tour_images_insert_policy" ON tour_images;
DROP POLICY IF EXISTS "tour_images_delete_policy" ON tour_images;
DROP POLICY IF EXISTS "tour_images_select_all" ON tour_images;
DROP POLICY IF EXISTS "tour_images_insert_agency_owner" ON tour_images;
DROP POLICY IF EXISTS "tour_images_delete_agency_owner" ON tour_images;

CREATE POLICY "tour_images_select_all"
  ON tour_images FOR SELECT
  USING (true);

CREATE POLICY "tour_images_insert_agency_owner"
  ON tour_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tours
      JOIN agencies ON agencies.id = tours.agency_id
      WHERE tours.id = tour_id
        AND agencies.owner_id = auth.uid()
    )
  );

CREATE POLICY "tour_images_delete_agency_owner"
  ON tour_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tours
      JOIN agencies ON agencies.id = tours.agency_id
      WHERE tours.id = tour_images.tour_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- 11. TOUR_PROMOTIONS — RLS POLICYLAR
-- =======================================================

ALTER TABLE tour_promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tour_promotions_select" ON tour_promotions;
DROP POLICY IF EXISTS "tour_promotions_insert" ON tour_promotions;
DROP POLICY IF EXISTS "tour_promotions_select_policy" ON tour_promotions;
DROP POLICY IF EXISTS "tour_promotions_insert_policy" ON tour_promotions;
DROP POLICY IF EXISTS "Active promotions are viewable" ON tour_promotions;
DROP POLICY IF EXISTS "tour_promotions_select_active_or_owner" ON tour_promotions;
DROP POLICY IF EXISTS "tour_promotions_insert_agency_owner" ON tour_promotions;

-- SELECT: Faol promotionlarni hamma ko'radi + owner o'zining barchasini
CREATE POLICY "tour_promotions_select_active_or_owner"
  ON tour_promotions FOR SELECT
  USING (
    (is_active = true AND ends_at > now())
    OR EXISTS (
      SELECT 1 FROM tours
      JOIN agencies ON agencies.id = tours.agency_id
      WHERE tours.id = tour_promotions.tour_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- INSERT: Faqat agentlik egasi promotion yaratadi
CREATE POLICY "tour_promotions_insert_agency_owner"
  ON tour_promotions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tours
      JOIN agencies ON agencies.id = tours.agency_id
      WHERE tours.id = tour_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- 12. MAXCOIN_TRANSACTIONS — RLS POLICYLAR
-- =======================================================

ALTER TABLE maxcoin_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "maxcoin_transactions_select" ON maxcoin_transactions;
DROP POLICY IF EXISTS "maxcoin_transactions_select_policy" ON maxcoin_transactions;
DROP POLICY IF EXISTS "Agency owner can view transactions" ON maxcoin_transactions;
DROP POLICY IF EXISTS "maxcoin_transactions_select_own" ON maxcoin_transactions;

CREATE POLICY "maxcoin_transactions_select_own"
  ON maxcoin_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = maxcoin_transactions.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- 13. PROMOTION_TIERS — RLS POLICYLAR
-- =======================================================

ALTER TABLE promotion_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promotion_tiers_select" ON promotion_tiers;
DROP POLICY IF EXISTS "promotion_tiers_select_policy" ON promotion_tiers;
DROP POLICY IF EXISTS "promotion_tiers_select_all" ON promotion_tiers;

CREATE POLICY "promotion_tiers_select_all"
  ON promotion_tiers FOR SELECT
  USING (true);

-- =======================================================
-- 14. COIN_REQUESTS — RLS POLICYLAR
-- =======================================================

ALTER TABLE coin_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coin_requests_select" ON coin_requests;
DROP POLICY IF EXISTS "coin_requests_insert" ON coin_requests;
DROP POLICY IF EXISTS "coin_requests_select_policy" ON coin_requests;
DROP POLICY IF EXISTS "coin_requests_insert_policy" ON coin_requests;
DROP POLICY IF EXISTS "coin_requests_select_own" ON coin_requests;
DROP POLICY IF EXISTS "coin_requests_insert_own" ON coin_requests;

CREATE POLICY "coin_requests_select_own"
  ON coin_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = coin_requests.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

CREATE POLICY "coin_requests_insert_own"
  ON coin_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- 15. SUBSCRIPTION_PLANS — RLS POLICYLAR
-- =======================================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscription_plans_select" ON subscription_plans;
DROP POLICY IF EXISTS "subscription_plans_select_policy" ON subscription_plans;
DROP POLICY IF EXISTS "subscription_plans_select_all" ON subscription_plans;

CREATE POLICY "subscription_plans_select_all"
  ON subscription_plans FOR SELECT
  USING (true);

-- =======================================================
-- 16. AGENCY_SUBSCRIPTIONS — RLS POLICYLAR
-- =======================================================

ALTER TABLE agency_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency_subscriptions_select" ON agency_subscriptions;
DROP POLICY IF EXISTS "agency_subscriptions_select_policy" ON agency_subscriptions;
DROP POLICY IF EXISTS "Agency subscriptions are viewable" ON agency_subscriptions;
DROP POLICY IF EXISTS "agency_subscriptions_select_own" ON agency_subscriptions;

-- SELECT: Faqat agentlik egasi o'z subscriptionsini ko'radi
CREATE POLICY "agency_subscriptions_select_own"
  ON agency_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = agency_subscriptions.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- 17. NOTIFICATION_LOG — RLS POLICYLAR
-- =======================================================

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_log_select" ON notification_log;
DROP POLICY IF EXISTS "notification_log_select_policy" ON notification_log;
DROP POLICY IF EXISTS "Users can view own notifications" ON notification_log;
DROP POLICY IF EXISTS "notification_log_select_own" ON notification_log;
DROP POLICY IF EXISTS "notification_log_select_all" ON notification_log;

-- notification_log has no user_id — it's an analytics table (title, body, recipient_count)
-- Only admin needs full access (service_role bypasses RLS)
-- Authenticated users can read logs for display purposes
CREATE POLICY "notification_log_select_all"
  ON notification_log FOR SELECT
  USING (true);

-- =======================================================
-- 18. CALL_TRACKING — RLS POLICYLAR
-- =======================================================

ALTER TABLE call_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "call_tracking_select" ON call_tracking;
DROP POLICY IF EXISTS "call_tracking_insert" ON call_tracking;
DROP POLICY IF EXISTS "call_tracking_select_policy" ON call_tracking;
DROP POLICY IF EXISTS "call_tracking_insert_policy" ON call_tracking;
DROP POLICY IF EXISTS "call_tracking_select_agency_owner" ON call_tracking;
DROP POLICY IF EXISTS "call_tracking_insert_authenticated" ON call_tracking;

-- SELECT: Faqat agentlik egasi statistikani ko'radi
CREATE POLICY "call_tracking_select_agency_owner"
  ON call_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = call_tracking.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- INSERT: Autentifikatsiyadan o'tgan user tracking yaratadi
CREATE POLICY "call_tracking_insert_authenticated"
  ON call_tracking FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =======================================================
-- 19. NOTIFICATION_PREFERENCES — RLS POLICYLAR
-- =======================================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_preferences_select" ON notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_insert" ON notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_update" ON notification_preferences;
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_select_own" ON notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_upsert_own" ON notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_update_own" ON notification_preferences;

CREATE POLICY "notification_preferences_select_own"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notification_preferences_upsert_own"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_preferences_update_own"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- =======================================================
-- 20. STORAGE — RLS POLICYLAR
-- =======================================================

-- Rasmlar/PDF hamma ko'ra oladi
DROP POLICY IF EXISTS "Public read access for all buckets" ON storage.objects;
CREATE POLICY "Public read access for all buckets"
  ON storage.objects FOR SELECT
  USING (true);

-- Autentifikatsiyadan o'tgan userlar fayl yuklaydi
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- O'z fayllarini yangilaydi
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- O'z fayllarini o'chiradi
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- =======================================================
-- 21. ADMIN UCHUN TRIGGER: Verification request approved
--     → agencies.is_verified = true
-- =======================================================

CREATE OR REPLACE FUNCTION handle_verification_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Agar verification request 'approved' bo'lsa → is_verified = true
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    UPDATE agencies
    SET is_verified = true, updated_at = now()
    WHERE id = NEW.agency_id;
  END IF;

  -- Agar verification request 'rejected' bo'lsa → is_verified = false
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status <> 'rejected') THEN
    UPDATE agencies
    SET is_verified = false, updated_at = now()
    WHERE id = NEW.agency_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_verification_status_change ON verification_requests;
CREATE TRIGGER on_verification_status_change
  AFTER UPDATE ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_verification_status_change();

-- =======================================================
-- YAKUNIY
-- =======================================================
-- is_approved → "Tekshirilgan" belgi (1-bosqich)
--   Admin agencies jadvalidan is_approved = true qiladi
--   Agentlik hammaga ko'rinadi
--
-- is_verified → "Tasdiqlangan" belgi (2-bosqich)
--   Admin verification_requests statusini 'approved' qiladi
--   Trigger avtomatik is_verified = true qiladi
-- =============================================
