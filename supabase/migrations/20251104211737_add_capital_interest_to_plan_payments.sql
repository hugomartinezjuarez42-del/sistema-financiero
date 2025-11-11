/*
  # Add Capital and Interest Breakdown to Plan Payments

  ## Changes
  1. Add capital_amount column to plan_payments
  2. Add interest_amount column to plan_payments
  3. These columns will break down each payment into principal and interest components

  ## Notes
  - amount = capital_amount + interest_amount
  - This allows tracking exactly how much goes to principal vs interest in each payment
  - Useful for amortization schedules and payment tracking
*/

-- Add capital_amount and interest_amount columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_payments' AND column_name = 'capital_amount'
  ) THEN
    ALTER TABLE plan_payments ADD COLUMN capital_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_payments' AND column_name = 'interest_amount'
  ) THEN
    ALTER TABLE plan_payments ADD COLUMN interest_amount numeric DEFAULT 0;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN plan_payments.capital_amount IS 'Amount that goes to principal/capital in this payment';
COMMENT ON COLUMN plan_payments.interest_amount IS 'Amount that goes to interest in this payment';
