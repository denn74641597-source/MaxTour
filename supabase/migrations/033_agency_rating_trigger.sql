-- ============================================================
-- Trigger: auto-update agencies.avg_rating & review_count
-- whenever a review is inserted, updated, or deleted.
-- ============================================================

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.update_agency_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_agency_id uuid;
BEGIN
  -- Determine which agency_id was affected
  IF TG_OP = 'DELETE' THEN
    target_agency_id := OLD.agency_id;
  ELSE
    target_agency_id := NEW.agency_id;
  END IF;

  -- Recalculate avg_rating and review_count from reviews
  UPDATE public.agencies
  SET
    avg_rating    = COALESCE((
      SELECT ROUND(AVG(r.rating)::numeric, 2)
      FROM public.reviews r
      WHERE r.agency_id = target_agency_id
    ), 0),
    review_count  = COALESCE((
      SELECT COUNT(*)::integer
      FROM public.reviews r
      WHERE r.agency_id = target_agency_id
    ), 0),
    updated_at    = now()
  WHERE id = target_agency_id;

  RETURN NULL; -- AFTER trigger, return value is ignored
END;
$$;

-- 2. Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS trg_update_agency_rating ON public.reviews;

CREATE TRIGGER trg_update_agency_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agency_rating();

-- 3. Backfill: recalculate ratings for ALL agencies from existing reviews
UPDATE public.agencies a
SET
  avg_rating   = COALESCE(sub.avg_r, 0),
  review_count = COALESCE(sub.cnt, 0),
  updated_at   = now()
FROM (
  SELECT
    r.agency_id,
    ROUND(AVG(r.rating)::numeric, 2) AS avg_r,
    COUNT(*)::integer                 AS cnt
  FROM public.reviews r
  GROUP BY r.agency_id
) sub
WHERE a.id = sub.agency_id;
