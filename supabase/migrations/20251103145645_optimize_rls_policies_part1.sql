/*
  # Optimizar Políticas RLS - Parte 1
  
  Elimina políticas duplicadas y optimiza el rendimiento usando (select auth.uid())
  en lugar de auth.uid() para evitar re-evaluación en cada fila.
  
  Tablas: notification_dismissals, payment_plans, plan_payments
*/

-- ==============================================================
-- notification_dismissals
-- ==============================================================

DROP POLICY IF EXISTS "Users can view own dismissals" ON notification_dismissals;
DROP POLICY IF EXISTS "Users can view their own notification dismissals" ON notification_dismissals;
CREATE POLICY "Users can view own dismissals"
  ON notification_dismissals FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own dismissals" ON notification_dismissals;
DROP POLICY IF EXISTS "Users can create their own notification dismissals" ON notification_dismissals;
CREATE POLICY "Users can insert own dismissals"
  ON notification_dismissals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own dismissals" ON notification_dismissals;
CREATE POLICY "Users can delete own dismissals"
  ON notification_dismissals FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ==============================================================
-- payment_plans
-- ==============================================================

DROP POLICY IF EXISTS "Users can view own payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Users can view organization payment plans" ON payment_plans;
CREATE POLICY "Users can view organization payment plans"
  ON payment_plans FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create own payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Members can create payment plans" ON payment_plans;
CREATE POLICY "Members can create payment plans"
  ON payment_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Members can update payment plans" ON payment_plans;
CREATE POLICY "Members can update payment plans"
  ON payment_plans FOR UPDATE
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

DROP POLICY IF EXISTS "Users can delete own payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Managers can delete payment plans" ON payment_plans;
CREATE POLICY "Managers can delete payment plans"
  ON payment_plans FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ==============================================================
-- plan_payments
-- ==============================================================

DROP POLICY IF EXISTS "Users can view plan payments" ON plan_payments;
DROP POLICY IF EXISTS "Users can view organization plan payments" ON plan_payments;
CREATE POLICY "Users can view organization plan payments"
  ON plan_payments FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create plan payments" ON plan_payments;
DROP POLICY IF EXISTS "Members can create plan payments" ON plan_payments;
CREATE POLICY "Members can create plan payments"
  ON plan_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update plan payments" ON plan_payments;
DROP POLICY IF EXISTS "Members can update plan payments" ON plan_payments;
CREATE POLICY "Members can update plan payments"
  ON plan_payments FOR UPDATE
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

DROP POLICY IF EXISTS "Members can delete plan payments" ON plan_payments;
CREATE POLICY "Members can delete plan payments"
  ON plan_payments FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );