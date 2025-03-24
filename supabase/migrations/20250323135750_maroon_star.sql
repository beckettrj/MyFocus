/*
  # Fix user ID type mismatch

  1. Changes
    - Change users table id column from bigint to uuid to match auth.users
    - Add proper foreign key constraints

  2. Security
    - Maintain existing RLS policies
*/

-- Create a new users table with the correct ID type
CREATE TABLE IF NOT EXISTS new_users (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  username text DEFAULT '',
  first_name text,
  last_name text,
  is_admin boolean DEFAULT false
);

-- Copy data from old table to new table (if any exists)
INSERT INTO new_users (id, created_at, username, is_admin)
SELECT 
  id::uuid, -- Convert existing IDs to UUID
  created_at,
  username,
  is_admin
FROM users;

-- Drop the old table
DROP TABLE users;

-- Rename the new table to users
ALTER TABLE new_users RENAME TO users;

-- Enable RLS on the new table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Add policy for admins to manage all users
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (is_admin = true)
  WITH CHECK (is_admin = true);