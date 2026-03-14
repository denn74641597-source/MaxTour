-- Add people_count field to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS people_count integer NOT NULL DEFAULT 1;
