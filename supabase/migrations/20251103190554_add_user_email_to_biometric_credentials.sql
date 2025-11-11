/*
  # Add user email to biometric credentials

  1. Changes
    - Add user_email column to biometric_credentials table
    - Update existing records with user emails
    - Add index for faster lookups by email

  2. Security
    - No changes to RLS policies needed
*/

-- Add user_email column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'biometric_credentials' AND column_name = 'user_email'
  ) THEN
    ALTER TABLE biometric_credentials ADD COLUMN user_email text;
  END IF;
END $$;

-- Update existing records with user emails from auth.users
UPDATE biometric_credentials bc
SET user_email = au.email
FROM auth.users au
WHERE bc.user_id = au.id AND bc.user_email IS NULL;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_user_email 
ON biometric_credentials(user_email);
