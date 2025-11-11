/*
  # Clean Duplicate and Conflicting RLS Policies

  ## Changes
  1. Remove duplicate INSERT policies on client_documents (keeping the better one)
  2. Remove overly permissive UPDATE policy (true/true is dangerous)
  3. Remove duplicate DELETE policies
  4. Keep only clean, secure policies

  ## Security
  - Ensures only one policy per operation
  - Removes policies with USING(true) which bypass security
  - Maintains proper organization_id checks
*/

-- Drop duplicate and problematic policies on client_documents
DROP POLICY IF EXISTS "Members can create documents" ON client_documents;
DROP POLICY IF EXISTS "Users can update client documents" ON client_documents;
DROP POLICY IF EXISTS "Members can delete client documents" ON client_documents;
DROP POLICY IF EXISTS "Users can view organization client documents" ON client_documents;

-- Keep these good policies:
-- "Members can upload client documents" - for INSERT
-- "Members can update documents" - for UPDATE
-- "Admins can delete documents" - for DELETE
-- "Users can view organization documents" - for SELECT

-- Verify we have the essential policies (these should already exist)
-- If not, create them

DO $$
BEGIN
  -- Ensure INSERT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_documents' 
    AND policyname = 'Members can upload client documents'
  ) THEN
    CREATE POLICY "Members can upload client documents"
      ON client_documents
      FOR INSERT
      TO authenticated
      WITH CHECK (
        organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- Ensure UPDATE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_documents' 
    AND policyname = 'Members can update documents'
  ) THEN
    CREATE POLICY "Members can update documents"
      ON client_documents
      FOR UPDATE
      TO authenticated
      USING (organization_id = get_user_organization_id())
      WITH CHECK (organization_id = get_user_organization_id());
  END IF;

  -- Ensure SELECT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_documents' 
    AND policyname = 'Users can view organization documents'
  ) THEN
    CREATE POLICY "Users can view organization documents"
      ON client_documents
      FOR SELECT
      TO authenticated
      USING (organization_id = get_user_organization_id());
  END IF;

  -- Ensure DELETE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_documents' 
    AND policyname = 'Admins can delete documents'
  ) THEN
    CREATE POLICY "Admins can delete documents"
      ON client_documents
      FOR DELETE
      TO authenticated
      USING (
        organization_id = get_user_organization_id() 
        AND EXISTS (
          SELECT 1
          FROM organization_members
          WHERE user_id = auth.uid()
            AND organization_id = get_user_organization_id()
            AND role = 'admin'
        )
      );
  END IF;
END $$;
