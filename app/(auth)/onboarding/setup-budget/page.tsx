'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { suggestBudgetAmountsAction, createBudgetAction } from '@/app/actions/budget';
import { getCategoriesAction } from '@/app/actions/category';
import { getSessionAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Category } from '@/types';
import {
  Coffee,
  Car,
  ShoppingBag,
  Home,
  Zap,
  Film,
  Heart,
  ShoppingCart,
  DollarSign,
  Loader2,
  PiggyBank,
  Utensils,
  GraduationCap,
  Plane,
  Sparkles
} from 'lucide-react';

// UPDATED: Icon mapping now uses category internal names
const CATEGORY_ICONS: Record<string, any> = {
  'dining_out': Coffee,
  'transportation': Car,
  'shopping': ShoppingBag,
  'housing': Home,
  'utilities': Zap,
  'entertainment': Film,
  'healthcare': Heart,
  'groceries': ShoppingCart,
  'personal_care': Sparkles,
  'education': GraduationCap,
  'travel': Plane,
  'other': Utensils,
};

// REMOVED: COMMON_CATEGORIES - now fetched from database

export default function SetupBudgetPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetAmounts, setBudgetAmounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      const session = await getSessionAction();
      if (!session) {
        router.push('/login');
        return;
      }

      const uid = session.id;
      setUserId(uid);

      // Fetch categories from database
      const categoriesResult = await getCategoriesAction();
      if (categoriesResult.categories) {
        setCategories(categoriesResult.categories);

        // Get suggested amounts
        const suggestions = await suggestBudgetAmountsAction(uid);

        // Initialize with suggestions or defaults using category IDs
        const initialAmounts: Record<string, number> = {};
        categoriesResult.categories.forEach((category) => {
          // Try to match suggestion by category ID or name
          const suggestion = suggestions.find(
            (s: any) => s.category_id === category.id || s.category_name === category.display_name
          );
          initialAmounts[category.id] = suggestion?.suggested_amount || 0;
        });

        setBudgetAmounts(initialAmounts);
      }

      setIsLoading(false);
    }

    initialize();
  }, [router]);

  const handleAmountChange = (category: string, value: string) => {
    const amount = parseFloat(value) || 0;
    setBudgetAmounts((prev) => ({
      ...prev,
      [category]: amount,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    if (!userId) {
      setError('User not authenticated');
      setIsSaving(false);
      return;
    }

    try {
      const now = new Date();

      // Convert budgetAmounts Record to array format for createBudgetAction
      const categoriesArray = Object.entries(budgetAmounts).map(([categoryId, amount]) => ({
        category_id: categoryId,
        budgeted_amount: amount,
      }));

      const result = await createBudgetAction(userId, {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        categories: categoriesArray,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to create budget');
      } else {
        // Success - redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-slate-600">Loading suggestions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
            <PiggyBank className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Set Your Budget
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            We've suggested budget amounts based on your recent spending. You can adjust these amounts or enter your own.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-3 mb-6">
              {categories.map((category) => {
                const Icon = CATEGORY_ICONS[category.name] || DollarSign;
                return (
                  <div
                    key={category.id}
                    className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <label className="font-medium text-slate-900 flex-1">
                      {category.display_name}
                    </label>
                    <div className="relative w-36">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                      </div>
                      <Input
                        data-testid={`budget-category-${category.name}`}
                        type="number"
                        name={`budget-${category.name}`}
                        value={budgetAmounts[category.id] || 0}
                        onChange={(e) => handleAmountChange(category.id, e.target.value)}
                        min="0"
                        step="10"
                        className="text-right pl-8"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-blue-900">
                    Total Monthly Budget
                  </span>
                </div>
                <span className="text-3xl font-bold text-blue-600">
                  ${Object.values(budgetAmounts).reduce((sum, amount) => sum + amount, 0).toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              data-testid="create-budget-button"
              type="submit"
              variant="primary"
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating budget...
                </>
              ) : (
                'Create Budget'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
