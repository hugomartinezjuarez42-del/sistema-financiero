/*
  # Add Collateral Photos Storage Bucket

  1. New Storage Bucket
    - `collateral-photos` bucket for storing collateral images
  
  2. Security
    - Enable RLS on storage bucket
    - Allow authenticated users to upload their collateral photos
    - Allow authenticated users to view their collateral photos
    - Allow authenticated users to delete their collateral photos
  
  3. Purpose
    - Store photos of collateral items (vehicles, properties, etc.)
    - Provide visual documentation for loans
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('collateral-photos', 'collateral-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload collateral photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'collateral-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view collateral photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'collateral-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete collateral photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'collateral-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );