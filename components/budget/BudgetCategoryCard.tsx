/**
 * BudgetCategoryCard Component
 *
 * Displays a single budget category with:
 * - Category name
 * - Budgeted amount
 * - Spent amount
 * - Progress bar with color coding (green < 80%, yellow 80-100%, red > 100%)
 * - Edit button
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';

export interface BudgetCategoryCardProps {
  categoryId: string;
  categoryName: string;
  budgetedAmount: number;
  spentAmount: number;
  onEdit?: (categoryId: string) => void;
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

function getStatusText(spentAmount: number, budgetedAmount: number): string {
  const percentage = budgetedAmount > 0 ? (spentAmount / budgetedAmount) * 100 : 0;

  if (percentage >= 100) {
    const overAmount = spentAmount - budgetedAmount;
    return `Over budget by ${formatCurrency(overAmount)}`;
  } else if (percentage >= 80) {
    const remaining = budgetedAmount - spentAmount;
    return `${formatCurrency(remaining)} remaining`;
  } else {
    const remaining = budgetedAmount - spentAmount;
    return `${formatCurrency(remaining)} remaining`;
  }
}

export function BudgetCategoryCard({
  categoryId,
  categoryName,
  budgetedAmount,
  spentAmount,
  onEdit,
  className,
}: BudgetCategoryCardProps) {
  const percentage = budgetedAmount > 0 ? (spentAmount / budgetedAmount) * 100 : 0;
  const statusText = getStatusText(spentAmount, budgetedAmount);

  // Determine status color
  let statusColor = 'text-green-600';
  if (percentage >= 100) {
    statusColor = 'text-red-600';
  } else if (percentage >= 80) {
    statusColor = 'text-yellow-600';
  }

  return (
    <Card
      variant="default"
      padding="md"
      className={cn('hover:shadow-md transition-shadow', className)}
      data-testid={`budget-category-card-${categoryId}`}
    >
      <CardContent className="space-y-3">
        {/* Header: Category name and Edit button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{categoryName}</h3>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(categoryId)}
              aria-label={`Edit ${categoryName} budget`}
              data-testid={`edit-budget-${categoryId}`}
            >
              Edit
            </Button>
          )}
        </div>

        {/* Amount display */}
        <div className="flex items-baseline justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(spentAmount)}
            </span>
            <span className="text-sm text-gray-500">
              of {formatCurrency(budgetedAmount)} budgeted
            </span>
          </div>
          <span className={cn('text-sm font-medium', statusColor)}>
            {percentage.toFixed(0)}%
          </span>
        </div>

        {/* Progress bar */}
        <ProgressBar
          value={spentAmount}
          max={budgetedAmount}
          size="md"
          showPercentage={false}
        />

        {/* Status text */}
        <p className={cn('text-sm font-medium', statusColor)}>{statusText}</p>
      </CardContent>
    </Card>
  );
}
