/*
  # Fix get_organization_users function auth.users access
  
  1. Changes
    - Update get_organization_users to properly access auth.users
    - Add error handling for auth schema access
    - Ensure SECURITY DEFINER and proper search_path
  
  2. Security
    - Function runs with definer privileges to access auth schema
    - Only returns users from caller's organization
*/

-- Drop and recreate with proper permissions
DROP FUNCTION IF EXISTS get_organization_users();

CREATE OR REPLACE FUNCTION get_organization_users()
RETURNS TABLE(
  id uuid,
  email text,
  role text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  v_organization_id uuid;
BEGIN
  -- Get the organization ID for the current user
  SELECT organization_id INTO v_organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'No perteneces a ninguna organización';
  END IF;

  -- Return members with their emails from auth.users
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    om.role,
    u.created_at
  FROM organization_members om
  INNER JOIN auth.users u ON u.id = om.user_id
  WHERE om.organization_id = v_organization_id
  ORDER BY u.created_at ASC;
  
EXCEPTION WHEN OTHERS THEN
  -- If there's an error accessing auth.users, raise it
  RAISE EXCEPTION 'Error al obtener usuarios: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_organization_users() TO authenticated;
