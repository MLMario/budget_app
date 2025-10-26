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

    const { data: budget, error } = await supabase
      .from('budgets')
      .select('*, budget_categories(*)')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .single();

    if (error) {
      return null;
    }

    return budget;
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
