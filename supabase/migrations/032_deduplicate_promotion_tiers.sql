-- Remove duplicate rows from promotion_tiers (keep only the oldest row per placement+days)
DELETE FROM promotion_tiers
WHERE id NOT IN (
  SELECT DISTINCT ON (placement, days) id
  FROM promotion_tiers
  ORDER BY placement, days, created_at ASC
);

-- Prevent future duplicates
ALTER TABLE promotion_tiers
  ADD CONSTRAINT uq_promotion_tiers_placement_days UNIQUE (placement, days);
