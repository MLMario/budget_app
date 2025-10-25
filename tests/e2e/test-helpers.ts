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

  const categories = [
    'Dining & Coffee',
    'Entertainment',
    'Transportation',
    'Groceries',
    'Shopping',
  ];

  const merchants = [
    'Starbucks',
    'McDonald\'s',
    'Uber',
    'Netflix',
    'Amazon',
    'Whole Foods',
    'Target',
    'Coffee Shop',
    'Local Restaurant',
    'Gas Station',
  ];

  const transactions = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30); // Random date within last 30 days
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = parseFloat((Math.random() * 100 + 5).toFixed(2)); // $5-$105

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