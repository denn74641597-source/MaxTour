-- Verification requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  certificate_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_agency ON verification_requests(agency_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);

-- RLS
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Agency owners can view their own requests
CREATE POLICY "Agency owners can view own verification requests"
  ON verification_requests FOR SELECT
  USING (agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid()));

-- Agency owners can insert their own requests
CREATE POLICY "Agency owners can submit verification requests"
  ON verification_requests FOR INSERT
  WITH CHECK (agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid()));

-- Ensure new agencies have is_verified = false by default (already the case, but explicit)
-- Reset is_verified when agency is first approved (don't auto-verify)
