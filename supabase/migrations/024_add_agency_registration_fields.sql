-- Add registration fields to agencies table
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS inn text;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS responsible_person text;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS license_pdf_url text;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS certificate_pdf_url text;
