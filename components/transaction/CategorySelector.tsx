/**
 * CategorySelector Component
 *
 * T077: Dropdown component for recategorizing transactions
 * Displays all available budget categories with visual styling
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';

export interface CategorySelectorProps {
  currentCategory?: string;
  onSelect: (category: string) => void;
  onCancel?: () => void;
  isOpen?: boolean;
  className?: string;
}

// Standard app categories matching the category mapping
const CATEGORIES = [
  'Dining & Coffee',
  'Transportation',
  'Shopping',
  'Housing',
  'Entertainment',
  'Healthcare',
  'Travel',
  'Personal Care',
  'Fees',
  'Transfer',
  'Income',
  'Groceries',
  'Bills & Utilities',
  'Education',
  'Gifts & Donations',
  'Savings',
  'Uncategorized',
];

const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    'Dining & Coffee': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    'Transportation': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    'Shopping': 'bg-pink-100 text-pink-800 hover:bg-pink-200',
    'Housing': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    'Entertainment': 'bg-red-100 text-red-800 hover:bg-red-200',
    'Healthcare': 'bg-green-100 text-green-800 hover:bg-green-200',
    'Travel': 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
    'Personal Care': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
    'Fees': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    'Transfer': 'bg-slate-100 text-slate-800 hover:bg-slate-200',
    'Income': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
    'Groceries': 'bg-lime-100 text-lime-800 hover:bg-lime-200',
    'Bills & Utilities': 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    'Education': 'bg-violet-100 text-violet-800 hover:bg-violet-200',
    'Gifts & Donations': 'bg-rose-100 text-rose-800 hover:bg-rose-200',
    'Savings': 'bg-teal-100 text-teal-800 hover:bg-teal-200',
    'Uncategorized': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  };
  return colorMap[category] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
};

export function CategorySelector({
  currentCategory,
  onSelect,
  onCancel,
  isOpen = true,
  className,
}: CategorySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleSelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleConfirm = () => {
    if (selectedCategory) {
      onSelect(selectedCategory);
      setSelectedCategory(null);
    }
  };

  const handleCancel = () => {
    setSelectedCategory(null);
    if (onCancel) {
      onCancel();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn('bg-white border border-gray-300 rounded-lg shadow-lg p-4', className)}
      data-testid="category-selector"
    >
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-900">Select Category</h3>
        {currentCategory && (
          <p className="text-xs text-gray-500 mt-1">
            Current: <span className="font-medium">{currentCategory}</span>
          </p>
        )}
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => handleSelect(category)}
            className={cn(
              'px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'text-left',
              getCategoryColor(category),
              selectedCategory === category && 'ring-2 ring-blue-500',
              currentCategory === category && 'ring-2 ring-gray-400'
            )}
            data-testid={`category-option-${category}`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        <Button
          variant="primary"
          size="sm"
          onClick={handleConfirm}
          disabled={!selectedCategory}
          fullWidth
          data-testid="save-category-button"
        >
          Save Category
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          fullWidth
          data-testid="cancel-category-button"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
