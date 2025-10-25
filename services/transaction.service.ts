import { createClient } from '@/lib/supabase/server';

// Category mapping from Plaid to app categories
const CATEGORY_MAP: Record<string, string> = {
  'FOOD_AND_DRINK': 'Dining & Coffee',
  'TRANSPORTATION': 'Transportation',
  'GENERAL_MERCHANDISE': 'Shopping',
  'HOME_IMPROVEMENT': 'Housing',
  'RENT_AND_UTILITIES': 'Housing',
  'ENTERTAINMENT': 'Entertainment',
  'HEALTHCARE': 'Healthcare',
  'TRAVEL': 'Travel',
  'PERSONAL_CARE': 'Personal Care',
  'BANK_FEES': 'Fees',
  'TRANSFER': 'Transfer',
  'INCOME': 'Income',
};

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

export function categorizeTransaction(plaidCategory: any): string {
  if (!plaidCategory || !plaidCategory.primary) {
    return 'Uncategorized';
  }

  const primary = plaidCategory.primary.toUpperCase();
  return CATEGORY_MAP[primary] || 'Uncategorized';
}

export async function importTransactions(
  userId: string,
  bankConnectionId: string,
  plaidTransactions: any[]
): Promise<ImportTransactionsResult> {
  try {
    const supabase = createClient();
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

      // Categorize transaction
      const category = categorizeTransaction(plaidTx.personal_finance_category);

      // Insert transaction
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          bank_connection_id: bankConnectionId,
          plaid_transaction_id: plaidTx.transaction_id,
          date: plaidTx.date,
          merchant_name: plaidTx.merchant_name || plaidTx.name,
          amount: Math.abs(plaidTx.amount), // Plaid amounts are negative for debits
          category: category,
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
    category?: string;
  }
) {
  try {
    const supabase = createClient();
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

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
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
  newCategory: string
): Promise<UpdateCategoryResult> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('transactions')
      .update({ category: newCategory })
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error };
    }

    // TODO: Trigger budget recalculation

    return { success: true, error: null };
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
    const supabase = createClient();

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
