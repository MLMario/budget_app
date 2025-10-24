-- AI-Powered Budget App - Seed Data
-- Version: 1.0.0
-- Created: 2025-10-23
-- Description: Test data with 3 users, bank connections, realistic transactions, budgets, goals, and AI reports

-- ============================================================================
-- Test Users (Created via Supabase Auth)
-- ============================================================================
-- Note: In development, create these users via Supabase Auth:
-- 1. alice@example.com (password: TestPassword123!)
-- 2. bob@example.com (password: TestPassword123!)
-- 3. charlie@example.com (password: TestPassword123!)
--
-- For seeding, we'll use hardcoded UUIDs that should match auth.users
-- In a real setup, these would be created through the auth system first

-- Create test users in auth.users table
-- Note: These are simplified test users. In production, users would be created via Supabase Auth API
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    'alice@example.com',
    crypt('TestPassword123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    FALSE,
    'authenticated',
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000002'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    'bob@example.com',
    crypt('TestPassword123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    FALSE,
    'authenticated',
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000003'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    'charlie@example.com',
    crypt('TestPassword123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    FALSE,
    'authenticated',
    'authenticated'
  )
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  alice_id UUID := '00000000-0000-0000-0000-000000000001';
  bob_id UUID := '00000000-0000-0000-0000-000000000002';
  charlie_id UUID := '00000000-0000-0000-0000-000000000003';
BEGIN
  RAISE NOTICE 'Created test users:';
  RAISE NOTICE 'Alice: %', alice_id;
  RAISE NOTICE 'Bob: %', bob_id;
  RAISE NOTICE 'Charlie: %', charlie_id;
END $$;

-- ============================================================================
-- User Preferences
-- ============================================================================
INSERT INTO public.user_preferences (user_id, preferences_text, notification_email_weekly, notification_email_monthly, notification_budget_warning, notification_budget_alert)
VALUES
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Coffee shop visits are important for my mental health and productivity. I work from cafes 3-4 times per week. I am trying to save for a vacation to Japan next summer. I want to reduce dining out expenses but not coffee.', TRUE, TRUE, TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000002'::UUID, 'I am focused on paying off my credit card debt. Gym membership is non-negotiable for my health. I cook at home most days to save money.', TRUE, TRUE, TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000003'::UUID, 'Building an emergency fund is my top priority. I have a family so groceries are a major expense. Entertainment spending is mostly for kids activities.', TRUE, FALSE, TRUE, TRUE);

-- ============================================================================
-- Bank Connections
-- ============================================================================
INSERT INTO public.bank_connections (id, user_id, plaid_access_token, plaid_item_id, institution_name, account_type, connection_status, last_sync_date)
VALUES
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'access-sandbox-alice-checking', 'item_alice_checking', 'Chase Bank', 'checking', 'active', NOW() - INTERVAL '2 hours'),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'access-sandbox-alice-credit', 'item_alice_credit', 'Capital One', 'credit_card', 'active', NOW() - INTERVAL '2 hours'),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000002'::UUID, 'access-sandbox-bob-checking', 'item_bob_checking', 'Bank of America', 'checking', 'active', NOW() - INTERVAL '5 hours'),
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000002'::UUID, 'access-sandbox-bob-savings', 'item_bob_savings', 'Bank of America', 'savings', 'active', NOW() - INTERVAL '5 hours'),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000003'::UUID, 'access-sandbox-charlie-checking', 'item_charlie_checking', 'Wells Fargo', 'checking', 'active', NOW() - INTERVAL '1 day'),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000003'::UUID, 'access-sandbox-charlie-credit', 'item_charlie_credit', 'American Express', 'credit_card', 'needs_reauth', NOW() - INTERVAL '7 days');

