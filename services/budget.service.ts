import { createClient } from '@/lib/supabase/server';

export interface BudgetData {
  month: number;
  year: number;
  categories: Array<{ category_id: string; budgeted_amount: number }>; // UPDATED: Use category_id FK
}

export interface CreateBudgetResult {
  budget_id: string | null;
  error: any;
}

export interface UpdateBudgetCategoryResult {
  success: boolean;
  error: any;
}

export async function suggestBudgetAmounts(userId: string): Promise<Array<{ category_id: string; category_name: string; suggested_amount: number }>> {
  try {
    const supabase = await createClient();

    // Get all active categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, display_name')
      .eq('is_active', true)
      .order('display_order');

    if (catError || !categories) {
      return [];
    }

    // Get transactions from last 30 days with category info
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('app_category_id, user_category_override_id, amount')
      .eq('user_id', userId)
      .eq('tag_ignored', false)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    // Calculate spending per category
    const categoryTotals: Record<string, number> = {};

    if (transactions && transactions.length > 0) {
      transactions.forEach((tx: any) => {
        const categoryId = tx.user_category_override_id || tx.app_category_id;
        if (categoryId) {
          categoryTotals[categoryId] = (categoryTotals[categoryId] || 0) + tx.amount;
        }
      });
    }

    // Build suggestions for all categories
    const suggestions = categories.map((cat: any) => {
      const total = categoryTotals[cat.id] || 0;

      // If no spending history, use defaults based on category
      let defaultAmount = 100;
      if (cat.name === 'groceries') defaultAmount = 400;
      else if (cat.name === 'housing') defaultAmount = 1500;
      else if (cat.name === 'dining_out') defaultAmount = 200;
      else if (cat.name === 'transportation') defaultAmount = 150;
      else if (cat.name === 'utilities') defaultAmount = 200;
      else if (cat.name === 'shopping') defaultAmount = 300;

      const suggested = total > 0 ? Math.ceil(total / 10) * 10 : defaultAmount;

      return {
        category_id: cat.id,
        category_name: cat.display_name,
        suggested_amount: suggested,
      };
    });

    return suggestions;
  } catch (error: any) {
    console.error('Error suggesting budget amounts:', error);
    return [];
  }
}

export async function createBudget(
  userId: string,
  budgetData: BudgetData
): Promise<CreateBudgetResult> {
  console.log('[createBudget] Called with:', {
    userId,
    month: budgetData.month,
    year: budgetData.year,
    categoriesCount: budgetData.categories.length,
    categories: budgetData.categories
  });

  try {
    const supabase = await createClient();

    console.log('[createBudget] Checking for existing budget...');

    // Check if budget already exists for this month/year
    const { data: existing, error: existingError } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', userId)
      .eq('month', budgetData.month)
      .eq('year', budgetData.year)
      .single();

    console.log('[createBudget] Existing check result:', { existing, existingError });

    // PGRST116 means no rows found, which is expected for new budgets
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('[createBudget] Error checking existing budget:', existingError);
      return { budget_id: null, error: existingError?.message || 'Failed to check existing budget' };
    }

    if (existing) {
      console.log('[createBudget] Budget already exists, aborting');
      return {
        budget_id: null,
        error: 'Budget already exists for this month',
      };
    }

    console.log('[createBudget] No existing budget found, proceeding with creation...');

    // Create budget
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .insert({
        user_id: userId,
        month: budgetData.month,
        year: budgetData.year,
      })
      .select()
      .single();

    if (budgetError || !budget) {
      console.error('[createBudget] Budget creation failed:', budgetError);
      return { budget_id: null, error: budgetError?.message || 'Failed to create budget' };
    }

    console.log('[createBudget] Budget created successfully:', budget.id);

    // Create budget categories using category_id FK
    const categoryInserts = budgetData.categories.map(
      (cat) => ({
        budget_id: budget.id,
        category_id: cat.category_id,
        budgeted_amount: cat.budgeted_amount,
      })
    );

    console.log('[createBudget] Inserting categories:', categoryInserts);

    const { error: categoriesError } = await supabase
      .from('budget_categories')
      .insert(categoryInserts);

    if (categoriesError) {
      console.error('[createBudget] Categories insert failed:', categoriesError);
      return { budget_id: null, error: categoriesError?.message || 'Failed to create budget categories' };
    }

    console.log('[createBudget] SUCCESS! Budget created with ID:', budget.id);
    return { budget_id: budget.id, error: null };
  } catch (error: any) {
    console.error('Error creating budget:', error);
    return { budget_id: null, error: error.message };
  }
}

