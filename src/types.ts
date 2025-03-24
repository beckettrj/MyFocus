export interface Task {
  id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  is_daily: boolean;
  user_id: string;
  parent_id?: string;
  last_worked_on?: string;
  created_at?: string;
  subtasks: Task[];
}

export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  is_admin: boolean;
  created_at: string;
}