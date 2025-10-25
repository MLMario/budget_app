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
async function createManualBankConnection(userId: string, accessToken: string) {
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
  const guaranteedTransactions = [
    { merchant: 'Starbucks', category: 'Dining & Coffee', amount: 5.50, daysAgo: 1 },
    { merchant: 'Starbucks', category: 'Dining & Coffee', amount: 6.75, daysAgo: 3 },
    { merchant: 'Starbucks', category: 'Dining & Coffee', amount: 4.25, daysAgo: 7 },
    { merchant: 'McDonald\'s', category: 'Dining & Coffee', amount: 12.50, daysAgo: 2 },
    { merchant: 'Uber', category: 'Transportation', amount: 25.00, daysAgo: 5 },
    { merchant: 'Netflix', category: 'Entertainment', amount: 15.99, daysAgo: 10 },
    { merchant: 'Amazon', category: 'Shopping', amount: 45.99, daysAgo: 8 },
    { merchant: 'Whole Foods', category: 'Groceries', amount: 78.50, daysAgo: 4 },
    { merchant: 'Target', category: 'Shopping', amount: 32.25, daysAgo: 6 },
    { merchant: 'Local Restaurant', category: 'Dining & Coffee', amount: 55.00, daysAgo: 9 },
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
      category_primary: txn.category,
      category_detailed: txn.category,
      plaid_transaction_id: `test_txn_${userId}_${i}_${Date.now()}`,
      payment_channel: 'online',
      pending: false,
      tag_non_negotiable: false,
      tag_ignored: false,
    });
  }

  // Fill remaining with random transactions if count > guaranteed
  const categories = ['Dining & Coffee', 'Entertainment', 'Transportation', 'Groceries', 'Shopping'];
  const randomMerchants = ['Coffee Shop', 'Gas Station', 'Movie Theater', 'Gym', 'Pharmacy'];

  for (let i = guaranteedCount; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    const merchant = randomMerchants[Math.floor(Math.random() * randomMerchants.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = parseFloat((Math.random() * 100 + 5).toFixed(2));

    transactions.push({
      user_id: userId,
      bank_connection_id: bankConnectionId,
      date: date.toISOString().split('T')[0],
      merchant_name: merchant,
      amount: amount,
      category_primary: category,
      category_detailed: category,
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