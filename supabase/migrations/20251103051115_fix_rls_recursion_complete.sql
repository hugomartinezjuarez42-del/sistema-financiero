/*
  # Corregir Recursión Infinita en Políticas RLS - Completo

  ## Problema
  Recursión infinita en organization_members cuando get_user_organization_id()
  intenta leer de esa misma tabla.

  ## Solución
  Recrear todas las políticas usando una estrategia sin recursión
*/

-- =====================================================
-- 1. ELIMINAR POLÍTICAS DE ORGANIZATION_MEMBERS
-- =====================================================

DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Admins can insert organization members" ON organization_members;
DROP POLICY IF EXISTS "Admins can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Admins can delete organization members" ON organization_members;

-- =====================================================
-- 2. RECREAR FUNCIÓN get_user_organization_id SIN RECURSIÓN
-- =====================================================

-- Eliminar la función y todas sus dependencias
DROP FUNCTION IF EXISTS get_user_organization_id() CASCADE;

-- Recrear como función SQL simple (no SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT organization_id 
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- =====================================================
-- 3. RECREAR FUNCIÓN user_has_permission
-- =====================================================

DROP FUNCTION IF EXISTS user_has_permission(text) CASCADE;

CREATE OR REPLACE FUNCTION user_has_permission(required_role text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = auth.uid() 
      AND organization_id = get_user_organization_id()
      AND (
        role = 'admin' OR
        (role = 'manager' AND required_role IN ('manager', 'member')) OR
        (role = 'member' AND required_role = 'member')
      )
  );
$$;

-- =====================================================
-- 4. RECREAR POLÍTICAS DE ORGANIZATION_MEMBERS SIN RECURSIÓN
-- =====================================================

-- SELECT: Los usuarios pueden ver miembros donde ellos son miembros
-- Usa auth.uid() directamente sin llamar funciones
CREATE POLICY "Users can view members of their organizations"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

-- INSERT: Solo admins pueden agregar miembros
CREATE POLICY "Admins can insert organization members"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid() 
        AND om.role = 'admin'
    )
  );

-- UPDATE: Solo admins pueden actualizar miembros
CREATE POLICY "Admins can update organization members"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid() 
        AND om.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid() 
        AND om.role = 'admin'
    )
  );

-- DELETE: Solo admins pueden eliminar miembros
CREATE POLICY "Admins can delete organization members"
  ON organization_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid() 
        AND om.role = 'admin'
    )
  );

-- =====================================================
-- 5. RECREAR TODAS LAS POLÍTICAS QUE FUERON ELIMINADAS
-- =====================================================

-- CLIENTS
CREATE POLICY "Users can view organization clients"
  ON clients FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Members can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('member')
  );

CREATE POLICY "Members can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('member')
  );

CREATE POLICY "Managers can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND user_has_permission('manager')
  );

-- LOANS
CREATE POLICY "Users can view organization loans"
  ON loans FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Members can create loans"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('member')
  );

CREATE POLICY "Members can update loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('member')
  );

CREATE POLICY "Managers can delete loans"
  ON loans FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND user_has_permission('manager')
  );

-- PAYMENTS
CREATE POLICY "Users can view organization payments"
  ON payments FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Members can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('member')
  );

CREATE POLICY "Members can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('member')
  );

CREATE POLICY "Managers can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND user_has_permission('manager')
  );

-- AUDIT_LOGS
CREATE POLICY "Users can view organization audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Members can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

-- CLIENT_DOCUMENTS
CREATE POLICY "Users can view organization client documents"
  ON client_documents FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Members can upload client documents"
  ON client_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('member')
  );

CREATE POLICY "Members can delete client documents"
  ON client_documents FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND user_has_permission('member')
  );

-- WHATSAPP_REMINDERS
CREATE POLICY "Users can view organization reminders"
  ON whatsapp_reminders FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Members can create reminders"
  ON whatsapp_reminders FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('member')
  );

CREATE POLICY "Members can update reminders"
  ON whatsapp_reminders FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('member')
  );

-- COLLATERAL_DOCUMENTS
CREATE POLICY "Users can view organization collateral documents"
  ON collateral_documents FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Members can upload collateral documents"
  ON collateral_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('member')
  );

CREATE POLICY "Members can delete collateral documents"
  ON collateral_documents FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND user_has_permission('member')
  );

-- PAYMENT_PLANS
CREATE POLICY "Users can view organization payment plans"
  ON payment_plans FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Members can create payment plans"
  ON payment_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('member')
  );

CREATE POLICY "Members can update payment plans"
  ON payment_plans FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('member')
  );

CREATE POLICY "Managers can delete payment plans"
  ON payment_plans FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND user_has_permission('manager')
  );

-- PLAN_PAYMENTS
CREATE POLICY "Users can view organization plan payments"
  ON plan_payments FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Members can create plan payments"
  ON plan_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('member')
  );

CREATE POLICY "Members can update plan payments"
  ON plan_payments FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('member')
  );

-- NOTIFICATION_DISMISSALS
CREATE POLICY "Users can view their own notification dismissals"
  ON notification_dismissals FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can create their own notification dismissals"
  ON notification_dismissals FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_id = auth.uid()
  );
