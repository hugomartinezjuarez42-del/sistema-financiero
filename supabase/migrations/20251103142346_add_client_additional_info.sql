/*
  # Agregar Información Adicional de Clientes

  1. Cambios a la Tabla `clients`
    - `residence_address` (text) - Dirección donde vive el cliente
    - `workplace` (text) - Lugar de trabajo
    - `workplace_address` (text) - Dirección del lugar de trabajo
    - `reference_name` (text) - Nombre de referencia personal
    - `reference_phone` (text) - Teléfono de referencia
    - `reference_relationship` (text) - Relación con la referencia (amigo, familiar, etc.)
    - `monthly_salary` (numeric) - Salario mensual del cliente
    - `other_income` (numeric) - Otros ingresos
    - `updated_at` (timestamptz) - Fecha de última actualización

  2. Notas
    - Todos los campos son opcionales para no afectar datos existentes
    - El campo `updated_at` se actualiza automáticamente
*/

-- Agregar nuevos campos a la tabla clients
DO $$ 
BEGIN
  -- Dirección de residencia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'residence_address'
  ) THEN
    ALTER TABLE clients ADD COLUMN residence_address text;
  END IF;

  -- Lugar de trabajo
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'workplace'
  ) THEN
    ALTER TABLE clients ADD COLUMN workplace text;
  END IF;

  -- Dirección del trabajo
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'workplace_address'
  ) THEN
    ALTER TABLE clients ADD COLUMN workplace_address text;
  END IF;

  -- Nombre de referencia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'reference_name'
  ) THEN
    ALTER TABLE clients ADD COLUMN reference_name text;
  END IF;

  -- Teléfono de referencia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'reference_phone'
  ) THEN
    ALTER TABLE clients ADD COLUMN reference_phone text;
  END IF;

  -- Relación con la referencia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'reference_relationship'
  ) THEN
    ALTER TABLE clients ADD COLUMN reference_relationship text;
  END IF;

  -- Salario mensual
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'monthly_salary'
  ) THEN
    ALTER TABLE clients ADD COLUMN monthly_salary numeric DEFAULT 0;
  END IF;

  -- Otros ingresos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'other_income'
  ) THEN
    ALTER TABLE clients ADD COLUMN other_income numeric DEFAULT 0;
  END IF;

  -- Fecha de última actualización
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE clients ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at en clients
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Crear índices para mejorar rendimiento en búsquedas
CREATE INDEX IF NOT EXISTS idx_clients_residence_address ON clients(residence_address);
CREATE INDEX IF NOT EXISTS idx_clients_workplace ON clients(workplace);
CREATE INDEX IF NOT EXISTS idx_clients_reference_name ON clients(reference_name);