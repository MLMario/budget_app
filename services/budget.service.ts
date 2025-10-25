import { createClient } from '@/lib/supabase/server';

export interface BudgetData {
  month: number;
  year: number;
  categories: Record<string, number>;
}

export interface CreateBudgetResult {
  budget_id: string | null;
  error: any;
}

export interface UpdateBudgetCategoryResult {
  success: boolean;
  error: any;
}

export async function suggestBudgetAmounts(userId: string): Promise<Record<string, number>> {
  try {
    const supabase = await createClient();

    // Get transactions from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('category, amount')
      .eq('user_id', userId)
      .eq('tag_ignored', false)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (error || !transactions || transactions.length === 0) {
      // Return default suggestions if no transactions
      return {
        'Dining & Coffee': 200,
        'Transportation': 150,
        'Shopping': 300,
        'Housing': 1500,
        'Utilities': 200,
        'Entertainment': 150,
        'Healthcare': 100,
        'Groceries': 400,
      };
    }

    // Calculate average spending per category
    const categoryTotals: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (!categoryTotals[tx.category]) {
        categoryTotals[tx.category] = 0;
        categoryCounts[tx.category] = 0;
      }
      categoryTotals[tx.category] += tx.amount;
      categoryCounts[tx.category]++;
    });

    // Round to nearest $10
    const suggestions: Record<string, number> = {};
    Object.keys(categoryTotals).forEach((category) => {
      const total = categoryTotals[category];
      const rounded = Math.ceil(total / 10) * 10;
      suggestions[category] = rounded;
    });

    return suggestions;
  } catch (error: any) {
    console.error('Error suggesting budget amounts:', error);
    return {};
  }
}

export async function createBudget(
  userId: string,
  budgetData: BudgetData
): Promise<CreateBudgetResult> {
  try {
    const supabase = await createClient();

    // Check if budget already exists for this month/year
    const { data: existing } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', userId)
      .eq('month', budgetData.month)
      .eq('year', budgetData.year)
      .single();

    if (existing) {
      return {
        budget_id: null,
        error: 'Budget already exists for this month',
      };
    }

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
      return { budget_id: null, error: budgetError };
    }

    // Create budget categories
    const categoryInserts = Object.entries(budgetData.categories).map(
      ([category, amount]) => ({
        budget_id: budget.id,
        category_name: category,
        budgeted_amount: amount,
      })
    );

    const { error: categoriesError } = await supabase
      .from('budget_categories')
      .insert(categoryInserts);

    if (categoriesError) {
      return { budget_id: null, error: categoriesError };
    }

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
  category?: string
): Promise<number> {
  try {
    const supabase = await createClient();

    // Get start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    let query = supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('tag_ignored', false)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error || !data) {
      return 0;
    }

    return data.reduce((sum, tx) => sum + tx.amount, 0);
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
 */
export async function recalculateSpending(
  userId: string,
  month: number,
  year: number,
  categories: string[]
): Promise<{ success: boolean; updatedCategories: string[]; error: any }> {
  try {
    const supabase = await createClient();

    // Get the budget for this month/year
    const budget = await getBudgetByMonth(userId, month, year);

    if (!budget) {
      // No budget exists for this month, nothing to recalculate
      return { success: true, updatedCategories: [], error: null };
    }

    const updatedCategories: string[] = [];

    // Recalculate spending for each affected category
    for (const categoryName of categories) {
      const spending = await calculateSpending(userId, month, year, categoryName);

      // Update the budget_categories table with new spending amount
      const { error: updateError } = await supabase
        .from('budget_categories')
        .update({
          spent_amount: spending,
          updated_at: new Date().toISOString()
        })
        .eq('budget_id', budget.id)
        .eq('category_name', categoryName);

      if (!updateError) {
        updatedCategories.push(categoryName);
      } else {
        console.error(`Error updating spending for ${categoryName}:`, updateError);
      }
    }

    return {
      success: true,
      updatedCategories,
      error: null
    };
  } catch (error: any) {
    console.error('Error recalculating spending:', error);
    return {
      success: false,
      updatedCategories: [],
      error: error.message
    };
  }
}
