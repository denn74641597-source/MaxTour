-- =============================================================================
-- Stage 2: MaxTour-owned notification outbox + Cloudflare worker wiring
-- =============================================================================
-- Goals:
--  1) Move runtime delivery ownership to MaxTour + dedicated Cloudflare worker.
--  2) Enqueue notifications to notification_outbox (no direct Expo call in DB).
--  3) Keep business writes safe if immediate invoke fails.
--  4) Support worker RPC contract with p_retry_after_seconds (int).
--  5) Keep only requested sender types and disable deprecated sender logic.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Ensure durable queue table exists and matches worker contract
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_ids        UUID[]      NOT NULL,
  preference_key  TEXT,
  title           TEXT        NOT NULL,
  body            TEXT        NOT NULL,
  data            JSONB       NOT NULL DEFAULT '{}'::jsonb,
  status          TEXT        NOT NULL DEFAULT 'pending',
  attempts        INT         NOT NULL DEFAULT 0,
  max_attempts    INT         NOT NULL DEFAULT 3,
  last_error      TEXT,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at      TIMESTAMPTZ,
  claimed_by      TEXT,
  sent_at         TIMESTAMPTZ,
  dedupe_key      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS user_ids UUID[];
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS preference_key TEXT;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS max_attempts INT DEFAULT 3;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS claimed_by TEXT;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS dedupe_key TEXT;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  UPDATE public.notification_outbox
  SET id = gen_random_uuid()
  WHERE id IS NULL;

  ALTER TABLE public.notification_outbox ALTER COLUMN id SET DEFAULT gen_random_uuid();
  ALTER TABLE public.notification_outbox ALTER COLUMN id SET NOT NULL;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.notification_outbox'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.notification_outbox
      ADD CONSTRAINT notification_outbox_pkey PRIMARY KEY (id);
  END IF;
END
$$;

UPDATE public.notification_outbox
SET
  user_ids = COALESCE(user_ids, ARRAY[]::UUID[]),
  title = COALESCE(title, ''),
  body = COALESCE(body, ''),
  data = COALESCE(data, '{}'::jsonb),
  status = COALESCE(status, 'pending'),
  attempts = COALESCE(attempts, 0),
  max_attempts = COALESCE(max_attempts, 3),
  next_attempt_at = COALESCE(next_attempt_at, now()),
  created_at = COALESCE(created_at, now()),
  updated_at = COALESCE(updated_at, now())
WHERE
  user_ids IS NULL
  OR title IS NULL
  OR body IS NULL
  OR data IS NULL
  OR status IS NULL
  OR attempts IS NULL
  OR max_attempts IS NULL
  OR next_attempt_at IS NULL
  OR created_at IS NULL
  OR updated_at IS NULL;

ALTER TABLE public.notification_outbox ALTER COLUMN user_ids SET DEFAULT ARRAY[]::UUID[];
ALTER TABLE public.notification_outbox ALTER COLUMN title SET DEFAULT '';
ALTER TABLE public.notification_outbox ALTER COLUMN body SET DEFAULT '';
ALTER TABLE public.notification_outbox ALTER COLUMN data SET DEFAULT '{}'::jsonb;
ALTER TABLE public.notification_outbox ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.notification_outbox ALTER COLUMN attempts SET DEFAULT 0;
ALTER TABLE public.notification_outbox ALTER COLUMN max_attempts SET DEFAULT 3;
ALTER TABLE public.notification_outbox ALTER COLUMN next_attempt_at SET DEFAULT now();
ALTER TABLE public.notification_outbox ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.notification_outbox ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.notification_outbox ALTER COLUMN user_ids SET NOT NULL;
ALTER TABLE public.notification_outbox ALTER COLUMN title SET NOT NULL;
ALTER TABLE public.notification_outbox ALTER COLUMN body SET NOT NULL;
ALTER TABLE public.notification_outbox ALTER COLUMN data SET NOT NULL;
ALTER TABLE public.notification_outbox ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.notification_outbox ALTER COLUMN attempts SET NOT NULL;
ALTER TABLE public.notification_outbox ALTER COLUMN max_attempts SET NOT NULL;
ALTER TABLE public.notification_outbox ALTER COLUMN next_attempt_at SET NOT NULL;
ALTER TABLE public.notification_outbox ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.notification_outbox ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.notification_outbox'::regclass
      AND conname = 'notification_outbox_status_check'
  ) THEN
    ALTER TABLE public.notification_outbox
      ADD CONSTRAINT notification_outbox_status_check
      CHECK (status IN ('pending','processing','sent','failed','skipped'));
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS notification_outbox_dedupe_open_idx
  ON public.notification_outbox (dedupe_key)
  WHERE dedupe_key IS NOT NULL AND status IN ('pending','processing');

