-- Add form_data JSONB column to verification_requests to store full verification form snapshot
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS form_data jsonb;

-- Make certificate_url nullable (it's already nullable from migration 026, but ensure)
-- The form_data will contain all verification details
