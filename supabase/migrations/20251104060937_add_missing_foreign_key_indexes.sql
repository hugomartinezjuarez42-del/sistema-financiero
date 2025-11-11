/*
  # Add missing foreign key indexes for performance
  
  1. Changes
    - Add indexes for all foreign keys that are missing them
    - Improves query performance for joins and lookups
  
  2. Performance
    - Foreign keys without indexes cause table scans
    - These indexes speed up JOIN operations significantly
*/

-- client_documents indexes
CREATE INDEX IF NOT EXISTS idx_client_documents_organization_id ON client_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_uploaded_by ON client_documents(uploaded_by);

-- clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_modified_by ON clients(modified_by);
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON clients(organization_id);

-- collateral_documents indexes
CREATE INDEX IF NOT EXISTS idx_collateral_documents_organization_id ON collateral_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_collateral_documents_uploaded_by ON collateral_documents(uploaded_by);

-- collection_tracking indexes
CREATE INDEX IF NOT EXISTS idx_collection_tracking_collected_by ON collection_tracking(collected_by);
CREATE INDEX IF NOT EXISTS idx_collection_tracking_organization_id ON collection_tracking(organization_id);

-- digital_signatures indexes
CREATE INDEX IF NOT EXISTS idx_digital_signatures_client_id ON digital_signatures(client_id);
CREATE INDEX IF NOT EXISTS idx_digital_signatures_organization_id ON digital_signatures(organization_id);

-- loans indexes
CREATE INDEX IF NOT EXISTS idx_loans_modified_by ON loans(modified_by);
CREATE INDEX IF NOT EXISTS idx_loans_organization_id ON loans(organization_id);

-- manager_signatures indexes
CREATE INDEX IF NOT EXISTS idx_manager_signatures_user_id ON manager_signatures(user_id);

-- notification_dismissals indexes
CREATE INDEX IF NOT EXISTS idx_notification_dismissals_client_id ON notification_dismissals(client_id);
CREATE INDEX IF NOT EXISTS idx_notification_dismissals_organization_id ON notification_dismissals(organization_id);

-- organization_members indexes
CREATE INDEX IF NOT EXISTS idx_organization_members_invited_by ON organization_members(invited_by);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);

-- organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);

-- payment_plans indexes
CREATE INDEX IF NOT EXISTS idx_payment_plans_client_id ON payment_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_loan_id ON payment_plans(loan_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_organization_id ON payment_plans(organization_id);

-- payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_modified_by ON payments(modified_by);
CREATE INDEX IF NOT EXISTS idx_payments_organization_id ON payments(organization_id);

-- plan_payments indexes
CREATE INDEX IF NOT EXISTS idx_plan_payments_organization_id ON plan_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_plan_payments_plan_id ON plan_payments(plan_id);

-- user_profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_by ON user_profiles(created_by);

-- whatsapp_reminders indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_created_by ON whatsapp_reminders(created_by);
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_organization_id ON whatsapp_reminders(organization_id);