export async function getBudgetByMonth(
  userId: string,
  month: number,
  year: number
) {
  try {
    const supabase = await createClient();

    // Query with JOIN to categories table (following pattern from compareBudgets)
    const { data: budget, error } = await supabase
      .from('budgets')
      .select(`
        *,
        budget_categories(
          id,
          budget_id,
          category_id,
          budgeted_amount,
          created_at,
          updated_at,
          categories(id, name, display_name, icon)
        )
      `)
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .single();

    if (error) {
      return null;
    }

    if (!budget) {
      return null;
    }

    // Get spending data for all categories
    const spending = await getSpendingByCategories(userId, month, year);

    // Create spending map for quick lookup
    const spendingMap: Record<string, number> = {};
    spending.forEach((s) => {
      spendingMap[s.categoryId] = s.spent;
    });

    // Map budget_categories to categories with proper field names and spent_amount
    return {
      ...budget,
      categories: Array.isArray(budget.budget_categories)
        ? budget.budget_categories.map((bc: any) => ({
            id: bc.id,
            budget_id: bc.budget_id,
            category_id: bc.category_id,
            category_name: bc.categories?.display_name || 'Unknown',
            budgeted_amount: bc.budgeted_amount,
            spent_amount: spendingMap[bc.category_id] || 0,
            created_at: bc.created_at,
            updated_at: bc.updated_at,
          }))
        : [],
    };
  } catch (error: any) {
    console.error('Error fetching budget:', error);
    return null;
  }
}

export async function calculateSpending(
  userId: string,
  month: number,
  year: number,
  categoryId?: string
): Promise<number> {
  try {
    const supabase = await createClient();

    // Get start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const query = supabase
      .from('transactions')
      .select('amount, app_category_id, user_category_override_id')
      .eq('user_id', userId)
      .eq('tag_ignored', false)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    const { data } = await query;

    if (!data) {
      return 0;
    }

    // Filter by category if specified (check both app_category_id and user_category_override_id)
    const filteredData = categoryId
      ? data.filter((tx: any) => {
          const effectiveCategoryId = tx.user_category_override_id || tx.app_category_id;
          return effectiveCategoryId === categoryId;
        })
      : data;

    return filteredData.reduce((sum: number, tx: any) => sum + tx.amount, 0);
  } catch (error: any) {
    console.error('Error calculating spending:', error);
    return 0;
  }
}

export async function updateBudgetCategory(
  userId: string,
  budgetId: string,
  categoryId: string,
  newAmount: number
): Promise<UpdateBudgetCategoryResult> {
  try {
    if (newAmount < 0) {
      return {
        success: false,
        error: 'Budget amount must be positive',
      };
    }

    const supabase = await createClient();

    // Verify budget belongs to user
    const { data: budget } = await supabase
      .from('budgets')
      .select('id')
      .eq('id', budgetId)
      .eq('user_id', userId)
      .single();

    if (!budget) {
      return { success: false, error: 'Budget not found' };
    }

    const { error } = await supabase
      .from('budget_categories')
      .update({ budgeted_amount: newAmount })
      .eq('id', categoryId)
      .eq('budget_id', budgetId);

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error updating budget category:', error);
    return { success: false, error: error.message };
  }
}

/**
 * T085: Recalculate spending for specific categories when transactions change
 * This function is called when transaction categories are updated or tags are modified
 *
 * NOTE: With new schema, spent_amount is NOT stored - it's calculated on-demand via
 * calculate_budget_utilization() function. This function is kept for backward compatibility
 * but is essentially a no-op now.
 */
export async function recalculateSpending(
  _userId: string,
  _month: number,
  _year: number,
  categoryIds: string[]
): Promise<{ success: boolean; updatedCategories: string[]; error: any }> {
  try {
    // With new schema, spending is calculated dynamically via calculate_budget_utilization()
    // database function. No need to store spent_amount in budget_categories table.
    // This function is kept for backward compatibility but doesn't actually update anything.

    return {
      success: true,
      updatedCategories: categoryIds,
      error: null
    };
  } catch (error: any) {
    return {
      success: false,
      updatedCategories: [],
      error: error.message
    };
  }
}

