/**
 * TransactionFilters Component
 *
 * T075: Filter panel for transactions with date range, category, merchant, and amount filters
 * Collapsible panel with clear all functionality
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { getCategoriesAction } from '@/app/actions/category';
import type { Category } from '@/types';

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  tag?: 'non-negotiable' | 'ignored' | null;
  pending?: boolean;
}

export interface TransactionFiltersProps {
  onApplyFilters: (filters: TransactionFilter) => void;
  onClearFilters: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function TransactionFilters({
  onApplyFilters,
  onClearFilters,
  isOpen = true,
  onToggle,
  className,
}: TransactionFiltersProps) {
  const [filters, setFilters] = useState<TransactionFilter>({});
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories from database
  useEffect(() => {
    async function fetchCategories() {
      const result = await getCategoriesAction();
      if (result.categories) {
        setCategories(result.categories);
      }
    }
    fetchCategories();
  }, []);

  const handleApply = () => {
    onApplyFilters(filters);
  };

  const handleClear = () => {
    setFilters({});
    onClearFilters();
  };

  const updateFilter = <K extends keyof TransactionFilter>(
    key: K,
    value: TransactionFilter[K]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== null && value !== ''
  ).length;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Toggle Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          data-testid="filter-button"
        >
          <svg
            className={cn(
              'h-5 w-5 transition-transform',
              isOpen && 'rotate-90'
            )}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activeFilterCount}
            </span>
          )}
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          data-testid="clear-filters-button"
        >
          Clear All
        </Button>
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <div
          className="bg-white border border-gray-200 rounded-lg p-4 space-y-4"
          data-testid="filter-panel"
        >
          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  data-testid="filter-start-date"
                />
                <span className="text-xs text-gray-500 mt-1">Start Date</span>
              </div>
              <div>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  data-testid="filter-end-date"
                />
                <span className="text-xs text-gray-500 mt-1">End Date</span>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) =>
                updateFilter(
                  'category',
                  e.target.value === '' ? undefined : e.target.value
                )
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              data-testid="filter-category-dropdown"
            >
              <option value="" data-testid="filter-category-option-all">
                All Categories
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id} data-testid={`filter-category-option-${category.name}`}>
                  {category.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Range Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Amount Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    value={filters.minAmount || ''}
                    onChange={(e) =>
                      updateFilter('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="Min"
                    className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    data-testid="filter-min-amount"
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1">Minimum</span>
              </div>
              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    value={filters.maxAmount || ''}
                    onChange={(e) =>
                      updateFilter('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="Max"
                    className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    data-testid="filter-max-amount"
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1">Maximum</span>
              </div>
            </div>
          </div>

          {/* Tag Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <select
              value={filters.tag || ''}
              onChange={(e) =>
                updateFilter(
                  'tag',
                  e.target.value ? (e.target.value as 'non-negotiable' | 'ignored') : null
                )
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              data-testid="filter-tag-dropdown"
            >
              <option value="">All Transactions</option>
              <option value="non-negotiable">Non-negotiable Only</option>
              <option value="ignored">Ignored Only</option>
            </select>
          </div>

          {/* Pending Filter */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pending-filter"
              checked={filters.pending || false}
              onChange={(e) => updateFilter('pending', e.target.checked || undefined)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              data-testid="filter-pending-checkbox"
            />
            <label
              htmlFor="pending-filter"
              className="ml-2 block text-sm text-gray-700"
            >
              Show pending transactions only
            </label>
          </div>

          {/* Apply Button */}
          <Button
            variant="primary"
            size="md"
            onClick={handleApply}
            fullWidth
            data-testid="apply-filters-button"
          >
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  );
}
