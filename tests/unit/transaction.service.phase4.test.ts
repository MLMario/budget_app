/**
 * Phase 4 / User Story 2: Transaction Management and Categorization Tests
 * Tasks: T067, T068, T070 (T069 removed - pattern learning eliminated)
 *
 * These tests are written FIRST before implementation (Test-First Development)
 * All tests should FAIL until corresponding service functions are implemented
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateCategory,
  addTag,
  getTransactionsByUser,
  importTransactions,
} from '@/services/transaction.service';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: '123e4567-e89b-12d3-a456-426614174000' } },
        error: null,
      }),
    },
  })),
}));

describe('Phase 4 - User Story 2: Transaction Management Tests', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockBankConnectionId = '123e4567-e89b-12d3-a456-426614174001';

  // T067: Unit tests for recategorization with budget verification
  describe('T067 - Recategorization with Budget Recalculation', () => {
    it('should verify budget recalculation affects both old and new categories', async () => {
      // This test should FAIL until T078 (recategorization) + T085 (budget recalculation) are implemented
      const transactionId = '123e4567-e89b-12d3-a456-426614174002';
      const oldCategory = 'Dining & Coffee';
      const newCategory = 'Entertainment';

      const result = await updateCategory(mockUserId, transactionId, newCategory);

      expect(result.success).toBe(true);
      expect(result.budgetRecalculated).toBe(true);
      expect(result.affectedCategories).toContain(oldCategory);
      expect(result.affectedCategories).toContain(newCategory);
    });

    it('should handle recategorization errors gracefully', async () => {
      const invalidTransactionId = 'invalid-id';
      const newCategory = 'Entertainment';

      const result = await updateCategory(mockUserId, invalidTransactionId, newCategory);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error).toContain('not found');
    });

    it('should prevent unauthorized recategorization', async () => {
      const otherUserId = '999e4567-e89b-12d3-a456-426614174000';
      const transactionId = '123e4567-e89b-12d3-a456-426614174002';

      const result = await updateCategory(otherUserId, transactionId, 'Entertainment');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });

    it('should update user_category_override field, not Plaid category', async () => {
      const transactionId = '123e4567-e89b-12d3-a456-426614174002';
      const newCategory = 'Entertainment';

      const result = await updateCategory(mockUserId, transactionId, newCategory);

      expect(result.success).toBe(true);

      // Verify the transaction was updated
      const transactions = await getTransactionsByUser(mockUserId);
      const updated = transactions.find(t => t.id === transactionId);

      expect(updated?.user_category_override).toBe(newCategory);
      // Plaid category should remain unchanged
      expect(updated?.category_primary).toBe('FOOD_AND_DRINK');
    });

    it('should recalculate budget for current month when category changes', async () => {
      const transactionId = '123e4567-e89b-12d3-a456-426614174002';
      const transactionAmount = 50.00;
      const oldCategory = 'Dining & Coffee';
      const newCategory = 'Entertainment';

      const result = await updateCategory(mockUserId, transactionId, newCategory);

      expect(result.success).toBe(true);
      // Budget should be recalculated
      expect(result.budgetRecalculated).toBe(true);
      // Both categories should be affected
      expect(result.affectedCategories.length).toBe(2);
      expect(result.affectedCategories).toContain(oldCategory);
      expect(result.affectedCategories).toContain(newCategory);
    });
  });

  // T068: Unit tests for tagging logic
  // NOTE: These tests are already comprehensive in transaction.service.test.ts
  // (lines 251-312), so T068 is considered COMPLETE
  describe('T068 - Tagging Logic (Already Implemented in Main Test File)', () => {
    it('should reference existing addTag tests', () => {
      // See tests/unit/transaction.service.test.ts lines 251-312
      // Tests cover:
      // - Non-negotiable tag
      // - Ignored tag
      // - Mutual exclusivity
      // - Budget exclusion
      expect(true).toBe(true);
    });
  });

  // T069: REMOVED - Pattern learning tests removed (T082-T084 removed from spec)

  // T070: Unit tests for search and filter
  describe('T070 - Search and Filter Transactions', () => {
    it('should filter transactions by merchant name', async () => {
      // This test should FAIL until search/filter is fully implemented
      const merchantName = 'Starbucks';

      const result = await getTransactionsByUser(mockUserId, { merchant: merchantName });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(transaction => {
        expect(transaction.merchant_name).toContain(merchantName);
      });
    });

    it('should filter transactions by amount range', async () => {
      // This test should FAIL until search/filter is fully implemented
      const minAmount = 10.00;
      const maxAmount = 50.00;

      const result = await getTransactionsByUser(mockUserId, {
        minAmount,
        maxAmount
      });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(transaction => {
        expect(transaction.amount).toBeGreaterThanOrEqual(minAmount);
        expect(transaction.amount).toBeLessThanOrEqual(maxAmount);
      });
    });

    it('should combine multiple filters (date + category + merchant + amount)', async () => {
      // This test should FAIL until search/filter is fully implemented
      const startDate = '2025-10-01';
      const endDate = '2025-10-31';
      const category = 'Dining & Coffee';
      const merchant = 'Starbucks';
      const minAmount = 5.00;
      const maxAmount = 20.00;

      const result = await getTransactionsByUser(mockUserId, {
        startDate,
        endDate,
        category,
        merchant,
        minAmount,
        maxAmount,
      });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(transaction => {
        expect(new Date(transaction.date)).toBeGreaterThanOrEqual(new Date(startDate));
        expect(new Date(transaction.date)).toBeLessThanOrEqual(new Date(endDate));
        expect(transaction.category).toBe(category);
        expect(transaction.merchant_name).toContain(merchant);
        expect(transaction.amount).toBeGreaterThanOrEqual(minAmount);
        expect(transaction.amount).toBeLessThanOrEqual(maxAmount);
      });
    });

    it('should filter by transaction tags (non-negotiable, ignored)', async () => {
      // This test should FAIL until search/filter is fully implemented
      const result = await getTransactionsByUser(mockUserId, {
        tag: 'non-negotiable'
      });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(transaction => {
        expect(transaction.tag_non_negotiable).toBe(true);
      });
    });

    it('should support case-insensitive merchant search', async () => {
      // This test should FAIL until search/filter is fully implemented
      const searchTerm = 'starbucks'; // lowercase

      const result = await getTransactionsByUser(mockUserId, {
        merchant: searchTerm
      });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(transaction => {
        expect(transaction.merchant_name.toLowerCase()).toContain(searchTerm);
      });
    });

    it('should filter by exact amount match', async () => {
      // This test should FAIL until search/filter is fully implemented
      const exactAmount = 25.99;

      const result = await getTransactionsByUser(mockUserId, {
        exactAmount
      });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(transaction => {
        expect(transaction.amount).toBe(exactAmount);
      });
    });

    it('should filter by pending status', async () => {
      // This test should FAIL until search/filter is fully implemented
      const result = await getTransactionsByUser(mockUserId, {
        pending: true
      });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(transaction => {
        expect(transaction.pending).toBe(true);
      });
    });

    it('should sort filtered results by date descending', async () => {
      // This test should FAIL until search/filter is fully implemented
      const result = await getTransactionsByUser(mockUserId, {
        sortBy: 'date',
        sortOrder: 'desc'
      });

      expect(Array.isArray(result)).toBe(true);
      for (let i = 0; i < result.length - 1; i++) {
        const currentDate = new Date(result[i].date);
        const nextDate = new Date(result[i + 1].date);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });
  });
});
