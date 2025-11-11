/*
  # Fix audit_logs check constraints
  
  1. Changes
    - Update action_type constraint to accept INSERT, UPDATE, DELETE
    - Update entity_type constraint to accept clients, loans, payments
  
  2. Reason
    - Trigger function uses PostgreSQL's TG_OP which returns uppercase
    - Trigger function uses TG_TABLE_NAME which returns plural form
*/

-- Drop old constraints
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_type_check;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_entity_type_check;

-- Add new constraints with correct values
ALTER TABLE audit_logs 
  ADD CONSTRAINT audit_logs_action_type_check 
  CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE'));

ALTER TABLE audit_logs 
  ADD CONSTRAINT audit_logs_entity_type_check 
  CHECK (entity_type IN ('clients', 'loans', 'payments'));
