/*
  # Firma del Gerente/Prestamista

  1. Nueva Tabla
    - `manager_signatures`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key) - Usuario que sube la firma
      - `organization_id` (uuid, foreign key) - Organización
      - `signature_data` (text) - Imagen de la firma en base64
      - `full_name` (text) - Nombre completo del firmante
      - `title` (text) - Cargo (Gerente, Director, etc.)
      - `is_active` (boolean) - Solo una firma activa por organización
      - `uploaded_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Seguridad
    - Enable RLS on `manager_signatures` table
    - Add policies for authenticated users within their organization
*/

CREATE TABLE IF NOT EXISTS manager_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  signature_data text NOT NULL,
  full_name text NOT NULL,
  title text DEFAULT 'Gerente' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  uploaded_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE manager_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view manager signatures in their organization"
  ON manager_signatures FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create manager signatures in their organization"
  ON manager_signatures FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update manager signatures in their organization"
  ON manager_signatures FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete manager signatures in their organization"
  ON manager_signatures FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_manager_signatures_organization_id ON manager_signatures(organization_id);
CREATE INDEX IF NOT EXISTS idx_manager_signatures_is_active ON manager_signatures(is_active);

-- Función para asegurar que solo una firma esté activa por organización
CREATE OR REPLACE FUNCTION ensure_single_active_manager_signature()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE manager_signatures 
    SET is_active = false 
    WHERE organization_id = NEW.organization_id 
      AND id != NEW.id 
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_active_manager_signature
  BEFORE INSERT OR UPDATE ON manager_signatures
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_manager_signature();