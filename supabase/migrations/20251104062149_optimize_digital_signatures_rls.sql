/*
  # Optimize digital_signatures RLS policies
  
  1. Changes
    - Replace auth.uid() with (SELECT auth.uid())
    - Improves performance by caching the result
  
  2. Security
    - Maintains same security level
    - Better performance at scale
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view signatures in their organization" ON digital_signatures;
DROP POLICY IF EXISTS "Users can create signatures in their organization" ON digital_signatures;
DROP POLICY IF EXISTS "Users can update signatures in their organization" ON digital_signatures;
DROP POLICY IF EXISTS "Users can delete signatures in their organization" ON digital_signatures;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view signatures in their organization"
  ON digital_signatures
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can create signatures in their organization"
  ON digital_signatures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update signatures in their organization"
  ON digital_signatures
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete signatures in their organization"
  ON digital_signatures
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );
