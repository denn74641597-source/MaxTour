-- Migration 028: Auth flow updates
-- 1. Users now register with phone+password (no email verification)
-- 2. Agencies register with email OTP verification
-- 3. Agency profile needs guvohnoma (certificate) and litsenziya (license) fields
-- 4. Ensure favorites table works properly for user tour persistence

-- ============================================================
-- 1. PROFILES - add email column for agencies
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- ============================================================
-- 2. AGENCIES - ensure all registration fields exist
-- ============================================================
-- These should already exist from migration 024, but ensure they're present
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS inn text;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS responsible_person text;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS license_pdf_url text;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS certificate_pdf_url text;

-- ============================================================
-- 3. FAVORITES - ensure table and indexes exist properly
-- ============================================================
-- Already exists from initial migration, just ensure indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_tour ON favorites(user_id, tour_id);

-- ============================================================
-- 4. RLS Policies for favorites (ensure delete works)
-- ============================================================
-- Already covered in initial migration but ensure completeness
DO $$
BEGIN
  -- Verify favorites policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'favorites' AND policyname = 'Users can view own favorites'
  ) THEN
    CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'favorites' AND policyname = 'Users can add favorites'
  ) THEN
    CREATE POLICY "Users can add favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'favorites' AND policyname = 'Users can remove favorites'
  ) THEN
    CREATE POLICY "Users can remove favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;
