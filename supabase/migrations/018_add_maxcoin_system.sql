-- MaxCoin balance for agencies
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS maxcoin_balance integer NOT NULL DEFAULT 0;

-- MaxCoin transaction history
CREATE TABLE IF NOT EXISTS maxcoin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  amount integer NOT NULL, -- positive = credit, negative = debit
  type text NOT NULL CHECK (type IN ('purchase', 'spend_featured', 'spend_hot_deals', 'spend_hot_tours', 'bonus', 'refund')),
  description text,
  tour_id uuid REFERENCES tours(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tour promotions — tracks which tours are promoted and where
CREATE TABLE IF NOT EXISTS tour_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  placement text NOT NULL CHECK (placement IN ('featured', 'hot_deals', 'hot_tours')),
  cost_coins integer NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- MaxCoin pricing packages (configurable by admin)
CREATE TABLE IF NOT EXISTS maxcoin_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coins integer NOT NULL,
  bonus_coins integer NOT NULL DEFAULT 0,
  price_uzs numeric NOT NULL,
  is_popular boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Promotion pricing (cost in coins per placement per day)
CREATE TABLE IF NOT EXISTS promotion_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement text NOT NULL UNIQUE CHECK (placement IN ('featured', 'hot_deals', 'hot_tours')),
  cost_per_day integer NOT NULL, -- coins per day
  min_days integer NOT NULL DEFAULT 1,
  max_days integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default promotion pricing
INSERT INTO promotion_pricing (placement, cost_per_day, min_days, max_days) VALUES
  ('featured', 50, 1, 30),
  ('hot_deals', 30, 1, 30),
  ('hot_tours', 40, 1, 30)
ON CONFLICT (placement) DO NOTHING;

-- Seed default MaxCoin packages
INSERT INTO maxcoin_packages (coins, bonus_coins, price_uzs, is_popular, sort_order) VALUES
  (50, 0, 750000, false, 1),
  (100, 10, 1400000, false, 2),
  (250, 50, 3250000, true, 3),
  (500, 100, 6000000, false, 4),
  (1000, 250, 11000000, false, 5)
ON CONFLICT DO NOTHING;

-- Index for active promotions lookup
CREATE INDEX IF NOT EXISTS idx_tour_promotions_active ON tour_promotions (placement, is_active, ends_at);
CREATE INDEX IF NOT EXISTS idx_tour_promotions_tour ON tour_promotions (tour_id, is_active);
CREATE INDEX IF NOT EXISTS idx_maxcoin_transactions_agency ON maxcoin_transactions (agency_id, created_at DESC);
