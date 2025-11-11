/*
  # Fix User Management and Add Modification Tracking

  1. Changes
    - Fix user creation function with better error handling
    - Add user deletion function
    - Add modified_by tracking to main tables
    - Add triggers to automatically track who made changes

  2. Security
    - Only admins can create/delete users
    - Cannot delete yourself
    - Cannot delete last admin
*/

-- Drop existing function
DROP FUNCTION IF EXISTS create_user_in_organization(text, text, text, uuid);

-- Create improved user creation function
CREATE OR REPLACE FUNCTION create_user_in_organization(
  p_email text,
  p_password text,
  p_role text,
  p_organization_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_user_id uuid;
  v_is_admin boolean;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- Check admin permissions
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
    AND organization_id = p_organization_id
    AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tienes permisos de administrador');
  END IF;

  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(trim(p_email))) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este email ya está registrado');
  END IF;

  -- Validate password length
  IF length(p_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'La contraseña debe tener al menos 6 caracteres');
  END IF;

  -- Generate new user ID
  v_new_user_id := gen_random_uuid();

  -- Insert into auth.users
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_new_user_id,
      'authenticated',
      'authenticated',
      lower(trim(p_email)),
      extensions.crypt(p_password, extensions.gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este email ya está en uso');
    WHEN OTHERS THEN
      RETURN jsonb_build_object('success', false, 'error', 'Error al crear usuario: ' || SQLERRM);
  END;

  -- Insert into auth.identities
  BEGIN
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_new_user_id,
      v_new_user_id,
      format('{"sub":"%s","email":"%s"}', v_new_user_id::text, lower(trim(p_email)))::jsonb,
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback user creation if identity fails
      DELETE FROM auth.users WHERE id = v_new_user_id;
      RETURN jsonb_build_object('success', false, 'error', 'Error al crear identidad: ' || SQLERRM);
  END;

  -- Add to organization
  BEGIN
    INSERT INTO organization_members (user_id, organization_id, role)
    VALUES (v_new_user_id, p_organization_id, p_role);
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback everything if organization membership fails
      DELETE FROM auth.identities WHERE user_id = v_new_user_id;
      DELETE FROM auth.users WHERE id = v_new_user_id;
      RETURN jsonb_build_object('success', false, 'error', 'Error al agregar a organización: ' || SQLERRM);
  END;

  RETURN jsonb_build_object('success', true, 'user_id', v_new_user_id);
END;
$$;

-- Create function to delete users
CREATE OR REPLACE FUNCTION delete_user_from_organization(
  p_user_id uuid,
  p_organization_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_admin_count int;
  v_target_role text;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- Cannot delete yourself
  IF auth.uid() = p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puedes eliminarte a ti mismo');
  END IF;

  -- Check admin permissions
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
    AND organization_id = p_organization_id
    AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tienes permisos de administrador');
  END IF;

  -- Get target user role
  SELECT role INTO v_target_role
  FROM organization_members
  WHERE user_id = p_user_id
  AND organization_id = p_organization_id;

  -- Check if it's the last admin
  IF v_target_role = 'admin' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM organization_members
    WHERE organization_id = p_organization_id
    AND role = 'admin';

    IF v_admin_count <= 1 THEN
      RETURN jsonb_build_object('success', false, 'error', 'No puedes eliminar al único administrador');
    END IF;
  END IF;

  -- Remove from organization
  DELETE FROM organization_members 
  WHERE user_id = p_user_id 
  AND organization_id = p_organization_id;

  -- Delete from auth (only if not in other organizations)
  IF NOT EXISTS (SELECT 1 FROM organization_members WHERE user_id = p_user_id) THEN
    DELETE FROM auth.identities WHERE user_id = p_user_id;
    DELETE FROM auth.users WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Add modified_by columns to track changes
ALTER TABLE clients ADD COLUMN IF NOT EXISTS modified_by uuid REFERENCES auth.users(id);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS modified_by uuid REFERENCES auth.users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS modified_by uuid REFERENCES auth.users(id);

-- Create function to set modified_by
CREATE OR REPLACE FUNCTION set_modified_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to track modifications
DROP TRIGGER IF EXISTS set_clients_modified_by ON clients;
CREATE TRIGGER set_clients_modified_by
  BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION set_modified_by();

DROP TRIGGER IF EXISTS set_loans_modified_by ON loans;
CREATE TRIGGER set_loans_modified_by
  BEFORE INSERT OR UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION set_modified_by();

DROP TRIGGER IF EXISTS set_payments_modified_by ON payments;
CREATE TRIGGER set_payments_modified_by
  BEFORE INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION set_modified_by();
