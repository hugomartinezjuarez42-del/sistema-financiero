/*
  # Step 2: Recreate user_has_permission function
  
  1. Changes
    - Drop old function
    - Create new function based on organization role
    - Simplified logic using member/admin roles
*/

-- Drop old function
DROP FUNCTION IF EXISTS user_has_permission(text);

-- Create new simplified function based on organization role
CREATE OR REPLACE FUNCTION user_has_permission(required_permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get user's role from organization_members
  SELECT role INTO user_role
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- If no role found, return false
  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Admin has all permissions
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;

  -- Member permissions
  IF user_role = 'member' THEN
    -- Members can do everything except delete
    IF required_permission IN ('member', 'view', 'create', 'edit') THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;
