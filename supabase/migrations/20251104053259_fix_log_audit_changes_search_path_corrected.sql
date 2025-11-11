/*
  # Fix log_audit_changes search_path correctly
  
  1. Changes
    - Update search_path to include both public and auth schemas
    - Maintain error handling
  
  2. Security
    - SECURITY DEFINER maintained
    - Proper exception handling
*/

-- Drop and recreate with correct search_path
DROP FUNCTION IF EXISTS log_audit_changes() CASCADE;

CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  v_user_email text;
  v_organization_id uuid;
  v_record_name text;
  v_changed_fields text[];
  v_key text;
  v_old_value text;
  v_new_value text;
BEGIN
  -- Get user email safely - use a separate query with error handling
  BEGIN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_user_email := 'Sistema';
  END;

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

  -- Insert audit log with error handling
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the main operation
    RAISE WARNING 'Failed to insert audit log: %', SQLERRM;
  END;

  -- Return appropriate value
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Recreate triggers that use this function
DROP TRIGGER IF EXISTS audit_clients_changes ON clients;
CREATE TRIGGER audit_clients_changes
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

DROP TRIGGER IF EXISTS audit_loans_changes ON loans;
CREATE TRIGGER audit_loans_changes
  AFTER INSERT OR UPDATE OR DELETE ON loans
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

DROP TRIGGER IF EXISTS audit_payments_changes ON payments;
CREATE TRIGGER audit_payments_changes
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
