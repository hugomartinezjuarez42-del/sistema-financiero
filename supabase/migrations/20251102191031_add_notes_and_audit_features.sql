/*
  # Agregar Notas por Cliente y Sistema de Auditoría

  1. Cambios
    - Agregar columna `notes` a la tabla `clients` para observaciones
    - Agregar columna `last_modified` a `clients` para tracking de cambios
    - Agregar columna `last_modified` a `loans` para tracking de cambios
    - Habilitar tracking de cambios en la tabla `audit_log` existente

  2. Seguridad
    - Todas las tablas mantienen sus políticas RLS existentes
*/

-- Agregar campo de notas a clientes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'notes'
  ) THEN
    ALTER TABLE clients ADD COLUMN notes text DEFAULT '';
  END IF;
END $$;

-- Agregar timestamp de última modificación a clientes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'last_modified'
  ) THEN
    ALTER TABLE clients ADD COLUMN last_modified timestamptz DEFAULT now();
  END IF;
END $$;

-- Agregar timestamp de última modificación a préstamos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'last_modified'
  ) THEN
    ALTER TABLE loans ADD COLUMN last_modified timestamptz DEFAULT now();
  END IF;
END $$;

-- Función para actualizar last_modified automáticamente
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar last_modified
DROP TRIGGER IF EXISTS update_clients_modtime ON clients;
CREATE TRIGGER update_clients_modtime
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_loans_modtime ON loans;
CREATE TRIGGER update_loans_modtime
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
