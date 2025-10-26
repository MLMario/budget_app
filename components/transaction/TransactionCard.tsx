/**
 * TransactionCard Component
 *
 * T074: Individual transaction card with merchant, amount, category badge, date, and action buttons
 * Supports click to expand details, recategorize, tag, and add notes
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';

export interface Transaction {
  id: string;
  date: string;
  merchant_name: string;
  amount: number;
  category_primary?: string;
  category_detailed?: string;
  app_category_id?: string;
  user_category_override_id?: string | null;
  user_category_override?: string | null; // DEPRECATED
  app_category?: { id: string; name: string; display_name: string } | null;
  user_category?: { id: string; name: string; display_name: string } | null;
  tag_non_negotiable: boolean;
  tag_ignored: boolean;
  notes?: string | null;
  pending?: boolean;
}

export interface TransactionCardProps {
  transaction: Transaction;
  onRecategorize?: (transactionId: string) => void;
  onTag?: (transactionId: string, tag: 'non-negotiable' | 'ignored') => void;
  onAddNote?: (transactionId: string) => void;
  onClick?: (transaction: Transaction) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  // Parse date string directly without timezone conversion
  // dateString is in YYYY-MM-DD format from database
  const [year, month, day] = dateString.split('-').map(Number);

  // Create date in local timezone (not UTC) to avoid off-by-one errors
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export function TransactionCard({
  transaction,
  onRecategorize,
  onTag,
  onAddNote,
  onClick,
}: TransactionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Use joined category data (user override takes precedence over app category)
  const displayCategory = (transaction as any).user_category?.display_name ||
                         (transaction as any).app_category?.display_name ||
                         'Uncategorized';

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
    if (onClick) {
      onClick(transaction);
    }
  };

  const handleRecategorize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRecategorize) {
      onRecategorize(transaction.id);
    }
  };

  const handleTagNonNegotiable = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTag) {
      onTag(transaction.id, 'non-negotiable');
    }
  };

  const handleTagIgnored = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTag) {
      onTag(transaction.id, 'ignored');
    }
  };

  const handleAddNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddNote) {
      onAddNote(transaction.id);
    }
  };

  return (
    <div
      data-testid={`transaction-card-${transaction.id}`}
      className={cn(
        'bg-white border border-gray-200 rounded-lg p-4 transition-all duration-200',
        'hover:shadow-md cursor-pointer',
        isExpanded && 'shadow-md ring-2 ring-blue-200',
        transaction.pending && 'opacity-75'
      )}
      onClick={handleCardClick}
    >
      {/* Main Transaction Info */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <p
              className="font-medium text-gray-900 truncate"
              data-testid="transaction-merchant"
            >
              {transaction.merchant_name}
              {transaction.pending && (
                <span className="ml-2 text-xs text-gray-500">(Pending)</span>
              )}
            </p>

            {/* Category Badge */}
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              data-testid="transaction-category"
            >
              {displayCategory}
            </span>

            {/* Tag Badges */}
            {transaction.tag_non_negotiable && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                data-testid="tag-badge-non-negotiable"
              >
                Non-negotiable
              </span>
            )}
            {transaction.tag_ignored && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                data-testid="tag-badge-ignored"
              >
                Ignored
              </span>
            )}
          </div>

          <p
            className="text-sm text-gray-500 mt-1"
            data-testid="transaction-date"
          >
            {formatDate(transaction.date)}
          </p>
        </div>

        {/* Amount */}
        <div className="text-right ml-4">
          <p
            className="text-lg font-semibold text-gray-900"
            data-testid="transaction-amount"
          >
            {formatCurrency(transaction.amount)}
          </p>
        </div>
      </div>

      {/* Expanded Details & Actions */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3" data-testid="transaction-details-modal">
          {/* Close Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Transaction Actions</h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="close-modal-button"
              aria-label="Close transaction details"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Notes Section */}
          {transaction.notes && (
            <div className="text-sm text-gray-700">
              <span className="font-medium">Note:</span> {transaction.notes}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecategorize}
              data-testid="recategorize-button"
            >
              Recategorize
            </Button>

            {!transaction.tag_non_negotiable && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTagNonNegotiable}
                data-testid="tag-non-negotiable-button"
              >
                Mark Non-negotiable
              </Button>
            )}

            {!transaction.tag_ignored && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTagIgnored}
                data-testid="tag-ignored-button"
              >
                Ignore from Budget
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddNote}
              data-testid="add-note-button"
            >
              {transaction.notes ? 'Edit Note' : 'Add Note'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
