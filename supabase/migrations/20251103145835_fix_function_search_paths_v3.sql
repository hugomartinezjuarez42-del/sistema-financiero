/*
  # Fijar Search Path en Funciones (v3)

  Recrea funciones con search_path inmutable sin eliminar las que tienen dependencias
*/

-- Funciones que se pueden reemplazar directamente

-- create_user_organization
CREATE OR REPLACE FUNCTION create_user_organization()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  INSERT INTO organizations (created_by, name)
  VALUES (NEW.id, 'Mi Organización')
  RETURNING id INTO new_org_id;
  
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$;

-- user_has_organization
CREATE OR REPLACE FUNCTION user_has_organization()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
  );
END;
$$;

-- user_has_permission - mantener signature original pero con search_path
CREATE OR REPLACE FUNCTION user_has_permission(required_role text)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = auth.uid()
    AND permission = required_role
    AND granted = true
  );
END;
$$;

-- get_user_organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  org_id uuid;
BEGIN
  SELECT organization_id INTO org_id
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN org_id;
END;
$$;

-- ensure_single_active_manager_signature
CREATE OR REPLACE FUNCTION ensure_single_active_manager_signature()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE manager_signatures
    SET is_active = false
    WHERE organization_id = NEW.organization_id
    AND id != NEW.id
    AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;