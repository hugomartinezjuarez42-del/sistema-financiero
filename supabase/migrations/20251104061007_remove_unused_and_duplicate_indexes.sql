/*
  # Remove unused and duplicate indexes
  
  1. Changes
    - Remove unused audit_logs indexes
    - Remove duplicate audit_logs indexes (keep idx_audit_logs_user_id)
    - Remove unused organization_invitations index
  
  2. Reason
    - Unused indexes waste space and slow down writes
    - Duplicate indexes provide no benefit
*/

-- Remove unused audit_logs indexes
DROP INDEX IF EXISTS idx_audit_logs_organization;
DROP INDEX IF EXISTS idx_audit_logs_entity_type;
DROP INDEX IF EXISTS idx_audit_logs_action_type;

-- Remove duplicate index (keep idx_audit_logs_user_id, drop idx_audit_logs_user)
DROP INDEX IF EXISTS idx_audit_logs_user;

-- Remove unused organization_invitations index
DROP INDEX IF EXISTS idx_organization_invitations_invited_by;
