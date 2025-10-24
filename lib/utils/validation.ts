/**
 * Validation Schemas using Zod
 *
 * Centralized validation schemas for all user inputs and data structures
 */

import { z } from 'zod'
import { PREDEFINED_CATEGORIES } from '@/types'

// ============================================================================
// Auth Validation
// ============================================================================

export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required')
  .max(255, 'Email is too long')

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  )

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const resetPasswordSchema = z.object({
  email: emailSchema,
})

// ============================================================================
// Transaction Validation
// ============================================================================

export const transactionSchema = z.object({
  merchant_name: z.string().nullable(),
  amount: z
    .number()
    .or(z.string().transform((val) => parseFloat(val)))
    .refine((val) => !isNaN(val), 'Amount must be a valid number'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  payment_channel: z.enum(['online', 'in_store', 'other']),
  category_primary: z.string().nullable().optional(),
  category_detailed: z.string().nullable().optional(),
  user_category_override: z.string().nullable().optional(),
  tag_non_negotiable: z.boolean().optional().default(false),
  tag_ignored: z.boolean().optional().default(false),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').nullable().optional(),
})
  .refine(
    (data) => !(data.tag_non_negotiable && data.tag_ignored),
    {
      message: 'A transaction cannot be both non-negotiable and ignored',
      path: ['tag_ignored'],
    }
  )

export const updateTransactionSchema = z.object({
  user_category_override: z.string().nullable().optional(),
  tag_non_negotiable: z.boolean().optional(),
  tag_ignored: z.boolean().optional(),
  notes: z.string().max(1000).nullable().optional(),
})
  .refine(
    (data) => {
      if (data.tag_non_negotiable === undefined || data.tag_ignored === undefined) {
        return true
      }
      return !(data.tag_non_negotiable && data.tag_ignored)
    },
    {
      message: 'A transaction cannot be both non-negotiable and ignored',
      path: ['tag_ignored'],
    }
  )

export const bulkCategorizeSchema = z.object({
  transaction_ids: z.array(z.string().uuid()).min(1, 'At least one transaction ID is required'),
  category: z.string().min(1, 'Category is required'),
})

// ============================================================================
// Budget Validation
// ============================================================================

export const budgetCategorySchema = z.object({
  category_name: z.enum(PREDEFINED_CATEGORIES as readonly [string, ...string[]]),
  budgeted_amount: z
    .number()
    .or(z.string().transform((val) => parseFloat(val)))
    .refine((val) => !isNaN(val) && val > 0, 'Budget amount must be greater than 0'),
})

export const createBudgetSchema = z.object({
  month: z
    .number()
    .int()
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  year: z
    .number()
    .int()
    .min(2020, 'Year must be 2020 or later')
    .max(2100, 'Year must be before 2100'),
  categories: z
    .array(budgetCategorySchema)
    .min(1, 'At least one budget category is required'),
})

export const updateBudgetCategorySchema = z.object({
  budgeted_amount: z
    .number()
    .or(z.string().transform((val) => parseFloat(val)))
    .refine((val) => !isNaN(val) && val > 0, 'Budget amount must be greater than 0'),
})

// ============================================================================
// Goal Validation
// ============================================================================

export const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100, 'Goal name is too long'),
  goal_type: z.enum(['savings', 'spending_limit', 'debt_payoff']),
  target_amount: z
    .number()
    .or(z.string().transform((val) => parseFloat(val)))
    .refine((val) => !isNaN(val) && val > 0, 'Target amount must be greater than 0'),
  target_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine(
      (date) => new Date(date) >= new Date(),
      'Target date must be in the future'
    ),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
  status: z.enum(['active', 'paused', 'completed']).optional().default('active'),
})

export const updateGoalSchema = goalSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update'
)

// ============================================================================
// Preferences Validation
// ============================================================================

export const userPreferencesSchema = z.object({
  preferences_text: z
    .string()
    .max(5000, 'Preferences text cannot exceed 5000 characters')
    .nullable()
    .optional(),
  notification_email_weekly: z.boolean().optional(),
  notification_email_monthly: z.boolean().optional(),
  notification_budget_warning: z.boolean().optional(),
  notification_budget_alert: z.boolean().optional(),
})

// ============================================================================
// AI Analysis Validation
// ============================================================================

export const weeklyAnalysisRequestSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  force_regenerate: z.boolean().optional().default(false),
})

export const monthlyReportRequestSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
})

export const recommendationFeedbackSchema = z.object({
  ai_report_id: z.string().uuid('Invalid report ID'),
  recommendation_id: z.string().min(1, 'Recommendation ID is required'),
  feedback_type: z.enum(['helpful', 'not_helpful', 'dismissed']),
})

// ============================================================================
// Plaid Integration Validation
// ============================================================================

export const plaidLinkTokenRequestSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
})

export const plaidExchangeTokenRequestSchema = z.object({
  public_token: z.string().min(1, 'Public token is required'),
  user_id: z.string().uuid('Invalid user ID'),
})

export const plaidWebhookSchema = z.object({
  webhook_type: z.string(),
  webhook_code: z.string(),
  item_id: z.string(),
  error: z
    .object({
      error_code: z.string(),
      error_message: z.string(),
    })
    .optional(),
  removed_transactions: z.array(z.string()).optional(),
  new_transactions: z.number().optional(),
})

// ============================================================================
// Pagination Validation
// ============================================================================

export const paginationSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(50),
  cursor: z.string().optional(),
})

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate data against a Zod schema and return typed result
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true
  data: T
} | {
  success: false
  errors: z.ZodError
} {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error }
    }
    throw error
  }
}

/**
 * Format Zod validation errors for API responses
 */
export function formatValidationErrors(errors: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}

  errors.errors.forEach((error) => {
    const path = error.path.join('.')
    if (!formatted[path]) {
      formatted[path] = []
    }
    formatted[path].push(error.message)
  })

  return formatted
}
