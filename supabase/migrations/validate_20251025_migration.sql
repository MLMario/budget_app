-- ============================================================================
-- Validation Script for Migration 20251025120000
-- Run this after applying the category management migration
-- ============================================================================

\echo '============================================'
\echo 'VALIDATION SCRIPT: Category Management Migration'
\echo '============================================'
\echo ''

-- ============================================================================
-- Test 1: Categories Table
-- ============================================================================
\echo '✓ Test 1: Verify categories table exists and has data'

SELECT 'Categories count:' AS test,
       COUNT(*)::TEXT AS result,
       CASE WHEN COUNT(*) = 12 THEN '✅ PASS' ELSE '❌ FAIL - Expected 12 categories' END AS status
FROM categories;

\echo ''

-- ============================================================================
-- Test 2: Plaid Mappings
-- ============================================================================
\echo '✓ Test 2: Verify Plaid category mappings exist'

SELECT 'Plaid mappings count:' AS test,
       COUNT(*)::TEXT AS result,
       CASE WHEN COUNT(*) >= 40 THEN '✅ PASS' ELSE '❌ FAIL - Expected 40+ mappings' END AS status
FROM plaid_category_mappings;

\echo ''

-- ============================================================================
-- Test 3: Transactions Have app_category_id
-- ============================================================================
\echo '✓ Test 3: Verify all transactions have app_category_id'

SELECT 'Transactions missing app_category_id:' AS test,
       COUNT(*)::TEXT AS result,
       CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL - Some transactions have NULL app_category_id' END AS status
FROM transactions
WHERE app_category_id IS NULL;

\echo ''

-- ============================================================================
-- Test 4: Budget Categories Have category_id
-- ============================================================================
\echo '✓ Test 4: Verify all budget_categories have category_id'

SELECT 'Budget categories missing category_id:' AS test,
       COUNT(*)::TEXT AS result,
       CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL - Some budget categories have NULL category_id' END AS status
FROM budget_categories
WHERE category_id IS NULL;

\echo ''

-- ============================================================================
-- Test 5: Foreign Key Integrity
-- ============================================================================
\echo '✓ Test 5: Verify foreign key integrity'

SELECT 'Transactions with invalid app_category_id:' AS test,
       COUNT(*)::TEXT AS result,
       CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL - Some transactions reference non-existent categories' END AS status
FROM transactions t
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.id = t.app_category_id);

\echo ''

SELECT 'Budget categories with invalid category_id:' AS test,
       COUNT(*)::TEXT AS result,
       CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL - Some budget categories reference non-existent categories' END AS status
FROM budget_categories bc
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.id = bc.category_id);

\echo ''

-- ============================================================================
-- Test 6: Indexes Exist
-- ============================================================================
\echo '✓ Test 6: Verify required indexes exist'

SELECT 'Index idx_categories_name:' AS test,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_indexes
         WHERE tablename = 'categories' AND indexname = 'idx_categories_name'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status;

SELECT 'Index idx_transactions_app_category:' AS test,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_indexes
         WHERE tablename = 'transactions' AND indexname = 'idx_transactions_app_category'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status;

SELECT 'Index idx_budget_categories_category:' AS test,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_indexes
         WHERE tablename = 'budget_categories' AND indexname = 'idx_budget_categories_category'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status;

\echo ''

-- ============================================================================
-- Test 7: RLS Policies
-- ============================================================================
\echo '✓ Test 7: Verify RLS policies exist'

SELECT 'RLS enabled on categories:' AS test,
       CASE WHEN relrowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END AS status
FROM pg_class
WHERE relname = 'categories';

SELECT 'RLS enabled on plaid_category_mappings:' AS test,
       CASE WHEN relrowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END AS status
FROM pg_class
WHERE relname = 'plaid_category_mappings';

\echo ''

-- ============================================================================
-- Test 8: Function Exists
-- ============================================================================
\echo '✓ Test 8: Verify calculate_budget_utilization function exists'

SELECT 'Function calculate_budget_utilization:' AS test,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_proc
         WHERE proname = 'calculate_budget_utilization'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status;

\echo ''

-- ============================================================================
-- Test 9: Category Distribution
-- ============================================================================
\echo '✓ Test 9: View category distribution across transactions'
\echo '(This shows how transactions are distributed across categories)'
\echo ''

SELECT
  c.display_name AS category,
  COUNT(t.id) AS transaction_count,
  COALESCE(SUM(t.amount), 0)::NUMERIC(10,2) AS total_amount
FROM categories c
LEFT JOIN transactions t
  ON COALESCE(t.user_category_override_id, t.app_category_id) = c.id
GROUP BY c.id, c.display_name
ORDER BY transaction_count DESC;

\echo ''

-- ============================================================================
-- Test 10: Unmapped Plaid Categories
-- ============================================================================
\echo '✓ Test 10: Check for unmapped Plaid categories'
\echo '(These transactions were mapped to "Other" - may need specific mappings)'
\echo ''

SELECT
  t.category_primary,
  t.category_detailed,
  COUNT(*) AS transaction_count
FROM transactions t
WHERE t.app_category_id = (SELECT id FROM categories WHERE name = 'other')
  AND t.category_primary IS NOT NULL
  AND t.category_primary != 'OTHER'
GROUP BY t.category_primary, t.category_detailed
ORDER BY transaction_count DESC
LIMIT 10;

\echo ''

-- ============================================================================
-- Test 11: Budget Category Mappings
-- ============================================================================
\echo '✓ Test 11: View budget category mappings (old name → new FK)'
\echo '(Verify that budget categories were mapped correctly)'
\echo ''

SELECT
  bc.category_name AS old_text_field,
  c.display_name AS new_category_fk,
  COUNT(*) AS budget_count
FROM budget_categories bc
JOIN categories c ON c.id = bc.category_id
GROUP BY bc.category_name, c.display_name
ORDER BY budget_count DESC
LIMIT 20;

\echo ''

-- ============================================================================
-- Summary
-- ============================================================================
\echo '============================================'
\echo 'VALIDATION SUMMARY'
\echo '============================================'
\echo ''
\echo 'If all tests show ✅ PASS or ✅ EXISTS, the migration was successful!'
\echo ''
\echo 'Next steps:'
\echo '1. Review category distribution in Test 9'
\echo '2. Check unmapped Plaid categories in Test 10'
\echo '3. Verify budget category mappings in Test 11'
\echo '4. Update service layer to use category FKs'
\echo '5. Update UI to use category picker'
\echo ''
\echo 'For detailed documentation, see: supabase/migrations/MIGRATION_GUIDE_20251025.md'
\echo '============================================'
