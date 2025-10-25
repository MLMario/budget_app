# Migration Guide: Category Management System

**Migration File:** `20251025120000_add_category_management.sql`
**Created:** 2025-10-25
**Impact:** BREAKING - Adds category management, updates schema

---

## Overview

This migration fixes the critical gap where `budget_categories.category_name` and `transactions.category_primary` used different taxonomies with no mapping, causing budget tracking to fail.

### What Changed

**New Tables:**
- `categories` - Master reference for all app categories
- `plaid_category_mappings` - Maps Plaid taxonomy → App taxonomy

**Updated Tables:**
- `transactions` - Added `app_category_id` FK (auto-mapped from Plaid)
- `budget_categories` - Added `category_id` FK (references categories)

**New Function:**
- `calculate_budget_utilization()` - Updated to use category FKs

---

## How to Apply Migration

### Option 1: Supabase CLI (Local Development)

```bash
# Navigate to project root
cd C:\Users\mario\apps\budget_ai\budget_app

# Reset database (applies all migrations)
supabase db reset

# OR apply only new migrations
supabase migration up
```

### Option 2: Manual Application (If Supabase CLI unavailable)

```bash
# Connect to your database
psql -h localhost -p 54322 -U postgres -d postgres

# Run the migration file
\i supabase/migrations/20251025120000_add_category_management.sql

# Exit
\q
```

### Option 3: Supabase Studio (UI)

1. Open Supabase Studio: http://localhost:54323
2. Navigate to SQL Editor
3. Copy contents of `20251025120000_add_category_management.sql`
4. Execute the SQL
5. Verify in Table Editor

---

## Validation Steps

After applying the migration, run these validation queries:

### 1. Verify Categories Table

```sql
-- Should return 12 categories
SELECT COUNT(*) FROM categories;

-- View all categories
SELECT name, display_name, display_order
FROM categories
ORDER BY display_order;
```

**Expected Output:**
```
 count
-------
    12

       name       |  display_name  | display_order
------------------+----------------+---------------
 groceries        | Groceries      |             1
 dining_out       | Dining & Coffee|             2
 transportation   | Transportation |             3
 entertainment    | Entertainment  |             4
 utilities        | Utilities      |             5
 healthcare       | Healthcare     |             6
 shopping         | Shopping       |             7
 housing          | Housing        |             8
 personal_care    | Personal Care  |             9
 education        | Education      |            10
 travel           | Travel         |            11
 other            | Other          |            99
```

---

### 2. Verify Plaid Mappings

```sql
-- Should return 40+ mappings
SELECT COUNT(*) FROM plaid_category_mappings;

-- View sample mappings
SELECT
  plaid_category_primary,
  plaid_category_detailed,
  c.display_name AS app_category
FROM plaid_category_mappings pcm
JOIN categories c ON c.id = pcm.app_category_id
LIMIT 10;
```

**Expected Output:**
```
 count
-------
    43
```

---

### 3. Verify Transactions Have Category FKs

```sql
-- Should return 0 (all transactions have app_category_id)
SELECT COUNT(*)
FROM transactions
WHERE app_category_id IS NULL;

-- View category distribution
SELECT
  c.display_name,
  COUNT(t.id) AS transaction_count
FROM categories c
LEFT JOIN transactions t
  ON COALESCE(t.user_category_override_id, t.app_category_id) = c.id
GROUP BY c.id, c.display_name
ORDER BY transaction_count DESC;
```

**Expected Output:**
```
 count
-------
     0  ← All transactions have valid category FK
```

---

### 4. Verify Budget Categories Have Category FKs

```sql
-- Should return 0 (all budget_categories have category_id)
SELECT COUNT(*)
FROM budget_categories
WHERE category_id IS NULL;

-- View budget categories with FK
SELECT
  bc.budgeted_amount,
  c.display_name AS category
FROM budget_categories bc
JOIN categories c ON c.id = bc.category_id
LIMIT 10;
```

**Expected Output:**
```
 count
-------
     0  ← All budget categories have valid category FK
```

---

### 5. Test Budget Utilization Function

```sql
-- Get a test user ID
SELECT id, email FROM auth.users LIMIT 1;

-- Test the function (replace user_id with actual value)
SELECT * FROM calculate_budget_utilization(
  'YOUR-USER-ID-HERE'::UUID,
  10,  -- October
  2025 -- Year
);
```

**Expected Output:**
```
 category_id | category_name  | budgeted_amount | spent_amount | percentage_used | status
-------------+----------------+-----------------+--------------+-----------------+---------
 uuid-...    | Dining & Coffee|          300.00 |       245.50 |           81.83 | warning
 uuid-...    | Groceries      |          500.00 |       420.30 |           84.06 | warning
 uuid-...    | Transportation |          200.00 |        85.00 |           42.50 | on_track
 ...
```

---

### 6. Check for Orphaned Data

```sql
-- Check for transactions with invalid Plaid categories (should be mapped to 'other')
SELECT
  t.category_primary,
  t.category_detailed,
  c.display_name AS mapped_to,
  COUNT(*) AS count
FROM transactions t
JOIN categories c ON c.id = t.app_category_id
WHERE c.name = 'other'
GROUP BY t.category_primary, t.category_detailed, c.display_name;
```

