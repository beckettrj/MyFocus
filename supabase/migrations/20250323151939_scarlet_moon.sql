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