-- Track user interests (when user saves to favorites, agency gets notified)
CREATE TABLE IF NOT EXISTS tour_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  telegram_username text,
  source text NOT NULL DEFAULT 'favorite', -- 'favorite', 'view', etc.
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tour_id)
);

CREATE INDEX idx_tour_interests_agency ON tour_interests(agency_id);
CREATE INDEX idx_tour_interests_tour ON tour_interests(tour_id);
CREATE INDEX idx_tour_interests_created ON tour_interests(created_at DESC);

-- Track call clicks for analytics
CREATE TABLE IF NOT EXISTS call_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid REFERENCES tours(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_tracking_agency ON call_tracking(agency_id);
CREATE INDEX idx_call_tracking_tour ON call_tracking(tour_id);

-- Add rating fields to agencies for caching avg rating
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS avg_rating numeric(3,2) DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

-- RLS policies for tour_interests
ALTER TABLE tour_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own interests"
  ON tour_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own interests"
  ON tour_interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Agency owners can view interests for their agency"
  ON tour_interests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agencies WHERE agencies.id = tour_interests.agency_id AND agencies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own interests"
  ON tour_interests FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for call_tracking
ALTER TABLE call_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert call tracking"
  ON call_tracking FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Agency owners can view their call tracking"
  ON call_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agencies WHERE agencies.id = call_tracking.agency_id AND agencies.owner_id = auth.uid()
    )
  );
