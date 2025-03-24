/*
  # Update RLS policies for tasks and users

  1. Changes
    - Remove existing task policies
    - Add new task policies for authenticated users to:
      - Read their own tasks
      - Create new tasks
      - Update their own tasks
      - Delete their own tasks
    - Update user policies to:
      - Allow only admin (Rod) to manage users
      - Allow users to read their own data

  2. Security
    - Tasks: Users can only manage their own tasks
    - Users: Only admin can manage all users
*/

-- First, drop existing policies
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;

-- Tasks policies
CREATE POLICY "Users can read own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop existing user policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (auth.uid() = (SELECT id FROM users WHERE email = 'rod@example.com' AND is_admin = true))
  WITH CHECK (auth.uid() = (SELECT id FROM users WHERE email = 'rod@example.com' AND is_admin = true));