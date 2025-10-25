'use client';

import { Input } from '../ui/Input';

interface BudgetCategoryInputProps {
  category: string;
  suggestedAmount: number;
  value: number;
  onChange: (value: number) => void;
}

export default function BudgetCategoryInput({
  category,
  suggestedAmount,
  value,
  onChange,
}: BudgetCategoryInputProps) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
      <div className="flex-1">
        <label className="font-medium text-gray-900 block">
          {category}
        </label>
        {suggestedAmount > 0 && suggestedAmount !== value && (
          <p className="text-sm text-gray-500 mt-1">
            Suggested: ${suggestedAmount.toFixed(2)}
          </p>
        )}
      </div>
      <div className="w-32">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min="0"
          step="10"
          className="text-right"
        />
      </div>
    </div>
  );
}
