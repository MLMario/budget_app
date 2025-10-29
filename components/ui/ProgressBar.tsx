/**
 * ProgressBar Component
 *
 * Color-coded progress bar for budget tracking
 * - Green: < 80% (on track)
 * - Yellow: 80-100% (warning)
 * - Red: > 100% (over budget)
 */

import React from 'react'
import { cn } from '@/lib/utils/cn'

export interface ProgressBarProps {
  value: number // Current value
  max: number // Maximum value
  showPercentage?: boolean
  showLabel?: boolean
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getProgressColor(percentage: number): string {
  if (percentage >= 100) {
    return 'bg-red-500'
  } else if (percentage >= 80) {
    return 'bg-yellow-500'
  } else {
    return 'bg-green-500'
  }
}

function getBackgroundColor(percentage: number): string {
  if (percentage >= 100) {
    return 'bg-red-100'
  } else if (percentage >= 80) {
    return 'bg-yellow-100'
  } else {
    return 'bg-green-100'
  }
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

export function ProgressBar({
  value,
  max,
  showPercentage = false,
  showLabel = false,
  label,
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const isOverBudget = percentage > 100

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span
              className={cn(
                'text-sm font-semibold',
                percentage >= 100
                  ? 'text-red-600'
                  : percentage >= 80
                  ? 'text-yellow-600'
                  : 'text-green-600'
              )}
            >
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          getBackgroundColor(percentage),
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            getProgressColor(percentage)
          )}
          style={{
            width: isOverBudget ? '100%' : `${percentage}%`,
          }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || 'Progress'}
          data-testid="progress-bar"
        />
      </div>

      {isOverBudget && (
        <p className="text-xs text-red-600 mt-1 font-medium">
          Over budget by {((value - max) / max * 100).toFixed(0)}%
        </p>
      )}
    </div>
  )
}

/**
 * Variant with value and max labels
 */
export interface ProgressBarWithLabelsProps extends ProgressBarProps {
  valueLabel: string
  maxLabel: string
}

export function ProgressBarWithLabels({
  value,
  max,
  valueLabel,
  maxLabel,
  label,
  size = 'md',
  className,
}: ProgressBarWithLabelsProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="mb-1.5">
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-1.5">
        <span
          className={cn(
            'text-sm font-semibold',
            percentage >= 100
              ? 'text-red-600'
              : percentage >= 80
              ? 'text-yellow-600'
              : 'text-green-600'
          )}
        >
          {valueLabel}
        </span>
        <span className="text-sm text-gray-500">{maxLabel}</span>
      </div>

      <ProgressBar
        value={value}
        max={max}
        size={size}
        showPercentage={false}
      />
    </div>
  )
}
