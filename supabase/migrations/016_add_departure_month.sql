-- Add departure_month column for tours that specify a month instead of exact date
ALTER TABLE tours ADD COLUMN IF NOT EXISTS departure_month text;
-- Format: "YYYY-MM" (e.g. "2026-04" for April 2026)
