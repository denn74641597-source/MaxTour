-- ============================================================
-- RLS policies for MaxCoin / Advertising tables
-- ============================================================

-- maxcoin_transactions: agencies can read their own, public cannot
ALTER TABLE maxcoin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owners can view own transactions"
  ON maxcoin_transactions FOR SELECT
  USING (agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid()));

-- tour_promotions: public can read active promotions, agency owners see all their own
ALTER TABLE tour_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active promotions are publicly viewable"
  ON tour_promotions FOR SELECT
  USING (
    (is_active = true AND ends_at > now())
    OR agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
  );

-- promotion_tiers: public read (needed for agency promotion UI)
ALTER TABLE promotion_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promotion tiers are viewable by everyone"
  ON promotion_tiers FOR SELECT
  USING (true);

-- coin_requests: agency owners see their own requests
ALTER TABLE coin_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owners can view own coin requests"
  ON coin_requests FOR SELECT
  USING (agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid()));

CREATE POLICY "Agency owners can submit coin requests"
  ON coin_requests FOR INSERT
  WITH CHECK (agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid()));
