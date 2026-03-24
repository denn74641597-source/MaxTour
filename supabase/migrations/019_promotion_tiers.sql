-- Replace promotion_pricing (per-day) with promotion_tiers (fixed pricing tiers)
DROP TABLE IF EXISTS promotion_pricing;
DROP TABLE IF EXISTS maxcoin_packages;

CREATE TABLE IF NOT EXISTS promotion_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement text NOT NULL CHECK (placement IN ('featured', 'hot_deals', 'hot_tours')),
  coins integer NOT NULL,
  days integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed fixed tiers
-- Featured (Tavsiya etilgan)
INSERT INTO promotion_tiers (placement, coins, days, sort_order) VALUES
  ('featured', 20, 3, 1),
  ('featured', 35, 6, 2),
  ('featured', 65, 10, 3),
  ('featured', 110, 20, 4),
  ('featured', 150, 30, 5);

-- Hot Deals (Yaxshi takliflar)
INSERT INTO promotion_tiers (placement, coins, days, sort_order) VALUES
  ('hot_deals', 5, 2, 1),
  ('hot_deals', 9, 4, 2),
  ('hot_deals', 16, 8, 3);

-- Hot Tours (Qaynoq turlar)
INSERT INTO promotion_tiers (placement, coins, days, sort_order) VALUES
  ('hot_tours', 3, 1, 1),
  ('hot_tours', 5, 2, 2),
  ('hot_tours', 7, 3, 3);

CREATE INDEX IF NOT EXISTS idx_promotion_tiers_placement ON promotion_tiers (placement, sort_order);
