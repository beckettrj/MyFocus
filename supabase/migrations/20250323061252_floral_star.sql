/*
  # Create tasks and comments tables

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `title` (text)
      - `description` (text, nullable)
      - `is_completed` (boolean)
      - `is_daily` (boolean)
      - `user_id` (uuid)
      - `parent_id` (uuid, self-referential foreign key for subtasks)
      - `last_worked_on` (timestamp)
    
    - `comments`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `content` (text)
      - `task_id` (uuid, foreign key to tasks)
      - `user_id` (uuid)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own tasks and comments
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text,
  is_completed boolean DEFAULT false,
  is_daily boolean NOT NULL,
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES tasks(id),
  last_worked_on timestamptz
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  content text NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Users can manage their own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);

-- Create policies for comments
CREATE POLICY "Users can manage their own comments"
  ON comments
  FOR ALL
  TO authenticated
  USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);