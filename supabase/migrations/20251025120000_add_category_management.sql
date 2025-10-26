-- Migration: Add Category Management System
-- Version: 2.0.0
-- Created: 2025-10-25
-- Description: Add categories reference table, Plaid mappings, and enforce category consistency
--
-- This migration fixes the critical gap where budget_categories.category_name and
-- transactions.category_primary use different taxonomies with no mapping.
--
-- Changes:
-- 1. Create categories reference table (master list)
-- 2. Create plaid_category_mappings table (Plaid taxonomy → App taxonomy)
-- 3. Add app_category_id FK to transactions
-- 4. Add category_id FK to budget_categories
-- 5. Backfill existing data
-- 6. Add constraints and indexes

-- ============================================================================
-- PHASE 1: CREATE NEW TABLES
-- ============================================================================

-- Table 1: Categories (Master Reference)
-- Purpose: Single source of truth for all budget categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,           -- Internal identifier: "dining_out"
  display_name TEXT NOT NULL,          -- User-facing name: "Dining & Coffee"
  description TEXT,                     -- "Restaurants, coffee shops, bars"
  icon TEXT,                            -- For UI (e.g., "utensils", "cart-shopping")
  display_order INTEGER NOT NULL,       -- For consistent UI ordering
  is_active BOOLEAN DEFAULT TRUE,       -- Allow soft-delete of categories
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed categories with predefined list
INSERT INTO public.categories (name, display_name, description, display_order) VALUES
  ('groceries', 'Groceries', 'Supermarkets and grocery stores', 1),
  ('dining_out', 'Dining & Coffee', 'Restaurants, cafes, bars, fast food', 2),
  ('transportation', 'Transportation', 'Gas, public transit, rideshare, parking', 3),
  ('entertainment', 'Entertainment', 'Movies, events, hobbies, streaming', 4),
  ('utilities', 'Utilities', 'Electric, water, internet, phone', 5),
  ('healthcare', 'Healthcare', 'Medical, dental, pharmacy, insurance', 6),
  ('shopping', 'Shopping', 'Clothing, electronics, home goods', 7),
  ('housing', 'Housing', 'Rent, mortgage, home maintenance', 8),
  ('personal_care', 'Personal Care', 'Haircuts, gym, beauty products', 9),
  ('education', 'Education', 'Tuition, books, courses', 10),
  ('travel', 'Travel', 'Flights, hotels, vacation expenses', 11),
  ('other', 'Other', 'Miscellaneous expenses', 99)
ON CONFLICT (name) DO NOTHING;

-- Index for fast category lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active) WHERE is_active = TRUE;

-- RLS: Categories are public (all authenticated users can read)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Categories are readable by all authenticated users"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify categories (for future use)
CREATE POLICY IF NOT EXISTS "Only admins can modify categories"
  ON public.categories
  FOR ALL
  USING (false); -- No one can modify via RLS (use migrations/admin tools)

-- Add updated_at trigger
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.categories IS 'Master reference table for all budget categories. Single source of truth.';
COMMENT ON COLUMN public.categories.name IS 'Internal identifier (lowercase, underscored). Used in code.';
COMMENT ON COLUMN public.categories.display_name IS 'User-facing display name. Used in UI.';

-- ============================================================================
-- Table 2: Plaid Category Mappings
-- Purpose: Map Plaid taxonomy to app categories
CREATE TABLE IF NOT EXISTS public.plaid_category_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plaid_category_primary TEXT NOT NULL,      -- Plaid's primary category (e.g., "FOOD_AND_DRINK")
  plaid_category_detailed TEXT,              -- Plaid's detailed category (e.g., "FOOD_AND_DRINK_RESTAURANTS")
  app_category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  confidence_score INTEGER DEFAULT 100,      -- For future ML improvements (0-100)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT plaid_mapping_unique UNIQUE(plaid_category_primary, plaid_category_detailed),
  CONSTRAINT confidence_valid CHECK (confidence_score BETWEEN 0 AND 100)
);

