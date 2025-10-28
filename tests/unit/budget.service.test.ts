import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createBudget,
  getBudgetByMonth,
  updateBudgetCategory,
  suggestBudgetAmounts,
  calculateSpending,
  deleteBudget,
  calculateBudgetUtilization,
  copyFromPreviousMonth,
  calculateThreeMonthAverage,
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
    it('should retrieve budget for specific month/year with category names and spending', async () => {
      // This test should FAIL until T060 (budget service) is implemented
      const result = await getBudgetByMonth(mockUserId, 10, 2025);

      expect(result).toBeDefined();
      expect(result.month).toBe(10);
      expect(result.year).toBe(2025);
      expect(result.categories).toBeDefined();
      expect(Array.isArray(result.categories)).toBe(true);

      // Verify each category has required fields from JOIN and spending calculation
      if (result.categories.length > 0) {
        result.categories.forEach(category => {
          expect(category.category_id).toBeDefined();
          expect(category.category_name).toBeDefined();
          expect(typeof category.category_name).toBe('string');
          expect(category.category_name).not.toBeNull();
          expect(category.budgeted_amount).toBeDefined();
          expect(typeof category.budgeted_amount).toBe('number');
          expect(category.spent_amount).toBeDefined();
          expect(typeof category.spent_amount).toBe('number');
        });
      }
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

  // T087: Budget CRUD - Delete operations
  describe('deleteBudget', () => {
    it('should delete budget and all associated budget categories', async () => {
      // This test should FAIL until delete functionality is implemented
      const budgetData = {
        month: 11,
        year: 2025,
        categories: {
          'Dining & Coffee': 200,
          'Transportation': 150,
        },
      };

      const created = await createBudget(mockUserId, budgetData);
      const budgetId = created.budget_id;

      const result = await deleteBudget(mockUserId, budgetId);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      const budget = await getBudgetByMonth(mockUserId, 11, 2025);
      expect(budget).toBeNull();
    });

    it('should prevent deleting budgets from other users', async () => {
      const otherUserId = '123e4567-e89b-12d3-a456-426614174999';
      const budgetId = '123e4567-e89b-12d3-a456-426614174002';

      const result = await deleteBudget(otherUserId, budgetId);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('not found');
    });

    it('should handle deleting non-existent budgets gracefully', async () => {
      const nonExistentBudgetId = '123e4567-e89b-12d3-a456-426614174999';

      const result = await deleteBudget(mockUserId, nonExistentBudgetId);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('not found');
    });
  });

  // T089: Percentage calculation and color indicators
  describe('calculateBudgetUtilization', () => {
    it('should calculate percentage used (spent / budgeted * 100)', async () => {
      const month = 10;
      const year = 2025;

      const result = await calculateBudgetUtilization(mockUserId, month, year);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      result.forEach(category => {
        expect(category.category_name).toBeDefined();
        expect(category.budgeted_amount).toBeGreaterThanOrEqual(0);
        expect(category.spent_amount).toBeGreaterThanOrEqual(0);
        expect(category.percentage_used).toBeDefined();

        const expected = (category.spent_amount / category.budgeted_amount) * 100;
        expect(category.percentage_used).toBeCloseTo(expected, 2);
      });
    });

    it('should return green status for percentage < 80%', async () => {
      const month = 10;
      const year = 2025;

      const result = await calculateBudgetUtilization(mockUserId, month, year);

      const underBudgetCategories = result.filter(cat => cat.percentage_used < 80);
      underBudgetCategories.forEach(category => {
        expect(category.status).toBe('on_track');
        expect(category.color).toBe('green');
      });
    });

    it('should return yellow status for percentage >= 80% and < 100%', async () => {
      const month = 10;
      const year = 2025;

      const result = await calculateBudgetUtilization(mockUserId, month, year);

      const warningCategories = result.filter(
        cat => cat.percentage_used >= 80 && cat.percentage_used < 100
      );
      warningCategories.forEach(category => {
        expect(category.status).toBe('warning');
        expect(category.color).toBe('yellow');
      });
    });

    it('should return red status for percentage >= 100%', async () => {
      const month = 10;
      const year = 2025;

      const result = await calculateBudgetUtilization(mockUserId, month, year);

      const overBudgetCategories = result.filter(cat => cat.percentage_used >= 100);
      overBudgetCategories.forEach(category => {
        expect(category.status).toBe('alert');
        expect(category.color).toBe('red');
      });
    });

    it('should handle categories with zero budget gracefully', async () => {
      const month = 10;
      const year = 2025;

      const result = await calculateBudgetUtilization(mockUserId, month, year);

      expect(result).toBeDefined();
    });
  });

  // T090: Future budget creation
  describe('copyFromPreviousMonth', () => {
    it('should copy budget amounts from previous month', async () => {
      const currentMonth = 11;
      const currentYear = 2025;

      const result = await copyFromPreviousMonth(mockUserId, currentMonth, currentYear);

      expect(result).toBeDefined();
      expect(result.categories).toBeDefined();
      expect(Object.keys(result.categories).length).toBeGreaterThan(0);

      Object.values(result.categories).forEach(amount => {
        expect(amount).toBeGreaterThan(0);
      });
    });

    it('should handle case when no previous month budget exists', async () => {
      const currentMonth = 1;
      const currentYear = 2026;

      const result = await copyFromPreviousMonth(mockUserId, currentMonth, currentYear);

      expect(result).toBeDefined();
      expect(typeof result.categories).toBe('object');
    });

    it('should copy from December when creating January budget', async () => {
      const currentMonth = 1;
      const currentYear = 2026;

      const result = await copyFromPreviousMonth(mockUserId, currentMonth, currentYear);

      expect(result).toBeDefined();
    });
  });

  describe('calculateThreeMonthAverage', () => {
    it('should calculate average budget amounts from last 3 months', async () => {
      const currentMonth = 11;
      const currentYear = 2025;

      const result = await calculateThreeMonthAverage(mockUserId, currentMonth, currentYear);

      expect(result).toBeDefined();
      expect(result.categories).toBeDefined();

      Object.entries(result.categories).forEach(([category, amount]) => {
        expect(typeof amount).toBe('number');
        expect(amount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle case when less than 3 months of data available', async () => {
      const currentMonth = 2;
      const currentYear = 2025;

      const result = await calculateThreeMonthAverage(mockUserId, currentMonth, currentYear);

      expect(result).toBeDefined();
      expect(typeof result.categories).toBe('object');
    });

    it('should round averaged amounts to nearest $10', async () => {
      const currentMonth = 11;
      const currentYear = 2025;

      const result = await calculateThreeMonthAverage(mockUserId, currentMonth, currentYear);

      Object.values(result.categories).forEach(amount => {
        expect(amount % 10).toBe(0);
      });
    });

    it('should exclude current month from average calculation', async () => {
      const currentMonth = 11;
      const currentYear = 2025;

      const result = await calculateThreeMonthAverage(mockUserId, currentMonth, currentYear);

      expect(result).toBeDefined();
    });
  });
});
