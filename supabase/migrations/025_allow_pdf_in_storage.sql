-- Allow PDF uploads in the images storage bucket (for agency license & certificate uploads)
UPDATE storage.buckets
SET allowed_mime_types = array_cat(
  COALESCE(allowed_mime_types, ARRAY[]::text[]),
  ARRAY['application/pdf']
)
WHERE id = 'images'
  AND NOT ('application/pdf' = ANY(COALESCE(allowed_mime_types, ARRAY[]::text[])));
