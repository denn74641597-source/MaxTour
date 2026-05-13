BEGIN;

-- ============================================================================
-- Bonus wallet + tour approval reward
-- ----------------------------------------------------------------------------
-- Goals:
-- 1) Keep purchased MaxCoin and bonus MaxCoin fully separated.
-- 2) Allow promotions to be charged from selected wallet (main/bonus).
-- 3) Add secure, idempotent admin bonus grant for published tours.
-- 4) Preserve existing RPCs while introducing wallet-aware RPCs.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Agency bonus balances/statistics
-- ----------------------------------------------------------------------------
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS maxcoin_bonus_balance INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maxcoin_bonus_earned_total INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'agencies_maxcoin_bonus_balance_nonnegative_chk'
      AND conrelid = 'public.agencies'::regclass
  ) THEN
    ALTER TABLE public.agencies
      ADD CONSTRAINT agencies_maxcoin_bonus_balance_nonnegative_chk
      CHECK (maxcoin_bonus_balance >= 0);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'agencies_maxcoin_bonus_earned_total_nonnegative_chk'
      AND conrelid = 'public.agencies'::regclass
  ) THEN
    ALTER TABLE public.agencies
      ADD CONSTRAINT agencies_maxcoin_bonus_earned_total_nonnegative_chk
      CHECK (maxcoin_bonus_earned_total >= 0);
  END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2) Wallet tagging for transactions and promotions
-- ----------------------------------------------------------------------------
ALTER TABLE public.maxcoin_transactions
  ADD COLUMN IF NOT EXISTS wallet_type TEXT;

UPDATE public.maxcoin_transactions
SET wallet_type = 'main'
WHERE wallet_type IS NULL;

ALTER TABLE public.maxcoin_transactions
  ALTER COLUMN wallet_type SET DEFAULT 'main';

ALTER TABLE public.maxcoin_transactions
  ALTER COLUMN wallet_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'maxcoin_transactions_wallet_type_chk'
      AND conrelid = 'public.maxcoin_transactions'::regclass
  ) THEN
    ALTER TABLE public.maxcoin_transactions
      ADD CONSTRAINT maxcoin_transactions_wallet_type_chk
      CHECK (wallet_type IN ('main', 'bonus'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_maxcoin_transactions_wallet_type_created_at
  ON public.maxcoin_transactions(wallet_type, created_at DESC);

ALTER TABLE public.tour_promotions
  ADD COLUMN IF NOT EXISTS wallet_type TEXT;

UPDATE public.tour_promotions
SET wallet_type = 'main'
WHERE wallet_type IS NULL;

ALTER TABLE public.tour_promotions
  ALTER COLUMN wallet_type SET DEFAULT 'main';

ALTER TABLE public.tour_promotions
  ALTER COLUMN wallet_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tour_promotions_wallet_type_chk'
      AND conrelid = 'public.tour_promotions'::regclass
  ) THEN
    ALTER TABLE public.tour_promotions
      ADD CONSTRAINT tour_promotions_wallet_type_chk
      CHECK (wallet_type IN ('main', 'bonus'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_tour_promotions_wallet_type_status
  ON public.tour_promotions(wallet_type, status, placement, created_at DESC);

-- ----------------------------------------------------------------------------
-- 3) One-time bonus grant log per approved tour
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tour_approval_bonus_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  bonus_amount INTEGER NOT NULL CHECK (bonus_amount > 0),
  granted_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tour_approval_bonus_grants_tour_id
  ON public.tour_approval_bonus_grants(tour_id);

CREATE INDEX IF NOT EXISTS idx_tour_approval_bonus_grants_agency_id
  ON public.tour_approval_bonus_grants(agency_id, granted_at DESC);

ALTER TABLE public.tour_approval_bonus_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tour_approval_bonus_grants_select_own" ON public.tour_approval_bonus_grants;
CREATE POLICY "tour_approval_bonus_grants_select_own"
  ON public.tour_approval_bonus_grants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.agencies a
      WHERE a.id = tour_approval_bonus_grants.agency_id
        AND a.owner_id = auth.uid()
    )
  );

REVOKE ALL ON public.tour_approval_bonus_grants FROM PUBLIC;
REVOKE ALL ON public.tour_approval_bonus_grants FROM anon;
GRANT SELECT ON public.tour_approval_bonus_grants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_approval_bonus_grants TO service_role;

