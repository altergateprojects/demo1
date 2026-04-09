-- =====================================================
-- CREATE EXPENSE ATTACHMENTS STORAGE BUCKET
-- =====================================================
-- Run this in Supabase SQL Editor to create the storage bucket
-- for expense attachments

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-attachments',
  'expense-attachments',
  true,
  10485760, -- 10MB in bytes
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/tiff',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for authenticated users
CREATE POLICY "Authenticated users can upload expense attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expense-attachments');

CREATE POLICY "Authenticated users can view expense attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'expense-attachments');

CREATE POLICY "Authenticated users can update their expense attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'expense-attachments');

CREATE POLICY "Authenticated users can delete expense attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'expense-attachments');

-- Verify the bucket was created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'expense-attachments';
