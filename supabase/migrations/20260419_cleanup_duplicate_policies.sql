-- =============================================
-- MaxTour — Dublikat va xavfli policylarni tozalash
-- =============================================
-- Hozirgi holat: 107 ta policy (web + mobile migrationlar)
-- Maqsad: ~45 ta toza, xavfsiz policy qoldirish
-- =============================================

-- =======================================================
-- 1. PROFILES — 3 dublikat o'chiriladi, 3 ta qoladi
-- =======================================================
-- Qoladi: "Public profiles are viewable by everyone" (SELECT)
--         "Users can insert own profile" (INSERT)
--         "Users can update own profile" (UPDATE)

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
DROP POLICY IF EXISTS "Owner manage own profile" ON profiles;

-- =======================================================
-- 2. AGENCIES — 3 eski o'chiriladi, 3 ta yangi qoladi
-- =======================================================
-- Qoladi: agencies_select_approved_or_owner, agencies_insert_own, agencies_update_own

DROP POLICY IF EXISTS "Approved agencies are viewable" ON agencies;
DROP POLICY IF EXISTS "Authenticated users can create agencies" ON agencies;
DROP POLICY IF EXISTS "Owner manage own agency" ON agencies;

-- =======================================================
-- 3. AGENCY_FOLLOWS — 7 eski o'chiriladi, 3 ta yangi qoladi
-- =======================================================
-- Qoladi: agency_follows_select_own, agency_follows_insert_own, agency_follows_delete_own
-- ⚠️ "Anyone can count follows per agency" USING(true) — barcha SELECT filterlarni bekor qiladi!

DROP POLICY IF EXISTS "Anyone can count follows per agency" ON agency_follows;
DROP POLICY IF EXISTS "Agency owner can view followers" ON agency_follows;
DROP POLICY IF EXISTS "Users can view own follows" ON agency_follows;
DROP POLICY IF EXISTS "Users can follow agencies" ON agency_follows;
DROP POLICY IF EXISTS "Users can insert own follows" ON agency_follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON agency_follows;
DROP POLICY IF EXISTS "Users can unfollow agencies" ON agency_follows;

-- =======================================================
-- 4. AGENCY_SUBSCRIPTIONS — 3 eski o'chiriladi, 1 ta yangi qoladi
-- =======================================================
-- Qoladi: agency_subscriptions_select_own
-- ⚠️ "Public read agency_subscriptions" USING(true) — barcha obuna ma'lumotlari ochiq!

DROP POLICY IF EXISTS "Public read agency_subscriptions" ON agency_subscriptions;
DROP POLICY IF EXISTS "Agency owner can view own subscription" ON agency_subscriptions;
DROP POLICY IF EXISTS "Agency owners can view subscriptions" ON agency_subscriptions;

-- =======================================================
-- 5. CALL_TRACKING — 4 eski o'chiriladi, 2 ta yangi qoladi
-- =======================================================
-- Qoladi: call_tracking_select_agency_owner, call_tracking_insert_authenticated
-- ⚠️ "Anyone can insert call tracking" WITH CHECK(true) — anonim spam!

DROP POLICY IF EXISTS "Anyone can insert call tracking" ON call_tracking;
DROP POLICY IF EXISTS "Authenticated users can insert call tracking" ON call_tracking;
DROP POLICY IF EXISTS "Agency owner can view own call tracking" ON call_tracking;
DROP POLICY IF EXISTS "Agency owners can view their call tracking" ON call_tracking;

-- =======================================================
-- 6. COIN_REQUESTS — 4 eski o'chiriladi, 2 ta yangi qoladi
-- =======================================================
-- Qoladi: coin_requests_select_own, coin_requests_insert_own

DROP POLICY IF EXISTS "Agency owner can insert coin requests" ON coin_requests;
DROP POLICY IF EXISTS "Agency owner can view own coin requests" ON coin_requests;
DROP POLICY IF EXISTS "Agency owners can submit coin requests" ON coin_requests;
DROP POLICY IF EXISTS "Agency owners can view own coin requests" ON coin_requests;

