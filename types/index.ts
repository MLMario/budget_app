/**
 * App Domain Types
 *
 * Core TypeScript interfaces for the AI-Powered Budget App
 * These are the main types used throughout the application
 */

import type { Database } from './database.types'
import type { PaymentChannel, TransactionLocation } from './plaid.types'
import type {
  TrajectoryPrediction,
  Recommendation,
  ProjectedMonthlySpend,
} from './ai.types'

// Re-export commonly used types
export * from './database.types'
export * from './plaid.types'
export * from './ai.types'

// ============================================================================
// User & Auth
// ============================================================================

export interface User {
  id: string // UUID
  email: string
  created_at: string // ISO 8601 timestamp
  email_confirmed_at: string | null
}

export interface UserPreferences {
  id: string // UUID
  user_id: string
  preferences_text: string | null
  notification_email_weekly: boolean
  notification_email_monthly: boolean
  notification_budget_warning: boolean
  notification_budget_alert: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// Bank Connections
// ============================================================================

export type BankConnectionStatus = 'active' | 'needs_reauth' | 'error'
export type AccountType = 'checking' | 'savings' | 'credit_card'

export interface BankConnection {
  id: string // UUID
  user_id: string
  plaid_item_id: string
  institution_name: string
  account_type: AccountType
  connection_status: BankConnectionStatus
  last_sync_date: string | null // ISO 8601 timestamp
  created_at: string
  updated_at: string
  // Note: plaid_access_token is encrypted and not exposed in API responses
}

// ============================================================================
// Categories (Master Reference)
// ============================================================================

export interface Category {
  id: string // UUID
  name: string // Internal identifier (e.g., "dining_out")
  display_name: string // User-facing name (e.g., "Dining & Coffee")
  description: string | null // Category description
  icon: string | null // Icon name for UI
  display_order: number // Sort order in UI
  is_active: boolean // Soft-delete support
  created_at: string
  updated_at: string
}

// ============================================================================
// Transactions
// ============================================================================

export interface Transaction {
  id: string // UUID
  user_id: string
  bank_connection_id: string
  plaid_transaction_id: string
  merchant_name: string | null
  amount: number // Decimal(12,2) - positive = debit, negative = credit
  date: string // YYYY-MM-DD
  authorized_date: string | null
  pending: boolean
  payment_channel: PaymentChannel
  category_primary: string | null // From Plaid (for reference only)
  category_detailed: string | null // From Plaid (for reference only)
  app_category_id: string // FK to categories (auto-mapped from Plaid)
  user_category_override: string | null // DEPRECATED - use user_category_override_id
  user_category_override_id: string | null // FK to categories (user recategorization)
  tag_non_negotiable: boolean
  tag_ignored: boolean
  notes: string | null
  location: TransactionLocation | null
  iso_currency_code: string
  original_description: string | null
  created_at: string
  updated_at: string
}

// Derived transaction display type with category details
export interface TransactionWithCategory extends Transaction {
  category?: Category // Joined category details (from app_category_id or user_category_override_id)
  effective_category_id: string // user_category_override_id || app_category_id
  effective_category_name: string // Category display_name
}

// ============================================================================
// Budgets
// ============================================================================

export interface Budget {
  id: string // UUID
  user_id: string
  month: number // 1-12
  year: number
  created_at: string
  updated_at: string
}

export interface BudgetCategory {
  id: string // UUID
  budget_id: string
  category_id: string // FK to categories
  category_name?: string // DEPRECATED - use category_id FK and join to categories
  budgeted_amount: number // Decimal(10,2)
  created_at: string
  updated_at: string
}

// Derived budget category with category details and spending calculations
export type BudgetCategoryStatus = 'on_track' | 'warning' | 'alert' | 'over_budget'

export interface BudgetCategoryWithSpending extends BudgetCategory {
  category?: Category // Joined category details (from category_id FK)
  spent_amount: number // Calculated from transactions (NOT stored)
  percentage_used: number // (spent_amount / budgeted_amount) * 100
  status: BudgetCategoryStatus // Based on percentage_used: <80 = on_track, 80-100 = warning, >100 = alert
}

// Dashboard budget utilization summary
export interface BudgetUtilization {
  total_budget: number
  total_spent: number
  percentage_used: number
  categories: BudgetCategoryWithSpending[]
  days_remaining: number
  average_daily_budget_remaining: number
}

// ============================================================================
// Goals
// ============================================================================

export type GoalType = 'savings' | 'spending_limit' | 'debt_payoff'
export type GoalPriority = 'high' | 'medium' | 'low'
export type GoalStatus = 'active' | 'paused' | 'completed'

export interface Goal {
  id: string // UUID
  user_id: string
  name: string
  goal_type: GoalType
  target_amount: number // Decimal(12,2)
  target_date: string // YYYY-MM-DD
  priority: GoalPriority
  status: GoalStatus
  created_at: string
  updated_at: string
}

// Derived goal with progress calculation
export interface GoalWithProgress extends Goal {
  current_progress: number // Calculated based on goal_type
  progress_percentage: number // (current_progress / target_amount) * 100
}

// ============================================================================
// AI Analysis & Reports
// ============================================================================

export type ReportType = 'weekly' | 'monthly'
export type FeedbackType = 'helpful' | 'not_helpful' | 'dismissed'

export interface AIAnalysisReport {
  id: string // UUID
  user_id: string
  report_type: ReportType
  generation_date: string // ISO 8601 timestamp
  analysis_period_start: string // YYYY-MM-DD
  analysis_period_end: string // YYYY-MM-DD
  trajectory_prediction: TrajectoryPrediction | null // Only for weekly reports
  recommendations: Recommendation[]
  confidence_level: number // 0-100
  created_at: string
}

export interface RecommendationFeedback {
  id: string // UUID
  user_id: string
  ai_report_id: string
  recommendation_id: string // rec_1, rec_2, etc.
  feedback_type: FeedbackType
  created_at: string
}

// ============================================================================
// Dashboard
// ============================================================================

export type AlertType = 'budget_warning' | 'budget_alert' | 'bank_connection'
export type AlertSeverity = 'info' | 'warning' | 'error'

export interface Alert {
  type: AlertType
  message: string
  category?: string
  severity: AlertSeverity
}

export interface DashboardData {
  current_budget_utilization: BudgetUtilization
  projected_monthly_spend: ProjectedMonthlySpend
  recent_transactions: Transaction[]
  active_alerts: Alert[]
  recent_ai_recommendations: Recommendation[]
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// Transaction Management
export interface UpdateTransactionRequest {
  user_category_override_id?: string | null // FK to categories
  user_category_override?: string | null // DEPRECATED - use user_category_override_id
  tag_non_negotiable?: boolean
  tag_ignored?: boolean
  notes?: string | null
}

export interface BulkCategorizeRequest {
  transaction_ids: string[]
  category_id: string // FK to categories
}

export interface BulkCategorizeResponse {
  success_count: number
  failure_count: number
  failed_transactions: Array<{
    transaction_id: string
    error: string
  }>
}

// Budget Management
export interface CreateBudgetRequest {
  month: number
  year: number
  categories: Array<{
    category_id: string // FK to categories
    budgeted_amount: number
  }>
}

export interface UpdateBudgetCategoryRequest {
  budgeted_amount: number
}

export interface SuggestBudgetRequest {
  user_id: string
  month: number
  year: number
}

export type BudgetSuggestionSource = 'average' | 'last_month' | 'three_month_average'

export interface SuggestBudgetResponse {
  suggested_categories: Array<{
    category_id: string // FK to categories
    category_name: string // Display name for convenience
    suggested_amount: number
    based_on: BudgetSuggestionSource
  }>
}

// ============================================================================
// Predefined Categories & Constants
// ============================================================================

// UPDATED: Categories now managed in database, not hardcoded
// Fetch categories from 'categories' table instead
export const PREDEFINED_CATEGORIES = [
  'groceries',
  'dining_out',
  'transportation',
  'entertainment',
  'utilities',
  'healthcare',
  'shopping',
  'housing',
  'personal_care',
  'education',
  'travel',
  'other',
] as const

export type PredefinedCategory = (typeof PREDEFINED_CATEGORIES)[number]

// DEPRECATED: Plaid category mapping now handled by plaid_category_mappings table
// This is kept for backward compatibility only
export const PLAID_CATEGORY_MAPPING: Record<string, string> = {
  FOOD_AND_DRINK: 'Dining & Coffee',
  GENERAL_MERCHANDISE: 'Shopping',
  TRANSPORTATION: 'Transportation',
  ENTERTAINMENT: 'Entertainment',
  MEDICAL: 'Healthcare',
  GENERAL_SERVICES: 'Other',
  RENT_AND_UTILITIES: 'Utilities',
  HOME_IMPROVEMENT: 'Shopping',
  PERSONAL_CARE: 'Personal Care',
  LOAN_PAYMENTS: 'Other',
  BANK_FEES: 'Other',
  INCOME: 'Other',
  TRANSFER_IN: 'Other',
  TRANSFER_OUT: 'Other',
}

// ============================================================================
// Utility Types
// ============================================================================

export interface PaginationParams {
  limit: number
  cursor?: string // For cursor-based pagination (created_at timestamp)
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    next_cursor: string | null
    has_more: boolean
  }
}

export interface ApiError {
  error: string
  message: string
  details?: Record<string, unknown>
}

export interface ApiSuccess<T = unknown> {
  success: true
  data: T
}

// ============================================================================
// Database Helper Types
// ============================================================================

export type DbResult<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type DbInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type DbUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
