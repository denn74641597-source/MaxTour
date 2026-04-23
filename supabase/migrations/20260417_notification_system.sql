-- =============================================
-- MaxTour Notification System
-- =============================================

-- 1. Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- User notifications
  new_tour_from_followed  BOOLEAN DEFAULT true,
  price_drop              BOOLEAN DEFAULT true,
  seats_low               BOOLEAN DEFAULT true,
  tour_cancelled          BOOLEAN DEFAULT true,
  departure_reminder      BOOLEAN DEFAULT true,
  hot_deals               BOOLEAN DEFAULT true,
  lead_confirmed          BOOLEAN DEFAULT true,
  lead_status_changed     BOOLEAN DEFAULT true,
  agency_verified_notify  BOOLEAN DEFAULT true,
  weekly_picks            BOOLEAN DEFAULT true,
  -- Agency notifications
  new_lead                BOOLEAN DEFAULT true,
  daily_leads_summary     BOOLEAN DEFAULT true,
  pending_leads_reminder  BOOLEAN DEFAULT true,
  tour_approved           BOOLEAN DEFAULT true,
  tour_rejected           BOOLEAN DEFAULT true,
  tour_milestone          BOOLEAN DEFAULT true,
  seats_alert             BOOLEAN DEFAULT true,
  tour_expiring           BOOLEAN DEFAULT true,
  subscription_expiring   BOOLEAN DEFAULT true,
  subscription_expired    BOOLEAN DEFAULT true,
  new_review              BOOLEAN DEFAULT true,
  new_follower            BOOLEAN DEFAULT true,
  follower_milestone      BOOLEAN DEFAULT true,
  verification_update     BOOLEAN DEFAULT true,
  --
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Notification log table (for analytics)
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  recipient_count INT DEFAULT 0,
  preference_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =======================================================
-- Helper: invoke send-notification Edge Function
-- =======================================================
CREATE OR REPLACE FUNCTION notify_users(
  p_user_ids UUID[],
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}',
  p_preference_key TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  payload JSONB;
BEGIN
  payload := jsonb_build_object(
    'user_ids', p_user_ids,
    'title', p_title,
    'body', p_body,
    'data', p_data,
    'preference_key', p_preference_key
  );

  PERFORM net.http_post(
    url := 'https://vgdfewmyhgzpbxesxfdb.supabase.co/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnZGZld215aGd6cGJ4ZXN4ZmRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI4OTA5NCwiZXhwIjoyMDg4ODY1MDk0fQ.BB8X2U1bfJvBUmKty3pLf3eIUHqmklWDMdOWS2mZFdg'
    ),
    body := payload
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================================================
-- TRIGGER 1: New lead → notify agency owner
-- =======================================================
CREATE OR REPLACE FUNCTION on_new_lead() RETURNS trigger AS $$
DECLARE
  v_owner_id UUID;
  v_tour_title TEXT;
  v_lead_name TEXT;
