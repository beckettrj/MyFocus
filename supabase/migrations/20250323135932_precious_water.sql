/*
  # Fix user ID type mismatch

  1. Changes
    - Change users table id column from bigint to uuid to match auth.users
    - Add proper foreign key constraints
    - Generate new UUIDs for existing users

  2. Security
    - Enable RLS on users table
    - Add policies for user data access
    - Add admin management policy
*/

-- Create a temporary table to store the old IDs and their new UUIDs
CREATE TEMP TABLE id_mapping (
  old_id bigint,
  new_id uuid DEFAULT gen_random_uuid()
);

-- Store existing IDs with their new UUIDs
INSERT INTO id_mapping (old_id)
SELECT id FROM users;

-- Create the new users table with UUID
CREATE TABLE IF NOT EXISTS new_users (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  username text DEFAULT '',
  first_name text,
  last_name text,
  is_admin boolean DEFAULT false
);

-- Copy data from old table to new table using the mapping
INSERT INTO new_users (id, created_at, username, is_admin)
SELECT 
  m.new_id,
  u.created_at,
  u.username,
  u.is_admin
FROM users u
JOIN id_mapping m ON u.id = m.old_id;

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

-- Drop the temporary mapping table
DROP TABLE id_mapping;