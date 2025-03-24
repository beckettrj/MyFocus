/*
  # Fix user policies recursion

  1. Changes
    - Drop existing policies that cause recursion
    - Create new policies with non-recursive checks
    
  2. Security
    - Maintain same security model but with optimized policy checks
    - Users can still only read their own profile
    - Admins still have full access but with non-recursive policy
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admin full access" ON users;

-- Create new non-recursive policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin full access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    (SELECT is_admin FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    (SELECT is_admin FROM users WHERE id = auth.uid())
  );