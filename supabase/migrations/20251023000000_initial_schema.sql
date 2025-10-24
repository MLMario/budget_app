-- AI-Powered Budget App - Initial Database Schema
-- Version: 1.0.0
-- Created: 2025-10-23
-- Description: Complete schema with 9 tables, RLS policies, indexes, constraints, triggers

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgsodium";

-- ============================================================================
-- Table 1: User Preferences
-- ============================================================================
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences_text TEXT,
  notification_email_weekly BOOLEAN DEFAULT TRUE,
  notification_email_monthly BOOLEAN DEFAULT TRUE,
  notification_budget_warning BOOLEAN DEFAULT TRUE,
  notification_budget_alert BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  CONSTRAINT preferences_text_length CHECK (char_length(preferences_text) <= 5000)
);

-- ============================================================================
-- Table 2: Bank Connections
-- ============================================================================
CREATE TABLE public.bank_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_access_token TEXT NOT NULL,
  plaid_item_id TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  connection_status TEXT NOT NULL,
  last_sync_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT bank_connection_status_valid CHECK (connection_status IN ('active', 'needs_reauth', 'error')),
  CONSTRAINT bank_account_type_valid CHECK (account_type IN ('checking', 'savings', 'credit_card'))
);

-- ============================================================================
-- Table 3: Transactions
-- ============================================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_connection_id UUID NOT NULL REFERENCES public.bank_connections(id) ON DELETE CASCADE,
  plaid_transaction_id TEXT UNIQUE NOT NULL,
  merchant_name TEXT,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  authorized_date DATE,
  pending BOOLEAN DEFAULT FALSE,
  payment_channel TEXT NOT NULL,
  category_primary TEXT,
  category_detailed TEXT,
  user_category_override TEXT,
  tag_non_negotiable BOOLEAN DEFAULT FALSE,
  tag_ignored BOOLEAN DEFAULT FALSE,
  notes TEXT,
  location JSONB,
  iso_currency_code TEXT DEFAULT 'USD',
  original_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT transaction_payment_channel_valid CHECK (payment_channel IN ('online', 'in_store', 'other')),
  CONSTRAINT transaction_notes_length CHECK (char_length(notes) <= 1000),
  CONSTRAINT check_tags_mutually_exclusive CHECK (NOT (tag_non_negotiable AND tag_ignored))
);

-- ============================================================================
-- Table 4: Budgets
-- ============================================================================
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT budget_month_valid CHECK (month BETWEEN 1 AND 12),
  CONSTRAINT budget_year_valid CHECK (year >= 2020),
  UNIQUE(user_id, month, year)
);

-- ============================================================================
-- Table 5: Budget Categories
-- ============================================================================
CREATE TABLE public.budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  budgeted_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT budget_category_amount_valid CHECK (budgeted_amount > 0),
  UNIQUE(budget_id, category_name)
);

-- ============================================================================
-- Table 6: Goals
-- ============================================================================
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  target_date DATE NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT goal_type_valid CHECK (goal_type IN ('savings', 'spending_limit', 'debt_payoff')),
  CONSTRAINT goal_priority_valid CHECK (priority IN ('high', 'medium', 'low')),
  CONSTRAINT goal_status_valid CHECK (status IN ('active', 'paused', 'completed')),
  CONSTRAINT goal_target_amount_valid CHECK (target_amount > 0)
);

-- ============================================================================
-- Table 7: AI Analysis Reports
-- ============================================================================
CREATE TABLE public.ai_analysis_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  generation_date TIMESTAMPTZ DEFAULT NOW(),
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  trajectory_prediction JSONB,
  recommendations JSONB NOT NULL,
  confidence_level INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT report_type_valid CHECK (report_type IN ('weekly', 'monthly')),
  CONSTRAINT confidence_level_valid CHECK (confidence_level BETWEEN 0 AND 100),
  CONSTRAINT analysis_period_valid CHECK (analysis_period_end > analysis_period_start)
);