-- Seed Plaid → App category mappings
-- Based on Plaid's personal_finance_category taxonomy
INSERT INTO public.plaid_category_mappings (plaid_category_primary, plaid_category_detailed, app_category_id) VALUES
  -- Food & Drink → Groceries
  ('FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES', (SELECT id FROM categories WHERE name = 'groceries')),

  -- Food & Drink → Dining Out
  ('FOOD_AND_DRINK', 'FOOD_AND_DRINK_RESTAURANTS', (SELECT id FROM categories WHERE name = 'dining_out')),
  ('FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE', (SELECT id FROM categories WHERE name = 'dining_out')),
  ('FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD', (SELECT id FROM categories WHERE name = 'dining_out')),
  ('FOOD_AND_DRINK', 'FOOD_AND_DRINK_BAR', (SELECT id FROM categories WHERE name = 'dining_out')),
  ('FOOD_AND_DRINK', NULL, (SELECT id FROM categories WHERE name = 'dining_out')), -- Fallback for FOOD_AND_DRINK

  -- Transportation
  ('TRANSPORTATION', 'TRANSPORTATION_GAS', (SELECT id FROM categories WHERE name = 'transportation')),
  ('TRANSPORTATION', 'TRANSPORTATION_PARKING', (SELECT id FROM categories WHERE name = 'transportation')),
  ('TRANSPORTATION', 'TRANSPORTATION_PUBLIC_TRANSIT', (SELECT id FROM categories WHERE name = 'transportation')),
  ('TRANSPORTATION', 'TRANSPORTATION_TAXI', (SELECT id FROM categories WHERE name = 'transportation')),
  ('TRANSPORTATION', 'TRANSPORTATION_RIDE_SHARE', (SELECT id FROM categories WHERE name = 'transportation')),
  ('TRANSPORTATION', 'TRANSPORTATION_TOLLS', (SELECT id FROM categories WHERE name = 'transportation')),
  ('TRANSPORTATION', NULL, (SELECT id FROM categories WHERE name = 'transportation')),

  -- Entertainment
  ('ENTERTAINMENT', 'ENTERTAINMENT_MOVIES_AND_MUSIC', (SELECT id FROM categories WHERE name = 'entertainment')),
  ('ENTERTAINMENT', 'ENTERTAINMENT_SPORTING_EVENTS', (SELECT id FROM categories WHERE name = 'entertainment')),
  ('ENTERTAINMENT', 'ENTERTAINMENT_GYMS_AND_FITNESS', (SELECT id FROM categories WHERE name = 'personal_care')),
  ('ENTERTAINMENT', NULL, (SELECT id FROM categories WHERE name = 'entertainment')),

  -- General Merchandise → Shopping
  ('GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_CLOTHING', (SELECT id FROM categories WHERE name = 'shopping')),
  ('GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_ELECTRONICS', (SELECT id FROM categories WHERE name = 'shopping')),
  ('GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_HOME_IMPROVEMENT', (SELECT id FROM categories WHERE name = 'shopping')),
  ('GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES', (SELECT id FROM categories WHERE name = 'shopping')),
  ('GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_DISCOUNT_STORES', (SELECT id FROM categories WHERE name = 'shopping')),
  ('GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_DEPARTMENT_STORES', (SELECT id FROM categories WHERE name = 'shopping')),
  ('GENERAL_MERCHANDISE', NULL, (SELECT id FROM categories WHERE name = 'shopping')),

  -- Home Improvement
  ('HOME_IMPROVEMENT', NULL, (SELECT id FROM categories WHERE name = 'housing')),

  -- Medical
  ('MEDICAL', 'MEDICAL_HEALTHCARE_SERVICES', (SELECT id FROM categories WHERE name = 'healthcare')),
  ('MEDICAL', 'MEDICAL_PHARMACIES', (SELECT id FROM categories WHERE name = 'healthcare')),
  ('MEDICAL', 'MEDICAL_DENTAL_CARE', (SELECT id FROM categories WHERE name = 'healthcare')),
  ('MEDICAL', 'MEDICAL_EYE_CARE', (SELECT id FROM categories WHERE name = 'healthcare')),
  ('MEDICAL', NULL, (SELECT id FROM categories WHERE name = 'healthcare')),

  -- Personal Care
  ('PERSONAL_CARE', 'PERSONAL_CARE_HAIR_SALONS', (SELECT id FROM categories WHERE name = 'personal_care')),
  ('PERSONAL_CARE', 'PERSONAL_CARE_SPAS', (SELECT id FROM categories WHERE name = 'personal_care')),
  ('PERSONAL_CARE', 'PERSONAL_CARE_GYMS_AND_FITNESS', (SELECT id FROM categories WHERE name = 'personal_care')),
  ('PERSONAL_CARE', NULL, (SELECT id FROM categories WHERE name = 'personal_care')),

  -- Rent and Utilities
  ('RENT_AND_UTILITIES', 'RENT_AND_UTILITIES_RENT', (SELECT id FROM categories WHERE name = 'housing')),
  ('RENT_AND_UTILITIES', 'RENT_AND_UTILITIES_GAS_AND_ELECTRICITY', (SELECT id FROM categories WHERE name = 'utilities')),
  ('RENT_AND_UTILITIES', 'RENT_AND_UTILITIES_INTERNET_AND_CABLE', (SELECT id FROM categories WHERE name = 'utilities')),
  ('RENT_AND_UTILITIES', 'RENT_AND_UTILITIES_PHONE', (SELECT id FROM categories WHERE name = 'utilities')),
  ('RENT_AND_UTILITIES', 'RENT_AND_UTILITIES_WATER', (SELECT id FROM categories WHERE name = 'utilities')),
  ('RENT_AND_UTILITIES', NULL, (SELECT id FROM categories WHERE name = 'utilities')),

  -- Travel
  ('TRAVEL', 'TRAVEL_FLIGHTS', (SELECT id FROM categories WHERE name = 'travel')),
  ('TRAVEL', 'TRAVEL_LODGING', (SELECT id FROM categories WHERE name = 'travel')),
  ('TRAVEL', 'TRAVEL_RENTAL_CARS', (SELECT id FROM categories WHERE name = 'travel')),
  ('TRAVEL', NULL, (SELECT id FROM categories WHERE name = 'travel')),

  -- General Services
  ('GENERAL_SERVICES', 'GENERAL_SERVICES_ACCOUNTING', (SELECT id FROM categories WHERE name = 'other')),
  ('GENERAL_SERVICES', 'GENERAL_SERVICES_AUTOMOTIVE', (SELECT id FROM categories WHERE name = 'transportation')),
  ('GENERAL_SERVICES', 'GENERAL_SERVICES_INSURANCE', (SELECT id FROM categories WHERE name = 'other')),
  ('GENERAL_SERVICES', NULL, (SELECT id FROM categories WHERE name = 'other'))
