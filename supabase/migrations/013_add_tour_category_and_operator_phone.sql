-- Add category column to tours for the new category system
ALTER TABLE tours ADD COLUMN IF NOT EXISTS category TEXT;

-- Add operator phone column to tours
ALTER TABLE tours ADD COLUMN IF NOT EXISTS operator_phone TEXT;

-- Add view_count column to tours for tracking popular tours
ALTER TABLE tours ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_tours_category ON tours(category);

-- Create index on view_count for popular tours sorting
CREATE INDEX IF NOT EXISTS idx_tours_view_count ON tours(view_count DESC);

-- RPC function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(tour_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE tours SET view_count = COALESCE(view_count, 0) + 1 WHERE id = tour_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
