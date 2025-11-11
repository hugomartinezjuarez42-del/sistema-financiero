/*
  # Optimizar Políticas RLS - Parte 3 (Corregido)
  
  Consolidar políticas duplicadas
*/

-- ==============================================================
-- audit_logs
-- ==============================================================

DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view organization audit logs" ON audit_logs;
CREATE POLICY "Users can view organization audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Members can create audit logs" ON audit_logs;
CREATE POLICY "Members can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ==============================================================
-- client_documents
-- ==============================================================

DROP POLICY IF EXISTS "Users can view client documents" ON client_documents;
DROP POLICY IF EXISTS "Users can view organization client documents" ON client_documents;
CREATE POLICY "Users can view organization client documents"
  ON client_documents FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can upload client documents" ON client_documents;
DROP POLICY IF EXISTS "Members can upload client documents" ON client_documents;
CREATE POLICY "Members can upload client documents"
  ON client_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete client documents" ON client_documents;
DROP POLICY IF EXISTS "Members can delete client documents" ON client_documents;
CREATE POLICY "Members can delete client documents"
  ON client_documents FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ==============================================================
-- collateral_documents
-- ==============================================================

DROP POLICY IF EXISTS "Users can view own collateral documents" ON collateral_documents;
DROP POLICY IF EXISTS "Users can view organization collateral documents" ON collateral_documents;
CREATE POLICY "Users can view organization collateral documents"
  ON collateral_documents FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own collateral documents" ON collateral_documents;
DROP POLICY IF EXISTS "Members can upload collateral documents" ON collateral_documents;
CREATE POLICY "Members can upload collateral documents"
  ON collateral_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own collateral documents" ON collateral_documents;
DROP POLICY IF EXISTS "Members can delete collateral documents" ON collateral_documents;
CREATE POLICY "Members can delete collateral documents"
  ON collateral_documents FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ==============================================================
-- payments
-- ==============================================================

DROP POLICY IF EXISTS "Users can create payments for own loans" ON payments;
DROP POLICY IF EXISTS "Members can create payments" ON payments;
CREATE POLICY "Members can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ==============================================================
-- whatsapp_reminders
-- ==============================================================

DROP POLICY IF EXISTS "Users can view whatsapp reminders" ON whatsapp_reminders;
DROP POLICY IF EXISTS "Users can view organization reminders" ON whatsapp_reminders;
CREATE POLICY "Users can view organization reminders"
  ON whatsapp_reminders FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create whatsapp reminders" ON whatsapp_reminders;
DROP POLICY IF EXISTS "Members can create reminders" ON whatsapp_reminders;
CREATE POLICY "Members can create reminders"
  ON whatsapp_reminders FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update whatsapp reminders" ON whatsapp_reminders;
DROP POLICY IF EXISTS "Members can update reminders" ON whatsapp_reminders;
CREATE POLICY "Members can update reminders"
  ON whatsapp_reminders FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ==============================================================
-- user_permissions
-- ==============================================================

DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
CREATE POLICY "Users can view own permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ==============================================================
-- user_profiles
-- ==============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (created_by = (select auth.uid()));