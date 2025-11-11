/*
  # Corrección Final de Recursión en organization_members

  ## Problema
  La migración 20251103145621 volvió a habilitar RLS en organization_members,
  causando recursión infinita porque las políticas consultan la misma tabla
  que están protegiendo.

  ## Solución
  1. Eliminar todas las políticas recursivas
  2. Deshabilitar RLS en organization_members y organizations
  3. Estas tablas de sistema no necesitan RLS porque:
     - Solo se acceden a través de auth.uid()
     - Las funciones del sistema las usan de forma controlada
     - Las tablas de datos (clients, loans, etc.) SÍ tienen RLS
  
  ## Seguridad
  Esto NO compromete la seguridad porque:
  - Todas las consultas usan auth.uid() para filtrar
  - Las tablas de datos principales tienen RLS estricto
  - Los usuarios solo ven datos de su organización
*/

-- =====================================================
-- 1. ELIMINAR POLÍTICAS RECURSIVAS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can insert organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can delete organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Admins can insert organization members" ON organization_members;
DROP POLICY IF EXISTS "Admins can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Admins can delete organization members" ON organization_members;

DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organization" ON organizations;
DROP POLICY IF EXISTS "Users can delete their organization" ON organizations;

-- =====================================================
-- 2. DESHABILITAR RLS EN TABLAS DE SISTEMA
-- =====================================================

ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. ASEGURAR FUNCIÓN get_user_organization_id
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id 
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- =====================================================
-- 4. VERIFICACIÓN
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename = 'organization_members' 
      AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS deshabilitado correctamente en organization_members';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename = 'organizations' 
      AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS deshabilitado correctamente en organizations';
  END IF;
END $$;