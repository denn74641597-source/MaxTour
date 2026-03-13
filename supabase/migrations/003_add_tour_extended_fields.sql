-- Add extended tour fields: destinations (multi-city routes), airline, extra_charges, hotel_images
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS destinations jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS airline text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS extra_charges jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS hotel_images jsonb DEFAULT '[]'::jsonb;