CREATE INDEX IF NOT EXISTS notification_outbox_next_attempt_idx
  ON public.notification_outbox (next_attempt_at);

CREATE INDEX IF NOT EXISTS notification_outbox_open_status_due_idx
  ON public.notification_outbox (status, next_attempt_at)
  WHERE status IN ('pending','processing');

CREATE OR REPLACE FUNCTION public.notification_outbox_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notification_outbox_touch ON public.notification_outbox;
CREATE TRIGGER trg_notification_outbox_touch
BEFORE UPDATE ON public.notification_outbox
FOR EACH ROW
EXECUTE FUNCTION public.notification_outbox_touch_updated_at();

-- Keep this table non-client-writeable; service_role/SECURITY DEFINER handles writes.
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_outbox FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2) Internal helper: enqueue row with deterministic dedupe
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enqueue_notification_outbox(
  p_user_ids UUID[],
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb,
  p_preference_key TEXT DEFAULT NULL,
  p_next_attempt_at TIMESTAMPTZ DEFAULT now(),
  p_dedupe_key TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_ids UUID[];
  v_payload JSONB := COALESCE(p_data, '{}'::jsonb);
  v_dedupe TEXT;
  v_id UUID;
BEGIN
  IF p_user_ids IS NULL OR array_length(p_user_ids, 1) IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(array_agg(DISTINCT u ORDER BY u), ARRAY[]::UUID[])
  INTO v_clean_ids
  FROM unnest(p_user_ids) AS u
  WHERE u IS NOT NULL;

  IF array_length(v_clean_ids, 1) IS NULL THEN
    RETURN NULL;
  END IF;

  v_dedupe := COALESCE(
    NULLIF(trim(COALESCE(p_dedupe_key, '')), ''),
    md5(
      COALESCE(lower(trim(p_preference_key)), '') || '|' ||
      COALESCE(p_title, '')                       || '|' ||
      COALESCE(p_body, '')                        || '|' ||
      COALESCE(v_payload::text, '{}')             || '|' ||
      array_to_string(v_clean_ids, ',')
    )
  );

  INSERT INTO public.notification_outbox (
    user_ids,
    preference_key,
    title,
    body,
    data,
    status,
    attempts,
    max_attempts,
    next_attempt_at,
    dedupe_key
  )
  VALUES (
    v_clean_ids,
    p_preference_key,
    COALESCE(p_title, ''),
    COALESCE(p_body, ''),
    v_payload,
    'pending',
    0,
    3,
    COALESCE(p_next_attempt_at, now()),
    v_dedupe
  )
  RETURNING id INTO v_id;

  RETURN v_id;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enqueue_notification_outbox(UUID[], TEXT, TEXT, JSONB, TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_notification_outbox(UUID[], TEXT, TEXT, JSONB, TEXT, TIMESTAMPTZ, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.enqueue_notification_outbox(UUID[], TEXT, TEXT, JSONB, TEXT, TIMESTAMPTZ, TEXT) FROM authenticated;

-- -----------------------------------------------------------------------------
-- 3) Secret + immediate invoke helper (best effort, never hardcode secret)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_internal_notification_secret()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret TEXT;
BEGIN
  IF to_regclass('vault.decrypted_secrets') IS NOT NULL THEN
    SELECT ds.decrypted_secret
    INTO v_secret
    FROM vault.decrypted_secrets ds
    WHERE lower(ds.name) = 'internal_notification_secret'
    ORDER BY ds.created_at DESC
    LIMIT 1;
  END IF;

  IF v_secret IS NULL THEN
    v_secret := NULLIF(current_setting('app.settings.internal_notification_secret', true), '');
  END IF;

  RETURN v_secret;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_internal_notification_secret() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_internal_notification_secret() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_internal_notification_secret() FROM authenticated;

CREATE OR REPLACE FUNCTION public.invoke_notification_outbox_worker(
  p_batch_size INT DEFAULT 10,
  p_source TEXT DEFAULT 'supabase-immediate'
) RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret TEXT;
  v_req_id BIGINT;
  v_batch INT;
  v_source TEXT;
BEGIN
  v_secret := public.get_internal_notification_secret();
  v_batch := GREATEST(1, LEAST(COALESCE(p_batch_size, 10), 100));
  v_source := COALESCE(NULLIF(trim(p_source), ''), 'supabase-immediate');

  IF v_secret IS NULL THEN
    RAISE WARNING 'invoke_notification_outbox_worker: INTERNAL_NOTIFICATION_SECRET missing; keeping rows pending';
    RETURN NULL;
  END IF;

  IF to_regnamespace('net') IS NULL
     OR NOT EXISTS (
       SELECT 1
       FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'net'
         AND p.proname = 'http_post'
     ) THEN
    RAISE WARNING 'invoke_notification_outbox_worker: net.http_post unavailable; keeping rows pending';
    RETURN NULL;
  END IF;

  BEGIN
    EXECUTE
      'SELECT net.http_post(url := $1, headers := $2, body := $3)'
      INTO v_req_id
      USING
        'https://maxtour-notification-worker.denn74641597.workers.dev/internal/notifications/process',
        jsonb_build_object(
          'content-type', 'application/json',
          'x-internal-notification-secret', v_secret
        ),
        jsonb_build_object(
          'batch_size', v_batch,
          'source', v_source
        );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'invoke_notification_outbox_worker failed: % (%)', SQLERRM, SQLSTATE;
      RETURN NULL;
  END;

  RETURN v_req_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.invoke_notification_outbox_worker(INT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.invoke_notification_outbox_worker(INT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.invoke_notification_outbox_worker(INT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.invoke_notification_outbox_worker(INT, TEXT) TO service_role;

-- -----------------------------------------------------------------------------
-- 4) Worker RPC contract (stable signatures expected by Cloudflare worker)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_notification_outbox(
  p_batch_size INT DEFAULT 10,
  p_worker_id TEXT DEFAULT NULL
) RETURNS SETOF public.notification_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch INT := GREATEST(1, LEAST(COALESCE(p_batch_size, 10), 100));
BEGIN
  -- Crash/stall recovery: rows stuck in processing for > 5 minutes become pending.
  UPDATE public.notification_outbox
  SET
    status = 'pending',
    claimed_at = NULL,
    claimed_by = NULL
  WHERE status = 'processing'
    AND (claimed_at IS NULL OR claimed_at < now() - INTERVAL '5 minutes');

  RETURN QUERY
  WITH due AS (
    SELECT id
    FROM public.notification_outbox
    WHERE status = 'pending'
      AND next_attempt_at <= now()
    ORDER BY next_attempt_at, created_at
    LIMIT v_batch
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.notification_outbox o
  SET
    status = 'processing',
    claimed_at = now(),
    claimed_by = p_worker_id,
    attempts = COALESCE(o.attempts, 0) + 1
  FROM due
  WHERE o.id = due.id
  RETURNING o.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_sent(
  p_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notification_outbox
  SET
    status = 'sent',
    sent_at = now(),
    last_error = NULL
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_failed(
  p_id UUID,
  p_error TEXT,
  p_retry_after_seconds INT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts INT;
  v_max_attempts INT;
  v_retry_seconds INT;
BEGIN
  SELECT attempts, max_attempts
  INTO v_attempts, v_max_attempts
  FROM public.notification_outbox
  WHERE id = p_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_attempts >= v_max_attempts THEN
    UPDATE public.notification_outbox
    SET
      status = 'failed',
      last_error = LEFT(COALESCE(p_error, 'unknown_error'), 1000)
    WHERE id = p_id;
    RETURN;
  END IF;

  IF p_retry_after_seconds IS NOT NULL AND p_retry_after_seconds > 0 THEN
    v_retry_seconds := p_retry_after_seconds;
  ELSIF v_attempts <= 1 THEN
    v_retry_seconds := 60;
  ELSIF v_attempts = 2 THEN
    v_retry_seconds := 120;
  ELSE
    v_retry_seconds := 300;
  END IF;

  UPDATE public.notification_outbox
  SET
    status = 'pending',
    last_error = LEFT(COALESCE(p_error, 'unknown_error'), 1000),
    next_attempt_at = now() + make_interval(secs => v_retry_seconds),
    claimed_at = NULL,
    claimed_by = NULL
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_skipped(
  p_id UUID,
  p_reason TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notification_outbox
  SET
    status = 'skipped',
    last_error = LEFT(COALESCE(p_reason, ''), 1000)
  WHERE id = p_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_notification_outbox(INT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_notification_sent(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_notification_failed(UUID, TEXT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_notification_skipped(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_notification_outbox(INT, TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_notification_sent(UUID) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_notification_failed(UUID, TEXT, INT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_notification_skipped(UUID, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notification_outbox(INT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_notification_sent(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_notification_failed(UUID, TEXT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_notification_skipped(UUID, TEXT) TO service_role;

-- -----------------------------------------------------------------------------
-- 5) notify_users enqueue implementation + immediate invoke (best effort)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_users(
  p_user_ids UUID[],
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb,
  p_preference_key TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_ids UUID[];
  v_pref_key TEXT := lower(trim(COALESCE(p_preference_key, '')));
  v_data JSONB := COALESCE(p_data, '{}'::jsonb);
  v_dedupe_override TEXT;
  v_rate_limited BOOLEAN := FALSE;
  v_should_immediate BOOLEAN := FALSE;
  v_total INT := 0;
  v_chunk_size INT := 50;
  v_chunk_count INT := 0;
  v_chunk_idx INT;
  v_chunk_ids UUID[];
  v_next_attempt TIMESTAMPTZ;
BEGIN
  IF p_user_ids IS NULL OR array_length(p_user_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(array_agg(DISTINCT u ORDER BY u), ARRAY[]::UUID[])
  INTO v_clean_ids
  FROM unnest(p_user_ids) AS u
  WHERE u IS NOT NULL;

  v_total := COALESCE(array_length(v_clean_ids, 1), 0);
  IF v_total = 0 THEN
    RETURN;
  END IF;

  IF v_data ? '_dedupe_key' THEN
    v_dedupe_override := NULLIF(trim(v_data->>'_dedupe_key'), '');
    v_data := v_data - '_dedupe_key';
  END IF;

  v_rate_limited := (v_pref_key = 'new_tour_from_followed');
  v_should_immediate := v_pref_key = ANY (ARRAY[
    'new_lead',
    'tour_approved',
    'tour_rejected',
    'new_review',
    'new_follower',
    'verification_update',
    'new_tour_from_followed'
  ]);

  -- Rate-limited sender: split into 50-recipient chunks, each chunk offset by +N hours.
  IF v_rate_limited THEN
    v_chunk_count := CEIL(v_total::numeric / v_chunk_size::numeric)::INT;

    FOR v_chunk_idx IN 1..v_chunk_count LOOP
      v_chunk_ids := v_clean_ids[((v_chunk_idx - 1) * v_chunk_size + 1):LEAST(v_chunk_idx * v_chunk_size, v_total)];
      v_next_attempt := now() + make_interval(hours => (v_chunk_idx - 1));

      PERFORM public.enqueue_notification_outbox(
        v_chunk_ids,
        p_title,
        p_body,
        v_data,
        p_preference_key,
        v_next_attempt,
        CASE
          WHEN v_dedupe_override IS NULL THEN NULL
          ELSE v_dedupe_override || '|chunk=' || v_chunk_idx::TEXT
        END
      );
    END LOOP;
  ELSE
    PERFORM public.enqueue_notification_outbox(
      v_clean_ids,
      p_title,
      p_body,
      v_data,
      p_preference_key,
      now(),
      v_dedupe_override
    );
  END IF;

  -- Best-effort immediate invoke. Never block business transaction on failures.
  IF v_should_immediate THEN
    BEGIN
      PERFORM public.invoke_notification_outbox_worker(10, 'supabase-immediate');
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'notify_users immediate invoke failed (non-fatal): % (%)', SQLERRM, SQLSTATE;
    END;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_users enqueue failed (non-fatal): % (%)', SQLERRM, SQLSTATE;
    RETURN;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_users(UUID[], TEXT, TEXT, JSONB, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_users(UUID[], TEXT, TEXT, JSONB, TEXT) FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- 6) Keep only requested sender logic; disable deprecated sender logic
-- -----------------------------------------------------------------------------

-- Keep: new_lead
CREATE OR REPLACE FUNCTION public.on_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_tour_title TEXT;
  v_lead_name TEXT;
BEGIN
  SELECT owner_id INTO v_owner_id
  FROM public.agencies
  WHERE id = NEW.agency_id;

  SELECT title INTO v_tour_title
  FROM public.tours
  WHERE id = NEW.tour_id;

  v_lead_name := COALESCE(NEW.full_name, 'Yangi mijoz');

  PERFORM public.notify_users(
    ARRAY[v_owner_id],
    '📩 Yangi ariza!',
    v_lead_name || ' — ' || COALESCE(v_tour_title, 'Tur'),
    jsonb_build_object('type', 'new_lead', 'screen', 'leads', 'tour_id', NEW.tour_id),
    'new_lead'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_lead ON public.leads;
CREATE TRIGGER trg_new_lead
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.on_new_lead();

-- Keep: new_tour_from_followed (rate-limited through notify_users chunking)
CREATE OR REPLACE FUNCTION public.on_tour_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_name TEXT;
  v_follower_ids UUID[];
BEGIN
  IF NEW.status <> 'published' OR (OLD IS NOT NULL AND OLD.status = 'published') THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_agency_name
  FROM public.agencies
  WHERE id = NEW.agency_id;

  SELECT ARRAY_AGG(af.user_id ORDER BY af.user_id)
  INTO v_follower_ids
  FROM public.agency_follows af
  WHERE af.agency_id = NEW.agency_id;

  IF v_follower_ids IS NOT NULL AND array_length(v_follower_ids, 1) > 0 THEN
    PERFORM public.notify_users(
      v_follower_ids,
      '🆕 ' || COALESCE(v_agency_name, 'Agentlik') || ' yangi tur e''lon qildi',
      NEW.title,
      jsonb_build_object('type', 'new_tour', 'tourSlug', NEW.slug),
      'new_tour_from_followed'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tour_published ON public.tours;
CREATE TRIGGER trg_tour_published
AFTER INSERT OR UPDATE OF status ON public.tours
FOR EACH ROW
EXECUTE FUNCTION public.on_tour_published();

-- Keep: tour_approved / tour_rejected
CREATE OR REPLACE FUNCTION public.on_tour_moderated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT owner_id INTO v_owner_id
  FROM public.agencies
  WHERE id = NEW.agency_id;

  IF NEW.status = 'published' AND OLD.status = 'pending' THEN
    PERFORM public.notify_users(
      ARRAY[v_owner_id],
      '✅ Tur tasdiqlandi!',
      NEW.title || ' muvaffaqiyatli e''lon qilindi',
      jsonb_build_object('type', 'tour_approved', 'tourSlug', NEW.slug),
      'tour_approved'
    );
  ELSIF NEW.status = 'archived' AND OLD.status = 'pending' THEN
    PERFORM public.notify_users(
      ARRAY[v_owner_id],
      '❌ Tur rad etildi',
      NEW.title || ' — admin tomonidan rad etildi',
      jsonb_build_object('type', 'tour_rejected', 'tourSlug', NEW.slug),
      'tour_rejected'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tour_moderated ON public.tours;
CREATE TRIGGER trg_tour_moderated
AFTER UPDATE OF status ON public.tours
FOR EACH ROW
EXECUTE FUNCTION public.on_tour_moderated();

-- Keep: new_review
CREATE OR REPLACE FUNCTION public.on_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_agency_slug TEXT;
  v_reviewer_name TEXT;
BEGIN
  SELECT a.owner_id, a.slug
  INTO v_owner_id, v_agency_slug
  FROM public.agencies a
  WHERE a.id = NEW.agency_id;

  SELECT full_name
  INTO v_reviewer_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  PERFORM public.notify_users(
    ARRAY[v_owner_id],
    '⭐ Yangi sharh — ' || NEW.rating || ' yulduz',
    COALESCE(v_reviewer_name, 'Foydalanuvchi') || ': ' || COALESCE(NEW.comment, ''),
    jsonb_build_object('type', 'new_review', 'agencySlug', v_agency_slug),
    'new_review'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_review ON public.reviews;
CREATE TRIGGER trg_new_review
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.on_new_review();

-- Keep: new_follower (disable follower_milestone sender logic)
CREATE OR REPLACE FUNCTION public.on_new_follower()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_agency_slug TEXT;
  v_follower_name TEXT;
BEGIN
  SELECT a.owner_id, a.slug
  INTO v_owner_id, v_agency_slug
  FROM public.agencies a
  WHERE a.id = NEW.agency_id;

  SELECT full_name
  INTO v_follower_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  PERFORM public.notify_users(
    ARRAY[v_owner_id],
    '👤 Yangi obunachi!',
    COALESCE(v_follower_name, 'Foydalanuvchi') || ' sizga obuna bo''ldi',
    jsonb_build_object('type', 'new_follower', 'agencySlug', v_agency_slug),
    'new_follower'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_follower ON public.agency_follows;
CREATE TRIGGER trg_new_follower
AFTER INSERT ON public.agency_follows
FOR EACH ROW
EXECUTE FUNCTION public.on_new_follower();

-- Keep: verification_update
CREATE OR REPLACE FUNCTION public.on_verification_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  IF OLD.is_verified = NEW.is_verified THEN
    RETURN NEW;
  END IF;

  SELECT owner_id INTO v_owner_id
  FROM public.agencies
  WHERE id = NEW.id;

  IF NEW.is_verified = true THEN
    PERFORM public.notify_users(
      ARRAY[v_owner_id],
      '✅ Agentlik tasdiqlandi!',
      NEW.name || ' MaxTour tomonidan tasdiqlandi',
      jsonb_build_object('type', 'verification_approved'),
      'verification_update'
    );
  ELSE
    PERFORM public.notify_users(
      ARRAY[v_owner_id],
      '❌ Tasdiqlash bekor qilindi',
      NEW.name || ' — tasdiqlash holati o''zgartirildi',
      jsonb_build_object('type', 'verification_rejected'),
      'verification_update'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verification_changed ON public.agencies;
CREATE TRIGGER trg_verification_changed
AFTER UPDATE OF is_verified ON public.agencies
FOR EACH ROW
EXECUTE FUNCTION public.on_verification_changed();

-- Disable deprecated trigger senders
DROP TRIGGER IF EXISTS trg_lead_status_changed ON public.leads;
DROP TRIGGER IF EXISTS trg_price_drop ON public.tours;
DROP TRIGGER IF EXISTS trg_seats_low ON public.tours;
DROP TRIGGER IF EXISTS trg_tour_cancelled ON public.tours;

-- -----------------------------------------------------------------------------
-- 7) Cron jobs: keep pending_leads_reminder daily summary; unschedule deprecated
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_name TEXT;
  v_names TEXT[] := ARRAY[
    'departure-reminder',
    'departure_reminder',
    'subscription-expiring',
    'subscription_expiring',
    'subscription-expired',
    'subscription_expired',
    'tour-expiring',
    'tour_expiring',
    'tour-milestones',
    'tour_milestone',
    'seats-alert-agency',
    'seats_alert',
    'daily-leads-summary',
    'daily_leads_summary',
    'hot-deals',
    'hot_deals',
    'weekly-picks',
    'weekly_picks',
    'lead-confirmed',
    'lead_confirmed',
    'agency-verified-notify',
    'agency_verified_notify',
    'hot-deal',
    'hot_deal',
    'weekly-pick',
    'weekly_pick',
    'tour-update',
    'tour_update',
    'agency-update',
    'agency_update',
    'price_drop',
    'seats_low',
    'follower_milestone',
    'tour_cancelled',
    'lead_status_changed'
  ];
BEGIN
  IF to_regnamespace('cron') IS NULL THEN
    RAISE NOTICE 'pg_cron schema not found; cron unschedule/schedule skipped';
    RETURN;
  END IF;

  FOREACH v_name IN ARRAY v_names LOOP
    BEGIN
      PERFORM cron.unschedule(v_name);
    EXCEPTION
      WHEN OTHERS THEN
        -- job may not exist or caller may lack visibility/ownership; keep migration idempotent
        NULL;
    END;
  END LOOP;

  -- Recreate/replace pending-leads-reminder as one summary notification per agency/day.
  BEGIN
    PERFORM cron.unschedule('pending-leads-reminder');
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  PERFORM cron.schedule(
    'pending-leads-reminder',
    '0 11 * * *',
    $cron$
    WITH stale AS (
      SELECT
        l.agency_id,
        COUNT(*)::INT AS cnt
      FROM public.leads l
      WHERE l.status = 'new'
        AND l.created_at < now() - INTERVAL '24 hours'
      GROUP BY l.agency_id
    )
    SELECT public.notify_users(
      ARRAY[a.owner_id],
      '📩 Javob berilmagan arizalar',
      s.cnt || ' ta arizaga hali javob berilmagan',
      jsonb_build_object(
        'type', 'pending_leads_reminder',
        'count', s.cnt,
        '_dedupe_key', 'pending_leads_reminder|' || a.owner_id::text || '|' || current_date::text
      ),
      'pending_leads_reminder'
    )
    FROM stale s
    JOIN public.agencies a ON a.id = s.agency_id;
    $cron$
  );
END;
$$;

-- =============================================================================
-- End of Stage 2 migration
-- =============================================================================
