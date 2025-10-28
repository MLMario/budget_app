/**
 * MonthSelector Component
 *
 * Allows users to navigate between budget months
 * Displays current month/year and provides prev/next navigation
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';

export interface MonthSelectorProps {
  currentMonth: number; // 1-12
  currentYear: number;
  onMonthChange: (month: number, year: number) => void;
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

export function MonthSelector({
  currentMonth,
  currentYear,
  onMonthChange,
  className,
}: MonthSelectorProps) {
  const handlePrevious = () => {
    if (currentMonth === 1) {
      onMonthChange(12, currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1, currentYear);
    }
  };

  const handleNext = () => {
    if (currentMonth === 12) {
      onMonthChange(1, currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1, currentYear);
    }
  };

  const handleToday = () => {
    const now = new Date();
    onMonthChange(now.getMonth() + 1, now.getFullYear());
  };

  const monthName = MONTH_NAMES[currentMonth - 1];
  const now = new Date();
  const isCurrentMonth = currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();

  return (
    <div
      className={cn('flex items-center justify-between gap-4', className)}
      role="navigation"
      aria-label="Budget month navigation"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        aria-label="Previous month"
        data-testid="month-selector-prev"
      >
        ← Previous
      </Button>

      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900">
          {monthName} {currentYear}
        </h2>
        {!isCurrentMonth && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            data-testid="month-selector-today"
          >
            Today
          </Button>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        aria-label="Next month"
        data-testid="month-selector-next"
      >
        Next →
      </Button>
    </div>
  );
}
