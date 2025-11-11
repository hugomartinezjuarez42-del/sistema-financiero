/*
  # Add function to get organization users with emails

  1. New Function
    - get_organization_users: Returns all users in an organization with their emails
    - Accessible only to authenticated users in the organization
*/

CREATE OR REPLACE FUNCTION get_organization_users(p_organization_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  role text,
  joined_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is member of the organization
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_organization_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'No tienes acceso a esta organización';
  END IF;

  -- Return members with their emails
  RETURN QUERY
  SELECT 
    om.id,
    om.user_id,
    COALESCE(u.email, 'Email no disponible') as email,
    om.role,
    om.joined_at
  FROM organization_members om
  LEFT JOIN auth.users u ON u.id = om.user_id
  WHERE om.organization_id = p_organization_id
  ORDER BY om.joined_at ASC;
END;
$$;

COMMENT ON FUNCTION get_organization_users IS 'Obtiene todos los usuarios de una organización con sus emails';
