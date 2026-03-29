-- Add combo_hotels JSONB column for combo tour hotel variants
-- Structure: [{ price: number, hotels: [{ city: string, name: string, booking_url: string|null, image_url: string|null }] }]
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tours' AND column_name = 'combo_hotels'
  ) THEN
    ALTER TABLE tours ADD COLUMN combo_hotels jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
