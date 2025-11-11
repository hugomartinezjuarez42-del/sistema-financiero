/*
  # Fix create_user_in_organization function search_path
  
  1. Changes
    - Update search_path to include auth and extensions schemas
    - Ensure proper access to auth.users and pgcrypto functions
  
  2. Security
    - Maintains SECURITY DEFINER
    - Admin permission checks remain in place
*/

-- Drop and recreate with correct search_path
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
SET search_path TO 'public', 'auth', 'extensions'
AS $$
DECLARE
  v_new_user_id uuid;
  v_is_admin boolean;
  v_normalized_email text;
BEGIN
  -- Normalize email
  v_normalized_email := lower(trim(p_email));

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

  -- Check if email already exists (case insensitive)
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE lower(email) = v_normalized_email
  ) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Este email ya está registrado en el sistema'
    );
  END IF;

  -- Validate password length
  IF length(p_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'La contraseña debe tener al menos 6 caracteres');
  END IF;

  -- Generate new user ID
  v_new_user_id := gen_random_uuid();

  -- Insert into auth.users with pgcrypto
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
      v_normalized_email,
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
    );
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Este email ya está registrado'
      );
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Error al crear usuario: ' || SQLERRM
      );
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
      jsonb_build_object(
        'sub', v_new_user_id::text,
        'email', v_normalized_email
      ),
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      DELETE FROM auth.users WHERE id = v_new_user_id;
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Error al crear identidad: ' || SQLERRM
      );
  END;

  -- Add to organization
  BEGIN
    INSERT INTO organization_members (user_id, organization_id, role, joined_at)
    VALUES (v_new_user_id, p_organization_id, p_role, NOW());
  EXCEPTION
    WHEN OTHERS THEN
      DELETE FROM auth.identities WHERE user_id = v_new_user_id;
      DELETE FROM auth.users WHERE id = v_new_user_id;
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Error al agregar a organización: ' || SQLERRM
      );
  END;

  RETURN jsonb_build_object(
    'success', true, 
    'user_id', v_new_user_id,
    'message', 'Usuario creado exitosamente'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_user_in_organization(text, text, text, uuid) TO authenticated;
