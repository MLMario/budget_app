/**
 * WarningBadge Component
 *
 * Display badge for budget categories at 90%+ spending (warning threshold)
 * Used to highlight categories approaching their budget limit
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface WarningBadgeProps {
  percentage: number;
  remaining: number;
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

export function WarningBadge({
  percentage,
  remaining,
  className,
}: WarningBadgeProps) {
  // Only show for 90%+ spending (but below 100%)
  if (percentage < 90 || percentage >= 100) {
    return null;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-yellow-100 border border-yellow-300',
        className
      )}
      role="alert"
      aria-live="polite"
      data-testid="warning-badge"
    >
      <svg
        className="w-4 h-4 text-yellow-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-yellow-800">
          Warning: {percentage.toFixed(0)}% Used
        </span>
        <span className="text-xs text-yellow-700">
          Only {formatCurrency(remaining)} remaining
        </span>
      </div>
    </div>
  );
}

/**
 * Compact version for inline use
 */
export function WarningBadgeCompact({
  percentage,
  className,
}: {
  percentage: number;
  className?: string;
}) {
  // Only show for 90%+ spending (but below 100%)
  if (percentage < 90 || percentage >= 100) {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
        'bg-yellow-100 text-yellow-800 border border-yellow-300',
        className
      )}
      role="alert"
      aria-live="polite"
      data-testid="warning-badge-compact"
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
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      Warning
    </span>
  );
}
