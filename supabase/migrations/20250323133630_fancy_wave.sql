/*
  # Add completion counter table

  1. New Tables
    - `completion_counter`
      - `id` (uuid, primary key)
      - `total_completed` (bigint, default 0)
      - `user_id` (uuid)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policy for authenticated users to manage their own counter
*/

CREATE TABLE IF NOT EXISTS completion_counter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_completed bigint DEFAULT 0,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE completion_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own counter"
  ON completion_counter
  FOR ALL
  TO authenticated
  USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);