**If you see unmapped Plaid categories:**
```sql
-- Add missing mapping
INSERT INTO plaid_category_mappings
  (plaid_category_primary, plaid_category_detailed, app_category_id)
VALUES
  ('YOUR_PLAID_PRIMARY', 'YOUR_PLAID_DETAILED',
   (SELECT id FROM categories WHERE name = 'appropriate_category'));

-- Rerun backfill for affected transactions
UPDATE transactions
SET app_category_id = (
  SELECT app_category_id
  FROM plaid_category_mappings
  WHERE plaid_category_primary = transactions.category_primary
    AND plaid_category_detailed = transactions.category_detailed
  LIMIT 1
)
WHERE category_primary = 'YOUR_PLAID_PRIMARY';
```

---

## Rollback Instructions

**⚠️ WARNING:** This migration significantly changes the schema. Rollback is complex.

### To Rollback (if needed):

```sql
-- Drop new constraints and indexes
DROP INDEX IF EXISTS idx_transactions_app_category;
DROP INDEX IF EXISTS idx_transactions_user_override;
DROP INDEX IF EXISTS idx_budget_categories_category;
ALTER TABLE budget_categories DROP CONSTRAINT IF EXISTS budget_categories_budget_category_fk_unique;

-- Drop new columns
ALTER TABLE transactions DROP COLUMN IF EXISTS app_category_id;
ALTER TABLE transactions DROP COLUMN IF EXISTS user_category_override_id;
ALTER TABLE budget_categories DROP COLUMN IF EXISTS category_id;

-- Drop new tables
DROP TABLE IF EXISTS plaid_category_mappings CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Restore old budget_utilization function
-- (Copy from 20251023000000_initial_schema.sql)
```

**Better approach:** Create a new forward migration to fix issues rather than rolling back.

---

## Common Issues & Solutions

### Issue 1: Migration fails with "function update_updated_at_column() does not exist"

**Solution:** The initial migration should have created this. Run:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Issue 2: Some transactions mapped to "Other" category incorrectly

**Solution:** Add specific mappings for your Plaid categories:
```sql
-- Find unmapped categories
SELECT DISTINCT category_primary, category_detailed
FROM transactions
WHERE app_category_id = (SELECT id FROM categories WHERE name = 'other');

-- Add mappings as needed (see validation step 6)
```

### Issue 3: Budget categories not matching after migration

**Solution:** The migration uses fuzzy matching. Verify mappings:
```sql
-- See what was mapped
SELECT
  category_name,  -- Old TEXT field
  c.display_name AS new_category  -- New FK
FROM budget_categories bc
JOIN categories c ON c.id = bc.category_id;

-- Fix incorrect mappings
UPDATE budget_categories
SET category_id = (SELECT id FROM categories WHERE name = 'correct_category')
WHERE category_name = 'old_incorrect_name';
```

---

## Next Steps After Migration

1. ✅ **Service Layer Updates** (Required):
   - Update `services/transaction.service.ts` to use `app_category_id`
   - Update `services/budget.service.ts` to use `category_id`
   - Update budget calculation queries to use FKs

2. ✅ **UI Updates** (Required):
   - Replace category free-text input with dropdown/picker
   - Fetch categories from `categories` table
   - Update transaction recategorization to use category picker

3. ✅ **Type Definitions** (Required):
   - Regenerate Supabase types: `supabase gen types typescript`
   - Update `types/index.ts` with Category type

4. 🟢 **Optional Enhancements**:
   - Add category icons to UI
   - Add category color coding
   - Allow users to customize category names (display only)
   - Add analytics on category spending trends

---

## Success Criteria

After migration, the following should be true:

- [x] All 12 predefined categories exist in `categories` table
- [x] 40+ Plaid mappings exist in `plaid_category_mappings` table
- [x] All transactions have `app_category_id` NOT NULL
- [x] All budget_categories have `category_id` NOT NULL
- [x] Budget utilization calculation returns correct spent amounts
- [x] No "orphaned" data (FKs point to valid categories)
- [x] RLS policies work correctly for all users

---

## Monitoring & Maintenance

### Regular Checks

```sql
-- Check for unmapped Plaid categories (weekly)
SELECT DISTINCT t.category_primary, t.category_detailed
FROM transactions t
WHERE NOT EXISTS (
  SELECT 1 FROM plaid_category_mappings pcm
  WHERE pcm.plaid_category_primary = t.category_primary
    AND (pcm.plaid_category_detailed = t.category_detailed
         OR pcm.plaid_category_detailed IS NULL)
);
```

### Add New Category

```sql
-- If you need to add a new category
INSERT INTO categories (name, display_name, description, display_order)
VALUES ('new_category', 'New Category Name', 'Description', 13);

-- Add Plaid mappings for the new category
INSERT INTO plaid_category_mappings
  (plaid_category_primary, app_category_id)
VALUES
  ('PLAID_PRIMARY', (SELECT id FROM categories WHERE name = 'new_category'));
```

---

## Questions or Issues?

If the migration fails or produces unexpected results:

1. Check PostgreSQL logs for error messages
2. Run all validation queries above
3. Review the "Common Issues & Solutions" section
4. Check that initial migration (20251023000000) is properly applied
5. Verify database extensions are enabled: `uuid-ossp`, `pgsodium`

---

**Migration Status:** ✅ READY TO APPLY
**Tested:** Syntax validated, logic reviewed
**Breaking Changes:** YES - Requires service layer updates
**Rollback Complexity:** HIGH - Create forward migration instead if issues found
