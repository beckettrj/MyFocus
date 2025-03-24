/*
  # Add separate counters for daily and weekly tasks

  1. Changes
    - Add `is_daily` column to completion_counter table
    - Update existing records to mark them as daily tasks
    - Add unique constraint for user_id + is_daily combination

  2. Security
    - Maintain existing RLS policies
*/

-- Add is_daily column
ALTER TABLE completion_counter 
ADD COLUMN is_daily boolean NOT NULL DEFAULT true;

-- Add unique constraint
ALTER TABLE completion_counter
ADD CONSTRAINT completion_counter_user_id_is_daily_key UNIQUE (user_id, is_daily);