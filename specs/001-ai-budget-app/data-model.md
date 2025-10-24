# Data Model: AI-Powered Budget App

**Version**: 1.0.0
**Last Updated**: 2025-10-23
**Related**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md)

## Overview

This document defines the complete data model for the AI-Powered Budget App, including all entities, relationships, validation rules, and database schema. The model is designed to support Plaid transaction import, budget tracking, AI analysis, and user preferences while maintaining security through Row Level Security (RLS) policies.

## Database Platform

**Storage**: Supabase (PostgreSQL 15+)
**Security**: Row Level Security (RLS) enabled on all tables
**Auth**: Supabase Auth with email/password
**Encryption**: AES-256 at rest, TLS 1.3 in transit

## Entity Relationship Diagram

```text
┌─────────────────┐
│ User (Auth)     │◄──┐
│ - id (UUID)     │   │
│ - email         │   │
└─────────────────┘   │
                      │
                      │ 1:N
       ┌──────────────┼──────────────┬───────────────┬─────────────────┐
       │              │              │               │                 │
       │              │              │               │                 │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼───────┐ ┌────▼──────┐ ┌────────▼────────┐
│Bank         │ │Budget      │ │Goal        │ │User        │ │AI Analysis      │
│Connection   │ │            │ │            │ │Preferences │ │Report           │
│             │ │            │ │            │ │            │ │                 │
└──────┬──────┘ └─────┬──────┘ └────────────┘ └────────────┘ └────────┬────────┘
       │              │                                                │
       │ 1:N          │ 1:N                                           │ 1:N
       │              │                                                │
┌──────▼──────┐ ┌─────▼──────┐                                ┌───────▼────────┐
│Transaction  │ │Budget      │                                │Recommendation  │
│             │ │Category    │                                │Feedback        │
└─────────────┘ └────────────┘                                └────────────────┘
```

## Core Entities

### 1. User (Supabase Auth)

**Table**: `auth.users` (managed by Supabase Auth)

**Purpose**: User authentication and account management

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated user ID |
| `email` | TEXT | UNIQUE, NOT NULL | User email address |
| `encrypted_password` | TEXT | NOT NULL | Bcrypt hashed password (managed by Supabase) |
| `created_at` | TIMESTAMPTZ | NOT NULL | Account creation timestamp |
| `email_confirmed_at` | TIMESTAMPTZ | NULLABLE | Email verification timestamp |

**Validation**:
- Email format validation via Supabase Auth
- Password minimum 12 characters (enforced by Supabase settings)
- Email uniqueness enforced by database constraint

**RLS Policy**: N/A (managed by Supabase Auth system)

---

### 2. User Preferences

**Table**: `public.user_preferences`

**Purpose**: Store user-specific settings and free-form preferences text for AI personalization

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `user_id` | UUID | FK → auth.users(id), UNIQUE, NOT NULL | One-to-one with user |
| `preferences_text` | TEXT | NULLABLE | Free-form user preferences (e.g., "coffee important for mental health") |
| `notification_email_weekly` | BOOLEAN | DEFAULT TRUE | Enable weekly AI check-in emails |
| `notification_email_monthly` | BOOLEAN | DEFAULT TRUE | Enable monthly report emails |
| `notification_budget_warning` | BOOLEAN | DEFAULT TRUE | Enable budget warning notifications (90%) |
| `notification_budget_alert` | BOOLEAN | DEFAULT TRUE | Enable budget alert notifications (100%+) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Preference creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last preference update timestamp |

**Validation**:
- `user_id` must exist in `auth.users`
- Preferences text max length: 5000 characters

**RLS Policy**:
```sql
-- Users can only read/update their own preferences
CREATE POLICY "Users manage own preferences"
  ON user_preferences
  FOR ALL
  USING (auth.uid() = user_id);
```

---

### 3. Bank Connection

**Table**: `public.bank_connections`

**Purpose**: Store Plaid bank account connections and sync status

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `user_id` | UUID | FK → auth.users(id), NOT NULL | Owner of connection |
| `plaid_access_token` | TEXT | NOT NULL, ENCRYPTED | Plaid access token (encrypted via Supabase Vault) |
| `plaid_item_id` | TEXT | NOT NULL | Plaid item ID |
| `institution_name` | TEXT | NOT NULL | Bank name (e.g., "Chase", "Bank of America") |
| `account_type` | TEXT | NOT NULL | Account type (checking, savings, credit_card) |
| `connection_status` | TEXT | NOT NULL, CHECK | Status: 'active', 'needs_reauth', 'error' |
| `last_sync_date` | TIMESTAMPTZ | NULLABLE | Last successful transaction sync |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Connection creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last status update timestamp |

