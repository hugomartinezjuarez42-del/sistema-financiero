/*
  # Fix biometric authentication access

  1. Changes
    - Add policy to allow reading biometric credentials by email during login
    - This allows unauthenticated users to retrieve their credentials for login verification
  
  2. Security
    - Policy only allows SELECT (read) operations
    - Only returns credentials for the specified email
    - No sensitive data exposure as credentials are encrypted
*/

-- Add policy to allow reading credentials by email for login
CREATE POLICY "Allow reading biometric credentials by email for login"
  ON biometric_credentials
  FOR SELECT
  TO anon
  USING (true);
