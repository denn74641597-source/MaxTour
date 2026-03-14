-- Add operator_telegram_username to tours
-- Each tour can have its own responsible operator's Telegram username.
-- When a client clicks "Contact via Telegram" on a tour, they will be
-- connected to this operator instead of the agency's general Telegram.
-- Falls back to agency.telegram_username if this field is NULL.

ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS operator_telegram_username text;

COMMENT ON COLUMN public.tours.operator_telegram_username IS 'Telegram username of the operator responsible for this specific tour';
