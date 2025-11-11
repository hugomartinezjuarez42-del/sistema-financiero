/*
  # Corregir Search Path en Función con Argumento

  La función user_has_organization(uuid) no tiene search_path inmutable.
  Actualizarla para prevenir ataques de inyección SQL.
*/

CREATE OR REPLACE FUNCTION user_has_organization(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  org_count integer;
BEGIN
  SELECT COUNT(*) INTO org_count
  FROM public.organization_members
  WHERE user_id = user_uuid;

  RETURN org_count > 0;
END;
$$;