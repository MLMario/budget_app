/**
 * AlertBadge Component
 *
 * Display badge for budget categories at 100%+ spending (over budget)
 * Shows "Over by $X" to indicate the overspending amount
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface AlertBadgeProps {
  percentage: number;
  overAmount: number;
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

export function AlertBadge({
  percentage,
  overAmount,
  className,
}: AlertBadgeProps) {
  // Only show for 100%+ spending (over budget)
  if (percentage < 100) {
    return null;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-red-100 border border-red-300',
        className
      )}
      role="alert"
      aria-live="assertive"
      data-testid="alert-badge"
    >
      <svg
        className="w-4 h-4 text-red-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-red-800">
          Over Budget: {percentage.toFixed(0)}%
        </span>
        <span className="text-xs text-red-700">
          Over by {formatCurrency(overAmount)}
        </span>
      </div>
    </div>
  );
}

/**
 * Compact version for inline use
 */
export function AlertBadgeCompact({
  overAmount,
  className,
}: {
  overAmount: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
        'bg-red-100 text-red-800 border border-red-300',
        className
      )}
      role="alert"
      aria-live="assertive"
      data-testid="alert-badge-compact"
    >
      <svg
        className="w-3 h-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Over by {formatCurrency(overAmount)}
    </span>
  );
}
