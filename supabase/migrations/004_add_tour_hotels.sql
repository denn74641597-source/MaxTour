-- Add hotels JSONB array column to tours table
-- Each hotel: { name, stars, price, description, booking_url, images }
-- The main tour.price will always equal the first hotel's price
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS hotels jsonb DEFAULT '[]'::jsonb;