**Validation**:
- `connection_status` IN ('active', 'needs_reauth', 'error')
- `account_type` IN ('checking', 'savings', 'credit_card')
- `plaid_access_token` encrypted using Supabase Vault (pgsodium)

**Indexes**:
```sql
CREATE INDEX idx_bank_connections_user_id ON bank_connections(user_id);
CREATE INDEX idx_bank_connections_status ON bank_connections(connection_status);
```

**RLS Policy**:
```sql
-- Users can only manage their own bank connections
CREATE POLICY "Users manage own bank connections"
  ON bank_connections
  FOR ALL
  USING (auth.uid() = user_id);
```

**Encryption**:
```sql
-- Encrypt plaid_access_token using Supabase Vault
-- Implemented in service layer using pgsodium extension
```

---

### 4. Transaction

**Table**: `public.transactions`

**Purpose**: Store financial transactions imported from Plaid, including user tags and notes

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `user_id` | UUID | FK → auth.users(id), NOT NULL | Transaction owner |
| `bank_connection_id` | UUID | FK → bank_connections(id), NOT NULL | Source bank connection |
| `plaid_transaction_id` | TEXT | UNIQUE, NOT NULL | Plaid unique transaction ID (deduplication) |
| `merchant_name` | TEXT | NULLABLE | Merchant name (from Plaid enrichment) |
| `amount` | DECIMAL(12,2) | NOT NULL | Transaction amount (positive = debit, negative = credit) |
| `date` | DATE | NOT NULL | Transaction posted date |
| `authorized_date` | DATE | NULLABLE | Transaction authorization date |
| `pending` | BOOLEAN | DEFAULT FALSE | Is transaction pending/unsettled |
| `payment_channel` | TEXT | NOT NULL | Payment method: 'online', 'in_store', 'other' |
| `category_primary` | TEXT | NULLABLE | Plaid personal_finance_category.primary |
| `category_detailed` | TEXT | NULLABLE | Plaid personal_finance_category.detailed |
| `user_category_override` | TEXT | NULLABLE | User-assigned category (overrides Plaid) |
| `tag_non_negotiable` | BOOLEAN | DEFAULT FALSE | User marked as non-negotiable spending |
| `tag_ignored` | BOOLEAN | DEFAULT FALSE | User marked to exclude from budget tracking |
| `notes` | TEXT | NULLABLE | User notes (max 1000 characters) |
| `location` | JSONB | NULLABLE | Transaction location (city, region, country, coordinates) |
| `iso_currency_code` | TEXT | DEFAULT 'USD' | Currency code (USD for v1) |
| `original_description` | TEXT | NULLABLE | Raw transaction description from bank |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Import timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last modification timestamp |

**Validation**:
- `tag_non_negotiable` and `tag_ignored` cannot both be TRUE (mutually exclusive)
- `payment_channel` IN ('online', 'in_store', 'other')
- `amount` NOT NULL and numeric
- `plaid_transaction_id` must be unique (deduplication)
- Plaid category values from personal_finance_category taxonomy

**Indexes**:
```sql
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_plaid_id ON transactions(plaid_transaction_id);
CREATE INDEX idx_transactions_bank_connection ON transactions(bank_connection_id);
CREATE INDEX idx_transactions_category ON transactions(user_category_override, category_primary);
```

**RLS Policy**:
```sql
-- Users can only access their own transactions
CREATE POLICY "Users manage own transactions"
  ON transactions
  FOR ALL
  USING (auth.uid() = user_id);
```

**Constraint**:
```sql
-- Ensure tag_non_negotiable and tag_ignored are mutually exclusive
ALTER TABLE transactions
  ADD CONSTRAINT check_tags_mutually_exclusive
  CHECK (NOT (tag_non_negotiable AND tag_ignored));
```

**Plaid Category Mapping**:
- Store both `category_primary` (e.g., "FOOD_AND_DRINK") and `category_detailed` (e.g., "FOOD_AND_DRINK_RESTAURANTS")
- Map Plaid primary categories to app categories: FOOD_AND_DRINK → "Dining Out", GENERAL_MERCHANDISE → "Shopping"
- Use `user_category_override` to store user recategorization

---

### 5. Budget

**Table**: `public.budgets`

**Purpose**: Store monthly budget definitions for users

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `user_id` | UUID | FK → auth.users(id), NOT NULL | Budget owner |
| `month` | INTEGER | NOT NULL, CHECK | Month (1-12) |
| `year` | INTEGER | NOT NULL, CHECK | Year (e.g., 2025) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Budget creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last budget update timestamp |

