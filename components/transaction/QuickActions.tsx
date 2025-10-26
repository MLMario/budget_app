/**
 * QuickActions Component
 *
 * T080: Quick action buttons for transaction management
 * Provides easy access to: Recategorize, Mark Non-negotiable, Ignore from Budget, Add Note
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

export interface QuickActionsProps {
  transactionId: string;
  currentCategory?: string;
  isNonNegotiable?: boolean;
  isIgnored?: boolean;
  hasNotes?: boolean;
  onRecategorize: (transactionId: string) => void;
  onMarkNonNegotiable: (transactionId: string) => void;
  onIgnore: (transactionId: string) => void;
  onAddNote: (transactionId: string) => void;
  variant?: 'compact' | 'expanded';
}

export function QuickActions({
  transactionId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentCategory,
  isNonNegotiable = false,
  isIgnored = false,
  hasNotes = false,
  onRecategorize,
  onMarkNonNegotiable,
  onIgnore,
  onAddNote,
  variant = 'compact',
}: QuickActionsProps) {
  const handleRecategorize = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRecategorize(transactionId);
  };

  // AddT008: Updated handlers to support toggle behavior
  const handleMarkNonNegotiable = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkNonNegotiable(transactionId);
  };

  const handleIgnore = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIgnore(transactionId);
  };

  const handleAddNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddNote(transactionId);
  };

  if (variant === 'compact') {
    return (
      <div className="flex gap-1" data-testid="quick-actions-compact">
        {/* Recategorize Icon Button */}
        <button
          onClick={handleRecategorize}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          title="Recategorize"
          data-testid="quick-action-recategorize"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </button>

        {/* AddT007: Non-negotiable Icon Button - Toggle with visual states */}
        <button
          onClick={handleMarkNonNegotiable}
          className={`p-2 rounded-md transition-colors border ${
            isNonNegotiable
              ? 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200'
              : 'text-gray-600 border-transparent hover:text-purple-600 hover:bg-purple-50'
          }`}
          title={isNonNegotiable ? 'Remove Non-negotiable' : 'Mark as Non-negotiable'}
          data-testid="quick-action-non-negotiable"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* AddT007: Ignore Icon Button - Toggle with visual states */}
        <button
          onClick={handleIgnore}
          className={`p-2 rounded-md transition-colors border ${
            isIgnored
              ? 'bg-gray-200 text-gray-700 border-gray-400 hover:bg-gray-300'
              : 'text-gray-600 border-transparent hover:text-gray-700 hover:bg-gray-100'
          }`}
          title={isIgnored ? 'Restore to Budget' : 'Ignore from Budget'}
          data-testid="quick-action-ignore"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        </button>

        {/* Add/Edit Note Icon Button */}
        <button
          onClick={handleAddNote}
          className={`p-2 rounded-md transition-colors ${
            hasNotes
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title={hasNotes ? 'Edit Note' : 'Add Note'}
          data-testid="quick-action-note"
        >
          <svg
            className="w-4 h-4"
            fill={hasNotes ? 'currentColor' : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
    );
  }

  // Expanded variant with text labels
  return (
    <div className="flex flex-wrap gap-2" data-testid="quick-actions-expanded">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRecategorize}
        data-testid="quick-action-recategorize"
      >
        <svg
          className="w-4 h-4 mr-1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Recategorize
      </Button>

      {/* AddT007: Non-negotiable Button - Toggle with visual states */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleMarkNonNegotiable}
        data-testid="quick-action-non-negotiable"
        className={isNonNegotiable ? 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200 hover:text-purple-800' : ''}
      >
        <svg
          className="w-4 h-4 mr-1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {isNonNegotiable ? 'Remove Non-negotiable' : 'Non-negotiable'}
      </Button>

      {/* AddT007: Ignore Button - Toggle with visual states */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleIgnore}
        data-testid="quick-action-ignore"
        className={isIgnored ? 'bg-gray-200 text-gray-700 border-gray-400 hover:bg-gray-300 hover:text-gray-800' : ''}
      >
        <svg
          className="w-4 h-4 mr-1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
        {isIgnored ? 'Restore to Budget' : 'Ignore'}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleAddNote}
        data-testid="quick-action-note"
      >
        <svg
          className="w-4 h-4 mr-1.5"
          fill={hasNotes ? 'currentColor' : 'none'}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {hasNotes ? 'Edit Note' : 'Add Note'}
      </Button>
    </div>
  );
}
