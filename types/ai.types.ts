/**
 * AI Analysis Types
 *
 * TypeScript interfaces for Claude AI integration and analysis reports
 * Based on contracts/types.ts
 */

export type ReportType = 'weekly' | 'monthly'
export type EffortLevel = 'easy' | 'medium' | 'hard'
export type TrajectoryStatus = 'under_budget' | 'on_track' | 'over_budget'

/**
 * Trajectory prediction for end-of-month spending
 */
export interface TrajectoryPrediction {
  projected_total: number
  budget_total: number
  difference: number // positive = under budget, negative = over budget
  status: TrajectoryStatus
  likelihood_percentage: number // 0-100
}

/**
 * AI-generated recommendation for budget optimization
 */
export interface Recommendation {
  id: string // rec_1, rec_2, etc.
  action: string // Human-readable action description
  category: string // Which budget category this affects
  expected_savings: number
  implementation: string // How to implement the recommendation
  effort_level: EffortLevel
  preferences_respected: string[] // List of user preferences acknowledged
  rank: number // Priority ranking (1 = highest)
  affected_transaction_ids: string[] // Transactions that led to this recommendation
}

/**
 * Request to generate weekly AI analysis
 */
export interface WeeklyAnalysisRequest {
  user_id: string
  month: number
  year: number
  force_regenerate?: boolean // Optional: regenerate even if report exists
}

/**
 * Response with weekly AI analysis
 */
export interface WeeklyAnalysisResponse {
  report_id: string
  trajectory_prediction: TrajectoryPrediction
  recommendations: Recommendation[]
  confidence_level: number // 0-100
  analysis_period: {
    start: string // YYYY-MM-DD
    end: string // YYYY-MM-DD
  }
}

/**
 * Request to generate monthly AI report
 */
export interface MonthlyReportRequest {
  user_id: string
  month: number
  year: number
}

/**
 * Monthly spending summary by category
 */
export interface CategorySummary {
  category: string
  spent: number
  budgeted: number
  is_non_negotiable: boolean
}

/**
 * Spending anomaly detected by AI
 */
export interface SpendingAnomaly {
  description: string
  suggestion: string
}

/**
 * Response with monthly AI report
 */
export interface MonthlyReportResponse {
  report_id: string
  recommendations: Recommendation[]
  summary: {
    total_spent: number
    total_budget: number
    top_categories: CategorySummary[]
    anomalies: SpendingAnomaly[]
  }
  analysis_period: {
    start: string // YYYY-MM-DD
    end: string // YYYY-MM-DD
  }
}

/**
 * Claude AI prompt context for analysis
 */
export interface AIAnalysisContext {
  user_id: string
  preferences_text: string | null
  transactions: Array<{
    id: string
    merchant_name: string | null
    amount: number
    date: string
    category: string
    tag_non_negotiable: boolean
    tag_ignored: boolean
  }>
  budget_categories: Array<{
    category_name: string
    budgeted_amount: number
    spent_amount: number
    percentage_used: number
  }>
  goals: Array<{
    name: string
    goal_type: string
    target_amount: number
    target_date: string
    status: string
  }>
  current_month: number
  current_year: number
  days_of_data: number
}

/**
 * Claude AI response structure
 */
export interface ClaudeAnalysisResponse {
  trajectory_prediction?: TrajectoryPrediction
  recommendations: Recommendation[]
  confidence_level: number
  summary?: {
    total_spent: number
    total_budget: number
    top_categories: CategorySummary[]
    anomalies: SpendingAnomaly[]
  }
}

/**
 * Feedback types for recommendations
 */
export type FeedbackType = 'helpful' | 'not_helpful' | 'dismissed'

/**
 * Feedback on a specific recommendation
 */
export interface RecommendationFeedback {
  recommendation_id: string
  feedback_type: FeedbackType
  timestamp: string
}

/**
 * Aggregated feedback patterns for AI learning
 */
export interface FeedbackPattern {
  recommendation_type: string // e.g., "reduce_coffee", "skip_dining"
  helpful_count: number
  not_helpful_count: number
  dismissed_count: number
  total_count: number
  helpfulness_ratio: number // helpful / total
}

/**
 * AI analysis configuration
 */
export interface AIAnalysisConfig {
  min_days_required: number // Minimum days of data required (default: 7)
  max_recommendations: number // Maximum recommendations to return (default: 5)
  confidence_threshold: number // Minimum confidence to include prediction (default: 70)
  model: string // Claude model to use (default: 'claude-3-5-sonnet-20241022')
  temperature: number // Claude temperature parameter (default: 0.7)
}

/**
 * Projected monthly spend (used in dashboard)
 */
export interface ProjectedMonthlySpend {
  status: 'available' | 'insufficient_data'
  projected_total?: number
  confidence_level?: number
  days_of_data?: number
  comparison_to_budget?: {
    difference: number // positive = under, negative = over
    status: 'under' | 'on_track' | 'over'
  }
  message?: string // "Building your spending baseline..." for insufficient data
}