-- ============================================================================
-- Transactions - Alice (Coffee lover, saving for Japan trip)
-- ============================================================================
-- Current month (October 2025) - 23 days of data
INSERT INTO public.transactions (user_id, bank_connection_id, plaid_transaction_id, merchant_name, amount, date, pending, payment_channel, category_primary, category_detailed, user_category_override, tag_non_negotiable, notes, iso_currency_code)
VALUES
  -- Week 1 (Oct 1-7)
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_001', 'Starbucks', 6.75, '2025-10-01', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE', 'Dining Out', TRUE, 'Morning coffee - working session', 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_002', 'Whole Foods', 87.34, '2025-10-02', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES', 'Groceries', FALSE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_003', 'Blue Bottle Coffee', 8.50, '2025-10-03', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE', 'Dining Out', TRUE, 'Afternoon work session', 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000002'::UUID, 'plaid_tx_alice_004', 'Amazon', 45.99, '2025-10-03', FALSE, 'online', 'GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_ONLINE', 'Shopping', FALSE, 'Books and office supplies', 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_005', 'Chipotle', 12.85, '2025-10-04', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_RESTAURANTS', 'Dining Out', FALSE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_006', 'Philz Coffee', 7.25, '2025-10-05', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE', 'Dining Out', TRUE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000002'::UUID, 'plaid_tx_alice_007', 'Netflix', 15.49, '2025-10-06', FALSE, 'online', 'ENTERTAINMENT', 'ENTERTAINMENT_STREAMING', 'Entertainment', FALSE, 'Monthly subscription', 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_008', 'Trader Joes', 63.21, '2025-10-07', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES', 'Groceries', FALSE, NULL, 'USD'),

  -- Week 2 (Oct 8-14)
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_009', 'Starbucks', 6.75, '2025-10-08', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE', 'Dining Out', TRUE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_010', 'Shell Gas Station', 52.00, '2025-10-09', FALSE, 'in_store', 'TRANSPORTATION', 'TRANSPORTATION_GAS', 'Transportation', FALSE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_011', 'Blue Bottle Coffee', 8.50, '2025-10-10', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE', 'Dining Out', TRUE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000002'::UUID, 'plaid_tx_alice_012', 'Target', 78.45, '2025-10-11', FALSE, 'in_store', 'GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_RETAIL', 'Shopping', FALSE, 'Household items', 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_013', 'Sushi Restaurant', 35.60, '2025-10-12', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_RESTAURANTS', 'Dining Out', FALSE, 'Dinner with friend', 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_014', 'Whole Foods', 92.18, '2025-10-13', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES', 'Groceries', FALSE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_015', 'Philz Coffee', 7.25, '2025-10-14', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE', 'Dining Out', TRUE, NULL, 'USD'),

  -- Week 3 (Oct 15-21)
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_016', 'PG&E', 125.00, '2025-10-15', FALSE, 'online', 'RENT_AND_UTILITIES', 'UTILITIES_ELECTRIC', 'Utilities', FALSE, 'Electric bill', 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_017', 'Starbucks', 6.75, '2025-10-16', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE', 'Dining Out', TRUE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000002'::UUID, 'plaid_tx_alice_018', 'Spotify', 10.99, '2025-10-17', FALSE, 'online', 'ENTERTAINMENT', 'ENTERTAINMENT_STREAMING', 'Entertainment', FALSE, 'Monthly subscription', 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_019', 'Blue Bottle Coffee', 8.50, '2025-10-18', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE', 'Dining Out', TRUE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_020', 'Trader Joes', 71.50, '2025-10-19', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES', 'Groceries', FALSE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_021', 'Thai Restaurant', 28.75, '2025-10-20', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_RESTAURANTS', 'Dining Out', FALSE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_022', 'CVS Pharmacy', 34.50, '2025-10-21', FALSE, 'in_store', 'MEDICAL', 'MEDICAL_PHARMACY', 'Healthcare', FALSE, 'Prescriptions', 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_023', 'Philz Coffee', 7.25, '2025-10-22', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE', 'Dining Out', TRUE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000001'::UUID, 'plaid_tx_alice_024', 'Uber', 18.50, '2025-10-23', FALSE, 'online', 'TRANSPORTATION', 'TRANSPORTATION_RIDESHARE', 'Transportation', FALSE, NULL, 'USD');

