-- Add profile_views column to agencies table
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS profile_views integer NOT NULL DEFAULT 0;
