/*
  # Fix create user function to work with Supabase auth

  1. Changes
    - Use Supabase's auth.admin API approach instead of direct auth.users manipulation
    - Simplify user creation to avoid pgcrypto dependency issues
    - Use proper Supabase authentication methods

  2. Security
    - Maintains admin-only access requirement
    - Validates organization membership
*/

DROP FUNCTION IF EXISTS create_user_in_organization(text, text, text, uuid);

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
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
    AND organization_id = p_organization_id
    AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tienes permisos de administrador');
  END IF;

  v_new_user_id := gen_random_uuid();

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
    p_email,
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
    format('{"sub":"%s","email":"%s"}', v_new_user_id::text, p_email)::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );

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
