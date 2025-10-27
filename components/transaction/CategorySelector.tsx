/**
 * CategorySelector Component
 *
 * T077: Dropdown component for recategorizing transactions
 * AddT012-014: Converted to full modal overlay with icons matching design reference
 * Displays all available budget categories from database with visual styling
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { getCategoriesAction } from '@/app/actions/category';
import type { Category } from '@/types';
import {
  X,
  ShoppingCart,
  Coffee,
  Car,
  Film,
  Heart,
  Home,
  ShoppingBag,
  Droplet,
  GraduationCap,
  Plane,
  Grid,
  type LucideIcon,
} from 'lucide-react';

export interface CategorySelectorProps {
  currentCategoryId?: string;
  currentCategoryName?: string;
  onSelect: (categoryId: string, categoryName: string) => void;
  onCancel?: () => void;
  isOpen?: boolean;
  className?: string;
}

// Icon mapping for categories (AddT013)
const getCategoryIcon = (categoryName: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    'groceries': ShoppingCart,
    'dining_out': Coffee,
    'dining & coffee': Coffee,
    'transportation': Car,
    'entertainment': Film,
    'healthcare': Heart,
    'housing': Home,
    'shopping': ShoppingBag,
    'personal_care': Droplet,
    'personal care': Droplet,
    'education': GraduationCap,
    'travel': Plane,
    'other': Grid,
    'uncategorized': Grid,
    'bills_and_utilities': Home,
    'bills & utilities': Home,
  };

  const normalizedName = categoryName.toLowerCase().replace(/[_\s]+/g, '_');
  return iconMap[normalizedName] || iconMap[categoryName.toLowerCase()] || Grid;
};

export function CategorySelector({
  currentCategoryId,
  currentCategoryName,
  onSelect,
  onCancel,
  isOpen = true,
  className,
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      const result = await getCategoriesAction();
      if (result.categories) {
        setCategories(result.categories);
      }
      setIsLoading(false);
    }

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // ESC key handler (AddT014)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onCancel) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  const handleSelect = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleConfirm = () => {
    if (selectedCategory) {
      onSelect(selectedCategory.id, selectedCategory.display_name);
      setSelectedCategory(null);
    }
  };

  const handleCancel = () => {
    setSelectedCategory(null);
    if (onCancel) {
      onCancel();
    }
  };

  // Backdrop click handler (AddT014)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onCancel) {
      onCancel();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    // AddT012: Full-screen modal overlay with backdrop
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
      data-testid="category-selector"
    >
      {/* Modal Container */}
      <div
        className={cn(
          'bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3
            id="category-modal-title"
            className="text-lg font-semibold text-gray-900"
          >
            Select Category
          </h3>
          <button
            type="button"
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
            data-testid="close-category-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Loading categories...</p>
            </div>
          ) : (
            <>
              {/* Current Category Display */}
              {currentCategoryName && (
                <p className="text-xs text-gray-500 mb-4">
                  Current: <span className="font-medium">{currentCategoryName}</span>
                </p>
              )}

              {/* Category Grid (AddT013: With Icons, AddT014: Updated Styling) */}
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => {
                  const Icon = getCategoryIcon(category.name);
                  const isSelected = selectedCategory?.id === category.id;
                  const isCurrent = currentCategoryId === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleSelect(category)}
                      className={cn(
                        'flex flex-col items-center justify-center py-4 px-3 rounded-lg',
                        'border-2 transition-all duration-200',
                        'text-sm font-medium',
                        'hover:shadow-md',
                        // Selected state (AddT014)
                        isSelected && 'bg-blue-50 border-blue-500 shadow-md',
                        // Current category state
                        !isSelected && isCurrent && 'bg-gray-50 border-gray-300',
                        // Default state
                        !isSelected && !isCurrent && 'bg-white border-gray-200 hover:border-gray-300'
                      )}
                      data-testid={`category-option-${category.name}`}
                    >
                      <Icon
                        className={cn(
                          'w-6 h-6 mb-2',
                          isSelected ? 'text-blue-600' : 'text-gray-600'
                        )}
                      />
                      <span
                        className={cn(
                          'text-center',
                          isSelected ? 'text-blue-700' : 'text-gray-700'
                        )}
                      >
                        {category.display_name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer with Action Buttons (AddT014: Reordered) */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="flex-1"
            data-testid="cancel-category-button"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={!selectedCategory}
            className="flex-1"
            data-testid="save-category-button"
          >
            Save Category
          </Button>
        </div>
      </div>
    </div>
  );
}
