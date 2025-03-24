/*
  # Remove comments table

  1. Changes
    - Drop comments table as comments are stored in tasks
    - Remove foreign key constraints
  
  2. Security
    - No security changes needed as comments table is being removed
*/

-- Drop the comments table and its dependencies
DROP TABLE IF EXISTS comments;