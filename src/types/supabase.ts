export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          is_completed: boolean
          is_daily: boolean
          user_id: string
          parent_id: string | null
          last_worked_on: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string | null
          is_completed?: boolean
          is_daily: boolean
          user_id: string
          parent_id?: string | null
          last_worked_on?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          is_completed?: boolean
          is_daily?: boolean
          user_id?: string
          parent_id?: string | null
          last_worked_on?: string | null
        }
      }
    }
  }
}