/**
 * T098: Real-time spending tracking
 * Enhanced version with complete transaction data and category information
 */
export interface SpendingDetail {
  categoryId: string;
  categoryName: string;
  spent: number;
  transactionCount: number;
}

export async function getSpendingByCategories(
  userId: string,
  month: number,
  year: number
): Promise<SpendingDetail[]> {
  try {
    const supabase = await createClient();

    // Get start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get all transactions for the month with category information
    const { data: transactions } = await supabase
      .from('transactions')
      .select(`
        amount,
        app_category_id,
        user_category_override_id,
        categories!transactions_app_category_id_fkey(id, display_name)
      `)
      .eq('user_id', userId)
      .eq('tag_ignored', false)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Group by effective category (user override takes precedence)
    const categoryMap: Record<string, { name: string; spent: number; count: number }> = {};

    transactions.forEach((tx: any) => {
      const effectiveCategoryId = tx.user_category_override_id || tx.app_category_id;
      const categoryName = tx.categories?.display_name || 'Unknown';

      if (!categoryMap[effectiveCategoryId]) {
        categoryMap[effectiveCategoryId] = {
          name: categoryName,
          spent: 0,
          count: 0,
        };
      }

      categoryMap[effectiveCategoryId].spent += tx.amount;
      categoryMap[effectiveCategoryId].count += 1;
    });

    // Convert to array
    return Object.entries(categoryMap).map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      spent: data.spent,
      transactionCount: data.count,
    }));
  } catch (error: any) {
    console.error('Error getting spending by categories:', error);
    return [];
  }
}

/**
 * T099: Warning/alert indicator logic
 * Calculate budget status based on percentage used
 */
export type BudgetStatus = 'on_track' | 'warning' | 'alert';

export interface BudgetStatusResult {
  status: BudgetStatus;
  percentage: number;
  color: 'green' | 'yellow' | 'red';
  label: string;
}

export function calculateStatus(
  spent: number,
  budgeted: number
): BudgetStatusResult {
  // Handle edge cases
  if (budgeted <= 0) {
    return {
      status: 'alert',
      percentage: spent > 0 ? 100 : 0,
      color: 'red',
      label: 'No budget set',
    };
  }

  const percentage = (spent / budgeted) * 100;

  // Determine status based on percentage thresholds
  if (percentage >= 100) {
    return {
      status: 'alert',
      percentage,
      color: 'red',
      label: 'Over Budget',
    };
  } else if (percentage >= 80) {
    return {
      status: 'warning',
      percentage,
      color: 'yellow',
      label: 'Warning',
    };
  } else {
    return {
      status: 'on_track',
      percentage,
      color: 'green',
      label: 'On Track',
    };
  }
}

/**
 * T100: Budget comparison logic
 * Compare budgets between two months for month-over-month analysis
 */
export interface BudgetComparison {
  categoryId: string;
  categoryName: string;
  currentBudget: number;
  currentSpent: number;
  currentPercentage: number;
  previousBudget: number;
  previousSpent: number;
  previousPercentage: number;
  budgetChange: number;
  budgetChangePercentage: number;
  spentChange: number;
  spentChangePercentage: number;
}

export interface CompareBudgetsResult {
  currentMonth: number;
  currentYear: number;
  previousMonth: number;
  previousYear: number;
  totalBudgetChange: number;
  totalSpentChange: number;
  categories: BudgetComparison[];
}

