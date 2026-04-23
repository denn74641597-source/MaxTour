-- =============================================
-- MaxTour — Barcha jadvallar uchun RLS policylar
-- =============================================
-- Mavjud: notification_preferences (3 ta policy)
-- Qo'shilmoqda: profiles, agencies, tours, leads, favorites,
--   agency_follows, reviews, tour_images, tour_promotions,
--   maxcoin_transactions, promotion_tiers, coin_requests,
--   verification_requests, subscription_plans, agency_subscriptions,
--   notification_log, call_tracking

-- =======================================================
-- 1. PROFILES
-- =======================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Har kim profilni ko'ra oladi (agency sahifasida, review'larda kerak)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Faqat o'z profilini yangilash
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auth trigger orqali profile yaratiladi (service_role), lekin fallback:
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =======================================================
-- 2. AGENCIES
-- =======================================================
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Tasdiqlangan agentliklarni hamma ko'ra oladi
DROP POLICY IF EXISTS "Approved agencies are viewable by everyone" ON agencies;
CREATE POLICY "Approved agencies are viewable by everyone"
  ON agencies FOR SELECT
  USING (true);

-- Faqat owner agentlikni yangilaydi
DROP POLICY IF EXISTS "Agency owner can update own agency" ON agencies;
CREATE POLICY "Agency owner can update own agency"
  ON agencies FOR UPDATE
  USING (auth.uid() = owner_id);

-- Yangi agentlik yaratish (ro'yxatdan o'tgan user)
DROP POLICY IF EXISTS "Authenticated users can create agency" ON agencies;
CREATE POLICY "Authenticated users can create agency"
  ON agencies FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- =======================================================
-- 3. TOURS
-- =======================================================
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

-- Published turlarni hamma ko'ra oladi
DROP POLICY IF EXISTS "Published tours are viewable by everyone" ON tours;
CREATE POLICY "Published tours are viewable by everyone"
  ON tours FOR SELECT
  USING (
    status = 'published'
    OR EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = tours.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- Agency owner tur yaratishi
DROP POLICY IF EXISTS "Agency owner can insert tours" ON tours;
CREATE POLICY "Agency owner can insert tours"
  ON tours FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- Agency owner tur yangilashi
DROP POLICY IF EXISTS "Agency owner can update own tours" ON tours;
CREATE POLICY "Agency owner can update own tours"
  ON tours FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = tours.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- Agency owner tur o'chirishi
DROP POLICY IF EXISTS "Agency owner can delete own tours" ON tours;
CREATE POLICY "Agency owner can delete own tours"
  ON tours FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = tours.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- 4. LEADS
-- =======================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Har qanday autentifikatsiya qilingan user ariza qoldirishi mumkin
DROP POLICY IF EXISTS "Authenticated users can submit leads" ON leads;
CREATE POLICY "Authenticated users can submit leads"
  ON leads FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- User o'z arizalarini ko'radi
DROP POLICY IF EXISTS "Users can view own leads" ON leads;
CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = leads.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- Agency owner lead statusini yangilashi
DROP POLICY IF EXISTS "Agency owner can update lead status" ON leads;
CREATE POLICY "Agency owner can update lead status"
  ON leads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = leads.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- 5. FAVORITES
-- =======================================================
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- User o'z sevimlilarini ko'radi
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- User sevimli qo'shishi
DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User sevimli o'chirishi
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- =======================================================
-- 6. AGENCY_FOLLOWS
-- =======================================================
ALTER TABLE agency_follows ENABLE ROW LEVEL SECURITY;

-- User o'z obunalarini ko'radi
DROP POLICY IF EXISTS "Users can view own follows" ON agency_follows;
CREATE POLICY "Users can view own follows"
  ON agency_follows FOR SELECT
  USING (auth.uid() = user_id);

-- User obuna bo'lishi
DROP POLICY IF EXISTS "Users can insert own follows" ON agency_follows;
CREATE POLICY "Users can insert own follows"
  ON agency_follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User obunani bekor qilishi
DROP POLICY IF EXISTS "Users can delete own follows" ON agency_follows;
CREATE POLICY "Users can delete own follows"
  ON agency_follows FOR DELETE
  USING (auth.uid() = user_id);

-- Agency owner followers sonini ko'rishi uchun
DROP POLICY IF EXISTS "Agency owner can view followers" ON agency_follows;
CREATE POLICY "Agency owner can view followers"
  ON agency_follows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = agency_follows.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- 7. REVIEWS
-- =======================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Barcha sharhlarni hamma ko'ra oladi
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

-- Autentifikatsiya qilingan user sharh qoldirishi
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =======================================================
-- 8. TOUR_IMAGES
-- =======================================================
ALTER TABLE tour_images ENABLE ROW LEVEL SECURITY;

-- Rasmlarni hamma ko'ra oladi
DROP POLICY IF EXISTS "Tour images are viewable by everyone" ON tour_images;
CREATE POLICY "Tour images are viewable by everyone"
  ON tour_images FOR SELECT
  USING (true);

-- Agency owner rasm qo'shishi
DROP POLICY IF EXISTS "Agency owner can insert tour images" ON tour_images;
CREATE POLICY "Agency owner can insert tour images"
  ON tour_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tours
      JOIN agencies ON agencies.id = tours.agency_id
      WHERE tours.id = tour_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- Agency owner rasm o'chirishi
DROP POLICY IF EXISTS "Agency owner can delete tour images" ON tour_images;
CREATE POLICY "Agency owner can delete tour images"
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
-- 9. TOUR_PROMOTIONS
-- =======================================================
ALTER TABLE tour_promotions ENABLE ROW LEVEL SECURITY;

-- Faol promotionlarni hamma ko'ra oladi (bosh sahifada kerak)
DROP POLICY IF EXISTS "Active promotions are viewable by everyone" ON tour_promotions;
CREATE POLICY "Active promotions are viewable by everyone"
  ON tour_promotions FOR SELECT
  USING (true);

-- Agency owner promotion yaratishi
DROP POLICY IF EXISTS "Agency owner can insert promotions" ON tour_promotions;
CREATE POLICY "Agency owner can insert promotions"
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
-- 10. MAXCOIN_TRANSACTIONS
-- =======================================================
ALTER TABLE maxcoin_transactions ENABLE ROW LEVEL SECURITY;

-- Agency owner o'z tranzaksiyalarini ko'radi
DROP POLICY IF EXISTS "Agency owner can view own transactions" ON maxcoin_transactions;
CREATE POLICY "Agency owner can view own transactions"
  ON maxcoin_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = maxcoin_transactions.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- Agency owner tranzaksiya yaratishi (MaxCoin sarflash)
DROP POLICY IF EXISTS "Agency owner can insert transactions" ON maxcoin_transactions;
CREATE POLICY "Agency owner can insert transactions"
  ON maxcoin_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- 11. PROMOTION_TIERS
-- =======================================================
ALTER TABLE promotion_tiers ENABLE ROW LEVEL SECURITY;

-- Hamma ko'ra oladi (narxlar ro'yxati)
DROP POLICY IF EXISTS "Promotion tiers are viewable by everyone" ON promotion_tiers;
CREATE POLICY "Promotion tiers are viewable by everyone"
  ON promotion_tiers FOR SELECT
  USING (true);

