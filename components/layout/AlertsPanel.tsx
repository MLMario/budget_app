'use client';

import { useEffect, useState } from 'react';
import { getSessionAction } from '@/app/actions/auth';
import { getBudgetByMonthAction, calculateSpendingAction } from '@/app/actions/budget';

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const session = await getSessionAction();
        if (!session) {
          setIsLoading(false);
          return;
        }

        const userId = session.id;
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const budget = await getBudgetByMonthAction(userId, month, year);

        if (budget) {
          const totalBudget = budget.budget_categories?.reduce(
            (sum: number, cat: any) => sum + cat.budgeted_amount,
            0
          ) || 0;

          const totalSpent = await calculateSpendingAction(userId, month, year);
          const utilizationPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

          const newAlerts: Alert[] = [];

          // Budget utilization alerts
          if (utilizationPercentage > 100) {
            newAlerts.push({
              id: 'budget-exceeded',
              type: 'error',
              title: 'Budget Exceeded',
              message: `You've spent ${utilizationPercentage.toFixed(0)}% of your budget this month.`,
              timestamp: new Date(),
            });
          } else if (utilizationPercentage > 90) {
            newAlerts.push({
              id: 'budget-warning',
              type: 'warning',
              title: 'Budget Warning',
              message: `You've used ${utilizationPercentage.toFixed(0)}% of your budget. Consider reducing spending.`,
              timestamp: new Date(),
            });
          } else if (utilizationPercentage > 75) {
            newAlerts.push({
              id: 'budget-info',
              type: 'info',
              title: 'Budget Update',
              message: `You're at ${utilizationPercentage.toFixed(0)}% of your monthly budget.`,
              timestamp: new Date(),
            });
          }

          // Days remaining in month alert
          const daysInMonth = new Date(year, month, 0).getDate();
          const daysRemaining = daysInMonth - now.getDate();

          if (daysRemaining <= 5 && utilizationPercentage < 80) {
            newAlerts.push({
              id: 'days-remaining',
              type: 'success',
              title: 'Doing Great!',
              message: `Only ${daysRemaining} days left and you're under budget. Keep it up!`,
              timestamp: new Date(),
            });
          }

          setAlerts(newAlerts);
        }
      } catch (error) {
        console.error('Error loading alerts:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAlerts();
  }, []);

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      default:
        return '📌';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-8">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h2>

        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No alerts at this time</p>
            <p className="text-xs text-gray-400 mt-2">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border p-3 ${getAlertStyles(alert.type)}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">{getAlertIcon(alert.type)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{alert.title}</h3>
                    <p className="text-xs mt-1">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Tips Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Tips</h3>
          <div className="space-y-2">
            <div className="text-xs text-gray-600">
              💡 Tag recurring bills as "non-negotiable" to track essential expenses
            </div>
            <div className="text-xs text-gray-600">
              💡 Review your spending weekly to stay on track
            </div>
            <div className="text-xs text-gray-600">
              💡 Use AI Insights for personalized recommendations
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
