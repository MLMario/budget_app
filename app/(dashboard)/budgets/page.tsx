/**
 * Budgets Page
 *
 * Main budget management page with:
 * - Current month overview
 * - Category breakdowns
 * - Edit controls
 * - Month navigation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { MonthSelector } from '@/components/budget/MonthSelector';
import { BudgetOverview } from '@/components/budget/BudgetOverview';
import { BudgetCategoryCard } from '@/components/budget/BudgetCategoryCard';
import { BudgetEditModal } from '@/components/budget/BudgetEditModal';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { getSessionAction } from '@/app/actions/auth';
import {
  getBudgetByMonthAction,
  updateBudgetCategoryAction,
} from '@/app/actions/budget';

interface BudgetCategory {
  id: string;
  category_id: string;
  category_name: string;
  budgeted_amount: number;
  spent_amount: number;
}

interface Budget {
  id: string;
  month: number;
  year: number;
  categories: BudgetCategory[];
}

export default function BudgetsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [budget, setBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);

  // Load user session
  useEffect(() => {
    async function loadSession() {
      try {
        const session = await getSessionAction();
        if (session) {
          setUserId(session.id);
        } else {
          setError('Please log in to view budgets');
        }
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Failed to load session');
      }
    }

    loadSession();
  }, []);

  // Load budget data
  useEffect(() => {
    if (!userId) return;

    async function loadBudget() {
      try {
        setIsLoading(true);
        setError(null);

        const budgetData = await getBudgetByMonthAction(userId!, currentMonth, currentYear);

        if (budgetData) {
          setBudget(budgetData);
        } else {
          // No budget exists for this month
          setBudget(null);
        }
      } catch (err) {
        console.error('Error loading budget:', err);
        setError('Failed to load budget data');
      } finally {
        setIsLoading(false);
      }
    }

    loadBudget();
  }, [userId, currentMonth, currentYear]);

  // Refresh budget when page becomes visible (user switches back to tab)
  useEffect(() => {
    if (!userId) return;

    const handleVisibilityChange = async () => {
      // Only refresh when page becomes visible (not when hiding)
      if (document.visibilityState === 'visible') {
        console.log('[Budget Page] Tab became visible, refreshing budget data...');

        try {
          setIsLoading(true);
          const budgetData = await getBudgetByMonthAction(userId, currentMonth, currentYear);

          if (budgetData) {
            setBudget(budgetData);
          }
        } catch (err) {
          console.error('Error refreshing budget on visibility change:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, currentMonth, currentYear]);

  const handleMonthChange = (month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);
  };

  const handleEditCategory = (categoryId: string) => {
    const category = budget?.categories.find((c) => c.category_id === categoryId);
    if (category) {
      setEditingCategory(category);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveBudget = async (categoryId: string, newAmount: number) => {
    if (!userId || !budget) return;

    try {
      const result = await updateBudgetCategoryAction(
        userId,
        budget.id,
        categoryId,
        newAmount
      );

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh budget data
      const updatedBudget = await getBudgetByMonthAction(userId, currentMonth, currentYear);
      if (updatedBudget) {
        setBudget(updatedBudget);
      }

      setIsEditModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      console.error('Error updating budget:', err);
      throw err; // Re-throw to show error in modal
    }
  };

  const handleCreateBudget = () => {
    // Navigate to budget creation flow
    // This would be implemented in a future task
    console.log('Create budget clicked');
  };

  // Calculate totals
  const totalBudget = budget?.categories.reduce((sum, cat) => sum + cat.budgeted_amount, 0) || 0;
  const totalSpent = budget?.categories.reduce((sum, cat) => sum + cat.spent_amount, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Loading budgets..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header with month selector */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Budget Management</h1>
        <MonthSelector
          currentMonth={currentMonth}
          currentYear={currentYear}
          onMonthChange={handleMonthChange}
        />
      </div>

      {!budget ? (
        /* No budget exists for selected month */
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            No Budget for This Month
          </h2>
          <p className="text-gray-600 mb-6">
            Create a budget to start tracking your spending for{' '}
            {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
            .
          </p>
          <Button variant="primary" size="lg" onClick={handleCreateBudget}>
            Create Budget
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Budget Overview */}
          <BudgetOverview
            totalBudget={totalBudget}
            totalSpent={totalSpent}
            month={currentMonth}
            year={currentYear}
          />

          {/* Category Breakdown */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budget.categories.map((category) => (
                <BudgetCategoryCard
                  key={category.id}
                  categoryId={category.category_id}
                  categoryName={category.category_name}
                  budgetedAmount={category.budgeted_amount}
                  spentAmount={category.spent_amount}
                  onEdit={handleEditCategory}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCategory && (
        <BudgetEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCategory(null);
          }}
          categoryId={editingCategory.category_id}
          categoryName={editingCategory.category_name}
          currentAmount={editingCategory.budgeted_amount}
          onSave={handleSaveBudget}
        />
      )}
    </div>
  );
}