-- ----------------------------------------------------------------------------
-- 4) Admin-only secure bonus grant RPC (idempotent per tour)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_tour_approval_bonus_v1(
  p_tour_id UUID,
  p_admin_user_id UUID DEFAULT NULL,
  p_bonus_amount INTEGER DEFAULT 2
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_tour public.tours%ROWTYPE;
  v_amount INTEGER := COALESCE(p_bonus_amount, 2);
  v_grant_id UUID;
  v_new_bonus_balance INTEGER;
  v_new_bonus_earned_total INTEGER;
BEGIN
  IF p_tour_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'tour_id_required');
  END IF;

  IF v_amount <= 0 OR v_amount > 1000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_bonus_amount');
  END IF;

  SELECT *
    INTO v_tour
  FROM public.tours
  WHERE id = p_tour_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'tour_not_found');
  END IF;

  IF v_tour.status <> 'published' THEN
    RETURN jsonb_build_object('success', false, 'error', 'tour_not_published');
  END IF;

  IF v_tour.agency_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'tour_missing_agency');
  END IF;

  INSERT INTO public.tour_approval_bonus_grants (
    tour_id,
    agency_id,
    bonus_amount,
    granted_by,
    metadata
  ) VALUES (
    v_tour.id,
    v_tour.agency_id,
    v_amount,
    p_admin_user_id,
    jsonb_build_object(
      'source', 'tour_approval',
      'awarded_at', now()
    )
  )
  ON CONFLICT (tour_id) DO NOTHING
  RETURNING id INTO v_grant_id;

  IF v_grant_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'granted', false,
      'reason', 'already_granted'
    );
  END IF;

  UPDATE public.agencies a
  SET maxcoin_bonus_balance = a.maxcoin_bonus_balance + v_amount,
      maxcoin_bonus_earned_total = a.maxcoin_bonus_earned_total + v_amount,
      updated_at = now()
  WHERE a.id = v_tour.agency_id
  RETURNING a.maxcoin_bonus_balance, a.maxcoin_bonus_earned_total
  INTO v_new_bonus_balance, v_new_bonus_earned_total;

  IF v_new_bonus_balance IS NULL THEN
    DELETE FROM public.tour_approval_bonus_grants
    WHERE id = v_grant_id;
    RETURN jsonb_build_object('success', false, 'error', 'agency_not_found');
  END IF;

  INSERT INTO public.maxcoin_transactions (
    agency_id,
    amount,
    type,
    description,
    tour_id,
    wallet_type
  ) VALUES (
    v_tour.agency_id,
    v_amount,
    'bonus_tour_approval',
    'Tour approval bonus',
    v_tour.id,
    'bonus'
  );

  RETURN jsonb_build_object(
    'success', true,
    'granted', true,
    'grantId', v_grant_id,
    'agencyId', v_tour.agency_id,
    'bonusAmount', v_amount,
    'bonusBalance', v_new_bonus_balance,
    'bonusEarnedTotal', v_new_bonus_earned_total
  );
END;
$$;