ON CONFLICT (plaid_category_primary, plaid_category_detailed) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plaid_mappings_primary ON public.plaid_category_mappings(plaid_category_primary);
CREATE INDEX IF NOT EXISTS idx_plaid_mappings_detailed ON public.plaid_category_mappings(plaid_category_detailed);
CREATE INDEX IF NOT EXISTS idx_plaid_mappings_app_category ON public.plaid_category_mappings(app_category_id);

-- RLS: Mappings are public
ALTER TABLE public.plaid_category_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Plaid mappings are readable by all authenticated users"
  ON public.plaid_category_mappings
  FOR SELECT
  TO authenticated
  USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_plaid_mappings_updated_at
  BEFORE UPDATE ON public.plaid_category_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.plaid_category_mappings IS 'Maps Plaid personal_finance_category taxonomy to app categories';
COMMENT ON COLUMN public.plaid_category_mappings.plaid_category_primary IS 'Plaid primary category (e.g., FOOD_AND_DRINK)';
COMMENT ON COLUMN public.plaid_category_mappings.plaid_category_detailed IS 'Plaid detailed category (e.g., FOOD_AND_DRINK_RESTAURANTS). NULL = fallback mapping.';

-- ============================================================================
-- PHASE 2: UPDATE EXISTING TABLES
-- ============================================================================

-- Step 1: Add app_category_id to transactions (nullable initially for backfill)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS app_category_id UUID REFERENCES public.categories(id);

-- Step 2: Add user_category_override_id to transactions (replaces TEXT field)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS user_category_override_id UUID REFERENCES public.categories(id);