-- ============================================================================
-- Table 8: Recommendation Feedback
-- ============================================================================
CREATE TABLE public.recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_report_id UUID NOT NULL REFERENCES public.ai_analysis_reports(id) ON DELETE CASCADE,
  recommendation_id TEXT NOT NULL,
  feedback_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT feedback_type_valid CHECK (feedback_type IN ('helpful', 'not_helpful', 'dismissed')),
  UNIQUE(user_id, ai_report_id, recommendation_id)
);

-- ============================================================================
-- Table 9: Audit Log (for security and compliance)
-- ============================================================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User Preferences Indexes
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Bank Connections Indexes
CREATE INDEX idx_bank_connections_user_id ON public.bank_connections(user_id);
CREATE INDEX idx_bank_connections_status ON public.bank_connections(connection_status);

-- Transactions Indexes
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX idx_transactions_plaid_id ON public.transactions(plaid_transaction_id);
CREATE INDEX idx_transactions_bank_connection ON public.transactions(bank_connection_id);
CREATE INDEX idx_transactions_category ON public.transactions(user_category_override, category_primary);
CREATE INDEX idx_transactions_pending ON public.transactions(pending) WHERE pending = TRUE;

-- Budgets Indexes
CREATE UNIQUE INDEX idx_budgets_user_month_year ON public.budgets(user_id, month, year);

-- Budget Categories Indexes
CREATE INDEX idx_budget_categories_budget_id ON public.budget_categories(budget_id);
CREATE UNIQUE INDEX idx_budget_categories_budget_category ON public.budget_categories(budget_id, category_name);

-- Goals Indexes
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_status ON public.goals(status);
CREATE INDEX idx_goals_target_date ON public.goals(target_date) WHERE status = 'active';

-- AI Analysis Reports Indexes
CREATE INDEX idx_ai_reports_user_id ON public.ai_analysis_reports(user_id);
CREATE INDEX idx_ai_reports_date ON public.ai_analysis_reports(generation_date DESC);
CREATE INDEX idx_ai_reports_type ON public.ai_analysis_reports(report_type);

-- Recommendation Feedback Indexes
CREATE INDEX idx_feedback_user_id ON public.recommendation_feedback(user_id);
CREATE INDEX idx_feedback_report_id ON public.recommendation_feedback(ai_report_id);
CREATE INDEX idx_feedback_type ON public.recommendation_feedback(feedback_type);

-- Audit Log Indexes
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- User Preferences RLS Policy
CREATE POLICY "Users manage own preferences"
  ON public.user_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- Bank Connections RLS Policy
CREATE POLICY "Users manage own bank connections"
  ON public.bank_connections
  FOR ALL
  USING (auth.uid() = user_id);

-- Transactions RLS Policy
CREATE POLICY "Users manage own transactions"
  ON public.transactions
  FOR ALL
  USING (auth.uid() = user_id);

-- Budgets RLS Policy
CREATE POLICY "Users manage own budgets"
  ON public.budgets
  FOR ALL
  USING (auth.uid() = user_id);

-- Budget Categories RLS Policy
CREATE POLICY "Users manage budget categories via budgets"
  ON public.budget_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.budgets
      WHERE budgets.id = budget_categories.budget_id
        AND budgets.user_id = auth.uid()
    )
  );

-- Goals RLS Policy
CREATE POLICY "Users manage own goals"
  ON public.goals
  FOR ALL
  USING (auth.uid() = user_id);

-- AI Analysis Reports RLS Policy
CREATE POLICY "Users access own ai reports"
  ON public.ai_analysis_reports
  FOR ALL
  USING (auth.uid() = user_id);

-- Recommendation Feedback RLS Policy
CREATE POLICY "Users manage own feedback"
  ON public.recommendation_feedback
  FOR ALL
  USING (auth.uid() = user_id);

