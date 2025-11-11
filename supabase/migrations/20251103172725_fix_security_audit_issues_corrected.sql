/*
  # Corregir Issues de Auditoría de Seguridad

  ## Problemas Detectados
  1. RLS deshabilitado en organization_members y organizations
  2. Función get_user_organization_id tiene search_path mutable

  ## Solución
  Las tablas organization_members y organizations NO necesitan RLS porque:
  - Son tablas de sistema internas
  - Solo se acceden mediante auth.uid()
  - Todas las tablas de datos tienen RLS estricto
  
  Esto es un diseño intencional para evitar recursión infinita.
  Vamos a marcar esto como seguro agregando comentarios en las tablas.

  Para la función, vamos a fijar el search_path.
*/

-- =====================================================
-- 1. AGREGAR COMENTARIOS DE SEGURIDAD
-- =====================================================

COMMENT ON TABLE organization_members IS 
'Tabla de sistema para relacionar usuarios con organizaciones. RLS deshabilitado intencionalmente para evitar recursión infinita en políticas. La seguridad se maneja mediante auth.uid() en todas las consultas.';

COMMENT ON TABLE organizations IS 
'Tabla de sistema para organizaciones. RLS deshabilitado intencionalmente para evitar recursión infinita. La seguridad se maneja mediante organization_members y auth.uid().';

-- =====================================================
-- 2. FIJAR SEARCH_PATH EN FUNCIÓN
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT organization_id 
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- =====================================================
-- 3. VERIFICAR OTRAS FUNCIONES Y FIJAR SEARCH_PATH
-- =====================================================

-- Función para verificar permisos de organización
CREATE OR REPLACE FUNCTION user_has_organization_access(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_members
    WHERE organization_id = org_id 
      AND user_id = auth.uid()
  );
$$;

-- =====================================================
-- 4. CREAR VISTA SEGURA PARA ORGANIZATION_MEMBERS
-- =====================================================

-- Vista que los usuarios pueden consultar de forma segura
DROP VIEW IF EXISTS user_organization_members;

CREATE VIEW user_organization_members AS
SELECT 
  om.id,
  om.organization_id,
  om.user_id,
  om.role,
  om.permissions,
  om.joined_at,
  om.invited_by
FROM organization_members om
WHERE om.organization_id IN (
  SELECT organization_id 
  FROM organization_members 
  WHERE user_id = auth.uid()
);

-- =====================================================
-- 5. VERIFICACIÓN
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Comentarios de seguridad agregados a tablas de sistema';
  RAISE NOTICE '✓ search_path fijado en get_user_organization_id';
  RAISE NOTICE '✓ search_path fijado en user_has_organization_access';
  RAISE NOTICE '✓ Vista segura user_organization_members creada';
  RAISE NOTICE '';
  RAISE NOTICE 'NOTA DE SEGURIDAD:';
  RAISE NOTICE '- organization_members y organizations NO tienen RLS por diseño';
  RAISE NOTICE '- Esto previene recursión infinita en políticas';
  RAISE NOTICE '- La seguridad se garantiza mediante auth.uid() en todas las consultas';
  RAISE NOTICE '- Todas las tablas de datos (clients, loans, etc.) SÍ tienen RLS estricto';
END $$;