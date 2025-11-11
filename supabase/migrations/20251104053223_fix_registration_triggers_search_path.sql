/*
  # Fix registration triggers search_path
  
  1. Changes
    - Update create_user_organization to include auth in search_path
    - Update create_first_user_admin to include auth in search_path
    - Add proper error handling so registration never fails
  
  2. Security
    - Maintains SECURITY DEFINER
    - Proper exception handling
*/

-- Fix create_user_organization
CREATE OR REPLACE FUNCTION create_user_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
DECLARE
  new_org_id uuid;
  existing_org_id uuid;
  pending_invitation record;
BEGIN
  -- Verificar si el usuario ya tiene una organización
  SELECT organization_id INTO existing_org_id
  FROM organization_members 
  WHERE user_id = NEW.id
  LIMIT 1;

  IF existing_org_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar si hay invitaciones pendientes para este email
  SELECT * INTO pending_invitation
  FROM organization_invitations
  WHERE invited_email = NEW.email
  AND status = 'pending'
  AND expires_at > now()
  LIMIT 1;

  -- Si hay invitación pendiente, NO crear organización nueva
  -- El usuario debe aceptar la invitación manualmente
  IF pending_invitation IS NOT NULL THEN
    RAISE NOTICE 'User % has pending invitation, skipping org creation', NEW.email;
    RETURN NEW;
  END IF;

  -- Crear nueva organización solo si no hay invitaciones
  BEGIN
    INSERT INTO organizations (name, created_by, created_at)
    VALUES ('Mi Organización', NEW.id, now())
    RETURNING id INTO new_org_id;

    -- Agregar usuario como admin
    INSERT INTO organization_members (organization_id, user_id, role, joined_at)
    VALUES (new_org_id, NEW.id, 'admin', now());

    RAISE NOTICE 'Auto-created organization % for new user %', new_org_id, NEW.email;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating organization for user %: %', NEW.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Fix create_first_user_admin
CREATE OR REPLACE FUNCTION create_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
BEGIN
  -- Check if this is the first user
  IF NOT EXISTS (SELECT 1 FROM user_profiles LIMIT 1) THEN
    BEGIN
      -- Create admin profile
      INSERT INTO user_profiles (id, full_name, role, is_active)
      VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'admin', true);

      -- Create full permissions
      INSERT INTO user_permissions (
        user_id,
        can_create_clients, can_edit_clients, can_delete_clients,
        can_create_loans, can_edit_loans, can_delete_loans,
        can_create_payments, can_delete_payments,
        can_view_reports, can_export_data, can_manage_users
      ) VALUES (
        NEW.id,
        true, true, true,
        true, true, true,
        true, true,
        true, true, true
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error creating first admin user profile: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;
