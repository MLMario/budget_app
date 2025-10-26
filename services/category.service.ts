import { createClient } from '@/lib/supabase/server';
import type { Category } from '@/types';

/**
 * Category Service
 *
 * Helper functions for fetching and managing categories from the database.
 * Categories are now managed in the 'categories' table instead of being hardcoded.
 */

export interface GetCategoriesResult {
  categories: Category[];
  error: any;
}

/**
 * Fetch all active categories from the database
 * @returns Array of active categories ordered by display_order
 */
export async function getCategories(): Promise<GetCategoriesResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      return { categories: [], error };
    }

    return { categories: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return { categories: [], error: error.message };
  }
}

/**
 * Get a single category by ID
 * @param categoryId - UUID of the category
 * @returns Category object or null
 */
export async function getCategoryById(categoryId: string): Promise<Category | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Category;
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return null;
  }
}

/**
 * Get a category by internal name
 * @param name - Internal category name (e.g., "dining_out")
 * @returns Category object or null
 */
export async function getCategoryByName(name: string): Promise<Category | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('name', name)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Category;
  } catch (error: any) {
    console.error('Error fetching category by name:', error);
    return null;
  }
}

/**
 * Get categories formatted for dropdown/select inputs
 * @returns Array of {value, label} objects
 */
export async function getCategoriesForSelect(): Promise<Array<{value: string; label: string}>> {
  const { categories } = await getCategories();

  return categories.map(cat => ({
    value: cat.id,
    label: cat.display_name,
  }));
}
