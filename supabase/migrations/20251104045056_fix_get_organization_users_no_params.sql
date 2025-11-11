/*
  # Fix get_organization_users function
  
  1. Changes
    - Create version without parameters that automatically gets user's organization
    - Returns user list from the calling user's organization
  
  2. Security
    - Uses auth.uid() to get current user
    - Returns only users from same organization
*/

-- Drop existing function with parameter
DROP FUNCTION IF EXISTS get_organization_users(uuid);

-- Create new function without parameters
CREATE OR REPLACE FUNCTION get_organization_users()
RETURNS TABLE(
  id uuid,
  email text,
  role text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  -- Return members with their emails
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    om.role,
    u.created_at
  FROM organization_members om
  INNER JOIN auth.users u ON u.id = om.user_id
  WHERE om.organization_id = v_organization_id
  ORDER BY u.created_at ASC;
END;
$$;
