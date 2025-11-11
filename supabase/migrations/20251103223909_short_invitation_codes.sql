-- Cambiar códigos de invitación a formato corto (6 caracteres)
-- En lugar de 32 caracteres hex, usar 6 caracteres alfanuméricos

-- 1. Crear función para generar códigos cortos únicos
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Sin letras confusas (I, O, 0, 1)
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- 2. Actualizar la tabla para usar códigos cortos
ALTER TABLE organization_invitations 
  ALTER COLUMN invitation_code SET DEFAULT generate_short_code();

-- 3. Actualizar invitaciones existentes con códigos cortos
UPDATE organization_invitations
SET invitation_code = generate_short_code()
WHERE LENGTH(invitation_code) > 10;

-- 4. Asegurar que los códigos sean únicos incluso después de actualizar
DO $$
DECLARE
  inv_record RECORD;
  new_code text;
  max_attempts integer := 10;
  attempt integer;
BEGIN
  FOR inv_record IN 
    SELECT id FROM organization_invitations 
    WHERE invitation_code IN (
      SELECT invitation_code 
      FROM organization_invitations 
      GROUP BY invitation_code 
      HAVING COUNT(*) > 1
    )
  LOOP
    attempt := 0;
    LOOP
      new_code := generate_short_code();
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM organization_invitations WHERE invitation_code = new_code
      ) OR attempt >= max_attempts;
      attempt := attempt + 1;
    END LOOP;
    
    UPDATE organization_invitations 
    SET invitation_code = new_code 
    WHERE id = inv_record.id;
  END LOOP;
END $$;

COMMENT ON FUNCTION generate_short_code() IS 'Genera códigos cortos de 6 caracteres para invitaciones (sin letras confusas)';
