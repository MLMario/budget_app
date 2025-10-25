'use client';

import { useEffect, useState } from 'react';
import { getSessionAction } from '@/app/actions/auth';
import { getBudgetByMonthAction, calculateSpendingAction } from '@/app/actions/budget';
import { AlertCircle, CheckCircle, Lightbulb, Info, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

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
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
      case 'success':
        return CheckCircle;
      default:
        return Info;
    }
  };

  const getAlertIconColor = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      case 'success':
        return 'text-white';
      default:
        return 'text-slate-600';
    }
  };

  const getAlertTextColor = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-900';
      case 'warning':
        return 'text-yellow-900';
      case 'info':
        return 'text-blue-900';
      case 'success':
        return 'text-emerald-900';
      default:
        return 'text-slate-900';
    }
  };

  const quickTips = [
    'Tag recurring bills as "non-negotiable" to track essential expenses',
    'Review your spending weekly to stay on track',
    'Use AI Insights for personalized recommendations',
  ];

  if (isLoading) {
    return (
      <div className="sticky top-8 space-y-6">
        <div className="animate-pulse">
          <div className="h-24 bg-slate-200 rounded-xl mb-6"></div>
          <div className="h-40 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-8 space-y-6">
      {/* Alerts Section */}
      <div>
        <h3 className="text-slate-900 font-semibold mb-4">Alerts</h3>

        {alerts.length === 0 ? (
          <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-emerald-900 font-medium mb-1">No alerts at this time</p>
                <p className="text-sm text-emerald-700">You're all caught up!</p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = getAlertIcon(alert.type);
              const bgClass = alert.type === 'success' ? 'bg-emerald-500' :
                             alert.type === 'error' ? 'bg-red-500' :
                             alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
              return (
                <Card
                  key={alert.id}
                  className={`p-4 ${getAlertStyles(alert.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${bgClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${getAlertIconColor(alert.type)}`} />
                    </div>
                    <div>
                      <p className={`font-medium mb-1 ${getAlertTextColor(alert.type)}`}>
                        {alert.title}
                      </p>
                      <p className={`text-sm ${getAlertTextColor(alert.type)}`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Tips Section */}
      <div>
        <h3 className="text-slate-900 font-semibold mb-4">Quick Tips</h3>
        <div className="space-y-3">
          {quickTips.map((tip, index) => (
            <Card
              key={index}
              className="p-4 bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-900" />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{tip}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
