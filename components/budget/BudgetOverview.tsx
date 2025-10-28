/**
 * BudgetOverview Component
 *
 * Shows overall budget summary:
 * - Total budget
 * - Total spent
 * - Percentage used
 * - Days remaining in month
 * - Average daily budget
 * - Color-coded status indicator
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';

export interface BudgetOverviewProps {
  totalBudget: number;
  totalSpent: number;
  month: number;
  year: number;
  className?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDaysRemaining(month: number, year: number): number {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // If viewing past month, return 0
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 0;
  }

  // If viewing future month, return full days
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    return new Date(year, month, 0).getDate();
  }

  // Current month - calculate remaining days
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentDay = now.getDate();
  return daysInMonth - currentDay;
}

function getAverageDailyBudget(totalBudget: number, month: number, year: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  return totalBudget / daysInMonth;
}

export function BudgetOverview({
  totalBudget,
  totalSpent,
  month,
  year,
  className,
}: BudgetOverviewProps) {
  const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remaining = totalBudget - totalSpent;
  const daysRemaining = getDaysRemaining(month, year);
  const avgDailyBudget = getAverageDailyBudget(totalBudget, month, year);

  // Determine status
  let status: 'on_track' | 'warning' | 'alert' = 'on_track';
  let statusText = 'On Track';
  let statusColor = 'text-green-600';

  if (percentageUsed >= 100) {
    status = 'alert';
    statusText = 'Over Budget';
    statusColor = 'text-red-600';
  } else if (percentageUsed >= 80) {
    status = 'warning';
    statusText = 'Warning';
    statusColor = 'text-yellow-600';
  }

  return (
    <Card variant="elevated" padding="lg" className={cn(className)} data-testid="budget-overview">
      <CardHeader>
        <CardTitle as="h2">Budget Overview</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main budget display */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-4xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-2xl font-semibold text-gray-700">
                {formatCurrency(totalBudget)}
              </p>
            </div>
          </div>

          <ProgressBar value={totalSpent} max={totalBudget} size="lg" showPercentage={false} />

          <div className="flex items-center justify-between">
            <span className={cn('text-lg font-semibold', statusColor)}>
              {percentageUsed.toFixed(1)}% used
            </span>
            <span className={cn('px-3 py-1 rounded-full text-sm font-medium', statusColor)}>
              {statusText}
            </span>
          </div>
        </div>

        {/* Remaining amount */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Remaining</span>
            <span
              className={cn(
                'text-xl font-bold',
                remaining >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {formatCurrency(Math.abs(remaining))}
              {remaining < 0 && ' over'}
            </span>
          </div>
        </div>

        {/* Statistics grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Days Remaining</p>
            <p className="text-2xl font-semibold text-gray-900">{daysRemaining}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg. Daily Budget</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(avgDailyBudget)}
            </p>
          </div>
        </div>

        {/* Daily budget remaining (if days remaining > 0) */}
        {daysRemaining > 0 && remaining > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">Daily Budget Remaining</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatCurrency(remaining / daysRemaining)}
              <span className="text-sm text-gray-500 font-normal"> per day</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
