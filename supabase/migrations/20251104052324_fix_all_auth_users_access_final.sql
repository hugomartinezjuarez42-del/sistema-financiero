/*
  # Fix all functions accessing auth.users schema
  
  1. Changes
    - Update search_path for accept_invitation
    - Update search_path for get_my_invitations  
    - Update search_path for delete_user_from_organization
  
  2. Security
    - All functions maintain SECURITY DEFINER
    - Permission checks remain in place
*/

-- Fix accept_invitation
DROP FUNCTION IF EXISTS accept_invitation(text);

CREATE OR REPLACE FUNCTION accept_invitation(invitation_code_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
DECLARE
  invitation_record record;
  current_user_email text;
  result jsonb;
BEGIN
  -- Obtener email del usuario actual
  SELECT email INTO current_user_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Buscar invitación válida
  SELECT * INTO invitation_record
  FROM organization_invitations
  WHERE invitation_code = invitation_code_param
  AND status = 'pending'
  AND expires_at > now()
  AND invited_email = current_user_email;

  -- Verificar que existe
  IF invitation_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invitación no válida, expirada o no corresponde a tu email'
    );
  END IF;

  -- Verificar si el usuario ya es miembro
  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
    AND organization_id = invitation_record.organization_id
  ) THEN
    -- Marcar invitación como aceptada de todos modos
    UPDATE organization_invitations
    SET status = 'accepted',
        accepted_at = now()
    WHERE id = invitation_record.id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Ya eres miembro de esta organización'
    );
  END IF;

  -- Agregar usuario a la organización
  INSERT INTO organization_members (organization_id, user_id, role, joined_at)
  VALUES (
    invitation_record.organization_id,
    auth.uid(),
    invitation_record.role,
    now()
  );

  -- Marcar invitación como aceptada
  UPDATE organization_invitations
  SET status = 'accepted',
      accepted_at = now()
  WHERE id = invitation_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', invitation_record.organization_id,
    'role', invitation_record.role
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Fix get_my_invitations
DROP FUNCTION IF EXISTS get_my_invitations();

CREATE OR REPLACE FUNCTION get_my_invitations()
RETURNS TABLE(
  id uuid,
  organization_id uuid,
  organization_name text,
  invited_by_email text,
  role text,
  invitation_code text,
  expires_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.organization_id,
    o.name as organization_name,
    u.email as invited_by_email,
    i.role,
    i.invitation_code,
    i.expires_at,
    i.created_at
  FROM organization_invitations i
  JOIN organizations o ON i.organization_id = o.id
  JOIN auth.users u ON i.invited_by = u.id
  WHERE i.invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND i.status = 'pending'
  AND i.expires_at > now()
  ORDER BY i.created_at DESC;
END;
$$;

-- Fix delete_user_from_organization - needs 2 parameters
DROP FUNCTION IF EXISTS delete_user_from_organization(uuid);
DROP FUNCTION IF EXISTS delete_user_from_organization(uuid, uuid);

CREATE OR REPLACE FUNCTION delete_user_from_organization(
  user_id_to_delete uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  v_is_admin boolean;
  v_admin_count int;
  v_target_role text;
  v_organization_id uuid;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- Cannot delete yourself
  IF auth.uid() = user_id_to_delete THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puedes eliminarte a ti mismo');
  END IF;

  -- Get current user's organization
  SELECT organization_id INTO v_organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Check admin permissions
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
    AND organization_id = v_organization_id
    AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tienes permisos de administrador');
  END IF;

  -- Get target user role
  SELECT role INTO v_target_role
  FROM organization_members
  WHERE user_id = user_id_to_delete
  AND organization_id = v_organization_id;

  IF v_target_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario no encontrado en la organización');
  END IF;

  -- Check if it's the last admin
  IF v_target_role = 'admin' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM organization_members
    WHERE organization_id = v_organization_id
    AND role = 'admin';

    IF v_admin_count <= 1 THEN
      RETURN jsonb_build_object('success', false, 'error', 'No puedes eliminar al único administrador');
    END IF;
  END IF;

  -- Remove from organization
  DELETE FROM organization_members 
  WHERE user_id = user_id_to_delete 
  AND organization_id = v_organization_id;

  -- Delete from auth (only if not in other organizations)
  IF NOT EXISTS (SELECT 1 FROM organization_members WHERE user_id = user_id_to_delete) THEN
    DELETE FROM auth.identities WHERE user_id = user_id_to_delete;
    DELETE FROM auth.users WHERE id = user_id_to_delete;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION accept_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_from_organization(uuid) TO authenticated;
