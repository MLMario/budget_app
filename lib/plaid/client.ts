/**
 * Plaid API Client
 *
 * Configures and exports the Plaid client for bank connection and transaction sync
 */

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

/**
 * Get Plaid environment based on PLAID_ENV setting
 */
function getPlaidEnvironment(): string {
  const env = process.env.PLAID_ENV || 'sandbox'

  switch (env) {
    case 'production':
      return PlaidEnvironments.production
    case 'development':
      return PlaidEnvironments.development
    case 'sandbox':
    default:
      return PlaidEnvironments.sandbox
  }
}

/**
 * Plaid configuration with environment-based settings
 */
const configuration = new Configuration({
  basePath: getPlaidEnvironment(),
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
      'Plaid-Version': '2020-09-14', // API version
    },
  },
})

/**
 * Plaid API client instance
 *
 * This client provides methods for:
 * - Creating Link tokens
 * - Exchanging public tokens for access tokens
 * - Syncing transactions
 * - Managing Items (bank connections)
 * - Handling webhooks
 */
export const plaidClient = new PlaidApi(configuration)

/**
 * Plaid configuration constants
 */
export const PLAID_CONFIG = {
  environment: process.env.PLAID_ENV || 'sandbox',
  clientId: process.env.PLAID_CLIENT_ID,
  countryCodes: ['US'] as const,
  products: ['transactions'] as const,
  language: 'en' as const,
  webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/plaid/webhook`,
} as const

/**
 * Verify Plaid credentials are configured
 */
export function verifyPlaidConfig(): void {
  if (!process.env.PLAID_CLIENT_ID) {
    throw new Error('PLAID_CLIENT_ID environment variable is required')
  }
  if (!process.env.PLAID_SECRET) {
    throw new Error('PLAID_SECRET environment variable is required')
  }
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.warn('NEXT_PUBLIC_APP_URL not set - webhook URL may not work correctly')
  }
}

/**
 * Type helper for Plaid client
 */
export type PlaidClient = typeof plaidClient
