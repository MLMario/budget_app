/**
 * Transactions Page
 *
 * T073: Full transactions page with list, filters, search, and quick actions
 * Displays all user transactions with ability to search, filter, recategorize, and tag
 */

'use client';

import React, { useState, useEffect } from 'react';
import { TransactionCard, Transaction } from '@/components/transaction/TransactionCard';
import { TransactionSearch } from '@/components/transaction/TransactionSearch';
import { TransactionFilters, TransactionFilter } from '@/components/transaction/TransactionFilters';
import { CategorySelector } from '@/components/transaction/CategorySelector';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { updateCategoryAction, addTagAction } from '@/app/actions/transaction';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/lib/hooks/useToast';

export default function TransactionsPage() {
  const toast = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<TransactionFilter>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user ID from Supabase session
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };

    fetchUser();
  }, []);

  // Fetch transactions on mount and when user ID is available
  useEffect(() => {
    if (userId) {
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchTransactions = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      // Fetch transactions directly from client-side Supabase
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error} = await supabase
        .from('transactions')
        .select(`
          *,
          app_category:categories!app_category_id(id, name, display_name),
          user_category:categories!user_category_override_id(id, name, display_name)
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
        setFilteredTransactions([]);
      } else {
        setTransactions(data || []);
        setFilteredTransactions(data || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply search and filters
  useEffect(() => {
    let result = [...transactions];

    // Apply search
    if (searchTerm) {
      result = result.filter((t) =>
        t.merchant_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.startDate) {
      // Compare date strings directly (YYYY-MM-DD format) to avoid timezone issues
      result = result.filter((t) => t.date >= filters.startDate!);
    }
    if (filters.endDate) {
      // Compare date strings directly - inclusive of end date
      result = result.filter((t) => t.date <= filters.endDate!);
    }
    if (filters.category) {
      result = result.filter((t: any) => {
        // Get effective category ID (user override takes precedence)
        const effectiveCategoryId = t.user_category_override_id || t.app_category_id;
        return effectiveCategoryId === filters.category;
      });
    }
    if (filters.minAmount !== undefined) {
      result = result.filter((t) => t.amount >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined) {
      result = result.filter((t) => t.amount <= filters.maxAmount!);
    }
    if (filters.tag) {
      if (filters.tag === 'non-negotiable') {
        result = result.filter((t) => t.tag_non_negotiable);
      } else if (filters.tag === 'ignored') {
        result = result.filter((t) => t.tag_ignored);
      }
    }
    if (filters.pending) {
      result = result.filter((t) => t.pending);
    }

    setFilteredTransactions(result);
  }, [transactions, searchTerm, filters]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleApplyFilters = (newFilters: TransactionFilter) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleRecategorize = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setShowCategorySelector(true);
  };

  const handleCategorySelect = async (categoryId: string, categoryName: string) => {
    if (!userId || !selectedTransactionId) return;

    try {
      const result = await updateCategoryAction(userId, selectedTransactionId, categoryId);

      if (result.success) {
        // Refresh transactions to get updated data
        await fetchTransactions();
        setShowCategorySelector(false);
        setSelectedTransactionId(null);
        toast.success(`Transaction recategorized to ${categoryName}`);
      } else {
        console.error('Failed to update category:', result.error);
        toast.error('Failed to update category. Please try again.');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  const handleTag = async (transactionId: string, tag: 'non-negotiable' | 'ignored') => {
    if (!userId) return;

    try {
      const result = await addTagAction(userId, transactionId, tag);

      if (result.success) {
        // Update local state
        setTransactions((prev) =>
          prev.map((t) => {
            if (t.id === transactionId) {
              return {
                ...t,
                tag_non_negotiable: tag === 'non-negotiable' ? true : false,
                tag_ignored: tag === 'ignored' ? true : false,
              };
            }
            return t;
          })
        );
        const tagLabel = tag === 'non-negotiable' ? 'non-negotiable' : 'ignored';
        toast.success(`Tagged as ${tagLabel}`);
      } else {
        console.error('Failed to add tag:', result.error);
        toast.error('Failed to add tag. Please try again.');
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  const handleAddNote = (transactionId: string) => {
    // TODO: Implement notes modal (T081)
    console.log('Add note for transaction:', transactionId);
    toast.info('Notes feature coming soon!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" data-testid="loading-spinner"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <Button variant="primary" size="sm">
              Import Transactions
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              <TransactionSearch onSearch={handleSearch} />
              <TransactionFilters
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
                isOpen={isFilterOpen}
                onToggle={() => setIsFilterOpen(!isFilterOpen)}
              />
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <p>
                Showing <span className="font-medium">{filteredTransactions.length}</span> of{' '}
                <span className="font-medium">{transactions.length}</span> transactions
              </p>
            </div>

            {/* Category Selector Modal */}
            {showCategorySelector && selectedTransactionId && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="max-w-md w-full m-4">
                  <CategorySelector
                    onSelect={handleCategorySelect}
                    onCancel={() => {
                      setShowCategorySelector(false);
                      setSelectedTransactionId(null);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Transaction List */}
            <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2 text-lg font-medium">No transactions found</p>
                  <p className="mt-1 text-sm">
                    {searchTerm || Object.keys(filters).length > 0
                      ? 'Try adjusting your search or filters'
                      : 'Connect your bank to automatically import transactions'}
                  </p>
                </div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onRecategorize={handleRecategorize}
                    onTag={handleTag}
                    onAddNote={handleAddNote}
                  />
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
