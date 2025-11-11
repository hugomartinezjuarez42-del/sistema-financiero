-- Payment Plans and Negotiation System
-- Creates tables for custom payment plans and scheduled payments

CREATE TABLE IF NOT EXISTS payment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid REFERENCES loans(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('custom', 'reduced_interest', 'grace_period', 'restructure')),
  original_amount numeric NOT NULL DEFAULT 0,
  negotiated_amount numeric NOT NULL DEFAULT 0,
  new_interest_rate numeric,
  installments integer NOT NULL DEFAULT 1,
  installment_amount numeric NOT NULL DEFAULT 0,
  frequency_days integer NOT NULL DEFAULT 15,
  grace_period_days integer NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plan_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES payment_plans(id) ON DELETE CASCADE NOT NULL,
  installment_number integer NOT NULL,
  due_date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  paid_date date,
  paid_amount numeric NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment plans"
  ON payment_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payment plans"
  ON payment_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment plans"
  ON payment_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment plans"
  ON payment_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view plan payments"
  ON plan_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment_plans
      WHERE payment_plans.id = plan_payments.plan_id
      AND payment_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create plan payments"
  ON plan_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM payment_plans
      WHERE payment_plans.id = plan_payments.plan_id
      AND payment_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update plan payments"
  ON plan_payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment_plans
      WHERE payment_plans.id = plan_payments.plan_id
      AND payment_plans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM payment_plans
      WHERE payment_plans.id = plan_payments.plan_id
      AND payment_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete plan payments"
  ON plan_payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment_plans
      WHERE payment_plans.id = plan_payments.plan_id
      AND payment_plans.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_payment_plans_client ON payment_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_loan ON payment_plans(loan_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_user ON payment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_payments_plan ON plan_payments(plan_id);
