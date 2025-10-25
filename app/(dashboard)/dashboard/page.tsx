'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionAction } from '@/app/actions/auth';
import { getBudgetByMonthAction, calculateSpendingAction } from '@/app/actions/budget';
import { getTransactionsByUserAction } from '@/app/actions/transaction';
import { Receipt, TrendingUp, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const utilizationPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const now = new Date();
  const daysRemaining = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {userName}!
        </h1>
        <p className="text-slate-600">
          Here's your budget overview for {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Budget Card */}
        <Card className="lg:col-span-2 p-6 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-slate-600 mb-1">Current Budget Utilization</h3>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-3xl font-bold text-slate-900">
                  {formatCurrency(totalSpent)}
                </span>
                <span className="text-slate-400">
                  / {formatCurrency(totalBudget)}
                </span>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full ${
              utilizationPercentage > 100 ? 'bg-red-50 text-red-700' :
              utilizationPercentage > 80 ? 'bg-yellow-50 text-yellow-700' :
              'bg-emerald-50 text-emerald-700'
            }`}>
              <span className="font-medium">{utilizationPercentage.toFixed(0)}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                utilizationPercentage > 100 ? 'bg-red-600' :
                utilizationPercentage > 80 ? 'bg-yellow-500' :
                'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
            />
          </div>

          <div className="mt-2 text-xs text-slate-500">
            {utilizationPercentage < 50 ? "You're doing great! Keep it up." :
             utilizationPercentage < 80 ? "On track with your budget." :
             utilizationPercentage < 100 ? "Approaching your budget limit." :
             "You've exceeded your budget this month."}
          </div>

          {/* Alerts */}
          {utilizationPercentage > 90 && utilizationPercentage <= 100 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                You're approaching your budget limit. Consider reviewing your spending.
              </p>
            </div>
          )}

          {utilizationPercentage > 100 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                You've exceeded your budget by {formatCurrency(totalSpent - totalBudget)}
              </p>
            </div>
          )}
        </Card>

        {/* Stats Cards */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100 text-sm">Days Remaining</span>
              <TrendingUp className="w-4 h-4 text-blue-200" />
            </div>
            <div className="text-4xl font-bold mt-2">{daysRemaining}</div>
          </Card>

          <Card className="p-6 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="text-slate-600 mb-2 text-sm">Transactions This Month</div>
            <div className="text-4xl font-bold text-slate-900">{recentTransactions.length}</div>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors">
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-2">No transactions yet</p>
            <p className="text-sm text-slate-400">
              Connect your bank to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900">{tx.merchant_name || 'Transaction'}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(Math.abs(tx.amount))}
                  </p>
                  <p className="text-xs text-slate-500">{tx.category || 'Uncategorized'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
