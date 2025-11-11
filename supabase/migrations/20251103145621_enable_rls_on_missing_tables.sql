/*
  # Habilitar RLS en Tablas Faltantes

  Habilita Row Level Security en las tablas organization_members y organizations
  que actualmente no lo tienen habilitado, creando un riesgo de seguridad.
*/

-- Habilitar RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Políticas para organization_members
CREATE POLICY "Users can view their organization members"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members om
      WHERE om.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert organization members"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members om
      WHERE om.user_id = (select auth.uid())
    )
  );

-- Políticas para organizations
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));