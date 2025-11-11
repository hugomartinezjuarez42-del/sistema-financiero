/*
  # Add Optional Fields to Clients Table

  1. Changes
    - Add `id_number` (text, optional) - Número de identidad del cliente
    - Add `nickname` (text, optional) - Apodo del cliente
  
  2. Important Notes
    - These fields are optional and can be null
    - No changes to RLS policies needed
*/

-- Add id_number to clients table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'id_number'
  ) THEN
    ALTER TABLE clients ADD COLUMN id_number text;
  END IF;
END $$;

-- Add nickname to clients table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'nickname'
  ) THEN
    ALTER TABLE clients ADD COLUMN nickname text;
  END IF;
END $$;