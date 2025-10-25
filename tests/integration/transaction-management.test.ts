/**
 * T071: Integration Test for Transaction Management Flow
 *
 * Tests the complete transaction management workflow:
 * 1. Recategorize transaction
 * 2. Verify budget updates in real-time
 * 3. Add tags (non-negotiable/ignored)
 * 4. Verify tagged transactions are excluded from budget calculations
 *
 * This test should FAIL until User Story 2 implementation is complete
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  updateCategory,
  addTag,
  getTransactionsByUser,
  importTransactions,
} from '@/services/transaction.service';
import {
  getBudgetByMonth,
  calculateSpending,
  createBudget,
} from '@/services/budget.service';
import { createClient } from '@/lib/supabase/server';

describe('T071 - Transaction Management Integration Flow', () => {
  let testUserId: string;
  let testBankConnectionId: string;
  let testTransactionId: string;
  let supabase: any;

  beforeAll(async () => {
    // Setup test environment
    supabase = await createClient();

    // Create test user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-integration-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });

    if (authError) throw authError;
    testUserId = authData.user.id;

    // Create test bank connection
    const { data: bankConnection, error: bankError } = await supabase
      .from('bank_connections')
      .insert({
        user_id: testUserId,
        plaid_access_token: 'test-access-token',
        plaid_item_id: 'test-item-id',
        institution_name: 'Test Bank',
        account_type: 'checking',
        connection_status: 'active',
      })
      .select()
      .single();

    if (bankError) throw bankError;
    testBankConnectionId = bankConnection.id;

    // Create test budget for current month
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    await createBudget(testUserId, {
      month,
      year,
      categories: [
        { category_name: 'Dining & Coffee', budgeted_amount: 200.00 },
        { category_name: 'Entertainment', budgeted_amount: 150.00 },
        { category_name: 'Transportation', budgeted_amount: 100.00 },
      ],
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUserId && supabase) {
      await supabase.from('transactions').delete().eq('user_id', testUserId);
      await supabase.from('bank_connections').delete().eq('user_id', testUserId);
      await supabase.from('budgets').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  beforeEach(async () => {
    // Import a test transaction before each test
    const plaidTransactions = [{
      transaction_id: `plaid-tx-integration-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      merchant_name: 'Starbucks',
      amount: 25.50,
      personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'COFFEE_SHOPS' },
      payment_channel: 'in_store',
      pending: false,
    }];

    const importResult = await importTransactions(testUserId, testBankConnectionId, plaidTransactions);
    expect(importResult.imported).toBe(1);

    // Get the imported transaction ID
    const transactions = await getTransactionsByUser(testUserId);
    testTransactionId = transactions[0].id;
  });

  describe('Recategorization → Budget Update Flow', () => {
    it('should update budget when transaction is recategorized', async () => {
      // This test should FAIL until T078 + T085 are implemented
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Get initial budget state
      const initialBudget = await getBudgetByMonth(testUserId, month, year);
      const initialDiningSpending = await calculateSpending(testUserId, month, year, 'Dining & Coffee');
      const initialEntertainmentSpending = await calculateSpending(testUserId, month, year, 'Entertainment');

      expect(initialDiningSpending).toBeGreaterThan(0); // Transaction starts in Dining & Coffee
      expect(initialEntertainmentSpending).toBe(0); // No transactions in Entertainment yet

      // Recategorize transaction from Dining & Coffee to Entertainment
      const recategorizeResult = await updateCategory(testUserId, testTransactionId, 'Entertainment');

      expect(recategorizeResult.success).toBe(true);
      expect(recategorizeResult.budgetRecalculated).toBe(true);

      // Verify budget was recalculated
      const updatedDiningSpending = await calculateSpending(testUserId, month, year, 'Dining & Coffee');
      const updatedEntertainmentSpending = await calculateSpending(testUserId, month, year, 'Entertainment');

      // Dining spending should decrease by transaction amount (25.50)
      expect(updatedDiningSpending).toBe(initialDiningSpending - 25.50);

      // Entertainment spending should increase by transaction amount (25.50)
      expect(updatedEntertainmentSpending).toBe(initialEntertainmentSpending + 25.50);
    });

    it('should handle recategorization across months correctly', async () => {
      // This test should FAIL until T078 + T085 are implemented
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Create transaction in previous month
      const previousMonthDate = new Date(currentYear, currentMonth - 2, 15);
      const plaidTransactions = [{
        transaction_id: `plaid-tx-prev-month-${Date.now()}`,
        date: previousMonthDate.toISOString().split('T')[0],
        merchant_name: 'Old Transaction',
        amount: 50.00,
        personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'RESTAURANTS' },
        payment_channel: 'online',
        pending: false,
      }];

      await importTransactions(testUserId, testBankConnectionId, plaidTransactions);

      const transactions = await getTransactionsByUser(testUserId);
      const oldTransactionId = transactions.find(t => t.merchant_name === 'Old Transaction')?.id;

      // Recategorize old transaction
      const result = await updateCategory(testUserId, oldTransactionId!, 'Entertainment');

      expect(result.success).toBe(true);

      // Verify only the previous month's budget was recalculated (not current month)
      expect(result.budgetRecalculated).toBe(true);
    });
  });

  describe('Tagging → Budget Exclusion Flow', () => {
    it('should exclude ignored transactions from budget calculations', async () => {
      // This test should FAIL until T079 + T086 are implemented
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Get initial spending (transaction is included)
      const initialSpending = await calculateSpending(testUserId, month, year, 'Dining & Coffee');
      expect(initialSpending).toBeGreaterThan(0);

      // Tag transaction as ignored
      const tagResult = await addTag(testUserId, testTransactionId, 'ignored');
      expect(tagResult.success).toBe(true);

      // Verify transaction is excluded from budget calculations
      const updatedSpending = await calculateSpending(testUserId, month, year, 'Dining & Coffee');
      expect(updatedSpending).toBe(initialSpending - 25.50); // Transaction amount excluded
    });

    it('should include non-negotiable transactions in budget calculations', async () => {
      // This test should FAIL until T079 is implemented
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Get initial spending
      const initialSpending = await calculateSpending(testUserId, month, year, 'Dining & Coffee');

      // Tag transaction as non-negotiable
      const tagResult = await addTag(testUserId, testTransactionId, 'non-negotiable');
      expect(tagResult.success).toBe(true);

      // Verify transaction is STILL included in budget calculations
      const updatedSpending = await calculateSpending(testUserId, month, year, 'Dining & Coffee');
      expect(updatedSpending).toBe(initialSpending); // No change, still included
    });

    it('should enforce mutual exclusivity between non-negotiable and ignored tags', async () => {
      // This test should FAIL until T079 is implemented
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Tag as non-negotiable first
      await addTag(testUserId, testTransactionId, 'non-negotiable');

      const spendingWithNonNegotiable = await calculateSpending(testUserId, month, year, 'Dining & Coffee');
      expect(spendingWithNonNegotiable).toBeGreaterThan(0); // Included in budget

      // Tag as ignored (should remove non-negotiable tag)
      await addTag(testUserId, testTransactionId, 'ignored');

      const spendingWithIgnored = await calculateSpending(testUserId, month, year, 'Dining & Coffee');
      expect(spendingWithIgnored).toBe(spendingWithNonNegotiable - 25.50); // Now excluded

      // Verify tags are mutually exclusive
      const transactions = await getTransactionsByUser(testUserId);
      const transaction = transactions.find(t => t.id === testTransactionId);
      expect(transaction?.tag_ignored).toBe(true);
      expect(transaction?.tag_non_negotiable).toBe(false);
    });
  });

  describe('Complete Transaction Management Workflow', () => {
    it('should handle complete flow: import → recategorize → tag → budget update', async () => {
      // This test should FAIL until T057, T078, T079, T085, T086 are all implemented
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Step 1: Import transaction (already done in beforeEach)
      const initialTransactions = await getTransactionsByUser(testUserId);
      expect(initialTransactions.length).toBeGreaterThan(0);

      const transaction = initialTransactions.find(t => t.id === testTransactionId);
      expect(transaction?.category_primary).toBe('FOOD_AND_DRINK'); // From Plaid

      // Step 2: Recategorize transaction
      const recategorizeResult = await updateCategory(testUserId, testTransactionId, 'Entertainment');
      expect(recategorizeResult.success).toBe(true);

      // Step 3: Verify budget updated for both categories
      const entertainmentSpending = await calculateSpending(testUserId, month, year, 'Entertainment');
      expect(entertainmentSpending).toBe(25.50); // Transaction moved to Entertainment

      // Step 4: Tag transaction as ignored
      const tagResult = await addTag(testUserId, testTransactionId, 'ignored');
      expect(tagResult.success).toBe(true);

      // Step 5: Verify transaction excluded from budget
      const updatedEntertainmentSpending = await calculateSpending(testUserId, month, year, 'Entertainment');
      expect(updatedEntertainmentSpending).toBe(0); // Transaction excluded

      // Step 6: Verify complete transaction state
      const finalTransactions = await getTransactionsByUser(testUserId);
      const finalTransaction = finalTransactions.find(t => t.id === testTransactionId);

      expect(finalTransaction?.user_category_override).toBe('Entertainment');
      expect(finalTransaction?.tag_ignored).toBe(true);
      expect(finalTransaction?.tag_non_negotiable).toBe(false);
    });

    it('should handle search and filter during workflow', async () => {
      // This test should FAIL until T057 search/filter is implemented
      // Import multiple transactions
      const plaidTransactions = [
        {
          transaction_id: 'plaid-tx-filter-1',
          date: new Date().toISOString().split('T')[0],
          merchant_name: 'Walmart',
          amount: 100.00,
          personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'SUPERSTORES' },
          payment_channel: 'in_store',
          pending: false,
        },
        {
          transaction_id: 'plaid-tx-filter-2',
          date: new Date().toISOString().split('T')[0],
          merchant_name: 'Shell Gas',
          amount: 45.00,
          personal_finance_category: { primary: 'TRANSPORTATION', detailed: 'GAS' },
          payment_channel: 'in_store',
          pending: false,
        },
      ];

      await importTransactions(testUserId, testBankConnectionId, plaidTransactions);

      // Filter by category
      const diningTransactions = await getTransactionsByUser(testUserId, { category: 'Dining & Coffee' });
      expect(diningTransactions.length).toBeGreaterThan(0);
      diningTransactions.forEach(t => expect(t.category).toContain('Dining'));

      // Filter by merchant
      const walmartTransactions = await getTransactionsByUser(testUserId, { merchant: 'Walmart' });
      expect(walmartTransactions.length).toBe(1);
      expect(walmartTransactions[0].merchant_name).toBe('Walmart');

      // Filter by amount range
      const expensiveTransactions = await getTransactionsByUser(testUserId, {
        minAmount: 40.00,
        maxAmount: 150.00,
      });
      expect(expensiveTransactions.length).toBeGreaterThanOrEqual(2);
      expensiveTransactions.forEach(t => {
        expect(t.amount).toBeGreaterThanOrEqual(40.00);
        expect(t.amount).toBeLessThanOrEqual(150.00);
      });
    });
  });
});
