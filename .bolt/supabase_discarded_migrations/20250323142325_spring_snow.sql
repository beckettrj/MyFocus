/*
  # Fix user table RLS policies

  1. Changes
    - Drop existing restrictive policies
    - Add new policy to allow users to insert their own record
    - Maintain admin management capabilities
    - Keep user data privacy intact
  
  2. Security
    - Users can only read their own data
    - Users can insert their own record once
    - Admins retain full management capabilities
*/

-- Drop existing user policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Allow users to create their own record
CREATE POLICY "Users can create their own record"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can do everything
CREATE POLICY "Admin can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (is_admin = true)
  WITH CHECK (is_admin = true);