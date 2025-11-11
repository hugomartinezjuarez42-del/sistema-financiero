/*
  # Remove Unused Indexes

  This migration removes all unused indexes that are not being utilized by queries.
  Keeping unused indexes wastes storage space and slows down write operations.

  ## Indexes Being Removed:
  
  ### Payments Table
  - idx_payments_date
  - idx_payments_organization_id
  
  ### User Profiles Table
  - idx_user_profiles_role
  - idx_user_profiles_created_by
  - idx_user_profiles_is_active
  
  ### User Permissions Table
  - idx_user_permissions_user_id
  
  ### Notification Dismissals Table
  - idx_notification_dismissals_client_id_fk
  - idx_notification_dismissals_organization_id_fk
  
  ### Digital Signatures Table
  - idx_digital_signatures_client_id
  - idx_digital_signatures_organization_id
  - idx_digital_signatures_signed_at
  
  ### Audit Logs Table
  - idx_audit_logs_created_at
  - idx_audit_logs_entity
  - idx_audit_logs_organization_id_fk
  
  ### Client Documents Table
  - idx_client_documents_type
  - idx_client_documents_uploaded_at
  - idx_client_documents_uploaded_by
  - idx_client_documents_organization_id_fk
  
  ### Payment Plans Table
  - idx_payment_plans_client
  - idx_payment_plans_loan
  - idx_payment_plans_organization_id_fk
  
  ### Plan Payments Table
  - idx_plan_payments_plan
  - idx_plan_payments_organization_id_fk
  
  ### WhatsApp Reminders Table
  - idx_whatsapp_reminders_date
  - idx_whatsapp_reminders_status
  - idx_whatsapp_reminders_created_by
  - idx_whatsapp_reminders_organization_id_fk
  
  ### Manager Signatures Table
  - idx_manager_signatures_is_active
  - idx_manager_signatures_user_id_fk
  
  ### Loans Table
  - idx_loans_status
  - idx_loans_due_date
  - idx_loans_organization_id
  
  ### Collateral Documents Table
  - idx_collateral_documents_uploaded_by
  - idx_collateral_documents_organization_id_fk
  
  ### Clients Table
  - idx_clients_organization_id
  - idx_clients_residence_address
  - idx_clients_workplace
  - idx_clients_reference_name
  
  ### Collection Tracking Table
  - idx_collection_tracking_client
  - idx_collection_tracking_organization
  - idx_collection_tracking_date
  - idx_collection_tracking_status
  - idx_collection_tracking_client_date
  - idx_collection_tracking_collected_by_fk
  
  ### Organization Members Table
  - idx_organization_members_user_id
  - idx_organization_members_org_id
  - idx_organization_members_invited_by_fk
  
  ### Organizations Table
  - idx_organizations_created_by_fk
*/

-- Payments table indexes
DROP INDEX IF EXISTS idx_payments_date;
DROP INDEX IF EXISTS idx_payments_organization_id;

-- User profiles table indexes
DROP INDEX IF EXISTS idx_user_profiles_role;
DROP INDEX IF EXISTS idx_user_profiles_created_by;
DROP INDEX IF EXISTS idx_user_profiles_is_active;

-- User permissions table indexes
DROP INDEX IF EXISTS idx_user_permissions_user_id;

-- Notification dismissals table indexes
DROP INDEX IF EXISTS idx_notification_dismissals_client_id_fk;
DROP INDEX IF EXISTS idx_notification_dismissals_organization_id_fk;

-- Digital signatures table indexes
DROP INDEX IF EXISTS idx_digital_signatures_client_id;
DROP INDEX IF EXISTS idx_digital_signatures_organization_id;
DROP INDEX IF EXISTS idx_digital_signatures_signed_at;

-- Audit logs table indexes
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS idx_audit_logs_entity;
DROP INDEX IF EXISTS idx_audit_logs_organization_id_fk;

-- Client documents table indexes
DROP INDEX IF EXISTS idx_client_documents_type;
DROP INDEX IF EXISTS idx_client_documents_uploaded_at;
DROP INDEX IF EXISTS idx_client_documents_uploaded_by;
DROP INDEX IF EXISTS idx_client_documents_organization_id_fk;

-- Payment plans table indexes
DROP INDEX IF EXISTS idx_payment_plans_client;
DROP INDEX IF EXISTS idx_payment_plans_loan;
DROP INDEX IF EXISTS idx_payment_plans_organization_id_fk;

-- Plan payments table indexes
DROP INDEX IF EXISTS idx_plan_payments_plan;
DROP INDEX IF EXISTS idx_plan_payments_organization_id_fk;

-- WhatsApp reminders table indexes
DROP INDEX IF EXISTS idx_whatsapp_reminders_date;
DROP INDEX IF EXISTS idx_whatsapp_reminders_status;
DROP INDEX IF EXISTS idx_whatsapp_reminders_created_by;
DROP INDEX IF EXISTS idx_whatsapp_reminders_organization_id_fk;

-- Manager signatures table indexes
DROP INDEX IF EXISTS idx_manager_signatures_is_active;
DROP INDEX IF EXISTS idx_manager_signatures_user_id_fk;

-- Loans table indexes
DROP INDEX IF EXISTS idx_loans_status;
DROP INDEX IF EXISTS idx_loans_due_date;
DROP INDEX IF EXISTS idx_loans_organization_id;

-- Collateral documents table indexes
DROP INDEX IF EXISTS idx_collateral_documents_uploaded_by;
DROP INDEX IF EXISTS idx_collateral_documents_organization_id_fk;

-- Clients table indexes
DROP INDEX IF EXISTS idx_clients_organization_id;
DROP INDEX IF EXISTS idx_clients_residence_address;
DROP INDEX IF EXISTS idx_clients_workplace;
DROP INDEX IF EXISTS idx_clients_reference_name;

-- Collection tracking table indexes
DROP INDEX IF EXISTS idx_collection_tracking_client;
DROP INDEX IF EXISTS idx_collection_tracking_organization;
DROP INDEX IF EXISTS idx_collection_tracking_date;
DROP INDEX IF EXISTS idx_collection_tracking_status;
DROP INDEX IF EXISTS idx_collection_tracking_client_date;
DROP INDEX IF EXISTS idx_collection_tracking_collected_by_fk;

-- Organization members table indexes
DROP INDEX IF EXISTS idx_organization_members_user_id;
DROP INDEX IF EXISTS idx_organization_members_org_id;
DROP INDEX IF EXISTS idx_organization_members_invited_by_fk;

-- Organizations table indexes
DROP INDEX IF EXISTS idx_organizations_created_by_fk;
