/**
 * Mock Service Worker (MSW) Handlers for Plaid API
 *
 * Mock responses for Plaid API endpoints used in tests
 */

import { http, HttpResponse } from 'msw'

const PLAID_BASE_URL = 'https://sandbox.plaid.com'

/**
 * Mock Plaid Link token creation
 */
export const createLinkTokenHandler = http.post(
  `${PLAID_BASE_URL}/link/token/create`,
  async () => {
    return HttpResponse.json({
      link_token: 'link-sandbox-test-token-12345',
      expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      request_id: 'req-test-12345',
    })
  }
)

/**
 * Mock Plaid public token exchange
 */
export const exchangePublicTokenHandler = http.post(
  `${PLAID_BASE_URL}/item/public_token/exchange`,
  async () => {
    return HttpResponse.json({
      access_token: 'access-sandbox-test-token-12345',
      item_id: 'item-test-12345',
      request_id: 'req-test-12345',
    })
  }
)

/**
 * Mock Plaid transactions sync
 */
export const transactionsSyncHandler = http.post(
  `${PLAID_BASE_URL}/transactions/sync`,
  async () => {
    return HttpResponse.json({
      added: [
        {
          account_id: 'acc-test-12345',
          amount: 12.50,
          iso_currency_code: 'USD',
          unofficial_currency_code: null,
          category: ['Food and Drink', 'Restaurants'],
          category_id: '13005000',
          check_number: null,
          date: '2025-10-23',
          authorized_date: '2025-10-22',
          name: 'Test Restaurant',
          merchant_name: 'Test Restaurant',
          payment_channel: 'in_store',
          pending: false,
          pending_transaction_id: null,
          transaction_id: 'tx-test-12345',
          transaction_type: 'place',
          location: {
            address: '123 Main St',
            city: 'San Francisco',
            region: 'CA',
            postal_code: '94102',
            country: 'US',
            lat: 37.7749,
            lon: -122.4194,
          },
          personal_finance_category: {
            primary: 'FOOD_AND_DRINK',
            detailed: 'FOOD_AND_DRINK_RESTAURANTS',
            confidence_level: 'HIGH',
          },
        },
      ],
      modified: [],
      removed: [],
      next_cursor: 'cursor-test-next',
      has_more: false,
      request_id: 'req-test-12345',
    })
  }
)

/**
 * Mock Plaid Item (institution connection) get
 */
export const getItemHandler = http.post(
  `${PLAID_BASE_URL}/item/get`,
  async () => {
    return HttpResponse.json({
      item: {
        item_id: 'item-test-12345',
        institution_id: 'ins_test_12345',
        webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/plaid/webhook`,
        error: null,
        available_products: ['transactions'],
        billed_products: ['transactions'],
        consent_expiration_time: null,
        update_type: 'background',
      },
      status: {
        transactions: {
          last_successful_update: new Date().toISOString(),
          last_failed_update: null,
        },
      },
      request_id: 'req-test-12345',
    })
  }
)

/**
 * Mock Plaid Institution get
 */
export const getInstitutionHandler = http.post(
  `${PLAID_BASE_URL}/institutions/get_by_id`,
  async () => {
    return HttpResponse.json({
      institution: {
        institution_id: 'ins_test_12345',
        name: 'Test Bank',
        products: ['transactions'],
        country_codes: ['US'],
        url: 'https://testbank.com',
        primary_color: '#003366',
        logo: null,
      },
      request_id: 'req-test-12345',
    })
  }
)

/**
 * Mock Plaid accounts get
 */
export const getAccountsHandler = http.post(
  `${PLAID_BASE_URL}/accounts/get`,
  async () => {
    return HttpResponse.json({
      accounts: [
        {
          account_id: 'acc-test-12345',
          balances: {
            available: 1000.50,
            current: 1100.75,
            limit: null,
            iso_currency_code: 'USD',
            unofficial_currency_code: null,
          },
          mask: '0000',
          name: 'Test Checking',
          official_name: 'Test Bank Checking Account',
          type: 'depository',
          subtype: 'checking',
        },
      ],
      item: {
        item_id: 'item-test-12345',
        institution_id: 'ins_test_12345',
        webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/plaid/webhook`,
        error: null,
        available_products: ['transactions'],
        billed_products: ['transactions'],
      },
      request_id: 'req-test-12345',
    })
  }
)

/**
 * All Plaid mock handlers
 */
export const plaidHandlers = [
  createLinkTokenHandler,
  exchangePublicTokenHandler,
  transactionsSyncHandler,
  getItemHandler,
  getInstitutionHandler,
  getAccountsHandler,
]