export async function compareBudgets(
  userId: string,
  currentMonth: number,
  currentYear: number,
  previousMonth?: number,
  previousYear?: number
): Promise<CompareBudgetsResult | null> {
  try {
    const supabase = await createClient();

    // Calculate previous month if not provided
    if (previousMonth === undefined || previousYear === undefined) {
      if (currentMonth === 1) {
        previousMonth = 12;
        previousYear = currentYear - 1;
      } else {
        previousMonth = currentMonth - 1;
        previousYear = currentYear;
      }
    }

    // Get current month budget with categories
    const { data: currentBudget } = await supabase
      .from('budgets')
      .select(`
        id,
        month,
        year,
        budget_categories(
          category_id,
          budgeted_amount,
          categories(id, display_name)
        )
      `)
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single();

    // Get previous month budget with categories
    const { data: previousBudget } = await supabase
      .from('budgets')
      .select(`
        id,
        month,
        year,
        budget_categories(
          category_id,
          budgeted_amount,
          categories(id, display_name)
        )
      `)
      .eq('user_id', userId)
      .eq('month', previousMonth)
      .eq('year', previousYear)
      .single();

    if (!currentBudget && !previousBudget) {
      return null;
    }

    // Get spending for both months
    const currentSpending = await getSpendingByCategories(userId, currentMonth, currentYear);
    const previousSpending = await getSpendingByCategories(userId, previousMonth, previousYear);

    // Create spending maps for quick lookup
    const currentSpendingMap: Record<string, number> = {};
    currentSpending.forEach((s) => {
      currentSpendingMap[s.categoryId] = s.spent;
    });

    const previousSpendingMap: Record<string, number> = {};
    previousSpending.forEach((s) => {
      previousSpendingMap[s.categoryId] = s.spent;
    });

    // Collect all categories from both budgets
    const categorySet = new Set<string>();
    const categoryNames: Record<string, string> = {};

    if (currentBudget?.budget_categories) {
      currentBudget.budget_categories.forEach((bc: any) => {
        categorySet.add(bc.category_id);
        categoryNames[bc.category_id] = bc.categories?.display_name || 'Unknown';
      });
    }

    if (previousBudget?.budget_categories) {
      previousBudget.budget_categories.forEach((bc: any) => {
        categorySet.add(bc.category_id);
        categoryNames[bc.category_id] = bc.categories?.display_name || 'Unknown';
      });
    }

    // Build comparison for each category
    const categories: BudgetComparison[] = [];
    let totalCurrentBudget = 0;
    let totalCurrentSpent = 0;
    let totalPreviousBudget = 0;
    let totalPreviousSpent = 0;

    categorySet.forEach((categoryId) => {
      const currentCat = currentBudget?.budget_categories?.find(
        (bc: any) => bc.category_id === categoryId
      );
      const previousCat = previousBudget?.budget_categories?.find(
        (bc: any) => bc.category_id === categoryId
      );

      const currentBudgetAmount = currentCat?.budgeted_amount || 0;
      const currentSpentAmount = currentSpendingMap[categoryId] || 0;
      const previousBudgetAmount = previousCat?.budgeted_amount || 0;
      const previousSpentAmount = previousSpendingMap[categoryId] || 0;

      const currentPercentage =
        currentBudgetAmount > 0 ? (currentSpentAmount / currentBudgetAmount) * 100 : 0;
      const previousPercentage =
        previousBudgetAmount > 0 ? (previousSpentAmount / previousBudgetAmount) * 100 : 0;

      const budgetChange = currentBudgetAmount - previousBudgetAmount;
      const budgetChangePercentage =
        previousBudgetAmount > 0 ? (budgetChange / previousBudgetAmount) * 100 : 0;

      const spentChange = currentSpentAmount - previousSpentAmount;
      const spentChangePercentage =
        previousSpentAmount > 0 ? (spentChange / previousSpentAmount) * 100 : 0;

      categories.push({
        categoryId,
        categoryName: categoryNames[categoryId],
        currentBudget: currentBudgetAmount,
        currentSpent: currentSpentAmount,
        currentPercentage,
        previousBudget: previousBudgetAmount,
        previousSpent: previousSpentAmount,
        previousPercentage,
        budgetChange,
        budgetChangePercentage,
        spentChange,
        spentChangePercentage,
      });

      totalCurrentBudget += currentBudgetAmount;
      totalCurrentSpent += currentSpentAmount;
      totalPreviousBudget += previousBudgetAmount;
      totalPreviousSpent += previousSpentAmount;
    });

    return {
      currentMonth,
      currentYear,
      previousMonth,
      previousYear,
      totalBudgetChange: totalCurrentBudget - totalPreviousBudget,
      totalSpentChange: totalCurrentSpent - totalPreviousSpent,
      categories,
    };
  } catch (error: any) {
    console.error('Error comparing budgets:', error);
    return null;
  }
}

/**
 * T102: Copy budget from previous month
 * Retrieves the previous month's budget and returns the category amounts
 */
export interface CopyBudgetResult {
  categories: Array<{ category_id: string; category_name: string; amount: number }>;
  sourceBudget: {
    month: number;
    year: number;
  } | null;
}

