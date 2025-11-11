/*
  # Sistema de Seguimiento de Cobros por Quincena

  1. Nuevas Tablas
    - `collection_tracking` - Seguimiento de gestión de cobros
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `organization_id` (uuid, foreign key to organizations)
      - `collection_date` (date) - Fecha de la quincena de cobro
      - `status` (text) - Estado: 'paid', 'postponed', 'pending'
      - `amount_collected` (numeric) - Monto cobrado
      - `notes` (text) - Notas del cobrador
      - `collected_by` (uuid) - Usuario que gestionó
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Índices
    - Por cliente y fecha para búsquedas rápidas
    - Por organización y fecha
    - Por status

  3. Seguridad
    - RLS habilitado
    - Solo usuarios autenticados de la organización pueden ver/editar
*/

-- Crear tabla de seguimiento de cobros
CREATE TABLE IF NOT EXISTS collection_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  collection_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('paid', 'postponed', 'pending')),
  amount_collected numeric DEFAULT 0,
  notes text,
  collected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_collection_tracking_client ON collection_tracking(client_id);
CREATE INDEX IF NOT EXISTS idx_collection_tracking_organization ON collection_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_collection_tracking_date ON collection_tracking(collection_date);
CREATE INDEX IF NOT EXISTS idx_collection_tracking_status ON collection_tracking(status);
CREATE INDEX IF NOT EXISTS idx_collection_tracking_client_date ON collection_tracking(client_id, collection_date);

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_collection_tracking_updated_at ON collection_tracking;
CREATE TRIGGER update_collection_tracking_updated_at
  BEFORE UPDATE ON collection_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE collection_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view collection tracking in their organization"
  ON collection_tracking FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert collection tracking in their organization"
  ON collection_tracking FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update collection tracking in their organization"
  ON collection_tracking FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete collection tracking in their organization"
  ON collection_tracking FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );