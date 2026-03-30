-- Ensure rating columns exist on agencies table
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS avg_rating numeric(3,2) DEFAULT 0;

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
