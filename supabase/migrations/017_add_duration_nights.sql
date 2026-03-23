-- Add duration_nights column
ALTER TABLE tours ADD COLUMN IF NOT EXISTS duration_nights integer;
