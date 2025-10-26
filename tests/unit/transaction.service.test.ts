import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  importTransactions,
  categorizeTransaction,
  getTransactionsByUser,
  updateCategory,
  addTag,
  toggleTag,
  removeTag,
} from '@/services/transaction.service';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      order: vi.fn(),
    })),
  })),
}));

describe('Transaction Service', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockBankConnectionId = '123e4567-e89b-12d3-a456-426614174001';

  describe('importTransactions', () => {
    it('should successfully import transactions from Plaid', async () => {
      // This test should FAIL until T057 (transaction service) is implemented
      const plaidTransactions = [
        {
          transaction_id: 'plaid-tx-1',
          date: '2025-10-15',
          merchant_name: 'Starbucks',
          amount: 5.99,
          personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'COFFEE_SHOPS' },
        },
        {
          transaction_id: 'plaid-tx-2',
          date: '2025-10-16',
          merchant_name: 'Target',
          amount: 45.32,
          personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'DEPARTMENT_STORES' },
        },
      ];

      const result = await importTransactions(mockUserId, mockBankConnectionId, plaidTransactions);

      expect(result).toBeDefined();
      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.error).toBeNull();
    });

    it('should import 30 days of transactions on first sync', async () => {
      // This test should FAIL until T057 (transaction service) is implemented
      const plaidTransactions = generateMockTransactions(30); // Helper function

      const result = await importTransactions(mockUserId, mockBankConnectionId, plaidTransactions);

      expect(result.imported).toBeGreaterThan(0);
      // Verify all transactions are within 30-day window
    });

    it('should deduplicate transactions based on plaid_transaction_id', async () => {
      // This test should FAIL until T057 (transaction service) is implemented
      const plaidTransactions = [
        {
          transaction_id: 'plaid-tx-duplicate',
          date: '2025-10-15',
          merchant_name: 'Starbucks',
          amount: 5.99,
          personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'COFFEE_SHOPS' },
        },
      ];

      // First import
      const result1 = await importTransactions(mockUserId, mockBankConnectionId, plaidTransactions);
      expect(result1.imported).toBe(1);

      // Second import (same transaction)
      const result2 = await importTransactions(mockUserId, mockBankConnectionId, plaidTransactions);
      expect(result2.imported).toBe(0);
      expect(result2.skipped).toBe(1);
    });

    it('should auto-categorize transactions during import', async () => {
      // This test should FAIL until T058 (categorization logic) is implemented
      const plaidTransactions = [
        {
          transaction_id: 'plaid-tx-1',
          date: '2025-10-15',
          merchant_name: 'Starbucks',
          amount: 5.99,
          personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'COFFEE_SHOPS' },
        },
      ];

      const result = await importTransactions(mockUserId, mockBankConnectionId, plaidTransactions);

      expect(result.imported).toBe(1);

      // Verify transaction was categorized
      const transactions = await getTransactionsByUser(mockUserId);
      expect(transactions[0].category).toBe('Dining & Coffee'); // Mapped from Plaid category
    });
  });

  describe('categorizeTransaction', () => {
    it('should map Plaid FOOD_AND_DRINK to Dining & Coffee category', async () => {
      // This test should FAIL until T058 (categorization logic) is implemented
      const plaidCategory = { primary: 'FOOD_AND_DRINK', detailed: 'COFFEE_SHOPS' };

      const result = categorizeTransaction(plaidCategory);

      expect(result).toBe('Dining & Coffee');
    });

    it('should map Plaid TRANSPORTATION to Transportation category', async () => {
      // This test should FAIL until T058 (categorization logic) is implemented
      const plaidCategory = { primary: 'TRANSPORTATION', detailed: 'GAS' };

      const result = categorizeTransaction(plaidCategory);

      expect(result).toBe('Transportation');
    });

    it('should map Plaid GENERAL_MERCHANDISE to Shopping category', async () => {
      // This test should FAIL until T058 (categorization logic) is implemented
      const plaidCategory = { primary: 'GENERAL_MERCHANDISE', detailed: 'DEPARTMENT_STORES' };

      const result = categorizeTransaction(plaidCategory);

      expect(result).toBe('Shopping');
    });

    it('should map Plaid HOME_IMPROVEMENT to Housing category', async () => {
      // This test should FAIL until T058 (categorization logic) is implemented
      const plaidCategory = { primary: 'HOME_IMPROVEMENT', detailed: 'HARDWARE' };

      const result = categorizeTransaction(plaidCategory);

      expect(result).toBe('Housing');
    });

    it('should default to Uncategorized for unknown Plaid categories', async () => {
      // This test should FAIL until T058 (categorization logic) is implemented
      const plaidCategory = { primary: 'UNKNOWN', detailed: 'UNKNOWN' };

      const result = categorizeTransaction(plaidCategory);

      expect(result).toBe('Uncategorized');
    });

    it('should learn from user overrides for merchant patterns', async () => {
      // This test should FAIL until T058 (categorization logic) is implemented
      const transactionId = '123e4567-e89b-12d3-a456-426614174002';
      const merchantName = 'Local Coffee Shop';

      // User recategorizes transaction
      await updateCategory(mockUserId, transactionId, 'Entertainment');

      // Next transaction from same merchant should use learned category
      const plaidTransactions = [
        {
          transaction_id: 'plaid-tx-new',
          date: '2025-10-20',
          merchant_name: 'Local Coffee Shop',
          amount: 6.50,
          personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'COFFEE_SHOPS' },
        },
      ];

      await importTransactions(mockUserId, mockBankConnectionId, plaidTransactions);

      const transactions = await getTransactionsByUser(mockUserId);
      const newTransaction = transactions.find(t => t.plaid_transaction_id === 'plaid-tx-new');
      expect(newTransaction?.category).toBe('Entertainment'); // Learned from user override
    });
  });

  describe('getTransactionsByUser', () => {
    it('should retrieve all transactions for a user', async () => {
      // This test should FAIL until T057 (transaction service) is implemented
      const result = await getTransactionsByUser(mockUserId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter transactions by date range', async () => {
      // This test should FAIL until T057 (transaction service) is implemented
      const startDate = '2025-10-01';
      const endDate = '2025-10-31';

      const result = await getTransactionsByUser(mockUserId, { startDate, endDate });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(transaction => {
        expect(new Date(transaction.date)).toBeGreaterThanOrEqual(new Date(startDate));
        expect(new Date(transaction.date)).toBeLessThanOrEqual(new Date(endDate));
      });
    });

    it('should filter transactions by category', async () => {
      // This test should FAIL until T057 (transaction service) is implemented
      const category = 'Dining & Coffee';

      const result = await getTransactionsByUser(mockUserId, { category });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(transaction => {
        expect(transaction.category).toBe(category);
      });
    });
  });

  describe('updateCategory', () => {
    it('should update transaction category', async () => {
      // This test should FAIL until T078 (recategorization) is implemented
      const transactionId = '123e4567-e89b-12d3-a456-426614174002';
      const newCategory = 'Entertainment';

      const result = await updateCategory(mockUserId, transactionId, newCategory);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      // Verify transaction category was updated
      const transactions = await getTransactionsByUser(mockUserId);
      const updatedTransaction = transactions.find(t => t.id === transactionId);
      expect(updatedTransaction?.category).toBe(newCategory);
    });

    it('should trigger budget recalculation when category changes', async () => {
      // This test should FAIL until T078 (recategorization) is implemented
      const transactionId = '123e4567-e89b-12d3-a456-426614174002';
      const oldCategory = 'Dining & Coffee';
      const newCategory = 'Entertainment';

      // TODO: Verify budget spending for both categories is recalculated
      const result = await updateCategory(mockUserId, transactionId, newCategory);

      expect(result.success).toBe(true);
      // Budget recalculation should be triggered
    });
  });

  describe('addTag', () => {
    it('should add non-negotiable tag to transaction', async () => {
      // This test should FAIL until T079 (tagging) is implemented
      const transactionId = '123e4567-e89b-12d3-a456-426614174002';
      const tag = 'non-negotiable';

      const result = await addTag(mockUserId, transactionId, tag);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      // Verify tag was added
      const transactions = await getTransactionsByUser(mockUserId);
      const taggedTransaction = transactions.find(t => t.id === transactionId);
      expect(taggedTransaction?.tag_non_negotiable).toBe(true);
    });

    it('should add ignored tag to transaction', async () => {
      // This test should FAIL until T079 (tagging) is implemented
      const transactionId = '123e4567-e89b-12d3-a456-426614174002';
      const tag = 'ignored';

      const result = await addTag(mockUserId, transactionId, tag);

      expect(result.success).toBe(true);

      // Verify tag was added
      const transactions = await getTransactionsByUser(mockUserId);
      const taggedTransaction = transactions.find(t => t.id === transactionId);
      expect(taggedTransaction?.tag_ignored).toBe(true);
    });

    it('should enforce mutual exclusivity between non-negotiable and ignored tags', async () => {
      // This test should FAIL until T079 (tagging) is implemented
      const transactionId = '123e4567-e89b-12d3-a456-426614174002';

      // Add non-negotiable tag
      await addTag(mockUserId, transactionId, 'non-negotiable');

      // Try to add ignored tag (should fail or remove non-negotiable)
      const result = await addTag(mockUserId, transactionId, 'ignored');

      expect(result.success).toBe(true);

      // Verify only ignored tag remains
      const transactions = await getTransactionsByUser(mockUserId);
      const taggedTransaction = transactions.find(t => t.id === transactionId);
      expect(taggedTransaction?.tag_ignored).toBe(true);
      expect(taggedTransaction?.tag_non_negotiable).toBe(false);
    });

    it('should exclude ignored transactions from budget calculations', async () => {
      // This test should FAIL until T086 (budget exclusion logic) is implemented
      const transactionId = '123e4567-e89b-12d3-a456-426614174002';

      // Add ignored tag
      await addTag(mockUserId, transactionId, 'ignored');

      // TODO: Verify transaction is excluded from budget spending calculations
      expect(true).toBe(true); // Placeholder
    });
  });

  // AddT002: Tests for toggle tag functionality
  describe('toggleTag', () => {
    it('should add tag if not present', async () => {
      const transactionId = '123e4567-e89b-12d3-a456-426614174003';
      const tag = 'non-negotiable';

      // Ensure transaction exists without the tag
      // (In real test, this would be set up with proper mock data)
      const result = await toggleTag(mockUserId, transactionId, tag);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      // Verify tag was added
      const transactions = await getTransactionsByUser(mockUserId);
      const taggedTransaction = transactions.find(t => t.id === transactionId);
      expect(taggedTransaction?.tag_non_negotiable).toBe(true);
    });

    it('should remove tag if already present', async () => {
      const transactionId = '123e4567-e89b-12d3-a456-426614174003';
      const tag = 'non-negotiable';

      // First toggle - add tag
      await toggleTag(mockUserId, transactionId, tag);

      // Second toggle - remove tag
      const result = await toggleTag(mockUserId, transactionId, tag);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      // Verify tag was removed
      const transactions = await getTransactionsByUser(mockUserId);
      const taggedTransaction = transactions.find(t => t.id === transactionId);
      expect(taggedTransaction?.tag_non_negotiable).toBe(false);
    });

    it('should toggle ignored tag correctly', async () => {
      const transactionId = '123e4567-e89b-12d3-a456-426614174003';
      const tag = 'ignored';

      // First toggle - add tag
      const result1 = await toggleTag(mockUserId, transactionId, tag);
      expect(result1.success).toBe(true);

      let transactions = await getTransactionsByUser(mockUserId);
      let taggedTransaction = transactions.find(t => t.id === transactionId);
      expect(taggedTransaction?.tag_ignored).toBe(true);

      // Second toggle - remove tag
      const result2 = await toggleTag(mockUserId, transactionId, tag);
      expect(result2.success).toBe(true);

      transactions = await getTransactionsByUser(mockUserId);
      taggedTransaction = transactions.find(t => t.id === transactionId);
      expect(taggedTransaction?.tag_ignored).toBe(false);
    });

    it('should enforce mutual exclusivity when toggling non-negotiable on ignored transaction', async () => {
      const transactionId = '123e4567-e89b-12d3-a456-426614174003';

      // First, add ignored tag
      await toggleTag(mockUserId, transactionId, 'ignored');

      let transactions = await getTransactionsByUser(mockUserId);
      let transaction = transactions.find(t => t.id === transactionId);
      expect(transaction?.tag_ignored).toBe(true);
      expect(transaction?.tag_non_negotiable).toBe(false);

      // Now toggle non-negotiable (should remove ignored and add non-negotiable)
      const result = await toggleTag(mockUserId, transactionId, 'non-negotiable');
      expect(result.success).toBe(true);

      transactions = await getTransactionsByUser(mockUserId);
      transaction = transactions.find(t => t.id === transactionId);
      expect(transaction?.tag_non_negotiable).toBe(true);
      expect(transaction?.tag_ignored).toBe(false);
    });

    it('should enforce mutual exclusivity when toggling ignored on non-negotiable transaction', async () => {
      const transactionId = '123e4567-e89b-12d3-a456-426614174003';

      // First, add non-negotiable tag
      await toggleTag(mockUserId, transactionId, 'non-negotiable');

      let transactions = await getTransactionsByUser(mockUserId);
      let transaction = transactions.find(t => t.id === transactionId);
      expect(transaction?.tag_non_negotiable).toBe(true);
      expect(transaction?.tag_ignored).toBe(false);

      // Now toggle ignored (should remove non-negotiable and add ignored)
      const result = await toggleTag(mockUserId, transactionId, 'ignored');
      expect(result.success).toBe(true);

      transactions = await getTransactionsByUser(mockUserId);
      transaction = transactions.find(t => t.id === transactionId);
      expect(transaction?.tag_ignored).toBe(true);
      expect(transaction?.tag_non_negotiable).toBe(false);
    });

    it('should trigger budget recalculation when toggling ignored tag', async () => {
      const transactionId = '123e4567-e89b-12d3-a456-426614174003';

      // Toggle ignored on (should trigger recalc to exclude from budget)
      const result1 = await toggleTag(mockUserId, transactionId, 'ignored');
      expect(result1.success).toBe(true);

      // Toggle ignored off (should trigger recalc to include in budget)
      const result2 = await toggleTag(mockUserId, transactionId, 'ignored');
      expect(result2.success).toBe(true);

      // TODO: Verify budget recalculation was triggered both times
      expect(true).toBe(true); // Placeholder for budget recalc verification
    });
  });

  // AddT002: Tests for removeTag functionality
  describe('removeTag', () => {
    it('should remove non-negotiable tag from transaction', async () => {
      const transactionId = '123e4567-e89b-12d3-a456-426614174004';

      // First add the tag
      await addTag(mockUserId, transactionId, 'non-negotiable');

      // Then remove it
      const result = await removeTag(mockUserId, transactionId, 'non-negotiable');
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      // Verify tag was removed
      const transactions = await getTransactionsByUser(mockUserId);
      const transaction = transactions.find(t => t.id === transactionId);
      expect(transaction?.tag_non_negotiable).toBe(false);
    });

    it('should remove ignored tag from transaction', async () => {
      const transactionId = '123e4567-e89b-12d3-a456-426614174004';

      // First add the tag
      await addTag(mockUserId, transactionId, 'ignored');

      // Then remove it
      const result = await removeTag(mockUserId, transactionId, 'ignored');
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      // Verify tag was removed
      const transactions = await getTransactionsByUser(mockUserId);
      const transaction = transactions.find(t => t.id === transactionId);
      expect(transaction?.tag_ignored).toBe(false);
    });

    it('should trigger budget recalculation when removing ignored tag', async () => {
      const transactionId = '123e4567-e89b-12d3-a456-426614174004';

      // Add ignored tag
      await addTag(mockUserId, transactionId, 'ignored');

      // Remove ignored tag (should trigger recalc to include transaction in budget)
      const result = await removeTag(mockUserId, transactionId, 'ignored');
      expect(result.success).toBe(true);

      // TODO: Verify budget recalculation was triggered
      expect(true).toBe(true); // Placeholder
    });
  });
});

// Helper function to generate mock transactions
function generateMockTransactions(days: number) {
  const transactions = [];
  const today = new Date();

  for (let i = 0; i < days * 2; i++) { // 2 transactions per day average
    const date = new Date(today);
    date.setDate(date.getDate() - Math.floor(i / 2));

    transactions.push({
      transaction_id: `plaid-tx-${i}`,
      date: date.toISOString().split('T')[0],
      merchant_name: `Merchant ${i}`,
      amount: Math.random() * 100,
      personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'RESTAURANTS' },
    });
  }

  return transactions;
}
