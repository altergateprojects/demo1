# Expense Attachments Setup Guide

## Issue
The expense attachments feature requires a Supabase Storage bucket named `expense-attachments` which doesn't exist in your project yet.

## Quick Fix - Create Storage Bucket

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "Storage" in the left sidebar
4. Click "New bucket" button
5. Enter bucket details:
   - Name: `expense-attachments`
   - Public bucket: ✅ YES (check this box)
   - File size limit: 10 MB (or your preference)
6. Click "Create bucket"

### Option 2: Using SQL (Run in SQL Editor)

```sql
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
```

## After Creating the Bucket

Once the bucket is created, the expense attachment features will work:

1. ✅ Upload attachments when creating/editing expenses
2. ✅ View attachment count in expenses list (📎 indicator)
3. ✅ View and download attachments from expense detail page

## Features

- Fraud-proof file integrity with SHA-256 hashing
- Support for images, PDFs, and Word documents
- 10MB file size limit per file
- Up to 5 files per expense
- Secure storage with RLS policies
- Public URLs for easy viewing

## Testing

After setup, test by:
1. Go to Expenses page
2. Click "Add Expense"
3. Try uploading a file
4. Save the expense
5. View the expense detail page
6. Click "View Attachments" - should now work!