**Validation**:
- `month` BETWEEN 1 AND 12
- `year` >= 2020
- UNIQUE constraint on (user_id, month, year) - one budget per user per month

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_budgets_user_month_year ON budgets(user_id, month, year);
```

**RLS Policy**:
```sql
-- Users can only manage their own budgets
CREATE POLICY "Users manage own budgets"
  ON budgets
  FOR ALL
  USING (auth.uid() = user_id);
```

---

### 6. Budget Category

**Table**: `public.budget_categories`

**Purpose**: Store category-specific budget allocations within a monthly budget

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `budget_id` | UUID | FK → budgets(id) ON DELETE CASCADE, NOT NULL | Parent budget |
| `category_name` | TEXT | NOT NULL | Category (e.g., "Groceries", "Dining Out") |
| `budgeted_amount` | DECIMAL(10,2) | NOT NULL, CHECK | Allocated budget amount |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Category creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Validation**:
- `budgeted_amount` > 0
- `category_name` IN predefined categories (enforced in application layer)
- UNIQUE constraint on (budget_id, category_name)

**Indexes**:
```sql
CREATE INDEX idx_budget_categories_budget_id ON budget_categories(budget_id);
CREATE UNIQUE INDEX idx_budget_categories_budget_category ON budget_categories(budget_id, category_name);
```

**RLS Policy**:
```sql
-- Users can access budget categories through their budgets
CREATE POLICY "Users manage budget categories via budgets"
  ON budget_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_categories.budget_id
        AND budgets.user_id = auth.uid()
    )
  );
```

**Calculated Fields** (NOT stored, computed in queries):
- `spent_amount`: SUM of transactions for category in budget month
- `percentage_used`: (spent_amount / budgeted_amount) * 100

**Predefined Categories**:
- Groceries
- Dining Out
- Transportation
- Entertainment
- Utilities
- Healthcare
- Shopping
- Other

---

### 7. Goal

**Table**: `public.goals`

**Purpose**: Store user financial goals with progress tracking

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `user_id` | UUID | FK → auth.users(id), NOT NULL | Goal owner |
| `name` | TEXT | NOT NULL | Goal name (e.g., "Emergency Fund") |
| `goal_type` | TEXT | NOT NULL, CHECK | Type: 'savings', 'spending_limit', 'debt_payoff' |
| `target_amount` | DECIMAL(12,2) | NOT NULL, CHECK | Target amount |
| `target_date` | DATE | NOT NULL | Target completion date |
| `priority` | TEXT | DEFAULT 'medium', CHECK | Priority: 'high', 'medium', 'low' |
| `status` | TEXT | DEFAULT 'active', CHECK | Status: 'active', 'paused', 'completed' |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Goal creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Validation**:
- `target_amount` > 0
- `target_date` >= CURRENT_DATE (for active goals)
- `goal_type` IN ('savings', 'spending_limit', 'debt_payoff')
- `priority` IN ('high', 'medium', 'low')
- `status` IN ('active', 'paused', 'completed')

**Indexes**:
```sql
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
```

**RLS Policy**:
```sql
-- Users can only manage their own goals
CREATE POLICY "Users manage own goals"
  ON goals
  FOR ALL
  USING (auth.uid() = user_id);
