/**
 * TransactionSearch Component
 *
 * T076: Search input for filtering transactions by merchant name
 * Supports debounced search to avoid excessive re-renders
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';

export interface TransactionSearchProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function TransactionSearch({
  onSearch,
  placeholder = 'Search transactions by merchant...',
  debounceMs = 300,
  className,
}: TransactionSearchProps) {
  const [searchValue, setSearchValue] = useState('');

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchValue, debounceMs, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleClear = () => {
    setSearchValue('');
    onSearch('');
  };

  return (
    <div className={cn('relative', className)}>
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Search Input */}
      <input
        type="text"
        value={searchValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg',
          'text-sm text-gray-900 placeholder-gray-500',
          'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'transition-colors duration-200'
        )}
        data-testid="transaction-search-input"
      />

      {/* Clear Button */}
      {searchValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          data-testid="clear-search-button"
        >
          <svg
            className="h-5 w-5"
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
      )}
    </div>
  );
}
