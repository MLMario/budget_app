/**
 * E2E Test Helpers
 *
 * Helper functions for seeding test data in E2E tests
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create a "manual transactions" bank connection for test data
 * This represents manually added transactions (not from Plaid)
 */
export async function createManualBankConnection(userId: string, accessToken: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const { data, error } = await supabase
    .from('bank_connections')
    .insert({
      user_id: userId,
      plaid_access_token: 'manual_entry', // Special token for manual transactions
      plaid_item_id: 'manual_item',
      institution_name: 'Manual Entry',
      connection_status: 'active',
      account_type: 'checking',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating manual bank connection:', error);
    throw error;
  }

  return data.id;
}

/**
 * Create test transactions for a user
 * Seeds realistic transaction data for testing transaction management features
 *
 * Creates DETERMINISTIC test data with guaranteed merchants for reliable E2E tests:
 * - Multiple Starbucks transactions (for search tests)
 * - Transactions across different categories (for filter tests)
 * - Transactions on different dates (for date range tests)
 * - Mix of amounts (for amount filter tests)
 */
export async function createTestTransactions(userId: string, accessToken: string, count: number = 10) {
  // Create client with user's access token to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  // Create a manual bank connection for these test transactions
  const bankConnectionId = await createManualBankConnection(userId, accessToken);

  const now = new Date();

  // GUARANTEED transactions for reliable testing
  // These ensure tests can depend on specific data existing
  // Uses Plaid taxonomy for category_primary/detailed (will be auto-mapped to app categories)
  const guaranteedTransactions = [
    { merchant: 'Starbucks', categoryPrimary: 'FOOD_AND_DRINK', categoryDetailed: 'FOOD_AND_DRINK_COFFEE', amount: 5.50, daysAgo: 1 },
    { merchant: 'Starbucks', categoryPrimary: 'FOOD_AND_DRINK', categoryDetailed: 'FOOD_AND_DRINK_COFFEE', amount: 6.75, daysAgo: 3 },
    { merchant: 'Starbucks', categoryPrimary: 'FOOD_AND_DRINK', categoryDetailed: 'FOOD_AND_DRINK_COFFEE', amount: 4.25, daysAgo: 7 },
    { merchant: 'McDonald\'s', categoryPrimary: 'FOOD_AND_DRINK', categoryDetailed: 'FOOD_AND_DRINK_FAST_FOOD', amount: 12.50, daysAgo: 2 },
    { merchant: 'Uber', categoryPrimary: 'TRANSPORTATION', categoryDetailed: 'TRANSPORTATION_RIDE_SHARE', amount: 25.00, daysAgo: 5 },
    { merchant: 'Netflix', categoryPrimary: 'ENTERTAINMENT', categoryDetailed: 'ENTERTAINMENT_MOVIES_AND_MUSIC', amount: 15.99, daysAgo: 10 },
    { merchant: 'Amazon', categoryPrimary: 'GENERAL_MERCHANDISE', categoryDetailed: 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES', amount: 45.99, daysAgo: 8 },
    { merchant: 'Whole Foods', categoryPrimary: 'FOOD_AND_DRINK', categoryDetailed: 'FOOD_AND_DRINK_GROCERIES', amount: 78.50, daysAgo: 4 },
    { merchant: 'Target', categoryPrimary: 'GENERAL_MERCHANDISE', categoryDetailed: 'GENERAL_MERCHANDISE_DISCOUNT_STORES', amount: 32.25, daysAgo: 6 },
    { merchant: 'Local Restaurant', categoryPrimary: 'FOOD_AND_DRINK', categoryDetailed: 'FOOD_AND_DRINK_RESTAURANTS', amount: 55.00, daysAgo: 9 },
  ];

  const transactions = [];

  // Create guaranteed transactions first
  const guaranteedCount = Math.min(count, guaranteedTransactions.length);
  for (let i = 0; i < guaranteedCount; i++) {
    const txn = guaranteedTransactions[i];
    const date = new Date(now);
    date.setDate(date.getDate() - txn.daysAgo);

    transactions.push({
      user_id: userId,
      bank_connection_id: bankConnectionId,
      date: date.toISOString().split('T')[0],
      merchant_name: txn.merchant,
      amount: txn.amount,
      category_primary: txn.categoryPrimary,
      category_detailed: txn.categoryDetailed,
      plaid_transaction_id: `test_txn_${userId}_${i}_${Date.now()}`,
      payment_channel: 'online',
      pending: false,
      tag_non_negotiable: false,
      tag_ignored: false,
    });
  }

  // Fill remaining with random transactions if count > guaranteed
  // Use Plaid taxonomy for categories (will be auto-mapped)
  const plaidCategories = [
    { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_COFFEE' },
    { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_MOVIES_AND_MUSIC' },
    { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_GAS' },
    { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' },
    { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES' },
  ];
  const randomMerchants = ['Coffee Shop', 'Gas Station', 'Movie Theater', 'Gym', 'Pharmacy'];

  for (let i = guaranteedCount; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    const merchant = randomMerchants[Math.floor(Math.random() * randomMerchants.length)];
    const category = plaidCategories[Math.floor(Math.random() * plaidCategories.length)];
    const amount = parseFloat((Math.random() * 100 + 5).toFixed(2));

    transactions.push({
      user_id: userId,
      bank_connection_id: bankConnectionId,
      date: date.toISOString().split('T')[0],
      merchant_name: merchant,
      amount: amount,
      category_primary: category.primary,
      category_detailed: category.detailed,
      plaid_transaction_id: `test_txn_${userId}_${i}_${Date.now()}`,
      payment_channel: 'online',
      pending: false,
      tag_non_negotiable: false,
      tag_ignored: false,
    });
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert(transactions)
    .select();

  if (error) {
    console.error('Error creating test transactions:', error);
    throw error;
  }

  return data;
}

/**
 * Clean up test transactions for a user
 */
export async function deleteTestTransactions(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting test transactions:', error);
    throw error;
  }
}

/**
 * Create test budget with transactions for E2E testing
 *
 * This helper seeds a complete test environment for budget management tests:
 * - Creates a manual bank connection
 * - Seeds test transactions with known amounts for predictable testing
 * - Returns bankConnectionId for use in tests
 *
 * @param userId - The user ID to create budget data for
 * @param accessToken - Access token for authenticated requests (bypasses RLS)
 * @param options - Optional configuration for test data
 */
export async function createTestBudgetData(
  userId: string,
  accessToken: string,
  options: {
    transactionCount?: number;
    categoryAmounts?: { [key: string]: number };
  } = {}
) {
  const { transactionCount = 0, categoryAmounts = {} } = options;

  // Create client with user's access token to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  // Create a manual bank connection for test transactions
  const bankConnectionId = await createManualBankConnection(userId, accessToken);

  // If transaction count specified, create test transactions
  if (transactionCount > 0) {
    await createTestTransactions(userId, accessToken, transactionCount);
  }

  return { bankConnectionId };
}

/**
 * Insert a single test transaction
 * Useful for budget testing where specific transaction amounts are needed
 *
 * @param userId - The user ID
 * @param accessToken - Access token for authenticated requests
 * @param bankConnectionId - The bank connection ID to associate with
 * @param transaction - Transaction data
 */
export async function insertTestTransaction(
  userId: string,
  accessToken: string,
  bankConnectionId: string,
  transaction: {
    merchant_name: string;
    amount: number;
    category_primary: string;
    category_detailed: string;
    date?: string;
  }
) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase.from('transactions').insert({
    user_id: userId,
    bank_connection_id: bankConnectionId,
    date: transaction.date || today,
    merchant_name: transaction.merchant_name,
    amount: transaction.amount,
    category_primary: transaction.category_primary,
    category_detailed: transaction.category_detailed,
    plaid_transaction_id: `test_${transaction.merchant_name.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`,
    payment_channel: 'online',
    pending: false,
    tag_non_negotiable: false,
    tag_ignored: false,
  }).select();

  if (error) {
    console.error('Error inserting test transaction:', error);
    throw error;
  }

  return data?.[0];
}

/**
 * Extract budget amount for a specific category card from the UI
 * @param page - The Playwright page object
 * @param categoryId - The UUID of the category
 * @returns The budget amount as a number
 */
export async function extractBudgetAmount(page: any, categoryId: string): Promise<number> {
  const card = page.locator(`[data-testid="budget-category-card-${categoryId}"]`);
  const budgetedAmountText = await card.locator('[data-testid="budgeted-amount"]').textContent();
  return parseFloat(budgetedAmountText?.match(/\$[\d,]+/)?.[0].replace(/[$,]/g, '') || '0');
}

/**
 * Extract total budget amount from the UI
 * @param page - The Playwright page object
 * @returns The total budget amount as a number
 */
export async function extractTotalBudget(page: any): Promise<number> {
  const totalBudgetText = await page.locator('[data-testid="total-budget-amount"]').textContent();
  return parseFloat(totalBudgetText?.replace(/[$,]/g, '') || '0');
}

/**
 * Insert a test transaction with optional percentage-based calculation
 * @param userId - The user ID
 * @param accessToken - Access token for authenticated requests
 * @param bankConnectionId - The bank connection ID
 * @param page - The Playwright page object (for percentage calculations)
 * @param transaction - Transaction data
 * @param percentageOfBudget - Optional percentage of budget to calculate amount
 */
export async function insertTestTransactionWithPercentage(
  userId: string,
  accessToken: string,
  bankConnectionId: string,
  page: any,
  transaction: {
    merchant_name: string;
    amount?: number;
    category_primary: string;
    category_detailed: string;
    category_id?: string;
    date?: string;
  },
  percentageOfBudget?: number
) {
  let finalAmount = transaction.amount;

  // If percentage specified and category_id provided, calculate amount based on budget
  if (percentageOfBudget !== undefined && transaction.category_id) {
    const budgetAmount = await extractBudgetAmount(page, transaction.category_id);
    finalAmount = budgetAmount * percentageOfBudget;
  }

  // Use the existing insertTestTransaction function with calculated amount
  return insertTestTransaction(userId, accessToken, bankConnectionId, {
    merchant_name: transaction.merchant_name,
    amount: finalAmount!,
    category_primary: transaction.category_primary,
    category_detailed: transaction.category_detailed,
    date: transaction.date,
  });
}