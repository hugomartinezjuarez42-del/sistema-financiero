/*
  # Asegurar que todos los usuarios tengan organización

  ## Descripción
  Esta migración garantiza que todos los usuarios existentes y futuros
  tengan una organización asignada automáticamente.

  ## Cambios
  1. Crea organizaciones para usuarios existentes sin una
  2. Mejora el trigger para crear organizaciones automáticamente
  3. Agrega verificación adicional de seguridad
*/

-- =====================================================
-- 1. CREAR ORGANIZACIONES PARA USUARIOS EXISTENTES
-- =====================================================

DO $$
DECLARE
  user_record RECORD;
  new_org_id uuid;
BEGIN
  -- Para cada usuario que NO tiene organización
  FOR user_record IN 
    SELECT u.id, u.email
    FROM auth.users u
    LEFT JOIN organization_members om ON u.id = om.user_id
    WHERE om.organization_id IS NULL
  LOOP
    -- Crear nueva organización
    INSERT INTO organizations (name, created_by, created_at)
    VALUES (
      'Mi Organización',
      user_record.id,
      now()
    )
    RETURNING id INTO new_org_id;
    
    -- Agregar usuario como admin
    INSERT INTO organization_members (organization_id, user_id, role, joined_at)
    VALUES (new_org_id, user_record.id, 'admin', now());
    
    -- Migrar datos existentes del usuario a su nueva organización
    -- Actualizar clients
    UPDATE clients 
    SET organization_id = new_org_id 
    WHERE user_id = user_record.id AND organization_id IS NULL;
    
    -- Actualizar loans
    UPDATE loans 
    SET organization_id = new_org_id 
    WHERE user_id = user_record.id AND organization_id IS NULL;
    
    -- Actualizar payments (a través de loans)
    UPDATE payments p
    SET organization_id = new_org_id
    FROM loans l
    WHERE p.loan_id = l.id 
      AND l.user_id = user_record.id 
      AND p.organization_id IS NULL;
    
    RAISE NOTICE 'Created organization % for user %', new_org_id, user_record.email;
  END LOOP;
END $$;

-- =====================================================
-- 2. MEJORAR TRIGGER DE AUTO-CREACIÓN
-- =====================================================

-- Recrear la función del trigger con mejor manejo de errores
CREATE OR REPLACE FUNCTION create_user_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id uuid;
  existing_org_id uuid;
BEGIN
  -- Verificar si el usuario ya tiene una organización
  SELECT organization_id INTO existing_org_id
  FROM organization_members 
  WHERE user_id = NEW.id
  LIMIT 1;
  
  IF existing_org_id IS NOT NULL THEN
    -- El usuario ya tiene organización, no hacer nada
    RETURN NEW;
  END IF;
  
  -- Crear nueva organización
  INSERT INTO organizations (name, created_by, created_at)
  VALUES ('Mi Organización', NEW.id, now())
  RETURNING id INTO new_org_id;
  
  -- Agregar usuario como admin
  INSERT INTO organization_members (organization_id, user_id, role, joined_at)
  VALUES (new_org_id, NEW.id, 'admin', now());
  
  RAISE NOTICE 'Auto-created organization % for new user %', new_org_id, NEW.email;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating organization for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- Asegurar que el trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_organization();

-- =====================================================
-- 3. FUNCIÓN DE VERIFICACIÓN
-- =====================================================

-- Función para verificar que un usuario tiene organización
CREATE OR REPLACE FUNCTION user_has_organization(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  org_count integer;
BEGIN
  SELECT COUNT(*) INTO org_count
  FROM organization_members
  WHERE user_id = user_uuid;
  
  RETURN org_count > 0;
END;
$$;

-- =====================================================
-- 4. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que no queden usuarios sin organización
DO $$
DECLARE
  users_without_org integer;
BEGIN
  SELECT COUNT(*) INTO users_without_org
  FROM auth.users u
  LEFT JOIN organization_members om ON u.id = om.user_id
  WHERE om.organization_id IS NULL;
  
  IF users_without_org > 0 THEN
    RAISE WARNING 'Hay % usuarios sin organización', users_without_org;
  ELSE
    RAISE NOTICE 'Todos los usuarios tienen organización asignada';
  END IF;
END $$;
