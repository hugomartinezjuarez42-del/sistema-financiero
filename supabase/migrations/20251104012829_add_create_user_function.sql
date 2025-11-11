/*
  # Add function to create users in organization

  1. New Functions
    - `create_user_in_organization` - Creates a new user and adds them to an organization
      - Parameters:
        - p_email: Email for the new user
        - p_password: Password for the new user
        - p_role: Role (admin or member)
        - p_organization_id: Organization ID to add user to
      - Returns: JSON with success status and message
      
  2. Security
    - Function uses security definer to create users with admin privileges
    - Only authenticated users can call this function
    - Validates organization membership before creating user
*/

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
  v_is_member boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
    AND organization_id = p_organization_id
    AND role = 'admin'
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tienes permisos de administrador');
  END IF;

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
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
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
  )
  RETURNING id INTO v_new_user_id;

  INSERT INTO organization_members (user_id, organization_id, role)
  VALUES (v_new_user_id, p_organization_id, p_role);

  RETURN jsonb_build_object('success', true, 'user_id', v_new_user_id);

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este email ya está registrado');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
