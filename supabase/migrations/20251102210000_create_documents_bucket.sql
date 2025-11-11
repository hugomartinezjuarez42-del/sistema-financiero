/*
  # Create Client Documents Storage Bucket

  1. Storage
    - Create 'client-documents' bucket for storing client files
    - Set as public bucket for easy access
    - Files: ID cards, contracts, pagarés, etc.

  2. Security
    - Allow authenticated users to upload files
    - Allow authenticated users to read files
    - Allow authenticated users to delete files
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY IF NOT EXISTS "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-documents');

CREATE POLICY IF NOT EXISTS "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'client-documents');

CREATE POLICY IF NOT EXISTS "Authenticated users can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'client-documents')
WITH CHECK (bucket_id = 'client-documents');

CREATE POLICY IF NOT EXISTS "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client-documents');
