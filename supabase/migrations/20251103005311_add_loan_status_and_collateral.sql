/*
  # Add Loan Status and Collateral System

  1. Changes to Existing Tables
    - `loans` table
      - Add `status` column (active, paid, overdue, cancelled, refinanced)
      - Add `collateral_type` column (vehicle, property, jewelry, electronics, other, none)
      - Add `collateral_description` column (text description)
      - Add `collateral_value` column (estimated value)
      - Add `collateral_notes` column (additional notes)
      - Add `due_date` column (next payment due date)
      - Add `days_overdue` column (calculated)

  2. New Tables
    - `collateral_documents` table for storing collateral photos/docs
      - `id` (uuid, primary key)
      - `loan_id` (uuid, foreign key)
      - `document_type` (photo, title, appraisal, other)
      - `file_name` (text)
      - `file_path` (text)
      - `file_size` (integer)
      - `uploaded_at` (timestamp)
      - `uploaded_by` (uuid, foreign key to auth.users)
      - `notes` (text)

  3. Security
    - Enable RLS on `collateral_documents`
    - Add policies for authenticated users to manage their collateral documents

  4. Indexes
    - Add index on loans.status for fast filtering
    - Add index on loans.due_date for payment reminders
*/

-- Add new columns to loans table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'status'
  ) THEN
    ALTER TABLE loans ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paid', 'overdue', 'cancelled', 'refinanced'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'collateral_type'
  ) THEN
    ALTER TABLE loans ADD COLUMN collateral_type TEXT DEFAULT 'none' CHECK (collateral_type IN ('vehicle', 'property', 'jewelry', 'electronics', 'other', 'none'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'collateral_description'
  ) THEN
    ALTER TABLE loans ADD COLUMN collateral_description TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'collateral_value'
  ) THEN
    ALTER TABLE loans ADD COLUMN collateral_value NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'collateral_notes'
  ) THEN
    ALTER TABLE loans ADD COLUMN collateral_notes TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE loans ADD COLUMN due_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'days_overdue'
  ) THEN
    ALTER TABLE loans ADD COLUMN days_overdue INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create collateral_documents table
CREATE TABLE IF NOT EXISTS collateral_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('photo', 'title', 'appraisal', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE collateral_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for collateral_documents
CREATE POLICY "Users can view own collateral documents"
  ON collateral_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = collateral_documents.loan_id
      AND loans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own collateral documents"
  ON collateral_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = collateral_documents.loan_id
      AND loans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own collateral documents"
  ON collateral_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = collateral_documents.loan_id
      AND loans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = collateral_documents.loan_id
      AND loans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own collateral documents"
  ON collateral_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = collateral_documents.loan_id
      AND loans.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);
CREATE INDEX IF NOT EXISTS idx_collateral_documents_loan_id ON collateral_documents(loan_id);

-- Update existing loans to have a status
UPDATE loans SET status = 'active' WHERE status IS NULL;

-- Function to calculate and update days overdue
CREATE OR REPLACE FUNCTION update_loan_overdue_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE loans
  SET days_overdue = CASE
    WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE THEN
      EXTRACT(DAY FROM (CURRENT_DATE - due_date))::INTEGER
    ELSE
      0
  END,
  status = CASE
    WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE AND status = 'active' THEN
      'overdue'
    WHEN due_date IS NOT NULL AND due_date >= CURRENT_DATE AND status = 'overdue' THEN
      'active'
    ELSE
      status
  END
  WHERE status IN ('active', 'overdue');
END;
$$;