-- =======================================================
-- 7. FAVORITES — 5 eski o'chiriladi, 3 ta yangi qoladi
-- =======================================================
-- Qoladi: favorites_select_own, favorites_insert_own, favorites_delete_own

DROP POLICY IF EXISTS "Users can add favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can remove favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;

-- =======================================================
-- 8. FEATURED_ITEMS — 1 dublikat o'chiriladi, 1 ta qoladi
-- =======================================================
-- Qoladi: "Featured items are viewable"

DROP POLICY IF EXISTS "Public read featured_items" ON featured_items;

-- =======================================================
-- 9. LEADS — 5 eski o'chiriladi, 3 ta yangi qoladi
-- =======================================================
-- Qoladi: leads_select_own, leads_insert_authenticated, leads_update_agency_owner
-- ⚠️ "Anyone can submit leads" WITH CHECK(true) — anonim spam!

DROP POLICY IF EXISTS "Anyone can submit leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can submit leads" ON leads;
DROP POLICY IF EXISTS "Agency/admin can view leads" ON leads;
DROP POLICY IF EXISTS "Agency owner can update lead status" ON leads;
DROP POLICY IF EXISTS "Agency/admin can update leads" ON leads;

-- =======================================================
-- 10. MAXCOIN_TRANSACTIONS — 5 eski o'chiriladi, 1 qoladi + 1 yangi
-- =======================================================
-- Qoladi: maxcoin_transactions_select_own
-- Yangi: maxcoin_transactions_insert_own (qayta yaratiladi)

DROP POLICY IF EXISTS "Agency owner can insert transactions" ON maxcoin_transactions;
DROP POLICY IF EXISTS "Agency owner can view own transactions" ON maxcoin_transactions;
DROP POLICY IF EXISTS "Agency owners can insert transactions" ON maxcoin_transactions;
DROP POLICY IF EXISTS "Agency owners can view own transactions" ON maxcoin_transactions;
DROP POLICY IF EXISTS "maxcoin_transactions_insert_own" ON maxcoin_transactions;

CREATE POLICY "maxcoin_transactions_insert_own"
  ON maxcoin_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = agency_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- 11. NOTIFICATION_PREFERENCES — 3 eski o'chiriladi, 3 ta yangi qoladi
-- =======================================================
-- Qoladi: notification_preferences_select_own, notification_preferences_upsert_own, notification_preferences_update_own

DROP POLICY IF EXISTS "Users can read own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;

-- =======================================================
-- 12. PROMOTION_TIERS — 1 eski o'chiriladi, 1 ta yangi qoladi
-- =======================================================
-- Qoladi: promotion_tiers_select_all

DROP POLICY IF EXISTS "Promotion tiers are viewable by everyone" ON promotion_tiers;

-- =======================================================
-- 13. REVIEWS — 4 eski o'chiriladi, 2 ta yangi qoladi
-- =======================================================
-- Qoladi: reviews_select_all, reviews_insert_authenticated

DROP POLICY IF EXISTS "Authenticated users can add reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Public read reviews" ON reviews;
DROP POLICY IF EXISTS "Reviews are viewable" ON reviews;

-- =======================================================
-- 14. SUBSCRIPTION_PLANS — 3 eski o'chiriladi, 1 ta yangi qoladi
-- =======================================================
-- Qoladi: subscription_plans_select_all

DROP POLICY IF EXISTS "Public read subscription_plans" ON subscription_plans;
DROP POLICY IF EXISTS "Subscription plans are viewable" ON subscription_plans;
DROP POLICY IF EXISTS "Subscription plans are viewable by everyone" ON subscription_plans;

-- =======================================================
-- 15. TOUR_IMAGES — 4 eski o'chiriladi, 3 ta yangi qoladi
-- =======================================================
-- Qoladi: tour_images_select_all, tour_images_insert_agency_owner, tour_images_delete_agency_owner

