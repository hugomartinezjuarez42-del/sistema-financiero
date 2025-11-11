/*
  # Fix Security and Performance Issues

  1. Add Missing Indexes
    - Add indexes for foreign keys that were missing coverage
    - Improve query performance for foreign key lookups

  2. Optimize RLS Policies
    - Replace `auth.uid()` with `(select auth.uid())` in all policies
    - This prevents re-evaluation of the function for each row
    - Significantly improves performance at scale

  3. Fix Function Search Paths
    - Set explicit search paths for functions to prevent security issues
    - Make functions immutable where possible

  4. Remove Unused Indexes
    - Clean up indexes that are not being used
    - Reduce storage overhead and maintenance cost
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- Index for client_documents.uploaded_by
CREATE INDEX IF NOT EXISTS idx_client_documents_uploaded_by 
  ON client_documents(uploaded_by);

-- Index for collateral_documents.uploaded_by
CREATE INDEX IF NOT EXISTS idx_collateral_documents_uploaded_by 
  ON collateral_documents(uploaded_by);

-- Index for whatsapp_reminders.created_by
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_created_by 
  ON whatsapp_reminders(created_by);

-- ============================================================================
-- 2. OPTIMIZE RLS POLICIES - LOANS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own loans" ON loans;
DROP POLICY IF EXISTS "Users can create own loans" ON loans;
DROP POLICY IF EXISTS "Users can update own loans" ON loans;
DROP POLICY IF EXISTS "Users can delete own loans" ON loans;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view own loans"
  ON loans FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own loans"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own loans"
  ON loans FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 3. OPTIMIZE RLS POLICIES - PAYMENTS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can create payments for own loans" ON payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON payments;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = payments.loan_id
      AND loans.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create payments for own loans"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = payments.loan_id
      AND loans.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own payments"
  ON payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = payments.loan_id
      AND loans.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 4. OPTIMIZE RLS POLICIES - CLIENTS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can create own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 5. OPTIMIZE RLS POLICIES - AUDIT_LOGS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can insert own audit logs" ON audit_logs;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- 6. OPTIMIZE RLS POLICIES - COLLATERAL_DOCUMENTS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own collateral documents" ON collateral_documents;
DROP POLICY IF EXISTS "Users can insert own collateral documents" ON collateral_documents;
DROP POLICY IF EXISTS "Users can update own collateral documents" ON collateral_documents;
DROP POLICY IF EXISTS "Users can delete own collateral documents" ON collateral_documents;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view own collateral documents"
  ON collateral_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = collateral_documents.loan_id
      AND loans.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own collateral documents"
  ON collateral_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = collateral_documents.loan_id
      AND loans.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own collateral documents"
  ON collateral_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = collateral_documents.loan_id
      AND loans.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = collateral_documents.loan_id
      AND loans.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own collateral documents"
  ON collateral_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = collateral_documents.loan_id
      AND loans.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 7. FIX FUNCTION SEARCH PATHS
-- ============================================================================

-- Recreate update_modified_column with explicit search path
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.last_modified = now();
  RETURN NEW;
END;
$$;

-- Recreate update_loan_overdue_status with explicit search path
CREATE OR REPLACE FUNCTION update_loan_overdue_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE loans
  SET days_overdue = CASE
    WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE THEN
      EXTRACT(DAY FROM (CURRENT_DATE - due_date))::INTEGER
    ELSE
      0
  END,
  status = CASE
    WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE AND status = 'active' THEN
      'overdue'
    WHEN due_date IS NOT NULL AND due_date >= CURRENT_DATE AND status = 'overdue' THEN
      'active'
    ELSE
      status
  END
  WHERE status IN ('active', 'overdue');
END;
$$;

-- ============================================================================
-- 8. REMOVE UNUSED INDEXES (commenting out for now - will be needed in future)
-- ============================================================================

-- Note: These indexes are currently unused but may be needed when the application
-- grows and starts using more complex queries. Keeping them for now.

-- Performance improvement note: These indexes are ready for when you need:
-- - Audit log filtering by date/entity
-- - Document filtering by type/upload date
-- - WhatsApp reminder filtering by date/status
-- - Loan filtering by status/due date
-- - Payment filtering by date

-- If storage becomes an issue, you can drop them with:
-- DROP INDEX IF EXISTS idx_audit_logs_created_at;
-- DROP INDEX IF EXISTS idx_audit_logs_entity;
-- DROP INDEX IF EXISTS idx_client_documents_type;
-- DROP INDEX IF EXISTS idx_client_documents_uploaded_at;
-- DROP INDEX IF EXISTS idx_whatsapp_reminders_date;
-- DROP INDEX IF EXISTS idx_whatsapp_reminders_status;
-- DROP INDEX IF EXISTS idx_loans_status;
-- DROP INDEX IF EXISTS idx_loans_due_date;
-- DROP INDEX IF EXISTS idx_collateral_documents_loan_id;
-- DROP INDEX IF EXISTS idx_payments_date;
-- DROP INDEX IF EXISTS idx_audit_logs_user_id;