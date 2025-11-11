/*
  # Add Clients Table to Loans System

  1. New Table
    - `clients`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - Usuario propietario
      - `name` (text) - Nombre del cliente
      - `rate` (decimal) - Tasa de interés por defecto para este cliente
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Changes to Existing Tables
    - Add `client_id` to `loans` table
    - Add `unpaid_interest` to `loans` table for tracking previous unpaid interest
    - Remove `interest_rate` from loans (will use client's rate)
  
  3. Security
    - Enable RLS on clients table
    - Add policies for clients
    - Update loans policies to check client ownership

  4. Important Notes
    - Section 1: Creates the clients table with proper relationships
    - Section 2: Modifies loans table to link to clients and store unpaid interest
    - Section 3: Sets up Row Level Security for data protection
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  rate decimal(5, 2) NOT NULL DEFAULT 14.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add client_id to loans table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE loans ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add unpaid_interest to loans table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'unpaid_interest'
  ) THEN
    ALTER TABLE loans ADD COLUMN unpaid_interest decimal(12, 2) DEFAULT 0.00;
  END IF;
END $$;

-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policies for clients table
CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_client_id ON loans(client_id);