-- ============================================================================
-- Transactions - Bob (Focused on debt payoff, gym is non-negotiable)
-- ============================================================================
INSERT INTO public.transactions (user_id, bank_connection_id, plaid_transaction_id, merchant_name, amount, date, pending, payment_channel, category_primary, category_detailed, user_category_override, tag_non_negotiable, notes, iso_currency_code)
VALUES
  ('00000000-0000-0000-0000-000000000002'::UUID, '10000000-0000-0000-0000-000000000003'::UUID, 'plaid_tx_bob_001', '24 Hour Fitness', 79.99, '2025-10-01', FALSE, 'online', 'GENERAL_SERVICES', 'GENERAL_SERVICES_GYM', 'Entertainment', TRUE, 'Monthly gym membership - health priority', 'USD'),
  ('00000000-0000-0000-0000-000000000002'::UUID, '10000000-0000-0000-0000-000000000003'::UUID, 'plaid_tx_bob_002', 'Safeway', 125.40, '2025-10-03', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES', 'Groceries', FALSE, 'Weekly groceries', 'USD'),
  ('00000000-0000-0000-0000-000000000002'::UUID, '10000000-0000-0000-0000-000000000003'::UUID, 'plaid_tx_bob_003', 'Credit Card Payment', 500.00, '2025-10-05', FALSE, 'online', 'LOAN_PAYMENTS', 'LOAN_PAYMENTS_CREDIT_CARD', 'Other', FALSE, 'Debt payoff payment', 'USD'),
  ('00000000-0000-0000-0000-000000000002'::UUID, '10000000-0000-0000-0000-000000000003'::UUID, 'plaid_tx_bob_004', 'Shell Gas Station', 45.00, '2025-10-06', FALSE, 'in_store', 'TRANSPORTATION', 'TRANSPORTATION_GAS', 'Transportation', FALSE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000002'::UUID, '10000000-0000-0000-0000-000000000003'::UUID, 'plaid_tx_bob_005', 'Chipotle', 11.50, '2025-10-07', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_RESTAURANTS', 'Dining Out', FALSE, 'Occasional treat', 'USD'),
  ('00000000-0000-0000-0000-000000000002'::UUID, '10000000-0000-0000-0000-000000000003'::UUID, 'plaid_tx_bob_006', 'Safeway', 98.75, '2025-10-10', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES', 'Groceries', FALSE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000002'::UUID, '10000000-0000-0000-0000-000000000003'::UUID, 'plaid_tx_bob_007', 'Netflix', 15.49, '2025-10-12', FALSE, 'online', 'ENTERTAINMENT', 'ENTERTAINMENT_STREAMING', 'Entertainment', FALSE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000002'::UUID, '10000000-0000-0000-0000-000000000003'::UUID, 'plaid_tx_bob_008', 'AT&T', 85.00, '2025-10-14', FALSE, 'online', 'RENT_AND_UTILITIES', 'UTILITIES_PHONE', 'Utilities', FALSE, 'Phone bill', 'USD'),
  ('00000000-0000-0000-0000-000000000002'::UUID, '10000000-0000-0000-0000-000000000003'::UUID, 'plaid_tx_bob_009', 'Safeway', 112.30, '2025-10-17', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES', 'Groceries', FALSE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000002'::UUID, '10000000-0000-0000-0000-000000000003'::UUID, 'plaid_tx_bob_010', 'Shell Gas Station', 48.00, '2025-10-18', FALSE, 'in_store', 'TRANSPORTATION', 'TRANSPORTATION_GAS', 'Transportation', FALSE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000002'::UUID, '10000000-0000-0000-0000-000000000003'::UUID, 'plaid_tx_bob_011', 'Home Depot', 56.78, '2025-10-20', FALSE, 'in_store', 'HOME_IMPROVEMENT', 'HOME_IMPROVEMENT_HARDWARE', 'Shopping', FALSE, 'Home repairs', 'USD'),
  ('00000000-0000-0000-0000-000000000002'::UUID, '10000000-0000-0000-0000-000000000003'::UUID, 'plaid_tx_bob_012', 'Electric Company', 110.00, '2025-10-22', FALSE, 'online', 'RENT_AND_UTILITIES', 'UTILITIES_ELECTRIC', 'Utilities', FALSE, NULL, 'USD');

-- ============================================================================
-- Transactions - Charlie (Building emergency fund, family with kids)
-- ============================================================================
INSERT INTO public.transactions (user_id, bank_connection_id, plaid_transaction_id, merchant_name, amount, date, pending, payment_channel, category_primary, category_detailed, user_category_override, tag_non_negotiable, notes, iso_currency_code)
VALUES
  ('00000000-0000-0000-0000-000000000003'::UUID, '10000000-0000-0000-0000-000000000005'::UUID, 'plaid_tx_charlie_001', 'Costco', 245.80, '2025-10-02', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES', 'Groceries', FALSE, 'Big family grocery run', 'USD'),
  ('00000000-0000-0000-0000-000000000003'::UUID, '10000000-0000-0000-0000-000000000005'::UUID, 'plaid_tx_charlie_002', 'Kids Soccer League', 150.00, '2025-10-03', FALSE, 'online', 'ENTERTAINMENT', 'ENTERTAINMENT_SPORTS', 'Entertainment', TRUE, 'Kids activity - important', 'USD'),
  ('00000000-0000-0000-0000-000000000003'::UUID, '10000000-0000-0000-0000-000000000005'::UUID, 'plaid_tx_charlie_003', 'Shell Gas Station', 65.00, '2025-10-04', FALSE, 'in_store', 'TRANSPORTATION', 'TRANSPORTATION_GAS', 'Transportation', FALSE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000003'::UUID, '10000000-0000-0000-0000-000000000006'::UUID, 'plaid_tx_charlie_004', 'Target', 134.55, '2025-10-05', FALSE, 'in_store', 'GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_RETAIL', 'Shopping', FALSE, 'Kids clothes and supplies', 'USD'),
  ('00000000-0000-0000-0000-000000000003'::UUID, '10000000-0000-0000-0000-000000000005'::UUID, 'plaid_tx_charlie_005', 'Pizza Hut', 42.50, '2025-10-06', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_RESTAURANTS', 'Dining Out', FALSE, 'Family dinner', 'USD'),
  ('00000000-0000-0000-0000-000000000003'::UUID, '10000000-0000-0000-0000-000000000005'::UUID, 'plaid_tx_charlie_006', 'Pediatrician', 75.00, '2025-10-08', FALSE, 'in_store', 'MEDICAL', 'MEDICAL_SERVICES', 'Healthcare', FALSE, 'Kids checkup copay', 'USD'),
  ('00000000-0000-0000-0000-000000000003'::UUID, '10000000-0000-0000-0000-000000000005'::UUID, 'plaid_tx_charlie_007', 'Costco', 198.40, '2025-10-09', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES', 'Groceries', FALSE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000003'::UUID, '10000000-0000-0000-0000-000000000005'::UUID, 'plaid_tx_charlie_008', 'Comcast', 120.00, '2025-10-10', FALSE, 'online', 'RENT_AND_UTILITIES', 'UTILITIES_INTERNET', 'Utilities', FALSE, 'Internet bill', 'USD'),
  ('00000000-0000-0000-0000-000000000003'::UUID, '10000000-0000-0000-0000-000000000005'::UUID, 'plaid_tx_charlie_009', 'Shell Gas Station', 68.00, '2025-10-12', FALSE, 'in_store', 'TRANSPORTATION', 'TRANSPORTATION_GAS', 'Transportation', FALSE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000003'::UUID, '10000000-0000-0000-0000-000000000006'::UUID, 'plaid_tx_charlie_010', 'Disney+', 13.99, '2025-10-13', FALSE, 'online', 'ENTERTAINMENT', 'ENTERTAINMENT_STREAMING', 'Entertainment', FALSE, 'Family entertainment', 'USD'),
  ('00000000-0000-0000-0000-000000000003'::UUID, '10000000-0000-0000-0000-000000000005'::UUID, 'plaid_tx_charlie_011', 'Costco', 215.75, '2025-10-16', FALSE, 'in_store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES', 'Groceries', FALSE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000003'::UUID, '10000000-0000-0000-0000-000000000005'::UUID, 'plaid_tx_charlie_012', 'AMC Theaters', 68.00, '2025-10-18', FALSE, 'in_store', 'ENTERTAINMENT', 'ENTERTAINMENT_MOVIES', 'Entertainment', FALSE, 'Family movie night', 'USD'),
  ('00000000-0000-0000-0000-000000000003'::UUID, '10000000-0000-0000-0000-000000000005'::UUID, 'plaid_tx_charlie_013', 'Electric Company', 185.00, '2025-10-20', FALSE, 'online', 'RENT_AND_UTILITIES', 'UTILITIES_ELECTRIC', 'Utilities', FALSE, NULL, 'USD'),
  ('00000000-0000-0000-0000-000000000003'::UUID, '10000000-0000-0000-0000-000000000005'::UUID, 'plaid_tx_charlie_014', 'Shell Gas Station', 72.00, '2025-10-22', FALSE, 'in_store', 'TRANSPORTATION', 'TRANSPORTATION_GAS', 'Transportation', FALSE, NULL, 'USD');

-- ============================================================================
-- Budgets - Current Month (October 2025)
-- ============================================================================
INSERT INTO public.budgets (id, user_id, month, year)
VALUES
  ('20000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 10, 2025),
  ('20000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000002'::UUID, 10, 2025),
  ('20000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000003'::UUID, 10, 2025);

-- ============================================================================
-- Budget Categories - Alice
-- ============================================================================
INSERT INTO public.budget_categories (budget_id, category_name, budgeted_amount)
VALUES
  ('20000000-0000-0000-0000-000000000001'::UUID, 'Groceries', 400.00),
  ('20000000-0000-0000-0000-000000000001'::UUID, 'Dining Out', 200.00),
  ('20000000-0000-0000-0000-000000000001'::UUID, 'Transportation', 150.00),
  ('20000000-0000-0000-0000-000000000001'::UUID, 'Entertainment', 100.00),
  ('20000000-0000-0000-0000-000000000001'::UUID, 'Utilities', 200.00),
  ('20000000-0000-0000-0000-000000000001'::UUID, 'Healthcare', 75.00),
  ('20000000-0000-0000-0000-000000000001'::UUID, 'Shopping', 250.00),
  ('20000000-0000-0000-0000-000000000001'::UUID, 'Other', 100.00);

-- ============================================================================
-- Budget Categories - Bob
-- ============================================================================
INSERT INTO public.budget_categories (budget_id, category_name, budgeted_amount)
VALUES
  ('20000000-0000-0000-0000-000000000002'::UUID, 'Groceries', 500.00),
  ('20000000-0000-0000-0000-000000000002'::UUID, 'Dining Out', 50.00),
  ('20000000-0000-0000-0000-000000000002'::UUID, 'Transportation', 200.00),
  ('20000000-0000-0000-0000-000000000002'::UUID, 'Entertainment', 150.00),
  ('20000000-0000-0000-0000-000000000002'::UUID, 'Utilities', 300.00),
  ('20000000-0000-0000-0000-000000000002'::UUID, 'Healthcare', 50.00),
  ('20000000-0000-0000-0000-000000000002'::UUID, 'Shopping', 100.00),
  ('20000000-0000-0000-0000-000000000002'::UUID, 'Other', 600.00);

-- ============================================================================
-- Budget Categories - Charlie
-- ============================================================================
INSERT INTO public.budget_categories (budget_id, category_name, budgeted_amount)
VALUES
  ('20000000-0000-0000-0000-000000000003'::UUID, 'Groceries', 800.00),
  ('20000000-0000-0000-0000-000000000003'::UUID, 'Dining Out', 150.00),
  ('20000000-0000-0000-0000-000000000003'::UUID, 'Transportation', 300.00),
  ('20000000-0000-0000-0000-000000000003'::UUID, 'Entertainment', 300.00),
  ('20000000-0000-0000-0000-000000000003'::UUID, 'Utilities', 400.00),
  ('20000000-0000-0000-0000-000000000003'::UUID, 'Healthcare', 200.00),
  ('20000000-0000-0000-0000-000000000003'::UUID, 'Shopping', 250.00),
  ('20000000-0000-0000-0000-000000000003'::UUID, 'Other', 100.00);

-- ============================================================================
-- Goals
-- ============================================================================
INSERT INTO public.goals (user_id, name, goal_type, target_amount, target_date, priority, status)
VALUES
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Japan Vacation Fund', 'savings', 5000.00, '2026-07-01', 'high', 'active'),
  ('00000000-0000-0000-0000-000000000002'::UUID, 'Pay Off Credit Card', 'debt_payoff', 8000.00, '2026-06-30', 'high', 'active'),
  ('00000000-0000-0000-0000-000000000002'::UUID, 'Reduce Dining Out', 'spending_limit', 50.00, '2025-12-31', 'medium', 'active'),
  ('00000000-0000-0000-0000-000000000003'::UUID, 'Emergency Fund', 'savings', 10000.00, '2026-12-31', 'high', 'active'),
  ('00000000-0000-0000-0000-000000000003'::UUID, 'Limit Entertainment Spending', 'spending_limit', 300.00, '2025-12-31', 'low', 'active');

-- ============================================================================
-- AI Analysis Reports - Sample Weekly Report (Alice)
-- ============================================================================
INSERT INTO public.ai_analysis_reports (id, user_id, report_type, analysis_period_start, analysis_period_end, trajectory_prediction, recommendations, confidence_level)
VALUES
  (
    '30000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'weekly',
    '2025-10-01',
    '2025-10-07',
    '{"projected_total": 1450.00, "budget_total": 1475.00, "difference": 25.00, "status": "under_budget", "likelihood_percentage": 85}'::JSONB,
    '[
      {
        "id": "rec_1",
        "action": "Reduce coffee shop visits by 1 per week",
        "category": "Dining Out",
        "expected_savings": 30.00,
        "implementation": "Visit coffee shops 3 times instead of 4 this week. Your preference for coffee shop work sessions is respected - this is a minor adjustment.",
        "effort_level": "easy",
        "preferences_respected": ["Respects your preference that coffee shop visits are important for mental health"],
        "rank": 1,
        "affected_transaction_ids": ["plaid_tx_alice_001", "plaid_tx_alice_003", "plaid_tx_alice_006"]
      },
      {
        "id": "rec_2",
        "action": "Cook dinner at home instead of dining out once",
        "category": "Dining Out",
        "expected_savings": 35.00,
        "implementation": "Plan one home-cooked meal to replace a restaurant visit this week.",
        "effort_level": "medium",
        "preferences_respected": [],
        "rank": 2,
        "affected_transaction_ids": ["plaid_tx_alice_005"]
      }
    ]'::JSONB,
    85
  );

-- ============================================================================
-- AI Analysis Reports - Sample Monthly Report (Bob)
-- ============================================================================
INSERT INTO public.ai_analysis_reports (id, user_id, report_type, analysis_period_start, analysis_period_end, trajectory_prediction, recommendations, confidence_level)
VALUES
  (
    '30000000-0000-0000-0000-000000000002'::UUID,
    '00000000-0000-0000-0000-000000000002'::UUID,
    'monthly',
    '2025-09-01',
    '2025-09-30',
    NULL,
    '[
      {
        "id": "rec_1",
        "action": "Increase credit card payment by $100/month",
        "category": "Other",
        "expected_savings": 0.00,
        "implementation": "Pay $600 instead of $500 toward credit card to accelerate debt payoff. This aligns with your goal to eliminate credit card debt.",
        "effort_level": "medium",
        "preferences_respected": ["Supports your goal of paying off credit card debt"],
        "rank": 1,
        "affected_transaction_ids": ["plaid_tx_bob_003"]
      },
      {
        "id": "rec_2",
        "action": "Review streaming subscriptions",
        "category": "Entertainment",
        "expected_savings": 15.49,
        "implementation": "Consider canceling Netflix if not actively using it. Keep gym membership as it is non-negotiable for your health.",
        "effort_level": "easy",
        "preferences_respected": ["Respects gym membership as non-negotiable for health"],
        "rank": 2,
        "affected_transaction_ids": ["plaid_tx_bob_007"]
      }
    ]'::JSONB,
    92
  );

-- ============================================================================
-- Recommendation Feedback
-- ============================================================================
INSERT INTO public.recommendation_feedback (user_id, ai_report_id, recommendation_id, feedback_type)
VALUES
  ('00000000-0000-0000-0000-000000000001'::UUID, '30000000-0000-0000-0000-000000000001'::UUID, 'rec_1', 'helpful'),
  ('00000000-0000-0000-0000-000000000001'::UUID, '30000000-0000-0000-0000-000000000001'::UUID, 'rec_2', 'not_helpful'),
  ('00000000-0000-0000-0000-000000000002'::UUID, '30000000-0000-0000-0000-000000000002'::UUID, 'rec_1', 'helpful');

-- ============================================================================
-- Summary Statistics
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Seed Data Summary:';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Users: 3 (alice, bob, charlie)';
  RAISE NOTICE 'Bank Connections: 6 total';
  RAISE NOTICE 'Transactions: % total', (SELECT COUNT(*) FROM public.transactions);
  RAISE NOTICE '  - Alice: % transactions', (SELECT COUNT(*) FROM public.transactions WHERE user_id = '00000000-0000-0000-0000-000000000001');
  RAISE NOTICE '  - Bob: % transactions', (SELECT COUNT(*) FROM public.transactions WHERE user_id = '00000000-0000-0000-0000-000000000002');
  RAISE NOTICE '  - Charlie: % transactions', (SELECT COUNT(*) FROM public.transactions WHERE user_id = '00000000-0000-0000-0000-000000000003');
  RAISE NOTICE 'Budgets: 3 (October 2025)';
  RAISE NOTICE 'Budget Categories: 24 total (8 per user)';
  RAISE NOTICE 'Goals: 5 total';
  RAISE NOTICE 'AI Reports: 2 (1 weekly, 1 monthly)';
  RAISE NOTICE 'Feedback: 3 items';
  RAISE NOTICE '============================================';
END $$;
