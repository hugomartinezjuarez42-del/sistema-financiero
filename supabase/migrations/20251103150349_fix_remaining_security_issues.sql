/*
  # Corregir Problemas de Seguridad Restantes

  1. Optimizar política RLS faltante en plan_payments
  2. Eliminar política duplicada en plan_payments
  3. Verificar search_path en funciones
*/

-- ==============================================================
-- PARTE 1: Eliminar política duplicada y optimizar plan_payments
-- ==============================================================

-- Eliminar política duplicada de DELETE
DROP POLICY IF EXISTS "Users can delete plan payments" ON plan_payments;

-- Asegurar que la política restante esté optimizada
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

-- ==============================================================
-- PARTE 2: Verificar todas las funciones tienen search_path fijo
-- ==============================================================

-- user_has_organization - asegurar search_path inmutable
CREATE OR REPLACE FUNCTION user_has_organization()
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Recrear otras funciones con search_path más restrictivo

CREATE OR REPLACE FUNCTION user_has_permission(required_role text)
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = auth.uid()
    AND permission = required_role
    AND granted = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  org_id uuid;
BEGIN
  SELECT organization_id INTO org_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN org_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_user_organization()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  INSERT INTO public.organizations (created_by, name)
  VALUES (NEW.id, 'Mi Organización')
  RETURNING id INTO new_org_id;
  
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION ensure_single_active_manager_signature()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.manager_signatures
    SET is_active = false
    WHERE organization_id = NEW.organization_id
    AND id != NEW.id
    AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;