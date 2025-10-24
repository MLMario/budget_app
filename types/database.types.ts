/**
 * Supabase Database Types
 *
 * These types are generated from the database schema.
 * In production, regenerate with: npx supabase gen types typescript
 */

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
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferences_text: string | null
          notification_email_weekly: boolean
          notification_email_monthly: boolean
          notification_budget_warning: boolean
          notification_budget_alert: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferences_text?: string | null
          notification_email_weekly?: boolean
          notification_email_monthly?: boolean
          notification_budget_warning?: boolean
          notification_budget_alert?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferences_text?: string | null
          notification_email_weekly?: boolean
          notification_email_monthly?: boolean
          notification_budget_warning?: boolean
          notification_budget_alert?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bank_connections: {
        Row: {
          id: string
          user_id: string
          plaid_access_token: string
          plaid_item_id: string
          institution_name: string
          account_type: string
          connection_status: string
          last_sync_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plaid_access_token: string
          plaid_item_id: string
          institution_name: string
          account_type: string
          connection_status: string
          last_sync_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plaid_access_token?: string
          plaid_item_id?: string
          institution_name?: string
          account_type?: string
          connection_status?: string
          last_sync_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          bank_connection_id: string
          plaid_transaction_id: string
          merchant_name: string | null
          amount: number
          date: string
          authorized_date: string | null
          pending: boolean
          payment_channel: string
          category_primary: string | null
          category_detailed: string | null
          user_category_override: string | null
          tag_non_negotiable: boolean
          tag_ignored: boolean
          notes: string | null
          location: Json | null
          iso_currency_code: string
          original_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bank_connection_id: string
          plaid_transaction_id: string
          merchant_name?: string | null
          amount: number
          date: string
          authorized_date?: string | null
          pending?: boolean
          payment_channel: string
          category_primary?: string | null
          category_detailed?: string | null
          user_category_override?: string | null
          tag_non_negotiable?: boolean
          tag_ignored?: boolean
          notes?: string | null
          location?: Json | null
          iso_currency_code?: string
          original_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bank_connection_id?: string
          plaid_transaction_id?: string
          merchant_name?: string | null
          amount?: number
          date?: string
          authorized_date?: string | null
          pending?: boolean
          payment_channel?: string
          category_primary?: string | null
          category_detailed?: string | null
          user_category_override?: string | null
          tag_non_negotiable?: boolean
          tag_ignored?: boolean
          notes?: string | null
          location?: Json | null
          iso_currency_code?: string
          original_description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          month: number
          year: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: number
          year: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: number
          year?: number
          created_at?: string
          updated_at?: string
        }
      }
      budget_categories: {
        Row: {
          id: string
          budget_id: string
          category_name: string
          budgeted_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          budget_id: string
          category_name: string
          budgeted_amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          budget_id?: string
          category_name?: string
          budgeted_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          name: string
          goal_type: string
          target_amount: number
          target_date: string
          priority: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          goal_type: string
          target_amount: number
          target_date: string
          priority?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          goal_type?: string
          target_amount?: number
          target_date?: string
          priority?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      ai_analysis_reports: {
        Row: {
          id: string
          user_id: string
          report_type: string
          generation_date: string
          analysis_period_start: string
          analysis_period_end: string
          trajectory_prediction: Json | null
          recommendations: Json
          confidence_level: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          report_type: string
          generation_date?: string
          analysis_period_start: string
          analysis_period_end: string
          trajectory_prediction?: Json | null
          recommendations: Json
          confidence_level?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          report_type?: string
          generation_date?: string
          analysis_period_start?: string
          analysis_period_end?: string
          trajectory_prediction?: Json | null
          recommendations?: Json
          confidence_level?: number | null
          created_at?: string
        }
      }
      recommendation_feedback: {
        Row: {
          id: string
          user_id: string
          ai_report_id: string
          recommendation_id: string
          feedback_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ai_report_id: string
          recommendation_id: string
          feedback_type: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ai_report_id?: string
          recommendation_id?: string
          feedback_type?: string
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          table_name: string
          operation: string
          old_data: Json | null
          new_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          table_name: string
          operation: string
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          table_name?: string
          operation?: string
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_budget_utilization: {
        Args: {
          p_user_id: string
          p_month: number
          p_year: number
        }
        Returns: {
          category_name: string
          budgeted_amount: number
          spent_amount: number
          percentage_used: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
