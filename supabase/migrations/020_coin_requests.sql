-- Fix: ensure maxcoin_balance column exists (re-run safe)
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS maxcoin_balance integer NOT NULL DEFAULT 0;

-- Coin purchase requests (pending admin approval)
CREATE TABLE IF NOT EXISTS coin_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  coins integer NOT NULL,
  price_uzs numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_coin_requests_status ON coin_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_requests_agency ON coin_requests (agency_id, created_at DESC);