-- Audit Log RLS Policy (users can only see their own audit logs)
CREATE POLICY "Users view own audit logs"
  ON public.audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Create generic update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to all tables with updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_connections_updated_at
  BEFORE UPDATE ON public.bank_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_categories_updated_at
  BEFORE UPDATE ON public.budget_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUDIT LOGGING TRIGGERS
-- ============================================================================

-- Create audit logging function for transaction updates
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, table_name, operation, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to transactions (track all category changes and tags)
CREATE TRIGGER transaction_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_transaction_changes();

-- ============================================================================
-- ENCRYPTION SETUP (for plaid_access_token)
-- ============================================================================

-- Note: Plaid access token encryption will be handled in the application layer
-- using pgsodium's encryption functions when storing/retrieving tokens.
-- Example usage in application code:
--
-- To encrypt (INSERT):
-- INSERT INTO bank_connections (plaid_access_token, ...)
-- VALUES (pgsodium.crypto_aead_det_encrypt(
--   'plaintext_token',
--   'encryption_key_from_env',
--   'additional_data'
-- ), ...);
--
-- To decrypt (SELECT):
-- SELECT pgsodium.crypto_aead_det_decrypt(
--   plaid_access_token,
--   'encryption_key_from_env',
--   'additional_data'
-- ) FROM bank_connections;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate budget utilization
CREATE OR REPLACE FUNCTION calculate_budget_utilization(
  p_user_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE (
  category_name TEXT,
  budgeted_amount NUMERIC,
  spent_amount NUMERIC,
  percentage_used NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bc.category_name,
    bc.budgeted_amount,
    COALESCE(SUM(t.amount), 0) AS spent_amount,
    CASE
      WHEN bc.budgeted_amount > 0 THEN
        (COALESCE(SUM(t.amount), 0) / bc.budgeted_amount * 100)
      ELSE 0
    END AS percentage_used
  FROM public.budget_categories bc
  JOIN public.budgets b ON b.id = bc.budget_id
  LEFT JOIN public.transactions t
    ON t.user_id = b.user_id
    AND COALESCE(t.user_category_override, t.category_primary) = bc.category_name
    AND EXTRACT(MONTH FROM t.date) = b.month
    AND EXTRACT(YEAR FROM t.date) = b.year
    AND t.tag_ignored = FALSE
    AND t.amount > 0  -- Only count expenses (positive amounts)
  WHERE b.user_id = p_user_id
    AND b.month = p_month
    AND b.year = p_year
  GROUP BY bc.id, bc.category_name, bc.budgeted_amount
  ORDER BY percentage_used DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.user_preferences IS 'Stores user-specific settings and free-form preferences for AI personalization';
COMMENT ON TABLE public.bank_connections IS 'Stores Plaid bank account connections with encrypted access tokens';
COMMENT ON TABLE public.transactions IS 'Financial transactions imported from Plaid with user categorization and tags';
COMMENT ON TABLE public.budgets IS 'Monthly budget definitions';
COMMENT ON TABLE public.budget_categories IS 'Category-specific budget allocations within monthly budgets';
COMMENT ON TABLE public.goals IS 'User financial goals with progress tracking';
COMMENT ON TABLE public.ai_analysis_reports IS 'Weekly and monthly AI-generated analysis reports';
COMMENT ON TABLE public.recommendation_feedback IS 'User feedback on AI recommendations for learning';
COMMENT ON TABLE public.audit_log IS 'Audit trail for transaction modifications and security compliance';

COMMENT ON COLUMN public.transactions.tag_non_negotiable IS 'User-marked essential spending that AI should not suggest reducing';
COMMENT ON COLUMN public.transactions.tag_ignored IS 'User-marked transaction to exclude from budget tracking (mutually exclusive with tag_non_negotiable)';
COMMENT ON COLUMN public.bank_connections.plaid_access_token IS 'Plaid access token (should be encrypted using pgsodium in application layer)';
