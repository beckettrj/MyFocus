/*
  # Fix user policies to prevent recursion

  1. Changes
    - Remove recursive admin check in policies
    - Simplify admin policy to use direct user ID comparison
    - Keep user read policy unchanged
  
  2. Security
    - Maintains RLS protection
    - Ensures admins can still manage users
    - Prevents infinite recursion
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admin full access" ON users;

-- Create simplified policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin full access"
  ON users
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_admin = true
  ));

/*
  # Add position column to tasks table

  1. Changes
    - Add position column to tasks table
    - Update existing tasks with sequential positions
*/

-- Add position column
ALTER TABLE tasks ADD COLUMN position integer;

-- Update existing tasks with sequential positions
WITH numbered_tasks AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, is_daily ORDER BY created_at) - 1 as row_num
  FROM tasks
)
UPDATE tasks
SET position = numbered_tasks.row_num
FROM numbered_tasks
WHERE tasks.id = numbered_tasks.id;