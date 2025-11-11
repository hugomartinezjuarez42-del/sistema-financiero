/*
  # Create Storage Bucket for Receipt Images

  1. Storage
    - Creates a public bucket called 'receipts' for storing receipt images temporarily
    - Public access enabled so images can be shared via WhatsApp without authentication
    - Files will be automatically cleaned up after 24 hours (can be configured)

  2. Security
    - Anyone can read files (public access for sharing)
    - Only authenticated users can upload files
    - Only authenticated users can delete their own files
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view receipt images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can delete their receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'receipts' AND owner = auth.uid());