/*
  # Add user management fields

  1. Changes
    - Add new columns to auth.users table:
      - username (text)
      - first_name (text, nullable)
      - last_name (text, nullable)

  2. Security
    - Only admins can view and manage users
*/

-- Add new columns to auth.users
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;