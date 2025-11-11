/*
  # Step 3: Recreate all RLS policies
  
  1. Changes
    - Recreate policies for clients, loans, and payments
    - Use simplified role-based access
    - All authenticated users from same org can view
    - All members can create and edit
    - Only admins can delete
*/

-- CLIENTS POLICIES
CREATE POLICY "Users can view organization clients"
  ON clients FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Members can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Members can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- LOANS POLICIES
CREATE POLICY "Users can view organization loans"
  ON loans FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Members can create loans"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Members can update loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Admins can delete loans"
  ON loans FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- PAYMENTS POLICIES
CREATE POLICY "Users can view organization payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = payments.loan_id
      AND loans.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Members can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = payments.loan_id
      AND loans.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Members can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = payments.loan_id
      AND loans.organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = payments.loan_id
      AND loans.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Admins can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = payments.loan_id
      AND loans.organization_id = get_user_organization_id()
    ) AND
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
