-- Consolidated: ensure ALL tour columns exist
-- Safe to run multiple times (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

-- From 002
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS hotel_booking_url text;

-- From 003
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS destinations jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS airline text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS extra_charges jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS hotel_images jsonb DEFAULT '[]'::jsonb;

-- From 004
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS hotels jsonb DEFAULT '[]'::jsonb;

-- From 005
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS old_price numeric;

-- From 006
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS operator_telegram_username text;

-- From 007
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS tour_type text NOT NULL DEFAULT 'international';
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS domestic_category text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS meeting_point text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS what_to_bring jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS guide_name text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS guide_phone text;

-- From 013
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS operator_phone text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS additional_info text;

-- From 016
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS departure_month text;

-- From 017
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS duration_nights integer;

-- From 023
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS variable_charges jsonb DEFAULT '[]'::jsonb;
