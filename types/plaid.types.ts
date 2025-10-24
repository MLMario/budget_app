/**
 * Plaid API Types
 *
 * TypeScript interfaces for Plaid API integration
 * Based on Plaid API documentation and contracts/types.ts
 */

export type PaymentChannel = 'online' | 'in_store' | 'other'
export type AccountType = 'checking' | 'savings' | 'credit_card'

/**
 * Transaction location information from Plaid
 */
export interface TransactionLocation {
  address: string | null
  city: string | null
  region: string | null
  postal_code: string | null
  country: string | null
  lat: number | null
  lon: number | null
}

/**
 * Plaid Personal Finance Category
 */
export interface PlaidPersonalFinanceCategory {
  primary: string
  detailed: string
  confidence_level?: string
}

/**
 * Transaction data from Plaid API
 */
export interface PlaidTransaction {
  transaction_id: string
  account_id: string
  amount: number
  date: string // YYYY-MM-DD
  authorized_date: string | null
  name: string
  merchant_name: string | null
  pending: boolean
  payment_channel: PaymentChannel
  category: string[] | null // Legacy Plaid categories
  personal_finance_category: PlaidPersonalFinanceCategory | null
  location: TransactionLocation
  iso_currency_code: string | null
  unofficial_currency_code: string | null
  original_description: string | null
}

/**
 * Plaid Link success callback data
 */
export interface PlaidLinkSuccess {
  public_token: string
  metadata: {
    institution: {
      name: string
      institution_id: string
    }
    accounts: Array<{
      id: string
      name: string
      mask: string
      type: string
      subtype: string
    }>
    link_session_id: string
  }
}

/**
 * Plaid Link error callback data
 */
export interface PlaidLinkError {
  error_type: string
  error_code: string
  error_message: string
  display_message: string | null
}

/**
 * Plaid Link exit callback data
 */
export interface PlaidLinkExit {
  error: PlaidLinkError | null
  metadata: {
    institution: {
      name: string
      institution_id: string
    } | null
    status: string
    link_session_id: string
    request_id: string
  }
}

/**
 * Plaid webhook payload for transaction updates
 */
export interface PlaidWebhookPayload {
  webhook_type: string
  webhook_code: string
  item_id: string
  error?: {
    error_code: string
    error_message: string
  }
  // For TRANSACTIONS_REMOVED webhook
  removed_transactions?: string[]
  // For DEFAULT_UPDATE webhook
  new_transactions?: number
}

/**
 * Request to create a Plaid Link token
 */
export interface PlaidLinkTokenRequest {
  user_id: string
  client_name?: string
  products?: string[]
  country_codes?: string[]
  language?: string
}

/**
 * Response with Plaid Link token
 */
export interface PlaidLinkTokenResponse {
  link_token: string
  expiration: string
}

/**
 * Request to exchange public token for access token
 */
export interface PlaidExchangeTokenRequest {
  public_token: string
  user_id: string
}

/**
 * Response after exchanging public token
 */
export interface PlaidExchangeTokenResponse {
  bank_connection_id: string
  institution_name: string
  account_type: AccountType
}

/**
 * Request to sync transactions from Plaid
 */
export interface PlaidSyncRequest {
  user_id: string
  bank_connection_id: string
  start_date?: string // YYYY-MM-DD
  end_date?: string // YYYY-MM-DD
}

/**
 * Response after syncing transactions
 */
export interface PlaidSyncResponse {
  transactions_added: number
  transactions_modified: number
  transactions_removed: number
  has_more: boolean
  cursor?: string
}

/**
 * Plaid Item (institution connection) status
 */
export interface PlaidItemStatus {
  item_id: string
  institution_id: string
  institution_name: string
  available_products: string[]
  billed_products: string[]
  error: {
    error_code: string
    error_message: string
  } | null
  consent_expiration_time: string | null
}

/**
 * Plaid Account information
 */
export interface PlaidAccount {
  account_id: string
  balances: {
    available: number | null
    current: number | null
    limit: number | null
    iso_currency_code: string | null
  }
  mask: string | null
  name: string
  official_name: string | null
  type: string
  subtype: string | null
}

/**
 * Plaid Institution information
 */
export interface PlaidInstitution {
  institution_id: string
  name: string
  products: string[]
  country_codes: string[]
  url: string | null
  primary_color: string | null
  logo: string | null
}
