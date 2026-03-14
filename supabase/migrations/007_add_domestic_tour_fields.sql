-- Add domestic tourism (ichki turizm) fields to tours table
-- Supports both international and domestic tours with different form fields

ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS tour_type text NOT NULL DEFAULT 'international';
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS domestic_category text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS meeting_point text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS what_to_bring jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS guide_name text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS guide_phone text;

-- Make country optional (domestic tours don't need a country)
-- country is already nullable in most setups, but ensure it stays that way

-- Add check constraint for tour_type
ALTER TABLE public.tours ADD CONSTRAINT tours_tour_type_check
  CHECK (tour_type IN ('international', 'domestic'));

-- Add check constraint for domestic_category
ALTER TABLE public.tours ADD CONSTRAINT tours_domestic_category_check
  CHECK (domestic_category IS NULL OR domestic_category IN ('excursion', 'nature', 'historical', 'pilgrimage', 'recreation', 'adventure'));

COMMENT ON COLUMN public.tours.tour_type IS 'Type of tour: international or domestic (ichki turizm)';
COMMENT ON COLUMN public.tours.domestic_category IS 'Category for domestic tours: excursion, nature, historical, pilgrimage, recreation, adventure';
COMMENT ON COLUMN public.tours.region IS 'Region/viloyat for domestic tours within Uzbekistan';
COMMENT ON COLUMN public.tours.district IS 'District/tuman within the selected region';
COMMENT ON COLUMN public.tours.meeting_point IS 'Meeting point/gathering location for domestic tours';
COMMENT ON COLUMN public.tours.what_to_bring IS 'JSON array of items tourists should bring';
COMMENT ON COLUMN public.tours.guide_name IS 'Name of the tour guide for domestic tours';
COMMENT ON COLUMN public.tours.guide_phone IS 'Phone number of the tour guide';
