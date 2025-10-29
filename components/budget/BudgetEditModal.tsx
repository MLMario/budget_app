/**
 * BudgetEditModal Component
 *
 * Modal for editing budget category amounts
 * - Shows current budgeted amount
 * - Allows user to update the amount
 * - Validates input (must be positive number)
 * - Saves changes to database
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface BudgetEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  currentAmount: number;
  onSave: (categoryId: string, newAmount: number) => Promise<void>;
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

export function BudgetEditModal({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  currentAmount,
  onSave,
  className,
}: BudgetEditModalProps) {
  const [amount, setAmount] = useState(currentAmount.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update amount when currentAmount changes (e.g., switching categories)
  useEffect(() => {
    setAmount(currentAmount.toString());
    setError(null);
  }, [currentAmount, categoryId]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string, numbers, and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount);

    // Validation
    if (isNaN(numAmount)) {
      setError('Please enter a valid number');
      return;
    }

    if (numAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (numAmount > 1000000) {
      setError('Amount must be less than $1,000,000');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(categoryId, numAmount);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setAmount(currentAmount.toString());
    setError(null);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleCancel}
      data-testid="budget-edit-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-budget-title"
    >
      <Card
        variant="elevated"
        padding="none"
        className={cn('w-full max-w-md mx-4', className)}
        onClick={(e) => e.stopPropagation()}
        data-testid="budget-edit-modal"
      >
        <CardHeader className="p-6 border-b border-gray-200">
          <CardTitle id="edit-budget-title" as="h2">
            Edit {categoryName} Budget
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div>
            <label htmlFor="budget-amount" className="block text-sm font-medium text-gray-700 mb-2">
              Budget Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="budget-amount"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                onKeyDown={handleKeyDown}
                placeholder="0.00"
                className="pl-8"
                autoFocus
                disabled={isSaving}
                aria-label="Budget amount"
                aria-invalid={!!error}
                aria-describedby={error ? 'budget-error' : undefined}
                data-testid="budget-amount-input"
              />
            </div>
            {error && (
              <p id="budget-error" className="mt-2 text-sm text-red-600" role="alert" data-testid="budget-error">
                {error}
              </p>
            )}
          </div>

          {/* Current vs New comparison */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Budget:</span>
              <span className="font-medium text-gray-900">{formatCurrency(currentAmount)}</span>
            </div>
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) !== currentAmount && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">New Budget:</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(parseFloat(amount))}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Change:</span>
                  <span
                    className={cn(
                      'font-semibold',
                      parseFloat(amount) > currentAmount ? 'text-green-600' : 'text-red-600'
                    )}
                    data-testid="budget-change-preview"
                  >
                    {parseFloat(amount) > currentAmount ? '+' : ''}
                    {formatCurrency(parseFloat(amount) - currentAmount)}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            data-testid="budget-edit-cancel"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaving || !!error}
            data-testid="budget-edit-save"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
