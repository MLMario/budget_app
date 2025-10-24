/**
 * Mock Plaid Client for Unit Tests
 *
 * Provides mock implementations of Plaid API methods
 * for unit testing without requiring actual Plaid API calls.
 */

import { vi } from 'vitest'

// Mock Plaid data
export const mockPlaidLinkToken = {
  link_token: 'link-sandbox-test-token-12345',
  expiration: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  request_id: 'test-request-id-link',
}

export const mockPlaidAccessToken = {
  access_token: 'access-sandbox-test-token-67890',
  item_id: 'test-item-id-12345',
  request_id: 'test-request-id-exchange',
}

export const mockPlaidItem = {
  item: {
    item_id: 'test-item-id-12345',
    institution_id: 'ins_109508',
    webhook: 'http://localhost:3000/api/plaid/webhook',
    error: null,
    available_products: ['transactions', 'auth'],
    billed_products: ['transactions'],
    consent_expiration_time: null,
    update_type: 'background',
  },
  status: {
    transactions: {
      last_successful_update: '2025-10-23T12:00:00Z',
      last_failed_update: null,
    },
  },
  request_id: 'test-request-id-item',
}

export const mockPlaidInstitution = {
  institution: {
    institution_id: 'ins_109508',
    name: 'Chase',
    products: ['transactions', 'auth', 'balance'],
    country_codes: ['US'],
    url: 'https://www.chase.com',
    primary_color: '#117ACA',
    logo: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  },
  request_id: 'test-request-id-institution',
}

export const mockPlaidAccounts = {
  accounts: [
    {
      account_id: 'test-account-id-1',
      balances: {
        available: 1000,
        current: 1200,
        limit: null,
        iso_currency_code: 'USD',
      },
      mask: '1234',
      name: 'Chase Checking',
      official_name: 'Chase Total Checking®',
      type: 'depository',
      subtype: 'checking',
    },
  ],
  item: mockPlaidItem.item,
  request_id: 'test-request-id-accounts',
}

export const mockPlaidTransactionsSync = {
  added: [
    {
      transaction_id: 'test-txn-1',
      account_id: 'test-account-id-1',
      amount: 25.50,
      date: '2025-10-23',
      authorized_date: '2025-10-22',
      name: 'Starbucks',
      merchant_name: 'Starbucks',
      pending: false,
      payment_channel: 'in_store',
      category: ['Food and Drink', 'Restaurants', 'Coffee Shop'],
      personal_finance_category: {
        primary: 'FOOD_AND_DRINK',
        detailed: 'FOOD_AND_DRINK_COFFEE',
        confidence_level: 'HIGH',
      },
      location: {
        address: '123 Main St',
        city: 'Seattle',
        region: 'WA',
        postal_code: '98101',
        country: 'US',
        lat: 47.6062,
        lon: -122.3321,
      },
      iso_currency_code: 'USD',
      unofficial_currency_code: null,
      original_description: 'STARBUCKS STORE #12345',
    },
  ],
  modified: [],
  removed: [],
  next_cursor: 'test-cursor-next',
  has_more: false,
  request_id: 'test-request-id-sync',
}

// Create mock Plaid client
export const createMockPlaidClient = () => {
  const mockLinkTokenCreate = vi.fn()
  const mockItemPublicTokenExchange = vi.fn()
  const mockItemGet = vi.fn()
  const mockInstitutionsGetById = vi.fn()
  const mockAccountsGet = vi.fn()
  const mockTransactionsSync = vi.fn()

  const mockClient = {
    linkTokenCreate: mockLinkTokenCreate,
    itemPublicTokenExchange: mockItemPublicTokenExchange,
    itemGet: mockItemGet,
    institutionsGetById: mockInstitutionsGetById,
    accountsGet: mockAccountsGet,
    transactionsSync: mockTransactionsSync,
  }

  return {
    client: mockClient,
    mocks: {
      linkTokenCreate: mockLinkTokenCreate,
      itemPublicTokenExchange: mockItemPublicTokenExchange,
      itemGet: mockItemGet,
      institutionsGetById: mockInstitutionsGetById,
      accountsGet: mockAccountsGet,
      transactionsSync: mockTransactionsSync,
    },
  }
}

// Helper to setup successful link token creation
export const setupSuccessfulLinkTokenCreate = (mockClient: any) => {
  mockClient.mocks.linkTokenCreate.mockResolvedValue({
    data: mockPlaidLinkToken,
  })
}

// Helper to setup link token creation error
export const setupLinkTokenCreateError = (mockClient: any, errorMessage: string) => {
  mockClient.mocks.linkTokenCreate.mockRejectedValue(
    new Error(errorMessage)
  )
}

// Helper to setup successful public token exchange
export const setupSuccessfulTokenExchange = (mockClient: any) => {
  mockClient.mocks.itemPublicTokenExchange.mockResolvedValue({
    data: mockPlaidAccessToken,
  })
  mockClient.mocks.itemGet.mockResolvedValue({
    data: mockPlaidItem,
  })
  mockClient.mocks.institutionsGetById.mockResolvedValue({
    data: mockPlaidInstitution,
  })
  mockClient.mocks.accountsGet.mockResolvedValue({
    data: mockPlaidAccounts,
  })
}

// Helper to setup token exchange error
export const setupTokenExchangeError = (mockClient: any, errorMessage: string) => {
  mockClient.mocks.itemPublicTokenExchange.mockRejectedValue(
    new Error(errorMessage)
  )
}

// Helper to setup successful transaction sync
export const setupSuccessfulTransactionSync = (mockClient: any) => {
  mockClient.mocks.transactionsSync.mockResolvedValue({
    data: mockPlaidTransactionsSync,
  })
}

// Helper to setup transaction sync error
export const setupTransactionSyncError = (mockClient: any, errorMessage: string) => {
  mockClient.mocks.transactionsSync.mockRejectedValue(
    new Error(errorMessage)
  )
}