DROP POLICY IF EXISTS "Agency owner can delete tour images" ON tour_images;
DROP POLICY IF EXISTS "Agency owner can insert tour images" ON tour_images;
DROP POLICY IF EXISTS "Agency/admin manage own tour_images" ON tour_images;
DROP POLICY IF EXISTS "Public read tour_images" ON tour_images;

-- =======================================================
-- 16. TOUR_PROMOTIONS — 6 eski o'chiriladi, 2 qoladi + 1 yangi
-- =======================================================
-- Qoladi: tour_promotions_select_active_or_owner, tour_promotions_insert_agency_owner
-- Yangi: tour_promotions_update_agency_owner
-- ⚠️ "Active promotions are viewable by everyone" USING(true) — barcha filterlarni bekor qiladi!

DROP POLICY IF EXISTS "Active promotions are viewable by everyone" ON tour_promotions;
DROP POLICY IF EXISTS "Active promotions are publicly viewable" ON tour_promotions;
DROP POLICY IF EXISTS "Agency owner can insert promotions" ON tour_promotions;
DROP POLICY IF EXISTS "Agency owners can insert promotions" ON tour_promotions;
DROP POLICY IF EXISTS "Agency owners can update promotions" ON tour_promotions;
DROP POLICY IF EXISTS "tour_promotions_insert_own" ON tour_promotions;
DROP POLICY IF EXISTS "tour_promotions_update_own" ON tour_promotions;
DROP POLICY IF EXISTS "tour_promotions_update_agency_owner" ON tour_promotions;

CREATE POLICY "tour_promotions_update_agency_owner"
  ON tour_promotions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tours
      JOIN agencies ON agencies.id = tours.agency_id
      WHERE tours.id = tour_promotions.tour_id
        AND agencies.owner_id = auth.uid()
    )
  );

-- =======================================================
-- 17. TOURS — 2 eski o'chiriladi, 4 ta yangi qoladi
-- =======================================================
-- Qoladi: tours_select_published_or_owner, tours_insert_approved_agency_owner,
--         tours_update_own, tours_delete_own
-- ⚠️ "Published tours are viewable" — is_approved tekshirmasligi sababli xavfli!
-- ⚠️ "Agency/admin manage own tours" ALL — SELECT da is_approved tekshirmaydi!

DROP POLICY IF EXISTS "Published tours are viewable" ON tours;
DROP POLICY IF EXISTS "Agency/admin manage own tours" ON tours;

-- =======================================================
-- 18. VERIFICATION_REQUESTS — 2 eski o'chiriladi, 2 ta yangi qoladi
-- =======================================================
-- Qoladi: verification_requests_select_own, verification_requests_insert_own

DROP POLICY IF EXISTS "Agency owners can submit verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Agency owners can view own verification requests" ON verification_requests;

-- =======================================================
-- 19. STORAGE.OBJECTS — 4 eski o'chiriladi, 4 ta yangi qoladi
-- =======================================================
-- Qoladi: "Public read access for all buckets", "Authenticated users can upload files",
--         "Users can update own files", "Users can delete own files"

DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own uploaded images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own uploaded images" ON storage.objects;

-- =======================================================
-- TOUR_INTERESTS — o'zgarishsiz (1 ta to'g'ri policy)
-- NOTIFICATION_LOG — o'zgarishsiz (1 ta to'g'ri policy)
-- =======================================================

-- =============================================
-- YAKUNIY NATIJA:
-- =============================================
-- O'chirildi: ~62 ta eski/dublikat/xavfli policy
-- Qoldi:      ~45 ta toza, xavfsiz policy
--
-- Bartaraf etilgan xavfsizlik muammolari (5 ta):
-- 1. agency_follows  "Anyone can count follows" USING(true)
-- 2. agency_subscriptions "Public read" USING(true)
-- 3. call_tracking "Anyone can insert" WITH CHECK(true)
-- 4. leads "Anyone can submit" WITH CHECK(true)
-- 5. tour_promotions "viewable by everyone" USING(true)
--
-- Yangi qo'shilgan policylar (2 ta):
-- 1. maxcoin_transactions_insert_own (INSERT)
-- 2. tour_promotions_update_agency_owner (UPDATE)
-- =============================================
