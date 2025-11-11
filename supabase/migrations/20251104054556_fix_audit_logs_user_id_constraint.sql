/*
  # Fix audit_logs user_id foreign key constraint
  
  1. Changes
    - Drop the foreign key constraint on user_id
    - Make user_id nullable so system operations can log
    - Keep user_email for tracking who made changes
  
  2. Reason
    - Trigger functions with SECURITY DEFINER may not have auth.uid()
    - We still track the user through user_email
    - This allows system operations to be logged
*/

-- Drop the foreign key constraint
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- Make user_id nullable
ALTER TABLE audit_logs ALTER COLUMN user_id DROP NOT NULL;
