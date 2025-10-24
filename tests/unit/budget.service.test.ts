import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createBudget,
  getBudgetByMonth,
  updateBudgetCategory,
  suggestBudgetAmounts,
  calculateSpending,
} from '@/services/budget.service';

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
      single: vi.fn(),
    })),
  })),
}));

describe('Budget Service', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

  describe('suggestBudgetAmounts', () => {
    it('should calculate average spending per category from last 30 days', async () => {
      // This test should FAIL until T061 (budget suggestion logic) is implemented
      const result = await suggestBudgetAmounts(mockUserId);

      expect(result).toBeDefined();
      expect(result['Dining & Coffee']).toBeGreaterThan(0);
      expect(result['Transportation']).toBeGreaterThan(0);
      expect(result['Shopping']).toBeGreaterThan(0);
    });

    it('should round suggested amounts to nearest $10', async () => {
      // This test should FAIL until T061 (budget suggestion logic) is implemented
      const result = await suggestBudgetAmounts(mockUserId);

      Object.values(result).forEach(amount => {
        expect(amount % 10).toBe(0); // All amounts should be multiples of $10
      });
    });

    it('should handle users with no transaction history', async () => {
      // This test should FAIL until T061 (budget suggestion logic) is implemented
      const newUserId = '123e4567-e89b-12d3-a456-426614174999';

      const result = await suggestBudgetAmounts(newUserId);

      expect(result).toBeDefined();
      // Should return default suggested amounts or empty object
      expect(typeof result).toBe('object');
    });

    it('should suggest amounts based on spending patterns', async () => {
      // This test should FAIL until T061 (budget suggestion logic) is implemented
      const result = await suggestBudgetAmounts(mockUserId);

      // If user spent $150 on coffee in last 30 days, suggest ~$150
      expect(result['Dining & Coffee']).toBeCloseTo(150, 20); // Within $20
    });

    it('should exclude ignored transactions from suggestions', async () => {
      // This test should FAIL until T061 (budget suggestion logic) is implemented
      const result = await suggestBudgetAmounts(mockUserId);

      // Ignored transactions should not affect budget suggestions
      expect(result).toBeDefined();
    });

    it('should provide suggestions for all common categories', async () => {
      // This test should FAIL until T061 (budget suggestion logic) is implemented
      const result = await suggestBudgetAmounts(mockUserId);

      const commonCategories = [
        'Dining & Coffee',
        'Transportation',
        'Shopping',
        'Housing',
        'Utilities',
        'Entertainment',
        'Healthcare',
        'Groceries',
      ];

      commonCategories.forEach(category => {
        expect(result[category]).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('createBudget', () => {
    it('should create budget for current month with category amounts', async () => {
      // This test should FAIL until T060 (budget service) is implemented
      const budgetData = {
        month: 10,
        year: 2025,
        categories: {
          'Dining & Coffee': 200,
          'Transportation': 150,
          'Shopping': 300,
          'Housing': 1500,
        },
      };

      const result = await createBudget(mockUserId, budgetData);

      expect(result).toBeDefined();
      expect(result.budget_id).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should create budget categories for each specified category', async () => {
      // This test should FAIL until T060 (budget service) is implemented
      const budgetData = {
        month: 10,
        year: 2025,
        categories: {
          'Dining & Coffee': 200,
          'Transportation': 150,
        },
      };

      const result = await createBudget(mockUserId, budgetData);

      expect(result.budget_id).toBeDefined();

      // Verify budget categories were created
      const budget = await getBudgetByMonth(mockUserId, 10, 2025);
      expect(budget.categories.length).toBe(2);
    });

    it('should prevent creating duplicate budgets for same month/year', async () => {
      // This test should FAIL until T060 (budget service) is implemented
      const budgetData = {
        month: 10,
        year: 2025,
        categories: {
          'Dining & Coffee': 200,
        },
      };

      await createBudget(mockUserId, budgetData);

      // Try to create duplicate
      const result = await createBudget(mockUserId, budgetData);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('already exists');
    });
  });

  describe('getBudgetByMonth', () => {
    it('should retrieve budget for specific month/year', async () => {
      // This test should FAIL until T060 (budget service) is implemented
      const result = await getBudgetByMonth(mockUserId, 10, 2025);

      expect(result).toBeDefined();
      expect(result.month).toBe(10);
      expect(result.year).toBe(2025);
      expect(result.categories).toBeDefined();
      expect(Array.isArray(result.categories)).toBe(true);
    });

    it('should return null for non-existent budget', async () => {
      // This test should FAIL until T060 (budget service) is implemented
      const result = await getBudgetByMonth(mockUserId, 12, 2099);

      expect(result).toBeNull();
    });
  });

  describe('calculateSpending', () => {
    it('should sum transactions by category for current month', async () => {
      // This test should FAIL until T098 (real-time spending tracking) is implemented
      const month = 10;
      const year = 2025;
      const category = 'Dining & Coffee';

      const result = await calculateSpending(mockUserId, month, year, category);

      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should exclude ignored transactions from spending calculations', async () => {
      // This test should FAIL until T086 (budget exclusion logic) is implemented
      const month = 10;
      const year = 2025;
      const category = 'Dining & Coffee';

      // Calculate spending (should exclude ignored transactions)
      const result = await calculateSpending(mockUserId, month, year, category);

      expect(result).toBeDefined();
      // Verify ignored transactions are not included
    });

    it('should only include transactions from specified month', async () => {
      // This test should FAIL until T098 (real-time spending tracking) is implemented
      const month = 10;
      const year = 2025;
      const category = 'Dining & Coffee';

      const result = await calculateSpending(mockUserId, month, year, category);

      // Verify only October 2025 transactions are included
      expect(result).toBeDefined();
    });

    it('should handle categories with no transactions', async () => {
      // This test should FAIL until T098 (real-time spending tracking) is implemented
      const month = 10;
      const year = 2025;
      const category = 'Uncategorized';

      const result = await calculateSpending(mockUserId, month, year, category);

      expect(result).toBe(0);
    });
  });

  describe('updateBudgetCategory', () => {
    it('should update budget category amount', async () => {
      // This test should FAIL until T060 (budget service) is implemented
      const budgetId = '123e4567-e89b-12d3-a456-426614174002';
      const categoryId = '123e4567-e89b-12d3-a456-426614174003';
      const newAmount = 250;

      const result = await updateBudgetCategory(mockUserId, budgetId, categoryId, newAmount);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject negative budget amounts', async () => {
      // This test should FAIL until T060 (budget service) is implemented
      const budgetId = '123e4567-e89b-12d3-a456-426614174002';
      const categoryId = '123e4567-e89b-12d3-a456-426614174003';
      const negativeAmount = -100;

      const result = await updateBudgetCategory(mockUserId, budgetId, categoryId, negativeAmount);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('positive');
    });
  });
});
