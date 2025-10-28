/**
 * FutureBudgetModal Component
 *
 * Modal for creating a future month's budget with three options:
 * 1. Copy from previous month
 * 2. Use 3-month average
 * 3. Custom amounts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';

export interface FutureBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: number;
  year: number;
  onCopyFromPrevious: () => Promise<void>;
  onUseThreeMonthAverage: () => Promise<void>;
  onUseCustom: () => Promise<void>;
  className?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function FutureBudgetModal({
  isOpen,
  onClose,
  month,
  year,
  onCopyFromPrevious,
  onUseThreeMonthAverage,
  onUseCustom,
  className,
}: FutureBudgetModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<
    'copy' | 'average' | 'custom' | null
  >(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedOption(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleOptionSelect = async (option: 'copy' | 'average' | 'custom') => {
    try {
      setIsLoading(true);
      setSelectedOption(option);

      if (option === 'copy') {
        await onCopyFromPrevious();
      } else if (option === 'average') {
        await onUseThreeMonthAverage();
      } else {
        await onUseCustom();
      }

      onClose();
    } catch (error) {
      console.error('Error creating budget:', error);
      // Error handling is done by parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const monthName = MONTH_NAMES[month - 1];

  // Calculate previous month for display
  let previousMonth = month - 1;
  let previousYear = year;
  if (previousMonth === 0) {
    previousMonth = 12;
    previousYear = year - 1;
  }
  const previousMonthName = MONTH_NAMES[previousMonth - 1];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      data-testid="future-budget-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-budget-title"
    >
      <Card
        variant="elevated"
        padding="none"
        className={cn('w-full max-w-2xl mx-4', className)}
        onClick={(e) => e.stopPropagation()}
        data-testid="future-budget-modal"
      >
        <CardHeader className="p-6 border-b border-gray-200">
          <CardTitle id="create-budget-title" as="h2">
            Create Budget for {monthName} {year}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Choose how you'd like to set up your budget for the upcoming month
          </p>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loading size="lg" text="Creating budget..." />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Option 1: Copy from previous month */}
              <button
                onClick={() => handleOptionSelect('copy')}
                disabled={isLoading}
                className={cn(
                  'w-full p-6 text-left border-2 rounded-lg transition-all',
                  'hover:border-blue-500 hover:bg-blue-50',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  selectedOption === 'copy' && 'border-blue-500 bg-blue-50'
                )}
                data-testid="budget-option-copy"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Copy from {previousMonthName} {previousYear}
                </h3>
                <p className="text-sm text-gray-600">
                  Use the exact same budget amounts from your previous month. This is ideal if
                  your spending is consistent.
                </p>
                <div className="mt-3 flex items-center text-sm text-blue-600">
                  <span className="font-medium">Recommended if you have a stable budget</span>
                </div>
              </button>

              {/* Option 2: Use 3-month average */}
              <button
                onClick={() => handleOptionSelect('average')}
                disabled={isLoading}
                className={cn(
                  'w-full p-6 text-left border-2 rounded-lg transition-all',
                  'hover:border-blue-500 hover:bg-blue-50',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  selectedOption === 'average' && 'border-blue-500 bg-blue-50'
                )}
                data-testid="budget-option-average"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Use 3-Month Average
                </h3>
                <p className="text-sm text-gray-600">
                  Calculate average amounts from your last 3 months of budgets. This smooths out
                  variations and provides a balanced budget.
                </p>
                <div className="mt-3 flex items-center text-sm text-blue-600">
                  <span className="font-medium">Recommended for consistent planning</span>
                </div>
              </button>

              {/* Option 3: Custom amounts */}
              <button
                onClick={() => handleOptionSelect('custom')}
                disabled={isLoading}
                className={cn(
                  'w-full p-6 text-left border-2 rounded-lg transition-all',
                  'hover:border-blue-500 hover:bg-blue-50',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  selectedOption === 'custom' && 'border-blue-500 bg-blue-50'
                )}
                data-testid="budget-option-custom"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Start from Scratch
                </h3>
                <p className="text-sm text-gray-600">
                  Create a budget with AI-suggested amounts based on your spending patterns. You
                  can adjust each category as needed.
                </p>
                <div className="mt-3 flex items-center text-sm text-blue-600">
                  <span className="font-medium">Recommended for first-time setup</span>
                </div>
              </button>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            data-testid="future-budget-cancel"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