BEGIN
  -- Get agency owner
  SELECT owner_id INTO v_owner_id
  FROM agencies WHERE id = NEW.agency_id;

  -- Get tour title
  SELECT title INTO v_tour_title
  FROM tours WHERE id = NEW.tour_id;

  v_lead_name := COALESCE(NEW.full_name, 'Yangi mijoz');

  PERFORM notify_users(
    ARRAY[v_owner_id],
    '📩 Yangi ariza!',
    v_lead_name || ' — ' || COALESCE(v_tour_title, 'Tur'),
    jsonb_build_object('type', 'new_lead', 'screen', 'leads', 'tour_id', NEW.tour_id),
    'new_lead'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_new_lead ON leads;
CREATE TRIGGER trg_new_lead
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION on_new_lead();

-- =======================================================
-- TRIGGER 2: Lead status changed → notify user
-- =======================================================
CREATE OR REPLACE FUNCTION on_lead_status_changed() RETURNS trigger AS $$
DECLARE
  v_tour_title TEXT;
  v_tour_slug TEXT;
  v_status_text TEXT;
BEGIN
  IF OLD.status = NEW.status OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT title, slug INTO v_tour_title, v_tour_slug
  FROM tours WHERE id = NEW.tour_id;

  v_status_text := CASE NEW.status
    WHEN 'contacted' THEN 'Agentlik siz bilan bog''lanadi'
    WHEN 'won' THEN 'Arizangiz tasdiqlandi!'
    WHEN 'lost' THEN 'Ariza yopildi'
    WHEN 'closed' THEN 'Ariza yakunlandi'
    ELSE NEW.status
  END;

  PERFORM notify_users(
    ARRAY[NEW.user_id],
    '📋 Ariza holati o''zgardi',
    COALESCE(v_tour_title, 'Tur') || ' — ' || v_status_text,
    jsonb_build_object('type', 'lead_status', 'tourSlug', v_tour_slug),
    'lead_status_changed'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_lead_status_changed ON leads;
CREATE TRIGGER trg_lead_status_changed
  AFTER UPDATE OF status ON leads
  FOR EACH ROW
  EXECUTE FUNCTION on_lead_status_changed();

-- =======================================================
-- TRIGGER 3: New tour from followed agency → notify followers
-- =======================================================
CREATE OR REPLACE FUNCTION on_tour_published() RETURNS trigger AS $$
DECLARE
  v_agency_name TEXT;
  v_follower_ids UUID[];
BEGIN
  -- Only trigger when status changes to 'published'
  IF NEW.status <> 'published' OR (OLD IS NOT NULL AND OLD.status = 'published') THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_agency_name FROM agencies WHERE id = NEW.agency_id;

  SELECT ARRAY_AGG(af.user_id) INTO v_follower_ids
  FROM agency_follows af
  WHERE af.agency_id = NEW.agency_id;

  IF v_follower_ids IS NOT NULL AND array_length(v_follower_ids, 1) > 0 THEN
    PERFORM notify_users(
      v_follower_ids,
      '🆕 ' || COALESCE(v_agency_name, 'Agentlik') || ' yangi tur e''lon qildi',
      NEW.title,
      jsonb_build_object('type', 'new_tour', 'tourSlug', NEW.slug),
      'new_tour_from_followed'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_tour_published ON tours;
CREATE TRIGGER trg_tour_published
  AFTER INSERT OR UPDATE OF status ON tours
  FOR EACH ROW
  EXECUTE FUNCTION on_tour_published();

-- =======================================================
-- TRIGGER 4: Price drop → notify users who favorited this tour
-- =======================================================
CREATE OR REPLACE FUNCTION on_price_drop() RETURNS trigger AS $$
DECLARE
  v_fav_user_ids UUID[];
BEGIN
  IF NEW.price >= OLD.price THEN
    RETURN NEW;
  END IF;

  SELECT ARRAY_AGG(user_id) INTO v_fav_user_ids
  FROM favorites WHERE tour_id = NEW.id;

  IF v_fav_user_ids IS NOT NULL AND array_length(v_fav_user_ids, 1) > 0 THEN
    PERFORM notify_users(
      v_fav_user_ids,
      '💰 Narx tushdi!',
      NEW.title || ' — ' || NEW.price || ' ' || NEW.currency,
      jsonb_build_object('type', 'price_drop', 'tourSlug', NEW.slug),
      'price_drop'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_price_drop ON tours;
CREATE TRIGGER trg_price_drop
  AFTER UPDATE OF price ON tours
  FOR EACH ROW
  EXECUTE FUNCTION on_price_drop();

-- =======================================================
-- TRIGGER 5: Seats running low → notify users who favorited
-- =======================================================
CREATE OR REPLACE FUNCTION on_seats_low() RETURNS trigger AS $$
DECLARE
  v_fav_user_ids UUID[];
BEGIN
  IF NEW.seats_left IS NULL OR NEW.seats_left > 3 THEN
    RETURN NEW;
  END IF;
  IF OLD.seats_left IS NOT NULL AND OLD.seats_left <= 3 THEN
    RETURN NEW; -- already notified
  END IF;

  SELECT ARRAY_AGG(user_id) INTO v_fav_user_ids
  FROM favorites WHERE tour_id = NEW.id;

  IF v_fav_user_ids IS NOT NULL AND array_length(v_fav_user_ids, 1) > 0 THEN
    PERFORM notify_users(
      v_fav_user_ids,
      '⚡ Joylar tugayapti!',
      NEW.title || ' — faqat ' || NEW.seats_left || ' ta joy qoldi',
      jsonb_build_object('type', 'seats_low', 'tourSlug', NEW.slug),
      'seats_low'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_seats_low ON tours;
CREATE TRIGGER trg_seats_low
  AFTER UPDATE OF seats_left ON tours
  FOR EACH ROW
  EXECUTE FUNCTION on_seats_low();

-- =======================================================
-- TRIGGER 6: Tour approved / rejected → notify agency owner
-- =======================================================
CREATE OR REPLACE FUNCTION on_tour_moderated() RETURNS trigger AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT owner_id INTO v_owner_id FROM agencies WHERE id = NEW.agency_id;

  IF NEW.status = 'published' AND OLD.status = 'pending' THEN
    PERFORM notify_users(
      ARRAY[v_owner_id],
      '✅ Tur tasdiqlandi!',
      NEW.title || ' muvaffaqiyatli e''lon qilindi',
      jsonb_build_object('type', 'tour_approved', 'tourSlug', NEW.slug),
      'tour_approved'
    );
  ELSIF NEW.status = 'archived' AND OLD.status = 'pending' THEN
    PERFORM notify_users(
      ARRAY[v_owner_id],
      '❌ Tur rad etildi',
      NEW.title || ' — admin tomonidan rad etildi',
      jsonb_build_object('type', 'tour_rejected', 'tourSlug', NEW.slug),
      'tour_rejected'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_tour_moderated ON tours;
CREATE TRIGGER trg_tour_moderated
  AFTER UPDATE OF status ON tours
  FOR EACH ROW
  EXECUTE FUNCTION on_tour_moderated();

-- =======================================================
-- TRIGGER 7: New review → notify agency owner
-- =======================================================
CREATE OR REPLACE FUNCTION on_new_review() RETURNS trigger AS $$
DECLARE
  v_owner_id UUID;
  v_agency_name TEXT;
  v_agency_slug TEXT;
  v_reviewer_name TEXT;
BEGIN
  SELECT a.owner_id, a.name, a.slug INTO v_owner_id, v_agency_name, v_agency_slug
  FROM agencies a WHERE a.id = NEW.agency_id;

  SELECT full_name INTO v_reviewer_name FROM profiles WHERE id = NEW.user_id;

  PERFORM notify_users(
    ARRAY[v_owner_id],
    '⭐ Yangi sharh — ' || NEW.rating || ' yulduz',
    COALESCE(v_reviewer_name, 'Foydalanuvchi') || ': ' || COALESCE(NEW.comment, ''),
    jsonb_build_object('type', 'new_review', 'agencySlug', v_agency_slug),
    'new_review'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_new_review ON reviews;
CREATE TRIGGER trg_new_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION on_new_review();

-- =======================================================
-- TRIGGER 8: New follower → notify agency owner
-- =======================================================
CREATE OR REPLACE FUNCTION on_new_follower() RETURNS trigger AS $$
DECLARE
  v_owner_id UUID;
  v_agency_name TEXT;
  v_agency_slug TEXT;
  v_follower_name TEXT;
  v_follower_count INT;
BEGIN
  SELECT a.owner_id, a.name, a.slug INTO v_owner_id, v_agency_name, v_agency_slug
  FROM agencies a WHERE a.id = NEW.agency_id;

  SELECT full_name INTO v_follower_name FROM profiles WHERE id = NEW.user_id;

  -- Follower count for milestones
  SELECT COUNT(*)::INT INTO v_follower_count
  FROM agency_follows WHERE agency_id = NEW.agency_id;

  -- Regular new follower notification
  PERFORM notify_users(
    ARRAY[v_owner_id],
    '👤 Yangi obunachi!',
    COALESCE(v_follower_name, 'Foydalanuvchi') || ' sizga obuna bo''ldi',
    jsonb_build_object('type', 'new_follower', 'agencySlug', v_agency_slug),
    'new_follower'
  );

  -- Milestone notifications: 50, 100, 500, 1000
  IF v_follower_count IN (50, 100, 500, 1000) THEN
    PERFORM notify_users(
      ARRAY[v_owner_id],
      '🎉 ' || v_follower_count || ' obunachi!',
      v_agency_name || ' — ' || v_follower_count || ' ta obunchiga yetdingiz!',
      jsonb_build_object('type', 'follower_milestone', 'agencySlug', v_agency_slug, 'count', v_follower_count),
      'follower_milestone'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_new_follower ON agency_follows;
CREATE TRIGGER trg_new_follower
  AFTER INSERT ON agency_follows
  FOR EACH ROW
  EXECUTE FUNCTION on_new_follower();

-- =======================================================
-- TRIGGER 9: Verification status changed → notify agency owner
-- =======================================================
CREATE OR REPLACE FUNCTION on_verification_changed() RETURNS trigger AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  IF OLD.is_verified = NEW.is_verified THEN RETURN NEW; END IF;

  SELECT owner_id INTO v_owner_id FROM agencies WHERE id = NEW.id;

  IF NEW.is_verified = true THEN
    PERFORM notify_users(
      ARRAY[v_owner_id],
      '✅ Agentlik tasdiqlandi!',
      NEW.name || ' MaxTour tomonidan tasdiqlandi',
      jsonb_build_object('type', 'verification_approved'),
      'verification_update'
    );
  ELSE
    PERFORM notify_users(
      ARRAY[v_owner_id],
      '❌ Tasdiqlash bekor qilindi',
      NEW.name || ' — tasdiqlash holati o''zgartirildi',
      jsonb_build_object('type', 'verification_rejected'),
      'verification_update'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_verification_changed ON agencies;
CREATE TRIGGER trg_verification_changed
  AFTER UPDATE OF is_verified ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION on_verification_changed();

-- =======================================================
-- TRIGGER 10: Tour archived → notify users who favorited
-- =======================================================
CREATE OR REPLACE FUNCTION on_tour_cancelled() RETURNS trigger AS $$
DECLARE
  v_fav_user_ids UUID[];
BEGIN
  IF NEW.status <> 'archived' OR OLD.status = 'archived' THEN
    RETURN NEW;
  END IF;

  SELECT ARRAY_AGG(user_id) INTO v_fav_user_ids
  FROM favorites WHERE tour_id = NEW.id;

  IF v_fav_user_ids IS NOT NULL AND array_length(v_fav_user_ids, 1) > 0 THEN
    PERFORM notify_users(
      v_fav_user_ids,
      '🚫 Tur bekor qilindi',
      NEW.title || ' — bu tur endi mavjud emas',
      jsonb_build_object('type', 'tour_cancelled', 'tourSlug', NEW.slug),
      'tour_cancelled'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_tour_cancelled ON tours;
CREATE TRIGGER trg_tour_cancelled
  AFTER UPDATE OF status ON tours
  FOR EACH ROW
  EXECUTE FUNCTION on_tour_cancelled();

-- =======================================================
-- CRON JOBS (requires pg_cron extension)
-- Run: SELECT cron.schedule(...)
-- =======================================================

-- CRON 1: Departure reminder — 3 days before departure
-- Schedule: every day at 09:00 UTC
SELECT cron.schedule(
  'departure-reminder',
  '0 9 * * *',
  $$
  WITH upcoming AS (
    SELECT t.id, t.title, t.slug, l.user_id
    FROM tours t
    JOIN leads l ON l.tour_id = t.id
    WHERE t.departure_date = CURRENT_DATE + INTERVAL '3 days'
      AND t.status = 'published'
      AND l.user_id IS NOT NULL
      AND l.status IN ('new', 'contacted', 'won')
  )
  SELECT notify_users(
    ARRAY_AGG(u.user_id),
    '✈️ Jo''nash sanasi yaqinlashmoqda!',
    u.title || ' — 3 kundan keyin jo''naydi',
    jsonb_build_object('type', 'departure_reminder', 'tourSlug', u.slug),
    'departure_reminder'
  )
  FROM upcoming u
  GROUP BY u.id, u.title, u.slug;
  $$
);

-- CRON 2: Subscription expiring — 3 days before ends_at
SELECT cron.schedule(
  'subscription-expiring',
  '0 10 * * *',
  $$
  SELECT notify_users(
    ARRAY[a.owner_id],
    '⏰ Obuna tugayapti!',
    'Sizning obunangiz 3 kundan keyin tugaydi. Yangilang!',
    jsonb_build_object('type', 'subscription_expiring'),
    'subscription_expiring'
  )
  FROM agency_subscriptions s
  JOIN agencies a ON a.id = s.agency_id
  WHERE s.status = 'active'
    AND s.ends_at::DATE = CURRENT_DATE + INTERVAL '3 days';
  $$
);

-- CRON 3: Subscription expired
SELECT cron.schedule(
  'subscription-expired',
  '0 10 * * *',
  $$
  UPDATE agency_subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND ends_at < NOW();

  SELECT notify_users(
    ARRAY[a.owner_id],
    '❌ Obuna tugadi',
    'Sizning obunangiz muddati tugadi. Turlarni e''lon qilish uchun yangilang.',
    jsonb_build_object('type', 'subscription_expired'),
    'subscription_expired'
  )
  FROM agency_subscriptions s
  JOIN agencies a ON a.id = s.agency_id
  WHERE s.status = 'expired'
    AND s.ends_at::DATE = CURRENT_DATE - INTERVAL '1 day';
  $$
);

-- CRON 4: Pending leads reminder — leads in 'new' status > 24h
SELECT cron.schedule(
  'pending-leads-reminder',
  '0 11 * * *',
  $$
  WITH stale AS (
    SELECT l.agency_id, COUNT(*)::INT AS cnt
    FROM leads l
    WHERE l.status = 'new'
      AND l.created_at < NOW() - INTERVAL '24 hours'
    GROUP BY l.agency_id
  )
  SELECT notify_users(
    ARRAY[a.owner_id],
    '📩 Javob berilmagan arizalar',
    s.cnt || ' ta arizaga hali javob berilmagan',
    jsonb_build_object('type', 'pending_leads'),
    'pending_leads_reminder'
  )
  FROM stale s
  JOIN agencies a ON a.id = s.agency_id;
  $$
);

-- CRON 5: Tour expiring — 7 days before departure
SELECT cron.schedule(
  'tour-expiring',
  '0 9 * * *',
  $$
  SELECT notify_users(
    ARRAY[a.owner_id],
    '📅 Tur muddati tugayapti',
    t.title || ' — 7 kundan keyin jo''naydi. Turni yangilang.',
    jsonb_build_object('type', 'tour_expiring', 'tourSlug', t.slug),
    'tour_expiring'
  )
  FROM tours t
  JOIN agencies a ON a.id = t.agency_id
  WHERE t.departure_date = CURRENT_DATE + INTERVAL '7 days'
    AND t.status = 'published';
  $$
);

-- CRON 6: Tour view milestones — 100, 500, 1000
SELECT cron.schedule(
  'tour-milestones',
  '0 12 * * *',
  $$
  SELECT notify_users(
    ARRAY[a.owner_id],
    '🔥 ' || t.view_count || ' ta ko''rish!',
    t.title || ' — ' || t.view_count || ' marta ko''rildi!',
    jsonb_build_object('type', 'tour_milestone', 'tourSlug', t.slug),
    'tour_milestone'
  )
  FROM tours t
  JOIN agencies a ON a.id = t.agency_id
  WHERE t.status = 'published'
    AND t.view_count IN (100, 500, 1000, 5000, 10000);
  $$
);

-- CRON 7: Seats alert for agency — seats_left <= 2
SELECT cron.schedule(
  'seats-alert-agency',
  '0 13 * * *',
  $$
  SELECT notify_users(
    ARRAY[a.owner_id],
    '⚡ Joylar tugayapti — ' || t.seats_left || ' ta qoldi',
    t.title || ' turida joylar kam qoldi',
    jsonb_build_object('type', 'seats_alert', 'tourSlug', t.slug),
    'seats_alert'
  )
  FROM tours t
  JOIN agencies a ON a.id = t.agency_id
  WHERE t.status = 'published'
    AND t.seats_left IS NOT NULL
    AND t.seats_left <= 2
    AND t.seats_left > 0;
  $$
);