```

**Calculated Field** (NOT stored):
- `current_progress`: Calculated based on goal_type
  - `savings`: Current savings account balance or sum of savings transactions
  - `spending_limit`: Remaining budget vs target
  - `debt_payoff`: Original debt - payments made

---

### 8. AI Analysis Report

**Table**: `public.ai_analysis_reports`

**Purpose**: Store weekly and monthly AI-generated analysis reports

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `user_id` | UUID | FK → auth.users(id), NOT NULL | Report owner |
| `report_type` | TEXT | NOT NULL, CHECK | Type: 'weekly', 'monthly' |
| `generation_date` | TIMESTAMPTZ | DEFAULT NOW() | Report generation timestamp |
| `analysis_period_start` | DATE | NOT NULL | Analysis start date |
| `analysis_period_end` | DATE | NOT NULL | Analysis end date |
| `trajectory_prediction` | JSONB | NULLABLE | Predicted end-of-month spending (JSON structure) |
| `recommendations` | JSONB | NOT NULL | Array of recommendation objects |
| `confidence_level` | INTEGER | CHECK | Prediction confidence (0-100) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Report storage timestamp |

**Validation**:
- `report_type` IN ('weekly', 'monthly')
- `confidence_level` BETWEEN 0 AND 100
- `analysis_period_end` > `analysis_period_start`

**JSONB Structures**:

**trajectory_prediction**:
```json
{
  "projected_total": 4850.00,
  "budget_total": 5000.00,
  "difference": 150.00,
  "status": "under_budget",
  "likelihood_percentage": 85
}
```

**recommendations** (array):
```json
[
  {
    "id": "rec_1",
    "action": "Skip 2 coffee runs this week",
    "category": "Dining Out",
    "expected_savings": 15.00,
    "implementation": "Visit coffee shop 3x instead of 5x this week",
    "effort_level": "easy",
    "preferences_respected": ["Respects your preference to maintain coffee shop visits for mental health"],
    "rank": 1,
    "affected_transaction_ids": ["trans_1", "trans_2"]
  }
]
```

**Indexes**:
```sql
CREATE INDEX idx_ai_reports_user_id ON ai_analysis_reports(user_id);
CREATE INDEX idx_ai_reports_date ON ai_analysis_reports(generation_date DESC);
CREATE INDEX idx_ai_reports_type ON ai_analysis_reports(report_type);
```

**RLS Policy**:
```sql
-- Users can only access their own AI reports
CREATE POLICY "Users access own ai reports"
  ON ai_analysis_reports
  FOR ALL
  USING (auth.uid() = user_id);
```

---

### 9. Recommendation Feedback

**Table**: `public.recommendation_feedback`

**Purpose**: Track user feedback on AI recommendations to improve future suggestions

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `user_id` | UUID | FK → auth.users(id), NOT NULL | Feedback provider |
| `ai_report_id` | UUID | FK → ai_analysis_reports(id), NOT NULL | Parent report |
| `recommendation_id` | TEXT | NOT NULL | ID of recommendation (from JSONB) |
| `feedback_type` | TEXT | NOT NULL, CHECK | Type: 'helpful', 'not_helpful', 'dismissed' |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Feedback timestamp |

**Validation**:
- `feedback_type` IN ('helpful', 'not_helpful', 'dismissed')
- UNIQUE constraint on (user_id, ai_report_id, recommendation_id)

**Indexes**:
```sql
CREATE INDEX idx_feedback_user_id ON recommendation_feedback(user_id);
CREATE INDEX idx_feedback_report_id ON recommendation_feedback(ai_report_id);
CREATE INDEX idx_feedback_type ON recommendation_feedback(feedback_type);
```

**RLS Policy**:
```sql
-- Users can only manage their own feedback
CREATE POLICY "Users manage own feedback"
  ON recommendation_feedback
  FOR ALL
  USING (auth.uid() = user_id);
```

---

## Derived/Calculated Data

### Current Budget Utilization

**Purpose**: Display total spent vs total budget for current month

**Calculation**:
```sql
SELECT
  bc.category_name,
  bc.budgeted_amount,
  COALESCE(SUM(t.amount), 0) AS spent_amount,
  (COALESCE(SUM(t.amount), 0) / bc.budgeted_amount * 100) AS percentage_used
FROM budget_categories bc
LEFT JOIN transactions t
  ON t.user_category_override = bc.category_name
  AND EXTRACT(MONTH FROM t.date) = b.month
  AND EXTRACT(YEAR FROM t.date) = b.year
  AND t.user_id = auth.uid()
  AND t.tag_ignored = FALSE
JOIN budgets b ON b.id = bc.budget_id
WHERE b.user_id = auth.uid()
GROUP BY bc.id, bc.category_name, bc.budgeted_amount;
```

**Color Indicators**:
- Green: `percentage_used` < 80
- Yellow: `percentage_used` >= 80 AND < 100
- Red: `percentage_used` >= 100

---

### Projected Monthly Spend

**Purpose**: AI prediction of end-of-month spending (NOT stored, computed by AI service)

**Requirements**:
- Minimum 7 days of transaction data required
- If < 7 days: Display "Building your spending baseline..."
- Uses current spending pace + historical patterns (if available) + day-of-month progression

**Calculation** (pseudocode):
```python
def calculate_projection(user_id, month, year):
    # Get transactions for current month
    transactions = get_transactions(user_id, month, year)

    # Check minimum data requirement
    days_of_data = count_unique_transaction_dates(transactions)
    if days_of_data < 7:
        return {"status": "insufficient_data", "message": "Building your spending baseline..."}

    # Calculate current spending rate
    current_spent = sum(transactions)
    days_elapsed = current_day_of_month()
    daily_average = current_spent / days_elapsed

    # Project to end of month
    days_remaining = days_in_month() - days_elapsed
    projected_total = current_spent + (daily_average * days_remaining)

    # Calculate confidence based on data quality
    confidence = min(days_of_data * 10, 100)  # 10% per day, max 100%

    return {
        "projected_total": projected_total,
        "confidence_level": confidence,
        "days_of_data": days_of_data
    }
