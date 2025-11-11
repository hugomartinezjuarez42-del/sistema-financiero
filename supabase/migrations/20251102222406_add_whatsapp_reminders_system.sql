/*
  # WhatsApp Reminders System

  1. New Tables
    - `whatsapp_reminders`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `reminder_date` (date) - date to send reminder
      - `message` (text) - custom message for reminder
      - `status` (text) - pending, sent, cancelled
      - `created_at` (timestamptz)
      - `created_by` (uuid, foreign key to auth.users)
      - `sent_at` (timestamptz, nullable)
      - `notes` (text, optional)

  2. Security
    - Enable RLS on `whatsapp_reminders` table
    - Add policies for authenticated users to manage reminders

  3. Important Notes
    - Reminders are scheduled for specific dates
    - System tracks when reminders are sent
    - Users can cancel pending reminders
    - Custom messages can be set for each reminder
*/

CREATE TABLE IF NOT EXISTS whatsapp_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  reminder_date date NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  sent_at timestamptz,
  notes text
);

ALTER TABLE whatsapp_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view whatsapp reminders"
  ON whatsapp_reminders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create whatsapp reminders"
  ON whatsapp_reminders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update whatsapp reminders"
  ON whatsapp_reminders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete whatsapp reminders"
  ON whatsapp_reminders FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_client_id ON whatsapp_reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_date ON whatsapp_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_status ON whatsapp_reminders(status);
