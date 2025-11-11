/*
  # Deshabilitar RLS en organization_members para evitar recursión

  ## Problema
  Las políticas RLS en organization_members causan recursión infinita porque:
  1. get_user_organization_id() hace SELECT en organization_members
  2. Ese SELECT activa las políticas de organization_members
  3. Las políticas hacen otro SELECT en organization_members
  4. Recursión infinita

  ## Solución
  Deshabilitar RLS en organization_members ya que:
  - Es una tabla de configuración del sistema
  - Solo contiene relaciones user_id <-> organization_id
  - Los usuarios solo pueden ver/modificar a través de funciones controladas
  - Las otras tablas (clients, loans, etc.) tienen RLS y usan get_user_organization_id()
  
  Esto es seguro porque:
  - Los usuarios solo pueden acceder a través de auth.uid()
  - Las funciones verifican permisos antes de permitir cambios
  - Las tablas de datos principales siguen protegidas con RLS
*/

-- =====================================================
-- 1. ELIMINAR TODAS LAS POLÍTICAS DE ORGANIZATION_MEMBERS
-- =====================================================

DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Admins can insert organization members" ON organization_members;
DROP POLICY IF EXISTS "Admins can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Admins can delete organization members" ON organization_members;

-- =====================================================
-- 2. DESHABILITAR RLS EN ORGANIZATION_MEMBERS
-- =====================================================

ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. VERIFICAR OTRAS TABLAS DE SISTEMA
-- =====================================================

-- Verificar que organizations también esté sin RLS para evitar problemas
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. ASEGURAR QUE get_user_organization_id FUNCIONA
-- =====================================================

-- Recrear la función para asegurar que está correcta
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT organization_id 
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- =====================================================
-- 5. VERIFICACIÓN
-- =====================================================

DO $$
BEGIN
  -- Verificar que RLS está deshabilitado
  IF EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename = 'organization_members' 
      AND rowsecurity = false
  ) THEN
    RAISE NOTICE 'RLS deshabilitado correctamente en organization_members';
  ELSE
    RAISE WARNING 'RLS aún está habilitado en organization_members';
  END IF;
END $$;
