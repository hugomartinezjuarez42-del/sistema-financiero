/*
  # Agregar Índices Faltantes en Foreign Keys

  Mejora el rendimiento de consultas agregando índices en todas las
  foreign keys que no tienen índices.
*/

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id_fk ON audit_logs(organization_id);

-- client_documents
CREATE INDEX IF NOT EXISTS idx_client_documents_organization_id_fk ON client_documents(organization_id);

-- collateral_documents
CREATE INDEX IF NOT EXISTS idx_collateral_documents_organization_id_fk ON collateral_documents(organization_id);

-- collection_tracking
CREATE INDEX IF NOT EXISTS idx_collection_tracking_collected_by_fk ON collection_tracking(collected_by);

-- manager_signatures
CREATE INDEX IF NOT EXISTS idx_manager_signatures_user_id_fk ON manager_signatures(user_id);

-- notification_dismissals
CREATE INDEX IF NOT EXISTS idx_notification_dismissals_client_id_fk ON notification_dismissals(client_id);
CREATE INDEX IF NOT EXISTS idx_notification_dismissals_organization_id_fk ON notification_dismissals(organization_id);

-- organization_members
CREATE INDEX IF NOT EXISTS idx_organization_members_invited_by_fk ON organization_members(invited_by);

-- organizations
CREATE INDEX IF NOT EXISTS idx_organizations_created_by_fk ON organizations(created_by);

-- payment_plans
CREATE INDEX IF NOT EXISTS idx_payment_plans_organization_id_fk ON payment_plans(organization_id);

-- plan_payments
CREATE INDEX IF NOT EXISTS idx_plan_payments_organization_id_fk ON plan_payments(organization_id);

-- whatsapp_reminders
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_organization_id_fk ON whatsapp_reminders(organization_id);