-- Step 3: Backfill app_category_id for existing transactions
-- Match using plaid_category_mappings with detailed match preferred, then primary fallback
UPDATE public.transactions t
SET app_category_id = (
  SELECT pcm.app_category_id
  FROM public.plaid_category_mappings pcm
  WHERE pcm.plaid_category_primary = t.category_primary
    AND (
      -- Prefer exact detailed match
      (pcm.plaid_category_detailed = t.category_detailed)
      OR
      -- Fall back to primary-only match (where detailed is NULL)
      (pcm.plaid_category_detailed IS NULL AND t.category_detailed IS NOT NULL)
    )
  ORDER BY
    -- Prioritize detailed matches
    CASE WHEN pcm.plaid_category_detailed IS NOT NULL THEN 0 ELSE 1 END,
    pcm.created_at DESC
  LIMIT 1
)
WHERE t.app_category_id IS NULL
  AND t.category_primary IS NOT NULL;

-- Fallback: Set to 'other' category if no mapping found
UPDATE public.transactions
SET app_category_id = (SELECT id FROM public.categories WHERE name = 'other')
WHERE app_category_id IS NULL;

-- Step 4: Make app_category_id NOT NULL after backfill
ALTER TABLE public.transactions
  ALTER COLUMN app_category_id SET NOT NULL;

-- Step 5: Add indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_app_category ON public.transactions(app_category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_override ON public.transactions(user_category_override_id)
  WHERE user_category_override_id IS NOT NULL;

-- Step 6: Add category_id to budget_categories (nullable initially)
ALTER TABLE public.budget_categories
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- Step 7: Backfill category_id for existing budget_categories
-- Try exact name match first, then case-insensitive, then display_name match
UPDATE public.budget_categories bc
SET category_id = (
  SELECT c.id
  FROM public.categories c
  WHERE
    -- Try exact match on internal name
    c.name = LOWER(REPLACE(bc.category_name, ' ', '_'))
    OR
    -- Try case-insensitive display name match
    LOWER(c.display_name) = LOWER(bc.category_name)
    OR
    -- Try partial match
    LOWER(bc.category_name) LIKE '%' || LOWER(c.display_name) || '%'
    OR
    LOWER(c.display_name) LIKE '%' || LOWER(bc.category_name) || '%'
  ORDER BY
    -- Prioritize exact matches
    CASE
      WHEN c.name = LOWER(REPLACE(bc.category_name, ' ', '_')) THEN 0
      WHEN LOWER(c.display_name) = LOWER(bc.category_name) THEN 1
      ELSE 2
    END
  LIMIT 1
)
WHERE bc.category_id IS NULL;

-- Fallback: Set to 'other' if no mapping found
UPDATE public.budget_categories
SET category_id = (SELECT id FROM public.categories WHERE name = 'other')
WHERE category_id IS NULL;

-- Step 8: Make category_id NOT NULL after backfill
ALTER TABLE public.budget_categories
  ALTER COLUMN category_id SET NOT NULL;

-- Step 9: Update unique constraint to use category_id instead of category_name
-- Drop old constraint if exists
ALTER TABLE public.budget_categories
  DROP CONSTRAINT IF EXISTS budget_categories_budget_category_unique;

-- Add new constraint
ALTER TABLE public.budget_categories
  ADD CONSTRAINT budget_categories_budget_category_fk_unique
  UNIQUE(budget_id, category_id);

-- Step 10: Add index for budget_categories
CREATE INDEX IF NOT EXISTS idx_budget_categories_category ON public.budget_categories(category_id);

-- Step 11: Make category_name nullable (it's now deprecated in favor of category_id)
ALTER TABLE public.budget_categories
  ALTER COLUMN category_name DROP NOT NULL;

-- Step 12: Drop old unique constraints on category_name (deprecated)
ALTER TABLE public.budget_categories
  DROP CONSTRAINT IF EXISTS budget_categories_budget_id_category_name_key;

DROP INDEX IF EXISTS idx_budget_categories_budget_category;

-- Step 13: Keep old TEXT columns for backward compatibility (optional)
-- Rename them to indicate they're deprecated
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_categories'
    AND column_name = 'category_name'
  ) THEN
    -- Keep the column but mark as deprecated
    COMMENT ON COLUMN public.budget_categories.category_name IS
      'DEPRECATED: Use category_id FK instead. Kept for backward compatibility only.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions'
    AND column_name = 'user_category_override'
  ) THEN
    COMMENT ON COLUMN public.transactions.user_category_override IS
      'DEPRECATED: Use user_category_override_id FK instead. Kept for backward compatibility only.';
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTIONS - Updated to use new schema
-- ============================================================================

