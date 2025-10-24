/**
 * Budget Test Fixtures
 *
 * Mock budget data following the Supabase schema structure
 */

export const mockBudget = {
  id: '20000000-0000-0000-0000-000000000001',
  user_id: '00000000-0000-0000-0000-000000000001',
  month: 10,
  year: 2025,
  created_at: '2025-10-01T00:00:00Z',
  updated_at: '2025-10-01T00:00:00Z',
}

export const mockBudgetCategories = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    budget_id: '20000000-0000-0000-0000-000000000001',
    category_name: 'Groceries',
    budgeted_amount: 500.00,
    created_at: '2025-10-01T00:00:00Z',
    updated_at: '2025-10-01T00:00:00Z',
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    budget_id: '20000000-0000-0000-0000-000000000001',
    category_name: 'Dining Out',
    budgeted_amount: 300.00,
    created_at: '2025-10-01T00:00:00Z',
    updated_at: '2025-10-01T00:00:00Z',
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    budget_id: '20000000-0000-0000-0000-000000000001',
    category_name: 'Transportation',
    budgeted_amount: 200.00,
    created_at: '2025-10-01T00:00:00Z',
    updated_at: '2025-10-01T00:00:00Z',
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    budget_id: '20000000-0000-0000-0000-000000000001',
    category_name: 'Shopping',
    budgeted_amount: 250.00,
    created_at: '2025-10-01T00:00:00Z',
    updated_at: '2025-10-01T00:00:00Z',
  },
  {
    id: '30000000-0000-0000-0000-000000000005',
    budget_id: '20000000-0000-0000-0000-000000000001',
    category_name: 'Utilities',
    budgeted_amount: 150.00,
    created_at: '2025-10-01T00:00:00Z',
    updated_at: '2025-10-01T00:00:00Z',
  },
]

export const mockBudgetWithCategories = {
  ...mockBudget,
  categories: mockBudgetCategories,
}

export const mockTransactionsForBudget = [
  {
    id: '00000000-1111-1111-1111-000000000011',
    user_id: '00000000-0000-0000-0000-000000000001',
    bank_connection_id: '10000000-0000-0000-0000-000000000001',
    plaid_transaction_id: 'txn_budget_grocery_001',
    merchant_name: 'Safeway',
    amount: 120.50,
    date: '2025-10-15',
    authorized_date: '2025-10-15',
    pending: false,
    payment_channel: 'in_store',
    category_primary: 'FOOD_AND_DRINK',
    category_detailed: 'FOOD_AND_DRINK_GROCERIES',
    user_category_override: null,
    tag_non_negotiable: false,
    tag_ignored: false,
    notes: null,
    location: null,
    iso_currency_code: 'USD',
    original_description: 'SAFEWAY',
    created_at: '2025-10-15T00:00:00Z',
    updated_at: '2025-10-15T00:00:00Z',
  },
  {
    id: '00000000-1111-1111-1111-000000000012',
    user_id: '00000000-0000-0000-0000-000000000001',
    bank_connection_id: '10000000-0000-0000-0000-000000000001',
    plaid_transaction_id: 'txn_budget_dining_001',
    merchant_name: 'Restaurant',
    amount: 65.00,
    date: '2025-10-14',
    authorized_date: '2025-10-14',
    pending: false,
    payment_channel: 'in_store',
    category_primary: 'FOOD_AND_DRINK',
    category_detailed: 'FOOD_AND_DRINK_RESTAURANT',
    user_category_override: 'Dining Out',
    tag_non_negotiable: false,
    tag_ignored: false,
    notes: null,
    location: null,
    iso_currency_code: 'USD',
    original_description: 'LOCAL RESTAURANT',
    created_at: '2025-10-14T00:00:00Z',
    updated_at: '2025-10-14T00:00:00Z',
  },
  {
    id: '00000000-1111-1111-1111-000000000013',
    user_id: '00000000-0000-0000-0000-000000000001',
    bank_connection_id: '10000000-0000-0000-0000-000000000001',
    plaid_transaction_id: 'txn_budget_ignored_001',
    merchant_name: 'Transfer',
    amount: 500.00,
    date: '2025-10-13',
    authorized_date: '2025-10-13',
    pending: false,
    payment_channel: 'other',
    category_primary: 'TRANSFER',
    category_detailed: 'TRANSFER_OUT',
    user_category_override: null,
    tag_non_negotiable: false,
    tag_ignored: true,
    notes: 'Savings transfer - ignore',
    location: null,
    iso_currency_code: 'USD',
    original_description: 'TRANSFER TO SAVINGS',
    created_at: '2025-10-13T00:00:00Z',
    updated_at: '2025-10-13T00:00:00Z',
  },
]

export const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'testuser@example.com',
}
