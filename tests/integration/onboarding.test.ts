import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { signUp } from '@/services/auth.service';
import { createLinkToken, exchangePublicToken, syncTransactions } from '@/services/plaid.service';
import { importTransactions } from '@/services/transaction.service';
import { suggestBudgetAmounts, createBudget } from '@/services/budget.service';

describe('Onboarding Flow Integration', () => {
  let testUserId: string;
  let testEmail: string;

  beforeEach(() => {
    testEmail = `test-${Date.now()}@example.com`;
  });

  afterEach(async () => {
    // Cleanup test data
    // TODO: Implement cleanup function
  });

  it('should complete full onboarding flow: signup → Plaid connect → transaction import → budget creation', async () => {
    // This test should FAIL until T047 is complete and all services are implemented

    // Step 1: Sign up
    const signUpResult = await signUp(testEmail, 'SecurePassword123!');
    expect(signUpResult.user).toBeDefined();
    expect(signUpResult.error).toBeNull();
    testUserId = signUpResult.user!.id;

    // Step 2: Create Plaid Link token
    const linkTokenResult = await createLinkToken(testUserId);
    expect(linkTokenResult.link_token).toBeDefined();
    expect(linkTokenResult.error).toBeNull();

    // Step 3: Exchange public token (simulate user completing Plaid Link)
    const publicToken = 'public-sandbox-test-token';
    const exchangeResult = await exchangePublicToken(testUserId, publicToken);
    expect(exchangeResult.access_token).toBeDefined();
    expect(exchangeResult.item_id).toBeDefined();
    expect(exchangeResult.bank_connection_id).toBeDefined();
    expect(exchangeResult.error).toBeNull();

    // Step 4: Sync transactions from Plaid
    const bankConnectionId = exchangeResult.bank_connection_id!;
    const syncResult = await syncTransactions(testUserId, bankConnectionId);
    expect(syncResult.added).toBeDefined();
    expect(syncResult.added.length).toBeGreaterThan(0);
    expect(syncResult.error).toBeNull();

    // Step 5: Suggest budget amounts based on transactions
    const suggestedAmounts = await suggestBudgetAmounts(testUserId);
    expect(suggestedAmounts).toBeDefined();
    expect(Object.keys(suggestedAmounts).length).toBeGreaterThan(0);

    // Step 6: Create budget with suggested amounts
    const budgetData = {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      categories: suggestedAmounts,
    };
    const budgetResult = await createBudget(testUserId, budgetData);
    expect(budgetResult.budget_id).toBeDefined();
    expect(budgetResult.error).toBeNull();

    // Verify: Complete flow should take less than 5 minutes (Success Criteria SC-001)
    // In test environment, should complete in < 10 seconds
  });

  it('should handle onboarding with manual skip of bank connection', async () => {
    // This test should FAIL until T047 is complete and skip flow is implemented

    // Step 1: Sign up
    const signUpResult = await signUp(testEmail, 'SecurePassword123!');
    expect(signUpResult.user).toBeDefined();
    testUserId = signUpResult.user!.id;

    // Step 2: Skip bank connection (no Plaid interaction)
    // User proceeds directly to manual budget setup

    // Step 3: Create budget with manual amounts (no suggested amounts)
    const budgetData = {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      categories: {
        'Dining & Coffee': 200,
        'Transportation': 150,
        'Shopping': 300,
        'Housing': 1500,
        'Utilities': 200,
      },
    };
    const budgetResult = await createBudget(testUserId, budgetData);
    expect(budgetResult.budget_id).toBeDefined();
    expect(budgetResult.error).toBeNull();

    // Verify: User can still access dashboard and manually add transactions later
  });

  it('should handle Plaid connection errors gracefully', async () => {
    // This test should FAIL until T047 is complete and error handling is implemented

    // Step 1: Sign up
    const signUpResult = await signUp(testEmail, 'SecurePassword123!');
    expect(signUpResult.user).toBeDefined();
    testUserId = signUpResult.user!.id;

    // Step 2: Try to exchange invalid public token
    const invalidPublicToken = 'invalid-token';
    const exchangeResult = await exchangePublicToken(testUserId, invalidPublicToken);
    expect(exchangeResult.error).toBeDefined();
    expect(exchangeResult.access_token).toBeNull();

    // Verify: User should be able to retry or skip bank connection
  });

  it('should auto-categorize imported transactions during onboarding', async () => {
    // This test should FAIL until T047 is complete and categorization is implemented

    // Step 1: Sign up and connect bank
    const signUpResult = await signUp(testEmail, 'SecurePassword123!');
    testUserId = signUpResult.user!.id;

    const linkTokenResult = await createLinkToken(testUserId);
    const exchangeResult = await exchangePublicToken(testUserId, 'public-sandbox-test-token');
    const bankConnectionId = exchangeResult.bank_connection_id!;

    // Step 2: Sync transactions
    const syncResult = await syncTransactions(testUserId, bankConnectionId);
    expect(syncResult.added.length).toBeGreaterThan(0);

    // Step 3: Verify transactions are categorized
    // Mock Plaid transactions include personal_finance_category
    // Service should map these to app categories
    const categorizedCount = syncResult.added.filter((t: any) => t.category !== 'Uncategorized').length;
    const totalCount = syncResult.added.length;

    // Verify: At least 80% of transactions are auto-categorized
    expect(categorizedCount / totalCount).toBeGreaterThan(0.8);
  });

  it('should create budget suggestions even with few transactions', async () => {
    // This test should FAIL until T047 is complete and suggestion logic handles edge cases

    // Step 1: Sign up and import minimal transactions
    const signUpResult = await signUp(testEmail, 'SecurePassword123!');
    testUserId = signUpResult.user!.id;

    // Simulate importing only 5 transactions
    const minimalTransactions = [
      {
        transaction_id: 'tx-1',
        date: '2025-10-20',
        merchant_name: 'Coffee Shop',
        amount: 5.99,
        personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'COFFEE_SHOPS' },
      },
      {
        transaction_id: 'tx-2',
        date: '2025-10-21',
        merchant_name: 'Gas Station',
        amount: 45.00,
        personal_finance_category: { primary: 'TRANSPORTATION', detailed: 'GAS' },
      },
      {
        transaction_id: 'tx-3',
        date: '2025-10-22',
        merchant_name: 'Grocery Store',
        amount: 87.32,
        personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'GROCERIES' },
      },
      {
        transaction_id: 'tx-4',
        date: '2025-10-23',
        merchant_name: 'Restaurant',
        amount: 32.50,
        personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'RESTAURANTS' },
      },
      {
        transaction_id: 'tx-5',
        date: '2025-10-24',
        merchant_name: 'Target',
        amount: 56.78,
        personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'DEPARTMENT_STORES' },
      },
    ];

    const bankConnectionId = '123e4567-e89b-12d3-a456-426614174001';
    await importTransactions(testUserId, bankConnectionId, minimalTransactions);

    // Step 2: Get budget suggestions
    const suggestedAmounts = await suggestBudgetAmounts(testUserId);
    expect(suggestedAmounts).toBeDefined();
    expect(Object.keys(suggestedAmounts).length).toBeGreaterThan(0);

    // Verify: Should provide reasonable suggestions even with limited data
  });
});
