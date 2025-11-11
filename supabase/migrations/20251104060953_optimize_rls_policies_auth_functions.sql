/*
  # Optimize RLS policies to use SELECT for auth functions
  
  1. Changes
    - Replace auth.uid() with (SELECT auth.uid())
    - This caches the result per query instead of per row
    - Dramatically improves performance at scale
  
  2. Tables affected
    - clients
    - loans
    - payments
    - audit_logs
*/

-- Drop and recreate policies for clients
DROP POLICY IF EXISTS "Admins can delete clients" ON clients;
CREATE POLICY "Admins can delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_permissions
      WHERE user_id = (SELECT auth.uid())
      AND can_delete_clients = true
    )
  );

-- Drop and recreate policies for loans
DROP POLICY IF EXISTS "Admins can delete loans" ON loans;
CREATE POLICY "Admins can delete loans"
  ON loans
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_permissions
      WHERE user_id = (SELECT auth.uid())
      AND can_delete_loans = true
    )
  );

-- Drop and recreate policies for payments
DROP POLICY IF EXISTS "Admins can delete payments" ON payments;
CREATE POLICY "Admins can delete payments"
  ON payments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_permissions
      WHERE user_id = (SELECT auth.uid())
      AND can_delete_payments = true
    )
  );

-- Drop and recreate policies for audit_logs
DROP POLICY IF EXISTS "Users can view audit logs from their organization" ON audit_logs;
CREATE POLICY "Users can view audit logs from their organization"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );
