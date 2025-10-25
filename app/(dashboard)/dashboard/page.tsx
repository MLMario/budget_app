'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionAction } from '@/app/actions/auth';
import { getBudgetByMonthAction, calculateSpendingAction } from '@/app/actions/budget';
import { getTransactionsByUserAction } from '@/app/actions/transaction';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [budgetData, setBudgetData] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);

  useEffect(() => {
    async function loadDashboard() {
      const session = await getSessionAction();
      if (!session) {
        router.push('/login');
        return;
      }

      const userId = session.id;
      setUserName(session.email?.split('@')[0] || 'User');

      // Get current month budget
      const now = new Date();
      const budget = await getBudgetByMonthAction(userId, now.getMonth() + 1, now.getFullYear());

      if (budget) {
        setBudgetData(budget);

        // Calculate total budget
        const total = budget.budget_categories?.reduce(
          (sum: number, cat: any) => sum + cat.budgeted_amount,
          0
        ) || 0;
        setTotalBudget(total);

        // Calculate total spending
        const spent = await calculateSpendingAction(userId, now.getMonth() + 1, now.getFullYear());
        setTotalSpent(spent);
      }

      // Get recent transactions
      const transactions = await getTransactionsByUserAction(userId);
      setRecentTransactions(transactions.slice(0, 10));

      setIsLoading(false);
    }

    loadDashboard();
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const utilizationPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's your budget overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Budget Utilization Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div
            className="bg-white rounded-lg shadow-sm p-6"
            data-testid="budget-utilization-widget"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Current Budget Utilization
            </h2>

            {budgetData ? (
              <>
                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(totalSpent)}
                    </span>
                    <span className="text-lg text-gray-600">
                      / {formatCurrency(totalBudget)}
                    </span>
                    <span className={`text-2xl font-semibold ${
                      utilizationPercentage > 100 ? 'text-red-600' :
                      utilizationPercentage > 80 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {utilizationPercentage.toFixed(0)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        utilizationPercentage > 100 ? 'bg-red-600' :
                        utilizationPercentage > 80 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                {utilizationPercentage > 90 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ You're approaching your budget limit. Consider reviewing your spending.
                    </p>
                  </div>
                )}

                {utilizationPercentage > 100 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">
                      🚨 You've exceeded your budget by {formatCurrency(totalSpent - totalBudget)}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No budget set for this month</p>
                <a
                  href="/dashboard/budgets"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create a budget →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Days Remaining
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Transactions This Month
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {recentTransactions.length}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </h2>
          <a
            href="/dashboard/transactions"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all →
          </a>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            No transactions yet. Connect your bank to get started!
          </p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{tx.merchant_name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(tx.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-gray-500">{tx.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
