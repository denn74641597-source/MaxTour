-- Add variable_charges column for unknown/approximate charges with price ranges
-- Format: [{ "name": "Internet paket", "min_amount": 50, "max_amount": 100 }]
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS variable_charges jsonb DEFAULT '[]'::jsonb;