REVOKE ALL ON FUNCTION public.grant_tour_approval_bonus_v1(UUID, UUID, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_tour_approval_bonus_v1(UUID, UUID, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.grant_tour_approval_bonus_v1(UUID, UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.grant_tour_approval_bonus_v1(UUID, UUID, INTEGER) TO service_role;

-- ----------------------------------------------------------------------------
-- 5) Wallet-aware promotion RPCs (new entrypoints)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.promote_tour_fair_wallet_v1(
  p_agency_id UUID,
  p_tour_id UUID,
  p_tier_id UUID,
  p_idempotency_key TEXT,
  p_wallet_type TEXT DEFAULT 'main'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid UUID;
  v_wallet_type TEXT := lower(coalesce(nullif(trim(p_wallet_type), ''), 'main'));
  v_tier RECORD;
  v_bonus_balance INT;
  v_new_bonus_balance INT;
  v_now TIMESTAMPTZ := now();
  v_ends_at TIMESTAMPTZ;
  v_active_count INT;
  v_should_waitlist BOOLEAN := false;
  v_existing UUID;
  v_resp JSONB;
  v_promotion_id UUID;
  v_target_total INT;
BEGIN
  IF v_wallet_type NOT IN ('main', 'bonus') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_wallet_type');
  END IF;

  IF v_wallet_type = 'main' THEN
    RETURN COALESCE(
      public.promote_tour_fair_v1(
        p_agency_id,
        p_tour_id,
        p_tier_id,
        p_idempotency_key
      ),
      '{}'::jsonb
    ) || jsonb_build_object('walletType', 'main');
  END IF;

  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required'
      USING ERRCODE = '28000',
            DETAIL = 'Authenticated session is required for promote_tour_fair_wallet_v1.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.agencies a
    WHERE a.id = p_agency_id
      AND a.owner_id = v_uid
  ) THEN
    RAISE EXCEPTION 'forbidden_agency_access'
      USING ERRCODE = '42501',
            DETAIL = 'auth.uid() must own p_agency_id.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.tours t
    WHERE t.id = p_tour_id
      AND t.agency_id = p_agency_id
  ) THEN
    RAISE EXCEPTION 'forbidden_tour_access'
      USING ERRCODE = '42501',
            DETAIL = 'p_tour_id must belong to p_agency_id.';
  END IF;

  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_idempotency_key');
  END IF;

  SELECT k.response_payload
    INTO v_resp
  FROM public.promo_idempotency_keys k
  WHERE k.scope = 'promote_tour_fair_wallet_v1'
    AND k.idempotency_key = p_idempotency_key
  LIMIT 1;

  IF v_resp IS NOT NULL THEN
    RETURN v_resp;
  END IF;

  SELECT id, placement, coins, days
    INTO v_tier
  FROM public.promotion_tiers
  WHERE id = p_tier_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'tier_not_found');
  END IF;

  IF v_tier.placement NOT IN ('hot_deals', 'hot_tours') THEN
    RETURN jsonb_build_object('success', false, 'error', 'unsupported_placement');
  END IF;

  SELECT tp.id
    INTO v_existing
  FROM public.tour_promotions tp
  WHERE tp.tour_id = p_tour_id
    AND tp.placement = v_tier.placement
    AND tp.status IN ('active', 'waitlist')
    AND (tp.status = 'waitlist' OR tp.ends_at >= v_now)
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'tour_already_promoted_or_waitlisted');
  END IF;

  SELECT COUNT(*)::INT
    INTO v_active_count
  FROM public.tour_promotions tp
  WHERE tp.placement = v_tier.placement
    AND tp.status = 'active'
    AND tp.is_active = true
    AND tp.ends_at >= v_now;

  v_should_waitlist := v_active_count >= public._l99_slot_limit(v_tier.placement)
                       OR public._l99_projected_sla_confidence(v_tier.placement) < 0.90;

  SELECT a.maxcoin_bonus_balance
    INTO v_bonus_balance
  FROM public.agencies a
  WHERE a.id = p_agency_id;

  IF COALESCE(v_bonus_balance, 0) < COALESCE(v_tier.coins, 0) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_bonus_balance',
      'required', COALESCE(v_tier.coins, 0),
      'current', COALESCE(v_bonus_balance, 0)
    );
  END IF;

  v_ends_at := v_now + make_interval(days => COALESCE(v_tier.days, 1));
  v_target_total := GREATEST(200, COALESCE(v_tier.days, 1) * 120);

  IF v_should_waitlist THEN
    INSERT INTO public.tour_promotions (
      tour_id,
      agency_id,
      placement,
      cost_coins,
      starts_at,
      ends_at,
      is_active,
      status,
      target_impressions_total,
      reserved_coins,
      activated_at,
      wallet_type
    ) VALUES (
      p_tour_id,
      p_agency_id,
      v_tier.placement,
      v_tier.coins,
      v_now,
      v_ends_at,
      false,
      'waitlist',
      v_target_total,
      v_tier.coins,
      NULL,
      'bonus'
    ) RETURNING id INTO v_promotion_id;

    INSERT INTO public.promo_waitlist (
      promotion_id,
      agency_id,
      tour_id,
      placement,
      requested_days,
      requested_coins,
      scheduled_start_at
    ) VALUES (
      v_promotion_id,
      p_agency_id,
      p_tour_id,
      v_tier.placement,
      v_tier.days,
      v_tier.coins,
      NULL
    );

    INSERT INTO public.promo_financial_ledger (
      promotion_id,
      agency_id,
      action,
      amount_coins,
      before_balance,
      after_balance,
      reason,
      metadata
    ) VALUES (
      v_promotion_id,
      p_agency_id,
      'reserve_waitlist',
      0,
      v_bonus_balance,
      v_bonus_balance,
      'waitlist_without_immediate_deduction',
      jsonb_build_object('placement', v_tier.placement, 'days', v_tier.days, 'wallet_type', 'bonus')
    );

    v_resp := jsonb_build_object(
      'success', true,
      'status', 'waitlist',
      'promotionId', v_promotion_id,
      'chargedNow', false,
      'currentBalance', v_bonus_balance,
      'placement', v_tier.placement,
      'days', v_tier.days,
      'walletType', 'bonus'
    );

    INSERT INTO public.promo_idempotency_keys(scope, idempotency_key, response_payload)
    VALUES ('promote_tour_fair_wallet_v1', p_idempotency_key, v_resp)
    ON CONFLICT (scope, idempotency_key) DO NOTHING;

    RETURN v_resp;
  END IF;

  UPDATE public.agencies
  SET maxcoin_bonus_balance = maxcoin_bonus_balance - v_tier.coins
  WHERE id = p_agency_id
    AND maxcoin_bonus_balance >= v_tier.coins
  RETURNING maxcoin_bonus_balance INTO v_new_bonus_balance;

  IF v_new_bonus_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'bonus_balance_race_condition');
  END IF;

  INSERT INTO public.tour_promotions (
    tour_id,
    agency_id,
    placement,
    cost_coins,
    starts_at,
    ends_at,
    is_active,
    status,
    target_impressions_total,
    reserved_coins,
    activated_at,
    wallet_type
  ) VALUES (
    p_tour_id,
    p_agency_id,
    v_tier.placement,
    v_tier.coins,
    v_now,
    v_ends_at,
    true,
    'active',
    v_target_total,
    0,
    v_now,
    'bonus'
  ) RETURNING id INTO v_promotion_id;

  INSERT INTO public.maxcoin_transactions (
    agency_id,
    amount,
    type,
    description,
    tour_id,
    wallet_type
  ) VALUES (
    p_agency_id,
    -v_tier.coins,
    'spend_' || v_tier.placement,
    v_tier.placement || ' uchun ' || v_tier.days || ' kunlik reklama (bonus wallet)',
    p_tour_id,
    'bonus'
  );

  INSERT INTO public.promo_financial_ledger (
    promotion_id,
    agency_id,
    action,
    amount_coins,
    before_balance,
    after_balance,
    reason,
    metadata
  ) VALUES (
    v_promotion_id,
    p_agency_id,
    'deduct_on_activate',
    -v_tier.coins,
    v_bonus_balance,
    v_new_bonus_balance,
    'promotion_activated',
    jsonb_build_object('placement', v_tier.placement, 'days', v_tier.days, 'wallet_type', 'bonus')
  );

  INSERT INTO public.promo_serving_state (
    promotion_id,
    last_served_at,
    served_count_total,
    served_count_today,
    served_count_hour
  ) VALUES (
    v_promotion_id,
    NULL,
    0,
    0,
    0
  )
  ON CONFLICT (promotion_id) DO NOTHING;

  INSERT INTO public.promo_delivery_hourly (
    promotion_id,
    hour_bucket,
    target_impressions,
    delivered_impressions,
    delivered_clicks,
    delivered_leads
  ) VALUES (
    v_promotion_id,
    date_trunc('hour', v_now),
    public._l99_target_per_hour(v_target_total, v_now, v_ends_at),
    0,
    0,
    0
  )
  ON CONFLICT (promotion_id, hour_bucket) DO NOTHING;

  v_resp := jsonb_build_object(
    'success', true,
    'status', 'active',
    'promotionId', v_promotion_id,
    'chargedNow', true,
    'newBalance', v_new_bonus_balance,
    'placement', v_tier.placement,
    'days', v_tier.days,
    'walletType', 'bonus'
  );

  INSERT INTO public.promo_idempotency_keys(scope, idempotency_key, response_payload)
  VALUES ('promote_tour_fair_wallet_v1', p_idempotency_key, v_resp)
  ON CONFLICT (scope, idempotency_key) DO NOTHING;

  RETURN v_resp;