-- Drop and recreate calculate_budget_utilization to use category FKs
DROP FUNCTION IF EXISTS calculate_budget_utilization(UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION calculate_budget_utilization(
  p_user_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  budgeted_amount NUMERIC,
  spent_amount NUMERIC,
  percentage_used NUMERIC,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bc.category_id,
    c.display_name AS category_name,
    bc.budgeted_amount,
    COALESCE(SUM(t.amount), 0) AS spent_amount,
    CASE
      WHEN bc.budgeted_amount > 0 THEN
        (COALESCE(SUM(t.amount), 0) / bc.budgeted_amount * 100)
      ELSE 0
    END AS percentage_used,
    CASE
      WHEN bc.budgeted_amount > 0 THEN
        CASE
          WHEN (COALESCE(SUM(t.amount), 0) / bc.budgeted_amount * 100) < 80 THEN 'on_track'
          WHEN (COALESCE(SUM(t.amount), 0) / bc.budgeted_amount * 100) < 100 THEN 'warning'
          ELSE 'alert'
        END
      ELSE 'on_track'
    END AS status
  FROM public.budget_categories bc
  JOIN public.budgets b ON b.id = bc.budget_id
  JOIN public.categories c ON c.id = bc.category_id
  LEFT JOIN public.transactions t
    ON t.user_id = b.user_id
    -- Use user override if set, otherwise use auto-categorized app_category_id
    AND COALESCE(t.user_category_override_id, t.app_category_id) = bc.category_id
    AND EXTRACT(MONTH FROM t.date) = b.month
    AND EXTRACT(YEAR FROM t.date) = b.year
    AND t.tag_ignored = FALSE
    AND t.amount > 0  -- Only count expenses (positive amounts)
  WHERE b.user_id = p_user_id
    AND b.month = p_month
    AND b.year = p_year
  GROUP BY bc.id, bc.category_id, c.display_name, bc.budgeted_amount
  ORDER BY percentage_used DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_budget_utilization IS
  'Calculate budget utilization by category for a specific month. Uses category FK for accurate matching.';

-- ============================================================================
-- VALIDATION QUERIES (run after migration)
-- ============================================================================

-- These are commented out but can be run manually to verify migration success

-- -- 1. Check all transactions have valid app_category_id
-- SELECT COUNT(*) AS invalid_transactions
-- FROM transactions
-- WHERE app_category_id IS NULL;
-- -- Expected: 0

-- -- 2. Check all budget_categories have valid category_id
-- SELECT COUNT(*) AS invalid_budget_categories
-- FROM budget_categories
-- WHERE category_id IS NULL;
-- -- Expected: 0

-- -- 3. Verify category mappings are working
-- SELECT
--   c.display_name,
--   COUNT(t.id) AS transaction_count
-- FROM categories c
-- LEFT JOIN transactions t ON COALESCE(t.user_category_override_id, t.app_category_id) = c.id
-- GROUP BY c.id, c.display_name
-- ORDER BY c.display_order;

-- -- 4. Test budget utilization calculation
-- -- Replace with actual user_id, month, year
-- -- SELECT * FROM calculate_budget_utilization(
-- --   'user-uuid-here'::UUID,
-- --   10,  -- month
-- --   2025 -- year
-- -- );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251025120000_add_category_management.sql completed successfully';
  RAISE NOTICE 'Phase 1: Created categories and plaid_category_mappings tables';
  RAISE NOTICE 'Phase 2: Added category FKs to transactions and budget_categories';
  RAISE NOTICE 'All existing data has been backfilled with category references';
  RAISE NOTICE 'Next steps: Update service layer to use category FKs (see plan.md)';
END $$;
