-- =====================================================
-- MAKE EXPENSE ATTACHMENTS BUCKET PUBLIC
-- =====================================================
-- The bucket exists but is private. This makes it public.

-- Update the bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'expense-attachments';

-- Verify the change
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'expense-attachments';
