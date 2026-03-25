-- Make certificate_url nullable in verification_requests
-- (agencies may register without uploading a certificate; auto-created on signup)
ALTER TABLE verification_requests ALTER COLUMN certificate_url DROP NOT NULL;
