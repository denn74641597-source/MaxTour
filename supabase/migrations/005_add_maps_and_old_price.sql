-- Add google_maps_url to agencies for location link
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS google_maps_url text;

-- Add old_price to tours for discount display
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS old_price numeric;
