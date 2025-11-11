/*
  # Optimizar Políticas RLS - Parte 2
  
  Tablas: digital_signatures, manager_signatures, collection_tracking
*/

-- ==============================================================
-- digital_signatures
-- ==============================================================

DROP POLICY IF EXISTS "Users can view signatures in their organization" ON digital_signatures;
CREATE POLICY "Users can view signatures in their organization"
  ON digital_signatures FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create signatures in their organization" ON digital_signatures;
CREATE POLICY "Users can create signatures in their organization"
  ON digital_signatures FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update signatures in their organization" ON digital_signatures;
CREATE POLICY "Users can update signatures in their organization"
  ON digital_signatures FOR UPDATE
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

DROP POLICY IF EXISTS "Users can delete signatures in their organization" ON digital_signatures;
CREATE POLICY "Users can delete signatures in their organization"
  ON digital_signatures FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ==============================================================
-- manager_signatures
-- ==============================================================

DROP POLICY IF EXISTS "Users can view manager signatures in their organization" ON manager_signatures;
CREATE POLICY "Users can view manager signatures in their organization"
  ON manager_signatures FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create manager signatures in their organization" ON manager_signatures;
CREATE POLICY "Users can create manager signatures in their organization"
  ON manager_signatures FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update manager signatures in their organization" ON manager_signatures;
CREATE POLICY "Users can update manager signatures in their organization"
  ON manager_signatures FOR UPDATE
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

DROP POLICY IF EXISTS "Users can delete manager signatures in their organization" ON manager_signatures;
CREATE POLICY "Users can delete manager signatures in their organization"
  ON manager_signatures FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ==============================================================
-- collection_tracking
-- ==============================================================

DROP POLICY IF EXISTS "Users can view collection tracking in their organization" ON collection_tracking;
CREATE POLICY "Users can view collection tracking in their organization"
  ON collection_tracking FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert collection tracking in their organization" ON collection_tracking;
CREATE POLICY "Users can insert collection tracking in their organization"
  ON collection_tracking FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update collection tracking in their organization" ON collection_tracking;
CREATE POLICY "Users can update collection tracking in their organization"
  ON collection_tracking FOR UPDATE
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

DROP POLICY IF EXISTS "Users can delete collection tracking in their organization" ON collection_tracking;
CREATE POLICY "Users can delete collection tracking in their organization"
  ON collection_tracking FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );