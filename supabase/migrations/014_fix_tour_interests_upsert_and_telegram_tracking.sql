-- Fix: Add UPDATE policy on tour_interests so upsert works for authenticated users
CREATE POLICY "Users can update their own interests"
  ON tour_interests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add type column to call_tracking to distinguish call vs telegram clicks
ALTER TABLE call_tracking ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'call';

-- Index for type-based filtering
CREATE INDEX IF NOT EXISTS idx_call_tracking_type ON call_tracking(type);
