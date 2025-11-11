/*
  # Remove duplicate RLS policy on audit_logs
  
  1. Changes
    - Drop the duplicate policy "Users can view organization audit logs"
    - Keep only "Users can view audit logs from their organization"
  
  2. Reason
    - Multiple permissive policies for the same action are redundant
    - Having both provides no additional security or functionality
*/

-- Drop the duplicate policy
DROP POLICY IF EXISTS "Users can view organization audit logs" ON audit_logs;
