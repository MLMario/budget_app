import { createClient } from '@/lib/supabase/server';

export interface ImportTransactionsResult {
  imported: number;
  skipped: number;
  error: any;
}

export interface UpdateCategoryResult {
  budgetRecalculated?: boolean;
  affectedCategories?: string[];
  success: boolean;
  error: any;
}

export interface AddTagResult {
  success: boolean;
  error: any;
}

// REMOVED: categorizeTransaction and CATEGORY_MAP
// Category mapping is now handled by database trigger (auto_map_transaction_category)
// and plaid_category_mappings table

export async function importTransactions(
  userId: string,
  bankConnectionId: string,
  plaidTransactions: any[]
): Promise<ImportTransactionsResult> {
  try {
    const supabase = await createClient();
    let imported = 0;
    let skipped = 0;

    for (const plaidTx of plaidTransactions) {
      // Check if transaction already exists
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('plaid_transaction_id', plaidTx.transaction_id)
        .single();

      if (existing) {
        skipped++;
        continue;
      }

      // Insert transaction with Plaid category fields
      // Database trigger (auto_map_transaction_category) will automatically populate app_category_id
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          bank_connection_id: bankConnectionId,
          plaid_transaction_id: plaidTx.transaction_id,
          date: plaidTx.date,
          merchant_name: plaidTx.merchant_name || plaidTx.name,
          amount: Math.abs(plaidTx.amount), // Plaid amounts are negative for debits
          category_primary: plaidTx.personal_finance_category?.primary || null,
          category_detailed: plaidTx.personal_finance_category?.detailed || null,
          payment_channel: plaidTx.payment_channel || 'online',
          tag_non_negotiable: false,
          tag_ignored: false,
        });

      if (!insertError) {
        imported++;
      } else {
        console.error('Error importing transaction:', insertError);
      }
    }

    return { imported, skipped, error: null };
  } catch (error: any) {
    console.error('Error importing transactions:', error);
    return { imported: 0, skipped: 0, error: error.message };
  }
}

export async function getTransactionsByUser(
  userId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string; // UPDATED: Use category_id FK instead of category name
  }
) {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    // NOTE: Category filtering needs to check both app_category_id and user_category_override_id
    // This is better handled in the client by filtering the results after fetch
    // Or use a database view/function for more complex filtering

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // If category filter specified, filter in memory (checking both category FKs)
    if (filters?.categoryId && data) {
      return data.filter((tx: any) => {
        const effectiveCategoryId = tx.user_category_override_id || tx.app_category_id;
        return effectiveCategoryId === filters.categoryId;
      });
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export async function updateCategory(
  userId: string,
  transactionId: string,
  newCategoryId: string // UPDATED: Use category_id FK instead of category name
): Promise<UpdateCategoryResult> {
  try {
    const supabase = await createClient();

    // Validate that the category exists
    const { data: categoryCheck, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', newCategoryId)
      .single();

    if (catError || !categoryCheck) {
      return {
        success: false,
        error: 'Invalid category ID',
      };
    }

    // Get the transaction to find old category and date
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('user_category_override_id, app_category_id, date')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !transaction) {
      return {
        success: false,
        error: fetchError || 'Transaction not found or Unauthorized',
      };
    }

    const oldCategoryId = transaction.user_category_override_id || transaction.app_category_id;
    const transactionDate = new Date(transaction.date);
    const month = transactionDate.getMonth() + 1;
    const year = transactionDate.getFullYear();

    // Update the category (set user_category_override_id FK)
    const { error } = await supabase
      .from('transactions')
      .update({ user_category_override_id: newCategoryId })
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error };
    }

    // T085: Trigger budget recalculation for affected categories
    const affectedCategories = [oldCategoryId, newCategoryId];
    const { recalculateSpending } = await import('./budget.service');

    const recalcResult = await recalculateSpending(
      userId,
      month,
      year,
      affectedCategories
    );

    return {
      success: true,
      error: null,
      budgetRecalculated: recalcResult.success,
      affectedCategories: recalcResult.updatedCategories,
    };
  } catch (error: any) {
    console.error('Error updating category:', error);
    return { success: false, error: error.message };
  }
}

export async function addTag(
  userId: string,
  transactionId: string,
  tag: 'non-negotiable' | 'ignored'
): Promise<AddTagResult> {
  try {
    const supabase = await createClient();

    // Get transaction to find category and date for budget recalculation
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('app_category_id, user_category_override_id, date')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !transaction) {
      return {
        success: false,
        error: fetchError || 'Transaction not found or Unauthorized',
      };
    }

    // Enforce mutual exclusivity
    const updates: any = {};
    if (tag === 'non-negotiable') {
      updates.tag_non_negotiable = true;
      updates.tag_ignored = false;
    } else {
      updates.tag_ignored = true;
      updates.tag_non_negotiable = false;
    }

    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error };
    }

    // T085/T086: Trigger budget recalculation when ignored tag changes
    // because ignored transactions are excluded from budget calculations
    if (tag === 'ignored') {
      const categoryId = transaction.user_category_override_id || transaction.app_category_id;
      const transactionDate = new Date(transaction.date);
      const month = transactionDate.getMonth() + 1;
      const year = transactionDate.getFullYear();

      const { recalculateSpending } = await import('./budget.service');
      await recalculateSpending(userId, month, year, [categoryId]);
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error adding tag:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add or update notes for a transaction (T081)
 */
export async function updateNotes(
  userId: string,
  transactionId: string,
  notes: string
): Promise<{ success: boolean; error: any }> {
  try {
    const supabase = await createClient();

    // Verify transaction belongs to user
    const { data: transaction, error: verifyError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (verifyError || !transaction) {
      return {
        success: false,
        error: verifyError || 'Transaction not found or Unauthorized',
      };
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update({ notes })
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (updateError) {
      return { success: false, error: updateError };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error updating notes:', error);
    return { success: false, error: error.message };
  }
}