export async function copyFromPreviousMonth(
  userId: string,
  targetMonth: number,
  targetYear: number
): Promise<CopyBudgetResult> {
  try {
    const supabase = await createClient();

    // Calculate previous month
    let previousMonth: number;
    let previousYear: number;

    if (targetMonth === 1) {
      previousMonth = 12;
      previousYear = targetYear - 1;
    } else {
      previousMonth = targetMonth - 1;
      previousYear = targetYear;
    }

    // Get previous month's budget with categories
    const { data: previousBudget } = await supabase
      .from('budgets')
      .select(`
        id,
        month,
        year,
        budget_categories(
          category_id,
          budgeted_amount,
          categories(id, display_name)
        )
      `)
      .eq('user_id', userId)
      .eq('month', previousMonth)
      .eq('year', previousYear)
      .single();

    if (!previousBudget || !previousBudget.budget_categories) {
      return {
        categories: [],
        sourceBudget: null,
      };
    }

    // Map to return format
    const categories = previousBudget.budget_categories.map((bc: any) => ({
      category_id: bc.category_id,
      category_name: bc.categories?.display_name || 'Unknown',
      amount: bc.budgeted_amount,
    }));

    return {
      categories,
      sourceBudget: {
        month: previousMonth,
        year: previousYear,
      },
    };
  } catch (error: any) {
    console.error('Error copying from previous month:', error);
    return {
      categories: [],
      sourceBudget: null,
    };
  }
}

/**
 * T103: Calculate three-month average budget
 * Retrieves last 3 months of budgets and calculates average per category
 */
export interface ThreeMonthAverageResult {
  categories: Array<{ category_id: string; category_name: string; amount: number }>;
  sourceMonths: Array<{ month: number; year: number }>;
  monthsUsed: number;
}

export async function calculateThreeMonthAverage(
  userId: string,
  targetMonth: number,
  targetYear: number
): Promise<ThreeMonthAverageResult> {
  try {
    const supabase = await createClient();

    // Calculate the 3 months before target month
    const months: Array<{ month: number; year: number }> = [];

    for (let i = 1; i <= 3; i++) {
      let month = targetMonth - i;
      let year = targetYear;

      // Handle year boundaries
      while (month <= 0) {
        month += 12;
        year -= 1;
      }

      months.push({ month, year });
    }

    // Fetch budgets for these months
    const budgetPromises = months.map(async ({ month, year }) => {
      const { data } = await supabase
        .from('budgets')
        .select(`
          id,
          month,
          year,
          budget_categories(
            category_id,
            budgeted_amount,
            categories(id, display_name)
          )
        `)
        .eq('user_id', userId)
        .eq('month', month)
        .eq('year', year)
        .single();

      return data;
    });

    const budgets = await Promise.all(budgetPromises);

    // Filter out null budgets
    const validBudgets = budgets.filter((b) => b !== null && b !== undefined);

    if (validBudgets.length === 0) {
      return {
        categories: [],
        sourceMonths: [],
        monthsUsed: 0,
      };
    }

    // Aggregate spending by category
    const categoryTotals: Record<
      string,
      { name: string; total: number; count: number }
    > = {};

    validBudgets.forEach((budget: any) => {
      if (budget.budget_categories) {
        budget.budget_categories.forEach((bc: any) => {
          const categoryId = bc.category_id;
          const categoryName = bc.categories?.display_name || 'Unknown';
          const amount = bc.budgeted_amount;

          if (!categoryTotals[categoryId]) {
            categoryTotals[categoryId] = {
              name: categoryName,
              total: 0,
              count: 0,
            };
          }

          categoryTotals[categoryId].total += amount;
          categoryTotals[categoryId].count += 1;
        });
      }
    });

    // Calculate averages and round to nearest $10
    const categories = Object.entries(categoryTotals).map(([categoryId, data]) => {
      const average = data.total / data.count;
      const roundedAmount = Math.round(average / 10) * 10;

      return {
        category_id: categoryId,
        category_name: data.name,
        amount: roundedAmount,
      };
    });

    // Get months that were actually used
    const sourceMonths = validBudgets.map((b: any) => ({
      month: b.month,
      year: b.year,
    }));

    return {
      categories,
      sourceMonths,
      monthsUsed: validBudgets.length,
    };
  } catch (error: any) {
    console.error('Error calculating three-month average:', error);
    return {
      categories: [],
      sourceMonths: [],
      monthsUsed: 0,
    };
  }
}
