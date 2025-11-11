/*
  # Mejorar Sistema de Auditoría Existente

  1. Mejoras
    - Agregar campo user_email para búsquedas
    - Agregar índices para consultas rápidas
    - Crear triggers automáticos para todas las tablas
    - Crear vista legible del historial

  2. Triggers
    - Captura automática de todos los cambios
    - Guarda valores antes y después
    - Lista campos que cambiaron
*/

-- Add missing columns
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_email text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS changed_fields text[];
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address text;

-- Update user_email for existing records
UPDATE audit_logs 
SET user_email = (SELECT email FROM auth.users WHERE id = audit_logs.user_id)
WHERE user_email IS NULL AND user_id IS NOT NULL;

-- Add indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);

-- Update RLS policy if needed
DROP POLICY IF EXISTS "Users can view audit logs from their organization" ON audit_logs;
CREATE POLICY "Users can view audit logs from their organization"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Function to log changes (improved)
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email text;
  v_organization_id uuid;
  v_record_name text;
  v_changed_fields text[];
  v_key text;
  v_old_value text;
  v_new_value text;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Get organization_id from the record
  IF TG_OP = 'DELETE' THEN
    v_organization_id := OLD.organization_id;
  ELSE
    v_organization_id := NEW.organization_id;
  END IF;

  -- Get record name based on table
  IF TG_TABLE_NAME = 'clients' THEN
    IF TG_OP = 'DELETE' THEN
      v_record_name := OLD.name;
    ELSE
      v_record_name := NEW.name;
    END IF;
  ELSIF TG_TABLE_NAME = 'loans' THEN
    IF TG_OP = 'DELETE' THEN
      v_record_name := 'Préstamo de $' || OLD.amount::text;
    ELSE
      v_record_name := 'Préstamo de $' || NEW.amount::text;
    END IF;
  ELSIF TG_TABLE_NAME = 'payments' THEN
    IF TG_OP = 'DELETE' THEN
      v_record_name := 'Pago de $' || OLD.amount::text;
    ELSE
      v_record_name := 'Pago de $' || NEW.amount::text;
    END IF;
  END IF;

  -- Calculate changed fields for UPDATE
  IF TG_OP = 'UPDATE' THEN
    v_changed_fields := ARRAY[]::text[];
    FOR v_key IN SELECT jsonb_object_keys(to_jsonb(NEW))
    LOOP
      -- Skip internal fields
      IF v_key NOT IN ('updated_at', 'last_modified', 'modified_by') THEN
        v_old_value := (to_jsonb(OLD) ->> v_key);
        v_new_value := (to_jsonb(NEW) ->> v_key);
        
        IF v_old_value IS DISTINCT FROM v_new_value THEN
          v_changed_fields := array_append(v_changed_fields, v_key);
        END IF;
      END IF;
    END LOOP;
    
    -- Only log if there are actual changes
    IF array_length(v_changed_fields, 1) IS NULL THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (
    organization_id,
    user_id,
    user_email,
    entity_type,
    entity_id,
    entity_name,
    action_type,
    old_values,
    new_values,
    changed_fields
  ) VALUES (
    v_organization_id,
    auth.uid(),
    COALESCE(v_user_email, 'Sistema'),
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    v_record_name,
    TG_OP,
    CASE
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD)
      ELSE NULL
    END,
    CASE
      WHEN TG_OP = 'DELETE' THEN NULL
      ELSE to_jsonb(NEW)
    END,
    v_changed_fields
  );

  -- Return appropriate value
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to clients
DROP TRIGGER IF EXISTS audit_clients_changes ON clients;
CREATE TRIGGER audit_clients_changes
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_changes();

-- Add audit triggers to loans
DROP TRIGGER IF EXISTS audit_loans_changes ON loans;
CREATE TRIGGER audit_loans_changes
  AFTER INSERT OR UPDATE OR DELETE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_changes();

-- Add audit triggers to payments
DROP TRIGGER IF EXISTS audit_payments_changes ON payments;
CREATE TRIGGER audit_payments_changes
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_changes();

-- Create readable view for audit history
CREATE OR REPLACE VIEW audit_history_readable AS
SELECT 
  al.id,
  al.created_at,
  al.user_email,
  al.entity_type,
  al.entity_id,
  al.entity_name,
  al.action_type,
  al.changed_fields,
  al.old_values,
  al.new_values,
  al.organization_id,
  CASE 
    WHEN al.entity_type = 'clients' THEN 'Cliente'
    WHEN al.entity_type = 'loans' THEN 'Préstamo'
    WHEN al.entity_type = 'payments' THEN 'Pago'
    ELSE al.entity_type
  END as tipo_registro,
  CASE 
    WHEN al.action_type = 'INSERT' THEN 'Creó'
    WHEN al.action_type = 'UPDATE' THEN 'Modificó'
    WHEN al.action_type = 'DELETE' THEN 'Eliminó'
    ELSE al.action_type
  END as accion
FROM audit_logs al
ORDER BY al.created_at DESC;

-- Grant permissions
GRANT SELECT ON audit_history_readable TO authenticated;

-- Set security invoker for view
ALTER VIEW audit_history_readable SET (security_invoker = on);

COMMENT ON TABLE audit_logs IS 'Registro completo de TODOS los cambios en el sistema para auditoría permanente';
COMMENT ON COLUMN audit_logs.old_values IS 'Valores completos antes del cambio (JSON)';
COMMENT ON COLUMN audit_logs.new_values IS 'Valores completos después del cambio (JSON)';
COMMENT ON COLUMN audit_logs.changed_fields IS 'Lista exacta de campos que cambiaron';
COMMENT ON COLUMN audit_logs.user_email IS 'Email del usuario que hizo el cambio (para búsquedas)';
