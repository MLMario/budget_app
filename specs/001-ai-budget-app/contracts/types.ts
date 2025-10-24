/**
 * TypeScript Data Contracts for AI-Powered Budget App
 *
 * This file defines all TypeScript interfaces and types for the application.
 * These contracts ensure type safety across the application and match the
 * database schema defined in data-model.md.
 *
 * Version: 1.0.0
 * Last Updated: 2025-10-23
 */

// ============================================================================
// User & Preferences
// ============================================================================

export interface User {
  id: string; // UUID
  email: string;
  created_at: string; // ISO 8601 timestamp
  email_confirmed_at: string | null;
}

export interface UserPreferences {
  id: string; // UUID
  user_id: string;
  preferences_text: string | null;
  notification_email_weekly: boolean;
  notification_email_monthly: boolean;
  notification_budget_warning: boolean;
  notification_budget_alert: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Bank Connections
// ============================================================================

export type BankConnectionStatus = 'active' | 'needs_reauth' | 'error';
export type AccountType = 'checking' | 'savings' | 'credit_card';

export interface BankConnection {
  id: string; // UUID
  user_id: string;
  plaid_item_id: string;
  institution_name: string;
  account_type: AccountType;
  connection_status: BankConnectionStatus;
  last_sync_date: string | null; // ISO 8601 timestamp
  created_at: string;
  updated_at: string;
  // Note: plaid_access_token is encrypted and not exposed in API responses
}

// ============================================================================
// Transactions (Plaid-sourced)
// ============================================================================

export type PaymentChannel = 'online' | 'in_store' | 'other';

export interface TransactionLocation {
  address: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
}

export interface PlaidTransaction {
  transaction_id: string; // Plaid's transaction ID
  account_id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  authorized_date: string | null;
  name: string;
  merchant_name: string | null;
  pending: boolean;
  payment_channel: PaymentChannel;
  category: string[] | null; // Plaid legacy categories
  personal_finance_category: {
    primary: string;
    detailed: string;
    confidence_level?: string;
  } | null;
  location: TransactionLocation;
  iso_currency_code: string | null;
  unofficial_currency_code: string | null;
  original_description: string | null;
}

export interface Transaction {
  id: string; // UUID
  user_id: string;
  bank_connection_id: string;
  plaid_transaction_id: string;
  merchant_name: string | null;
  amount: number; // Decimal(12,2) - positive = debit, negative = credit
  date: string; // YYYY-MM-DD
  authorized_date: string | null;
  pending: boolean;
  payment_channel: PaymentChannel;
  category_primary: string | null; // From Plaid personal_finance_category.primary
  category_detailed: string | null; // From Plaid personal_finance_category.detailed
  user_category_override: string | null; // User-assigned category
  tag_non_negotiable: boolean;
  tag_ignored: boolean;
  notes: string | null;
  location: TransactionLocation | null;
  iso_currency_code: string;
  original_description: string | null;
  created_at: string;
  updated_at: string;
}

// Derived transaction display type
export interface TransactionWithCategory extends Transaction {
  effective_category: string; // user_category_override || category_primary || 'Other'
}

// ============================================================================
// Budgets
// ============================================================================

export interface Budget {
  id: string; // UUID
  user_id: string;
  month: number; // 1-12
  year: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategory {
  id: string; // UUID
  budget_id: string;
  category_name: string;
  budgeted_amount: number; // Decimal(10,2)
  created_at: string;
  updated_at: string;
}

// Derived budget category with spending calculations
export interface BudgetCategoryWithSpending extends BudgetCategory {
  spent_amount: number; // Calculated from transactions
  percentage_used: number; // (spent_amount / budgeted_amount) * 100
  status: 'on_track' | 'warning' | 'alert' | 'over_budget'; // Based on percentage_used
}

// Dashboard budget utilization summary
export interface BudgetUtilization {
  total_budget: number;
  total_spent: number;
  percentage_used: number;
  categories: BudgetCategoryWithSpending[];
  days_remaining: number;
  average_daily_budget_remaining: number;
}

// ============================================================================
// Goals
// ============================================================================

export type GoalType = 'savings' | 'spending_limit' | 'debt_payoff';
export type GoalPriority = 'high' | 'medium' | 'low';
export type GoalStatus = 'active' | 'paused' | 'completed';

export interface Goal {
  id: string; // UUID
  user_id: string;
  name: string;
  goal_type: GoalType;
  target_amount: number; // Decimal(12,2)
  target_date: string; // YYYY-MM-DD
  priority: GoalPriority;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

// Derived goal with progress calculation
export interface GoalWithProgress extends Goal {
  current_progress: number; // Calculated based on goal_type
  progress_percentage: number; // (current_progress / target_amount) * 100
}

// ============================================================================
// AI Analysis & Recommendations
// ============================================================================

export type ReportType = 'weekly' | 'monthly';

export interface TrajectoryPrediction {
  projected_total: number;
  budget_total: number;
  difference: number; // positive = under budget, negative = over budget
  status: 'under_budget' | 'on_track' | 'over_budget';
  likelihood_percentage: number; // 0-100
}

export interface Recommendation {
  id: string; // rec_1, rec_2, etc.
  action: string; // Human-readable action description
  category: string; // Which budget category this affects
  expected_savings: number;
  implementation: string; // How to implement the recommendation
  effort_level: 'easy' | 'medium' | 'hard';
  preferences_respected: string[]; // List of user preferences acknowledged
  rank: number; // Priority ranking (1 = highest)
  affected_transaction_ids: string[]; // Transactions that led to this recommendation
}

export interface AIAnalysisReport {
  id: string; // UUID
  user_id: string;
  report_type: ReportType;
  generation_date: string; // ISO 8601 timestamp
  analysis_period_start: string; // YYYY-MM-DD
  analysis_period_end: string; // YYYY-MM-DD
  trajectory_prediction: TrajectoryPrediction | null; // Only for weekly reports
  recommendations: Recommendation[];
  confidence_level: number; // 0-100
  created_at: string;
}

// ============================================================================
// Recommendation Feedback
// ============================================================================

export type FeedbackType = 'helpful' | 'not_helpful' | 'dismissed';

export interface RecommendationFeedback {
  id: string; // UUID
  user_id: string;
  ai_report_id: string;
  recommendation_id: string; // rec_1, rec_2, etc.
  feedback_type: FeedbackType;
  created_at: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// ---- Plaid Integration ----

export interface PlaidLinkTokenRequest {
  user_id: string;
}

export interface PlaidLinkTokenResponse {
  link_token: string;
  expiration: string;
}

export interface PlaidExchangeTokenRequest {
  public_token: string;
  user_id: string;
}

export interface PlaidExchangeTokenResponse {
  bank_connection_id: string;
  institution_name: string;
  account_type: AccountType;
}

export interface PlaidWebhookPayload {
  webhook_type: string;
  webhook_code: string;
  item_id: string;
  new_transactions: number;
  removed_transactions: string[];
}

// ---- AI Analysis ----

export interface WeeklyAnalysisRequest {
  user_id: string;
  month: number;
  year: number;
  force_regenerate?: boolean; // Optional: regenerate even if report exists
}

export interface WeeklyAnalysisResponse {
  report_id: string;
  trajectory_prediction: TrajectoryPrediction;
  recommendations: Recommendation[];
  confidence_level: number;
  analysis_period: {
    start: string;
    end: string;
  };
}

export interface MonthlyReportRequest {
  user_id: string;
  month: number;
  year: number;
}

export interface MonthlyReportResponse {
  report_id: string;
  recommendations: Recommendation[];
  summary: {
    total_spent: number;
    total_budget: number;
    top_categories: Array<{
      category: string;
      spent: number;
      budgeted: number;
      is_non_negotiable: boolean;
    }>;
    anomalies: Array<{
      description: string;
      suggestion: string;
    }>;
  };
  analysis_period: {
    start: string;
    end: string;
  };
}

// ---- Transaction Management ----

export interface UpdateTransactionRequest {
  user_category_override?: string | null;
  tag_non_negotiable?: boolean;
  tag_ignored?: boolean;
  notes?: string | null;
}

export interface BulkCategorizeRequest {
  transaction_ids: string[];
  category: string;
}

export interface BulkCategorizeResponse {
  success_count: number;
  failure_count: number;
  failed_transactions: Array<{
    transaction_id: string;
    error: string;
  }>;
}

// ---- Budget Management ----

export interface CreateBudgetRequest {
  month: number;
  year: number;
  categories: Array<{
    category_name: string;
    budgeted_amount: number;
  }>;
}

export interface UpdateBudgetCategoryRequest {
  budgeted_amount: number;
}

export interface SuggestBudgetRequest {
  user_id: string;
  month: number;
  year: number;
}

export interface SuggestBudgetResponse {
  suggested_categories: Array<{
    category_name: string;
    suggested_amount: number;
    based_on: 'average' | 'last_month' | 'three_month_average';
  }>;
}

// ---- Dashboard ----

export interface ProjectedMonthlySpend {
  status: 'available' | 'insufficient_data';
  projected_total?: number;
  confidence_level?: number;
  days_of_data?: number;
  comparison_to_budget?: {
    difference: number; // positive = under, negative = over
    status: 'under' | 'on_track' | 'over';
  };
  message?: string; // "Building your spending baseline..." for insufficient data
}

export interface DashboardData {
  current_budget_utilization: BudgetUtilization;
  projected_monthly_spend: ProjectedMonthlySpend;
  recent_transactions: Transaction[];
  active_alerts: Array<{
    type: 'budget_warning' | 'budget_alert' | 'bank_connection';
    message: string;
    category?: string;
    severity: 'info' | 'warning' | 'error';
  }>;
  recent_ai_recommendations: Recommendation[];
}

// ============================================================================
// Validation Schemas (for runtime validation with Zod)
// ============================================================================

export const PREDEFINED_CATEGORIES = [
  'Groceries',
  'Dining Out',
  'Transportation',
  'Entertainment',
  'Utilities',
  'Healthcare',
  'Shopping',
  'Other'
] as const;

export type PredefinedCategory = typeof PREDEFINED_CATEGORIES[number];

// Map Plaid primary categories to app categories
export const PLAID_CATEGORY_MAPPING: Record<string, PredefinedCategory> = {
  'FOOD_AND_DRINK': 'Dining Out',
  'GENERAL_MERCHANDISE': 'Shopping',
  'TRANSPORTATION': 'Transportation',
  'ENTERTAINMENT': 'Entertainment',
  'MEDICAL': 'Healthcare',
  'GENERAL_SERVICES': 'Other',
  'RENT_AND_UTILITIES': 'Utilities',
  'HOME_IMPROVEMENT': 'Shopping',
  'PERSONAL_CARE': 'Shopping',
  'LOAN_PAYMENTS': 'Other',
  'BANK_FEES': 'Other',
  'INCOME': 'Other', // Income transactions
  'TRANSFER_IN': 'Other',
  'TRANSFER_OUT': 'Other'
};

// ============================================================================
// Utility Types
// ============================================================================

export interface PaginationParams {
  limit: number;
  cursor?: string; // For cursor-based pagination (created_at timestamp)
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    next_cursor: string | null;
    has_more: boolean;
  };
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Database Types (generated from Supabase)
// ============================================================================

/**
 * Note: In production, these types should be generated automatically
 * from the Supabase schema using:
 *
 * npx supabase gen types typescript --project-id <project-id> > types/database.types.ts
 *
 * This ensures the TypeScript types always match the actual database schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_preferences: {
        Row: UserPreferences;
        Insert: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserPreferences, 'id' | 'user_id'>>;
      };
      bank_connections: {
        Row: BankConnection;
        Insert: Omit<BankConnection, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BankConnection, 'id' | 'user_id'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Transaction, 'id' | 'user_id' | 'plaid_transaction_id'>>;
      };
      budgets: {
        Row: Budget;
        Insert: Omit<Budget, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Budget, 'id' | 'user_id' | 'month' | 'year'>>;
      };
      budget_categories: {
        Row: BudgetCategory;
        Insert: Omit<BudgetCategory, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BudgetCategory, 'id' | 'budget_id'>>;
      };
      goals: {
        Row: Goal;
        Insert: Omit<Goal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Goal, 'id' | 'user_id'>>;
      };
      ai_analysis_reports: {
        Row: AIAnalysisReport;
        Insert: Omit<AIAnalysisReport, 'id' | 'created_at'>;
        Update: Partial<Omit<AIAnalysisReport, 'id' | 'user_id'>>;
      };
      recommendation_feedback: {
        Row: RecommendationFeedback;
        Insert: Omit<RecommendationFeedback, 'id' | 'created_at'>;
        Update: Partial<Omit<RecommendationFeedback, 'id' | 'user_id'>>;
      };
    };
  };
}
