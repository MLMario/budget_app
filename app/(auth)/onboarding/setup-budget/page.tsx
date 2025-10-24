'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { suggestBudgetAmounts, createBudget } from '@/services/budget.service';
import { getSession } from '@/services/auth.service';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const COMMON_CATEGORIES = [
  'Dining & Coffee',
  'Transportation',
  'Shopping',
  'Housing',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Groceries',
];

export default function SetupBudgetPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [budgetAmounts, setBudgetAmounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      const session = await getSession();
      if (!session.session?.user) {
        router.push('/login');
        return;
      }

      const uid = session.session.user.id;
      setUserId(uid);

      // Get suggested amounts
      const suggestions = await suggestBudgetAmounts(uid);

      // Initialize with suggestions or defaults
      const initialAmounts: Record<string, number> = {};
      COMMON_CATEGORIES.forEach((category) => {
        initialAmounts[category] = suggestions[category] || 0;
      });

      setBudgetAmounts(initialAmounts);
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
      const result = await createBudget(userId, {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        categories: budgetAmounts,
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
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Set Your Budget
        </h1>
        <p className="text-gray-600 mb-6">
          We've suggested budget amounts based on your recent spending. You can adjust these amounts or enter your own.
        </p>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            {COMMON_CATEGORIES.map((category) => (
              <div
                key={category}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <label className="font-medium text-gray-900 flex-1">
                  {category}
                </label>
                <div className="w-32">
                  <Input
                    type="number"
                    name={`budget-${category.toLowerCase().replace(/\s+/g, '-')}`}
                    value={budgetAmounts[category] || 0}
                    onChange={(e) => handleAmountChange(category, e.target.value)}
                    min="0"
                    step="10"
                    className="text-right"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">
                Total Monthly Budget
              </span>
              <span className="text-2xl font-bold text-blue-600">
                ${Object.values(budgetAmounts).reduce((sum, amount) => sum + amount, 0).toFixed(2)}
              </span>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? 'Creating budget...' : 'Create Budget'}
          </Button>
        </form>
      </div>
    </div>
  );
}
