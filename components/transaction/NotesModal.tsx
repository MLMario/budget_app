/**
 * NotesModal Component
 *
 * T081: Modal for adding/editing transaction notes
 * Allows users to add context and reminders to individual transactions
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

export interface NotesModalProps {
  isOpen: boolean;
  transactionId: string;
  merchantName: string;
  amount: number;
  currentNotes?: string | null;
  onSave: (transactionId: string, notes: string) => Promise<void>;
  onClose: () => void;
}

export function NotesModal({
  isOpen,
  transactionId,
  merchantName,
  amount,
  currentNotes,
  onSave,
  onClose,
}: NotesModalProps) {
  const [notes, setNotes] = useState(currentNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update notes when currentNotes changes
  useEffect(() => {
    setNotes(currentNotes || '');
  }, [currentNotes]);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      await onSave(transactionId, notes);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(currentNotes || '');
    setError(null);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      data-testid="notes-modal-backdrop"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full m-4"
        onClick={(e) => e.stopPropagation()}
        data-testid="notes-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {currentNotes ? 'Edit Note' : 'Add Note'}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="close-notes-modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Transaction Info */}
          <div className="mt-2 text-sm text-gray-600">
            <p className="font-medium text-gray-900">{merchantName}</p>
            <p className="text-gray-500">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(amount)}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <label htmlFor="transaction-notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            id="transaction-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add context, reminders, or any other information about this transaction..."
            className={cn(
              'w-full px-3 py-2 border border-gray-300 rounded-lg',
              'text-sm text-gray-900 placeholder-gray-500',
              'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'resize-none transition-colors duration-200'
            )}
            rows={6}
            maxLength={1000}
            data-testid="notes-textarea"
          />
          <div className="mt-1 text-xs text-gray-500 text-right">
            {notes.length} / 1000 characters
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md" data-testid="notes-error">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaving}
            fullWidth
            data-testid="save-notes-button"
          >
            {isSaving ? 'Saving...' : 'Save Note'}
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={handleCancel}
            disabled={isSaving}
            fullWidth
            data-testid="cancel-notes-button"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