-- =======================================================
-- 12. COIN_REQUESTS
-- =======================================================
ALTER TABLE coin_requests ENABLE ROW LEVEL SECURITY;

-- Agency owner o'z so'rovlarini ko'radi
DROP POLICY IF EXISTS "Agency owner can view own coin requests" ON coin_requests;
CREATE POLICY "Agency owner can view own coin requests"
  ON coin_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = coin_requests.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- Agency owner coin so'rovi yaratishi
DROP POLICY IF EXISTS "Agency owner can insert coin requests" ON coin_requests;
CREATE POLICY "Agency owner can insert coin requests"
  ON coin_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- 13. VERIFICATION_REQUESTS
-- =======================================================
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Agency owner o'z verifikatsiya so'rovlarini ko'radi
DROP POLICY IF EXISTS "Agency owner can view own verification requests" ON verification_requests;
CREATE POLICY "Agency owner can view own verification requests"
  ON verification_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = verification_requests.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- Agency owner verifikatsiya so'rovi yaratishi
DROP POLICY IF EXISTS "Agency owner can insert verification requests" ON verification_requests;
CREATE POLICY "Agency owner can insert verification requests"
  ON verification_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- 14. SUBSCRIPTION_PLANS
-- =======================================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Hamma ko'ra oladi (narxlar sahifasi)
DROP POLICY IF EXISTS "Subscription plans are viewable by everyone" ON subscription_plans;
CREATE POLICY "Subscription plans are viewable by everyone"
  ON subscription_plans FOR SELECT
  USING (true);

-- =======================================================
-- 15. AGENCY_SUBSCRIPTIONS
-- =======================================================
ALTER TABLE agency_subscriptions ENABLE ROW LEVEL SECURITY;

-- Agency owner o'z obunasini ko'radi
DROP POLICY IF EXISTS "Agency owner can view own subscription" ON agency_subscriptions;
CREATE POLICY "Agency owner can view own subscription"
  ON agency_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = agency_subscriptions.agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- 16. NOTIFICATION_LOG
-- =======================================================
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Faqat service_role orqali yoziladi/o'qiladi (trigger'lar SECURITY DEFINER)
-- Oddiy foydalanuvchilar ko'ra olmaydi

-- =======================================================
-- 17. CALL_TRACKING
-- =======================================================
ALTER TABLE call_tracking ENABLE ROW LEVEL SECURITY;

-- Autentifikatsiya qilingan user call tracking yozishi
DROP POLICY IF EXISTS "Authenticated users can insert call tracking" ON call_tracking;
CREATE POLICY "Authenticated users can insert call tracking"
  ON call_tracking FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Agency owner o'z call tracking'ini ko'radi
DROP POLICY IF EXISTS "Agency owner can view own call tracking" ON call_tracking;
CREATE POLICY "Agency owner can view own call tracking"
  ON call_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tours
      JOIN agencies ON agencies.id = tours.agency_id
      WHERE tours.id = call_tracking.tour_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- STORAGE: "images" bucket policies
-- =======================================================
-- Bucket papkalari: tours/, logos/, hotels/, certificates/, licenses/
-- Barcha rasmlar public o'qish (getPublicUrl orqali)
-- Yozish faqat autentifikatsiya qilingan userlar uchun

-- Hamma rasmlarni ko'ra oladi
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

-- Autentifikatsiya qilingan userlar rasm yuklashi mumkin
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
  );

-- Foydalanuvchi faqat o'zi yuklagan rasmni yangilashi (upsert uchun)
DROP POLICY IF EXISTS "Users can update own uploaded images" ON storage.objects;
CREATE POLICY "Users can update own uploaded images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'images'
    AND auth.uid() = owner
  );

-- Foydalanuvchi faqat o'zi yuklagan rasmni o'chirishi
DROP POLICY IF EXISTS "Users can delete own uploaded images" ON storage.objects;
CREATE POLICY "Users can delete own uploaded images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images'
    AND auth.uid() = owner
  );