```

---

## Database Migrations

### Migration Strategy

**Tool**: Supabase CLI
**Location**: `/supabase/migrations/`
**Naming**: `YYYYMMDDHHMMSS_descriptive_name.sql`

### Initial Migration

**File**: `20251023000000_initial_schema.sql`

Contains:
1. Enable extensions (uuid-ossp, pgsodium for encryption)
2. Create all tables in order (respect foreign keys)
3. Create indexes
4. Enable RLS on all tables
5. Create RLS policies
6. Create constraints
7. Create triggers (updated_at timestamps)

### Seed Data

**File**: `/supabase/seed.sql`

Contains:
- Test users (3 accounts with different spending patterns)
- Bank connections (2-3 per user)
- Transactions (30-90 days of realistic data)
- Budgets (current month + 2 previous months)
- Budget categories (all 8 categories per budget)
- Goals (1-2 active goals per user)
- AI reports (1 weekly + 1 monthly sample)
- Recommendation feedback (sample feedback on reports)

---

## State Transitions

### Transaction Lifecycle

```
Plaid Import → Pending → Posted → User Recategorized → Analyzed by AI
                  ↓         ↓            ↓
              Ignored   Non-negotiable  Budget Tracking
```

### Budget Category Status

```
Created → On Track (0-80%) → Warning (80-90%) → Alert (90-100%) → Over Budget (>100%)
```

### Goal Status

```
Active → Progress Tracking → Completed
   ↓                            ↑
Paused ──────────────────────────┘
```

### Bank Connection Status

```
Active → Needs Reauth → Reconnected
   ↓           ↓
 Error ← Retry Failed
```

---

## Security & Privacy

### Row Level Security (RLS)

**Enforcement**: Enabled on ALL public tables
**Policy**: Users can ONLY access their own data (enforced via `auth.uid()`)

### Encryption

**At Rest**: AES-256 (Supabase default)
**In Transit**: TLS 1.3 (Supabase default)
**Sensitive Fields**:
- `bank_connections.plaid_access_token` → Encrypted via Supabase Vault (pgsodium)

### Audit Logging

**Implementation**: PostgreSQL triggers on transaction modifications

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger function for transactions table
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, table_name, operation, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    row_to_json(OLD),
    row_to_json(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_audit
AFTER UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION log_transaction_changes();
```

---

## Performance Considerations

### Pagination

**Transactions**: Use cursor-based pagination for transaction lists (1000+ items)

```sql
SELECT *
FROM transactions
WHERE user_id = auth.uid()
  AND created_at < :cursor
ORDER BY created_at DESC
LIMIT 50;
```

### Caching Strategy

**Dashboard Queries**: Cache for 5 minutes (current budget utilization, recent transactions)
**AI Reports**: Cache indefinitely (immutable after generation)
**Projected Spend**: Cache for 1 hour (recomputed periodically)

### Denormalization

**Budget Category Spent Amount**: NOT stored, calculated on-demand (ensures accuracy)
**Goal Progress**: NOT stored, calculated on-demand
**AI Recommendations**: Stored as JSONB (allows flexible structure without schema changes)

---

## Validation Rules Summary

### Transaction Validation
- Amount must be numeric
- Tags (non-negotiable, ignored) are mutually exclusive
- Plaid transaction ID must be unique (deduplication)
- Date must be valid

### Budget Validation
- One budget per user per month/year
- Category budgeted amounts must be > 0
- Categories must match predefined list

### Goal Validation
- Target amount > 0
- Target date >= current date (for active goals)
- Goal type must be valid enum

### AI Report Validation
- Confidence level 0-100
- Analysis period end > start
- Report type must be valid enum

---

## Future Enhancements

**Not in v1, documented for future reference**:

1. **Transaction Splits**: Allow splitting a single transaction across multiple categories
2. **Recurring Transactions**: Detect and flag recurring transactions (subscriptions)
3. **Multi-Currency Support**: Store original currency + converted USD amount
4. **Merchant Override Table**: Store learned merchant → category mappings
5. **Budget Templates**: Save and reuse budget configurations
6. **Goal Milestones**: Track intermediate milestones within goals

---

## References

- [Plaid Transactions API](https://plaid.com/docs/api/products/transactions/)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Supabase Vault (pgsodium)](https://supabase.com/docs/guides/database/vault)
