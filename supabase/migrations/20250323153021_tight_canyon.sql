/*
  # Prevent task self-reference

  1. Changes
    - Add check constraint to prevent tasks from referencing themselves
    
  2. Security
    - Ensures data integrity by preventing circular references
    - Tasks cannot have their own ID as parent_id
*/

-- Add check constraint to prevent self-referencing tasks
ALTER TABLE tasks
ADD CONSTRAINT prevent_self_reference
CHECK (id != parent_id);

-- Validate existing data
DO $$
BEGIN
  -- Check if any tasks violate the constraint
  IF EXISTS (
    SELECT 1 FROM tasks 
    WHERE id = parent_id
  ) THEN
    RAISE EXCEPTION 'Found tasks that reference themselves. Please fix the data before adding the constraint.';
  END IF;
END $$;