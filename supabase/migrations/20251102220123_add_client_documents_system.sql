/*
  # Client Documents System

  1. New Tables
    - `client_documents`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `document_type` (text) - cedula, contract, pagare, other
      - `file_name` (text)
      - `file_path` (text) - storage path
      - `file_size` (integer) - in bytes
      - `uploaded_at` (timestamptz)
      - `uploaded_by` (uuid, foreign key to auth.users)
      - `notes` (text, optional)

  2. Security
    - Enable RLS on `client_documents` table
    - Add policies for authenticated users to manage documents

  3. Important Notes
    - Documents are stored in Supabase Storage bucket 'client-documents'
    - Supports multiple file types: images (JPG, PNG, PDF)
    - File size limit handled at application level
*/

CREATE TABLE IF NOT EXISTS client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('cedula', 'contract', 'pagare', 'other')),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view client documents"
  ON client_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upload client documents"
  ON client_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update client documents"
  ON client_documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete client documents"
  ON client_documents FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_type ON client_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_client_documents_uploaded_at ON client_documents(uploaded_at DESC);