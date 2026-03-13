-- Add hotel_booking_url column to tours table
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS hotel_booking_url text;
