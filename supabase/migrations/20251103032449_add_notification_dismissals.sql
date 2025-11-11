/*
  # Add Notification Dismissals System

  1. New Tables
    - `notification_dismissals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `client_id` (uuid, references clients)
      - `dismissed_at` (timestamptz)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `notification_dismissals` table
    - Add policy for authenticated users to manage their own dismissals
  
  3. Purpose
    - Allow users to dismiss notification alerts
    - Track which notifications have been acknowledged
    - Prevent dismissed notifications from reappearing
*/

CREATE TABLE IF NOT EXISTS notification_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  dismissed_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, client_id)
);

ALTER TABLE notification_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dismissals"
  ON notification_dismissals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dismissals"
  ON notification_dismissals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dismissals"
  ON notification_dismissals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notification_dismissals_user_client 
  ON notification_dismissals(user_id, client_id);