END;
$$;

CREATE OR REPLACE FUNCTION public.promote_tour_featured_fair_wallet_v1(
  p_agency_id UUID,
  p_tour_id UUID,
  p_tier_id UUID,
  p_idempotency_key TEXT,
  p_wallet_type TEXT DEFAULT 'main'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid UUID;
  v_wallet_type TEXT := lower(coalesce(nullif(trim(p_wallet_type), ''), 'main'));
  v_tier RECORD;
  v_bonus_balance INT;
  v_new_bonus_balance INT;
  v_now TIMESTAMPTZ := now();
  v_ends_at TIMESTAMPTZ;
  v_active_count INT;
  v_should_waitlist BOOLEAN := false;
  v_existing UUID;
  v_resp JSONB;
  v_promotion_id UUID;
  v_target_total INT;
BEGIN
  IF v_wallet_type NOT IN ('main', 'bonus') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_wallet_type');
  END IF;

  IF v_wallet_type = 'main' THEN
    RETURN COALESCE(
      public.promote_tour_featured_fair_v1(
        p_agency_id,
        p_tour_id,
        p_tier_id,
        p_idempotency_key
      ),
      '{}'::jsonb
    ) || jsonb_build_object('walletType', 'main');
  END IF;

  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required'
      USING ERRCODE = '28000',
            DETAIL = 'Authenticated session is required for promote_tour_featured_fair_wallet_v1.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.agencies a
    WHERE a.id = p_agency_id
      AND a.owner_id = v_uid
  ) THEN
    RAISE EXCEPTION 'forbidden_agency_access'
      USING ERRCODE = '42501',
            DETAIL = 'auth.uid() must own p_agency_id.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.tours t
    WHERE t.id = p_tour_id
      AND t.agency_id = p_agency_id
  ) THEN
    RAISE EXCEPTION 'forbidden_tour_access'
      USING ERRCODE = '42501',
            DETAIL = 'p_tour_id must belong to p_agency_id.';
  END IF;

  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_idempotency_key');
  END IF;

  SELECT k.response_payload
    INTO v_resp
  FROM public.promo_idempotency_keys k
  WHERE k.scope = 'promote_tour_featured_fair_wallet_v1'
    AND k.idempotency_key = p_idempotency_key
  LIMIT 1;

  IF v_resp IS NOT NULL THEN
    RETURN v_resp;
  END IF;

  SELECT id, placement, coins, days
    INTO v_tier
  FROM public.promotion_tiers
  WHERE id = p_tier_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'tier_not_found');
  END IF;

  IF v_tier.placement <> 'featured' THEN
    RETURN jsonb_build_object('success', false, 'error', 'unsupported_placement');
  END IF;

  SELECT tp.id
    INTO v_existing
  FROM public.tour_promotions tp
  WHERE tp.tour_id = p_tour_id
    AND tp.placement = 'featured'
    AND tp.status IN ('active', 'waitlist')
    AND (tp.status = 'waitlist' OR tp.ends_at >= v_now)
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'tour_already_promoted_or_waitlisted');
  END IF;

  SELECT COUNT(*)::INT
    INTO v_active_count
  FROM public.tour_promotions tp
  WHERE tp.placement = 'featured'
    AND tp.status = 'active'
    AND tp.is_active = true
    AND tp.ends_at >= v_now;

  v_should_waitlist := v_active_count >= public._l99_slot_limit('featured')
                       OR public._l99_projected_sla_confidence('featured') < 0.90;

  SELECT a.maxcoin_bonus_balance
    INTO v_bonus_balance
  FROM public.agencies a
  WHERE a.id = p_agency_id;

  IF COALESCE(v_bonus_balance, 0) < COALESCE(v_tier.coins, 0) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_bonus_balance',
      'required', COALESCE(v_tier.coins, 0),
      'current', COALESCE(v_bonus_balance, 0)
    );
  END IF;

  v_ends_at := v_now + make_interval(days => COALESCE(v_tier.days, 1));
  v_target_total := GREATEST(300, COALESCE(v_tier.days, 1) * 180);

  IF v_should_waitlist THEN
    INSERT INTO public.tour_promotions (
      tour_id,
      agency_id,
      placement,
      cost_coins,
      starts_at,
      ends_at,
      is_active,
      status,
      target_impressions_total,
      reserved_coins,
      activated_at,
      wallet_type
    ) VALUES (
      p_tour_id,
      p_agency_id,
      'featured',
      v_tier.coins,
      v_now,
      v_ends_at,
      false,
      'waitlist',
      v_target_total,
      v_tier.coins,
      NULL,
      'bonus'
    ) RETURNING id INTO v_promotion_id;

    INSERT INTO public.promo_waitlist (
      promotion_id,
      agency_id,
      tour_id,
      placement,
      requested_days,
      requested_coins,
      scheduled_start_at
    ) VALUES (
      v_promotion_id,
      p_agency_id,
      p_tour_id,
      'featured',
      v_tier.days,
      v_tier.coins,
      NULL
    );

    INSERT INTO public.promo_financial_ledger (
      promotion_id,
      agency_id,
      action,
      amount_coins,
      before_balance,
      after_balance,
      reason,
      metadata
    ) VALUES (
      v_promotion_id,
      p_agency_id,
      'reserve_waitlist',
      0,
      v_bonus_balance,
      v_bonus_balance,
      'featured_waitlist_without_immediate_deduction',
      jsonb_build_object('placement', 'featured', 'days', v_tier.days, 'wallet_type', 'bonus')
    );

    v_resp := jsonb_build_object(
      'success', true,
      'status', 'waitlist',
      'promotionId', v_promotion_id,
      'chargedNow', false,
      'currentBalance', v_bonus_balance,
      'placement', 'featured',
      'days', v_tier.days,
      'walletType', 'bonus'
    );

    INSERT INTO public.promo_idempotency_keys(scope, idempotency_key, response_payload)
    VALUES ('promote_tour_featured_fair_wallet_v1', p_idempotency_key, v_resp)
    ON CONFLICT (scope, idempotency_key) DO NOTHING;

    RETURN v_resp;
  END IF;

  UPDATE public.agencies
  SET maxcoin_bonus_balance = maxcoin_bonus_balance - v_tier.coins
  WHERE id = p_agency_id
    AND maxcoin_bonus_balance >= v_tier.coins
  RETURNING maxcoin_bonus_balance INTO v_new_bonus_balance;

  IF v_new_bonus_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'bonus_balance_race_condition');
  END IF;

  INSERT INTO public.tour_promotions (
    tour_id,
    agency_id,
    placement,
    cost_coins,
    starts_at,
    ends_at,
    is_active,
    status,
    target_impressions_total,
    reserved_coins,
    activated_at,
    wallet_type
  ) VALUES (
    p_tour_id,
    p_agency_id,
    'featured',
    v_tier.coins,
    v_now,
    v_ends_at,
    true,
    'active',
    v_target_total,
    0,
    v_now,
    'bonus'
  ) RETURNING id INTO v_promotion_id;

  INSERT INTO public.maxcoin_transactions (
    agency_id,
    amount,
    type,
    description,
    tour_id,
    wallet_type
  ) VALUES (
    p_agency_id,
    -v_tier.coins,
    'spend_featured',
    'featured uchun ' || v_tier.days || ' kunlik premium reklama (bonus wallet)',
    p_tour_id,
    'bonus'
  );

  INSERT INTO public.promo_financial_ledger (
    promotion_id,
    agency_id,
    action,
    amount_coins,
    before_balance,
    after_balance,
    reason,
    metadata
  ) VALUES (
    v_promotion_id,
    p_agency_id,
    'deduct_on_activate',
    -v_tier.coins,
    v_bonus_balance,
    v_new_bonus_balance,
    'featured_promotion_activated',
    jsonb_build_object('placement', 'featured', 'days', v_tier.days, 'wallet_type', 'bonus')
  );

  INSERT INTO public.promo_serving_state (
    promotion_id,
    last_served_at,
    served_count_total,
    served_count_today,
    served_count_hour
  ) VALUES (
    v_promotion_id,
    NULL,
    0,
    0,
    0
  )
  ON CONFLICT (promotion_id) DO NOTHING;

  INSERT INTO public.promo_delivery_hourly (
    promotion_id,
    hour_bucket,
    target_impressions,
    delivered_impressions,
    delivered_clicks,
    delivered_leads
  ) VALUES (
    v_promotion_id,
    date_trunc('hour', v_now),
    public._l99_target_per_hour(v_target_total, v_now, v_ends_at),
    0,
    0,
    0
  )
  ON CONFLICT (promotion_id, hour_bucket) DO NOTHING;

  v_resp := jsonb_build_object(
    'success', true,
    'status', 'active',
    'promotionId', v_promotion_id,
    'chargedNow', true,
    'newBalance', v_new_bonus_balance,
    'placement', 'featured',
    'days', v_tier.days,
    'walletType', 'bonus'
  );

  INSERT INTO public.promo_idempotency_keys(scope, idempotency_key, response_payload)
  VALUES ('promote_tour_featured_fair_wallet_v1', p_idempotency_key, v_resp)
  ON CONFLICT (scope, idempotency_key) DO NOTHING;

  RETURN v_resp;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_tour_fair_wallet_v1(UUID, UUID, UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.promote_tour_fair_wallet_v1(UUID, UUID, UUID, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.promote_tour_fair_wallet_v1(UUID, UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_tour_fair_wallet_v1(UUID, UUID, UUID, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.promote_tour_featured_fair_wallet_v1(UUID, UUID, UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.promote_tour_featured_fair_wallet_v1(UUID, UUID, UUID, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.promote_tour_featured_fair_wallet_v1(UUID, UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_tour_featured_fair_wallet_v1(UUID, UUID, UUID, TEXT, TEXT) TO service_role;

-- ----------------------------------------------------------------------------
-- 6) Waitlist activation now respects stored wallet type
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_waitlist_promotions_v1(
  p_placement TEXT,
  p_hour_bucket TIMESTAMPTZ DEFAULT date_trunc('hour', now())
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_slot_limit INT;
  v_active_count INT;
  v_available INT;
  v_row RECORD;
  v_wallet_type TEXT;
  v_balance INT;
  v_new_balance INT;
  v_activated INT := 0;
BEGIN
  IF p_placement NOT IN ('hot_deals', 'hot_tours') THEN
    RETURN jsonb_build_object('success', false, 'error', 'unsupported_placement');
  END IF;

  v_slot_limit := public._l99_slot_limit(p_placement);

  SELECT COUNT(*)::INT
    INTO v_active_count
  FROM public.tour_promotions tp
  WHERE tp.placement = p_placement
    AND tp.status = 'active'
    AND tp.is_active = true
    AND tp.ends_at >= now();

  v_available := GREATEST(v_slot_limit - v_active_count, 0);

  IF v_available = 0 THEN
    RETURN jsonb_build_object('success', true, 'activated', 0, 'reason', 'no_capacity');
  END IF;

  FOR v_row IN
    SELECT pw.*, tp.cost_coins, COALESCE(tp.wallet_type, 'main') AS wallet_type
    FROM public.promo_waitlist pw
    JOIN public.tour_promotions tp ON tp.id = pw.promotion_id
    WHERE pw.placement = p_placement
      AND pw.status = 'waitlist'
    ORDER BY pw.requested_at ASC
    LIMIT v_available
  LOOP
    v_wallet_type := CASE
      WHEN v_row.wallet_type = 'bonus' THEN 'bonus'
      ELSE 'main'
    END;

    IF v_wallet_type = 'bonus' THEN
      SELECT a.maxcoin_bonus_balance
        INTO v_balance
      FROM public.agencies a
      WHERE a.id = v_row.agency_id;
    ELSE
      SELECT a.maxcoin_balance
        INTO v_balance
      FROM public.agencies a
      WHERE a.id = v_row.agency_id;
    END IF;

    IF COALESCE(v_balance, 0) < COALESCE(v_row.requested_coins, 0) THEN
      UPDATE public.promo_waitlist
         SET status = 'rejected', updated_at = now()
       WHERE id = v_row.id;

      UPDATE public.tour_promotions
         SET status = 'rejected', is_active = false
       WHERE id = v_row.promotion_id;

      INSERT INTO public.promo_financial_ledger (
        promotion_id,
        agency_id,
        action,
        amount_coins,
        before_balance,
        after_balance,
        reason,
        metadata
      ) VALUES (
        v_row.promotion_id,
        v_row.agency_id,
        'waitlist_reject_insufficient_balance',
        0,
        v_balance,
        v_balance,
        'insufficient_balance_on_activation',
        jsonb_build_object('placement', p_placement, 'wallet_type', v_wallet_type)
      );

      CONTINUE;
    END IF;

    IF v_wallet_type = 'bonus' THEN
      UPDATE public.agencies
         SET maxcoin_bonus_balance = maxcoin_bonus_balance - v_row.requested_coins
       WHERE id = v_row.agency_id
         AND maxcoin_bonus_balance >= v_row.requested_coins
      RETURNING maxcoin_bonus_balance INTO v_new_balance;
    ELSE
      UPDATE public.agencies
         SET maxcoin_balance = maxcoin_balance - v_row.requested_coins
       WHERE id = v_row.agency_id
         AND maxcoin_balance >= v_row.requested_coins
      RETURNING maxcoin_balance INTO v_new_balance;
    END IF;

    IF v_new_balance IS NULL THEN
      CONTINUE;
    END IF;

    UPDATE public.tour_promotions tp
       SET status = 'active',
           is_active = true,
           activated_at = now(),
           starts_at = now(),
           ends_at = now() + make_interval(days => v_row.requested_days),
           reserved_coins = 0,
           wallet_type = v_wallet_type
     WHERE tp.id = v_row.promotion_id;

    UPDATE public.promo_waitlist
       SET status = 'activated',
           updated_at = now(),
           scheduled_start_at = now()
     WHERE id = v_row.id;

    INSERT INTO public.maxcoin_transactions (
      agency_id,
      amount,
      type,
      description,
      tour_id,
      wallet_type
    ) VALUES (
      v_row.agency_id,
      -v_row.requested_coins,
      'spend_' || p_placement,
      p_placement || ' waitlistdan aktivatsiya qilindi',
      v_row.tour_id,
      v_wallet_type
    );

    INSERT INTO public.promo_financial_ledger (
      promotion_id,
      agency_id,
      action,
      amount_coins,
      before_balance,
      after_balance,
      reason,
      metadata
    ) VALUES (
      v_row.promotion_id,
      v_row.agency_id,
      'deduct_on_waitlist_activation',
      -v_row.requested_coins,
      v_balance,
      v_new_balance,
      'waitlist_activation',
      jsonb_build_object('placement', p_placement, 'wallet_type', v_wallet_type)
    );

    v_activated := v_activated + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'activated', v_activated, 'hourBucket', p_hour_bucket);
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_featured_waitlist_promotions_v1(
  p_hour_bucket TIMESTAMPTZ DEFAULT date_trunc('hour', now())
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_slot_limit INT;
  v_active_count INT;
  v_available INT;
  v_row RECORD;
  v_wallet_type TEXT;
  v_balance INT;
  v_new_balance INT;
  v_activated INT := 0;
BEGIN
  v_slot_limit := public._l99_slot_limit('featured');

  SELECT COUNT(*)::INT
    INTO v_active_count
  FROM public.tour_promotions tp
  WHERE tp.placement = 'featured'
    AND tp.status = 'active'
    AND tp.is_active = true
    AND tp.ends_at >= now();

  v_available := GREATEST(v_slot_limit - v_active_count, 0);

  IF v_available = 0 THEN
    RETURN jsonb_build_object('success', true, 'activated', 0, 'reason', 'no_capacity');
  END IF;

  FOR v_row IN
    SELECT pw.*, tp.cost_coins, COALESCE(tp.wallet_type, 'main') AS wallet_type
    FROM public.promo_waitlist pw
    JOIN public.tour_promotions tp ON tp.id = pw.promotion_id
    WHERE pw.placement = 'featured'
      AND pw.status = 'waitlist'
    ORDER BY pw.requested_at ASC
    LIMIT v_available
  LOOP
    v_wallet_type := CASE
      WHEN v_row.wallet_type = 'bonus' THEN 'bonus'
      ELSE 'main'
    END;

    IF v_wallet_type = 'bonus' THEN
      SELECT a.maxcoin_bonus_balance
        INTO v_balance
      FROM public.agencies a
      WHERE a.id = v_row.agency_id;
    ELSE
      SELECT a.maxcoin_balance
        INTO v_balance
      FROM public.agencies a
      WHERE a.id = v_row.agency_id;
    END IF;

    IF COALESCE(v_balance, 0) < COALESCE(v_row.requested_coins, 0) THEN
      UPDATE public.promo_waitlist
         SET status = 'rejected', updated_at = now()
       WHERE id = v_row.id;

      UPDATE public.tour_promotions
         SET status = 'rejected', is_active = false
       WHERE id = v_row.promotion_id;

      INSERT INTO public.promo_financial_ledger (
        promotion_id,
        agency_id,
        action,
        amount_coins,
        before_balance,
        after_balance,
        reason,
        metadata
      ) VALUES (
        v_row.promotion_id,
        v_row.agency_id,
        'waitlist_reject_insufficient_balance',
        0,
        v_balance,
        v_balance,
        'featured_insufficient_balance_on_activation',
        jsonb_build_object('placement', 'featured', 'wallet_type', v_wallet_type)
      );

      CONTINUE;
    END IF;

    IF v_wallet_type = 'bonus' THEN
      UPDATE public.agencies
         SET maxcoin_bonus_balance = maxcoin_bonus_balance - v_row.requested_coins
       WHERE id = v_row.agency_id
         AND maxcoin_bonus_balance >= v_row.requested_coins
      RETURNING maxcoin_bonus_balance INTO v_new_balance;
    ELSE
      UPDATE public.agencies
         SET maxcoin_balance = maxcoin_balance - v_row.requested_coins
       WHERE id = v_row.agency_id
         AND maxcoin_balance >= v_row.requested_coins
      RETURNING maxcoin_balance INTO v_new_balance;
    END IF;

    IF v_new_balance IS NULL THEN
      CONTINUE;
    END IF;

    UPDATE public.tour_promotions tp
       SET status = 'active',
           is_active = true,
           activated_at = now(),
           starts_at = now(),
           ends_at = now() + make_interval(days => v_row.requested_days),
           reserved_coins = 0,
           wallet_type = v_wallet_type
     WHERE tp.id = v_row.promotion_id;

    UPDATE public.promo_waitlist
       SET status = 'activated',
           updated_at = now(),
           scheduled_start_at = now()
     WHERE id = v_row.id;

    INSERT INTO public.maxcoin_transactions (
      agency_id,
      amount,
      type,
      description,
      tour_id,
      wallet_type
    ) VALUES (
      v_row.agency_id,
      -v_row.requested_coins,
      'spend_featured',
      'featured waitlistdan aktivatsiya qilindi',
      v_row.tour_id,
      v_wallet_type
    );

    INSERT INTO public.promo_financial_ledger (
      promotion_id,
      agency_id,
      action,
      amount_coins,
      before_balance,
      after_balance,
      reason,
      metadata
    ) VALUES (
      v_row.promotion_id,
      v_row.agency_id,
      'deduct_on_waitlist_activation',
      -v_row.requested_coins,
      v_balance,
      v_new_balance,
      'featured_waitlist_activation',
      jsonb_build_object('placement', 'featured', 'wallet_type', v_wallet_type)
    );

    v_activated := v_activated + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'activated', v_activated, 'hourBucket', p_hour_bucket);
END;
$$;

-- Keep operational RPCs service-role only.
REVOKE ALL ON FUNCTION public.activate_waitlist_promotions_v1(TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.activate_waitlist_promotions_v1(TEXT, TIMESTAMPTZ) FROM anon;
REVOKE EXECUTE ON FUNCTION public.activate_waitlist_promotions_v1(TEXT, TIMESTAMPTZ) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.activate_waitlist_promotions_v1(TEXT, TIMESTAMPTZ) TO service_role;

REVOKE ALL ON FUNCTION public.activate_featured_waitlist_promotions_v1(TIMESTAMPTZ) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.activate_featured_waitlist_promotions_v1(TIMESTAMPTZ) FROM anon;
REVOKE EXECUTE ON FUNCTION public.activate_featured_waitlist_promotions_v1(TIMESTAMPTZ) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.activate_featured_waitlist_promotions_v1(TIMESTAMPTZ) TO service_role;

COMMIT;
