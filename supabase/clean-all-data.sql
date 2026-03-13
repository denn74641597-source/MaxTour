-- ============================================================
-- MaxTour: Barcha demo/example ma'lumotlarni o'chirish
-- Supabase SQL Editor'da ishga tushiring
-- ============================================================
-- Tartib muhim! (Foreign key bog'lanishlari tufayli)
-- ============================================================

-- 1. Favorites (foydalanuvchi saqlagan turlar)
TRUNCATE TABLE favorites CASCADE;

-- 2. Featured items (asosiy sahifada ko'rsatiladigan turlar)
TRUNCATE TABLE featured_items CASCADE;

-- 3. Leads (so'rovlar / murojatlar)
TRUNCATE TABLE leads CASCADE;

-- 4. Reviews (sharhlar)
TRUNCATE TABLE reviews CASCADE;

-- 5. Tour images (tur rasmlari)
TRUNCATE TABLE tour_images CASCADE;

-- 6. Tours (barcha turlar)
TRUNCATE TABLE tours CASCADE;

-- 7. Agency subscriptions (agentlik obunalari)
TRUNCATE TABLE agency_subscriptions CASCADE;

-- 8. Agencies (agentliklar)
TRUNCATE TABLE agencies CASCADE;

-- 9. Profiles (foydalanuvchi profillari)
TRUNCATE TABLE profiles CASCADE;

-- 10. Demo auth users (Supabase Auth jadvallari)
DELETE FROM auth.identities
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@demo.maxtour.uz'
);

DELETE FROM auth.users
WHERE email LIKE '%@demo.maxtour.uz';

-- ============================================================
-- Subscription plans SAQLANADI (bu konfiguratsiya, demo emas)
-- Agar ularni ham o'chirmoqchi bo'lsangiz, quyidagini yoqing:
-- TRUNCATE TABLE subscription_plans CASCADE;
-- ============================================================

-- Tayyor! Endi barcha jadvallar bo'sh.
-- Haqiqiy agentliklar o'z turlarini qo'shganda sahifada ko'rinadi.
