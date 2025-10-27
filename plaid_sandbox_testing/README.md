# Plaid Sandbox Testing

This folder contains test scripts and sample data for testing the Plaid API integration in sandbox mode.

## Purpose

To validate the Plaid API connection, understand transaction data structure, and provide sample data for development and testing without needing live bank connections.

## Files

### Test Scripts

1. **`test-plaid-api.ts`**
   - Basic Plaid API connection test
   - Creates sandbox public token
   - Exchanges for access token
   - Retrieves account information
   - Attempts to sync transactions
   - Run: `npx tsx plaid_sandbox_testing/test-plaid-api.ts`

2. **`test-with-transactions.ts`**
   - Enhanced version with transaction generation attempts
   - Uses webhook triggers to populate transactions
   - Includes retry logic for transaction retrieval
   - Tests both transactionsSync and transactionsGet endpoints
   - Run: `npx tsx plaid_sandbox_testing/test-with-transactions.ts`

3. **`generate-sample-transactions.ts`**
   - Generates realistic sample transaction data based on Plaid API structure
   - Creates 11 sample transactions across different categories
   - Includes all fields from actual Plaid responses
   - Run: `npx tsx plaid_sandbox_testing/generate-sample-transactions.ts`

### Data Files

1. **`sample-transactions.json`**
   - Output from `test-plaid-api.ts`
   - Contains account data from sandbox
   - 12 accounts (checking, savings, credit cards, loans, investments)
   - No transactions (expected for new sandbox items)

2. **`sample-transactions-full.json`**
   - Output from `test-with-transactions.ts`
   - Enhanced account data
   - Transaction sync results
   - Statistics and metadata

3. **`sample-transactions-realistic.json`** ⭐ **RECOMMENDED FOR TESTING**
   - Output from `generate-sample-transactions.ts`
   - 11 realistic sample transactions
   - Covers 11 different transaction categories
   - Includes all Plaid transaction fields:
     - `transaction_id`, `account_id`, `amount`
     - `merchant_name`, `name`, `date`
     - `personal_finance_category` (primary and detailed)
     - `payment_channel`, `location`, `pending` status
     - Complete metadata matching Plaid API structure

4. **`error-log.json`** / **`transaction-test-error.json`**
   - Error logs from failed API attempts
   - Useful for debugging and understanding Plaid errors

## Sample Transaction Categories

The generated sample data includes transactions from these categories:

| Primary Category | Detailed Category | Example Merchant |
|-----------------|-------------------|------------------|
| FOOD_AND_DRINK | FOOD_AND_DRINK_COFFEE | Starbucks |
| FOOD_AND_DRINK | FOOD_AND_DRINK_FAST_FOOD | McDonald's |
| FOOD_AND_DRINK | FOOD_AND_DRINK_GROCERIES | Whole Foods |
| ENTERTAINMENT | ENTERTAINMENT_MUSIC_AND_AUDIO | Spotify |
| TRANSPORTATION | TRANSPORTATION_TAXIS_AND_RIDE_SHARES | Uber |
| RENT_AND_UTILITIES | RENT_AND_UTILITIES_RENT | Apartment Management |
| RENT_AND_UTILITIES | RENT_AND_UTILITIES_INTERNET_AND_CABLE | Comcast |
| GENERAL_MERCHANDISE | GENERAL_MERCHANDISE_PHARMACIES | Walgreens |
| GENERAL_MERCHANDISE | GENERAL_MERCHANDISE_SPORTING_GOODS | Nike |
| GENERAL_SERVICES | GENERAL_SERVICES_GYMS_AND_FITNESS_CENTERS | 24 Hour Fitness |
| INCOME | INCOME_WAGES | Direct Deposit |

## Transaction Data Structure

Each transaction includes:

```typescript
{
  transaction_id: string           // Unique Plaid transaction ID
  account_id: string               // Associated account ID
  amount: number                   // Transaction amount (positive = debit)
  iso_currency_code: string        // Currency (USD)
  date: string                     // Transaction date (YYYY-MM-DD)
  authorized_date: string | null   // Authorization date
  name: string                     // Transaction name
  merchant_name: string | null     // Merchant name (if available)
  pending: boolean                 // Pending status
  payment_channel: string          // 'in store' | 'online' | 'other'
  transaction_type: string         // 'place' | 'digital' | 'special'
  personal_finance_category: {
    primary: string                // Primary category (e.g., FOOD_AND_DRINK)
    detailed: string               // Detailed category (e.g., FOOD_AND_DRINK_COFFEE)
    confidence_level: string       // VERY_HIGH | HIGH | MEDIUM | LOW
  }
  location: {
    address: string | null
    city: string | null
    region: string | null
    postal_code: string | null
    country: string | null
    lat: number | null
    lon: number | null
    store_number: string | null
  }
  category: string[]               // Legacy Plaid categories
  category_id: string              // Legacy category ID
}
```

## Key Findings

### 1. Sandbox Behavior
- New sandbox items don't immediately have transaction history
- Transaction population can take time or require webhook triggers
- `PRODUCT_NOT_READY` error is common for new sandbox items
- Different test institutions behave differently

### 2. Plaid Integration in Project
The project uses:
- **Plaid Node SDK**: `plaid` package
- **Service Layer**: [services/plaid.service.ts](../services/plaid.service.ts)
- **Types**: [types/plaid.types.ts](../types/plaid.types.ts)
- **Actions**: [app/actions/plaid.ts](../app/actions/plaid.ts)

Current implementation includes:
- ✅ Link token creation (`createLinkToken`)
- ✅ Public token exchange (`exchangePublicToken`)
- ✅ Transaction sync (`syncTransactions`)
- ✅ Webhook handling (`handleWebhook`)

### 3. Transaction Sync API
The project uses `transactionsSync` API (recommended by Plaid):
- More efficient than `transactionsGet`
- Uses cursor-based pagination
- Returns added, modified, and removed transactions
- Stores sync cursor for incremental updates

### 4. Category Mapping
Plaid provides two category systems:
- **Legacy**: Array of category strings (being deprecated)
- **Personal Finance Category**: Structured primary + detailed categories

**Project should use**: `personal_finance_category` for new implementations

## Using Sample Data for Testing

### Import Transaction Service

```typescript
import sampleData from './plaid_sandbox_testing/sample-transactions-realistic.json';

// Use sample transactions for testing
const transactions = sampleData.transactions.all;

// Test transaction categorization
transactions.forEach(txn => {
  console.log(`${txn.merchant_name}: ${txn.personal_finance_category.primary}`);
});
```

### Test Budget Tracking

```typescript
// Calculate spending by category
const categoryTotals = transactions.reduce((acc, txn) => {
  const category = txn.personal_finance_category.primary;
  acc[category] = (acc[category] || 0) + txn.amount;
  return acc;
}, {});

// Example output:
// FOOD_AND_DRINK: $258.46
// TRANSPORTATION: $89.99
// RENT_AND_UTILITIES: $2575.50
```

## Plaid Sandbox Credentials

From `.env.local`:
```
PLAID_CLIENT_ID=68dcaa0237fe0500269e7ab4
PLAID_SECRET=3fe8e28a45d6f6d2c778209af78f4a
PLAID_ENV=sandbox
```

### Test Institutions
- **Chase**: `ins_109508` (used in tests)
- **First Platypus Bank**: `ins_109509` (transaction testing)

### Test Credentials
For Link flow testing:
- Username: `user_good`
- Password: `pass_good`

## Next Steps

1. **Transaction Import**: Use sample data to test transaction import flow
2. **Categorization**: Validate category mapping from Plaid to app categories
3. **Budget Tracking**: Test budget calculations with realistic transaction data
4. **AI Analysis**: Use sample data for AI recommendation testing
5. **E2E Tests**: Integrate sample data into Playwright tests

## Resources

- [Plaid Sandbox Documentation](https://plaid.com/docs/sandbox/)
- [Plaid Transactions API](https://plaid.com/docs/api/products/transactions/)
- [Plaid Personal Finance Categories](https://plaid.com/docs/api/products/transactions/#personal-finance-category-schema)
- [Project Spec](../specs/001-ai-budget-app/spec.md)
- [Project Implementation Plan](../specs/001-ai-budget-app/plan.md)

## Statistics

- **Total Transactions**: 11
- **Date Range**: October 1-25, 2025
- **Total Amount**: $6,879.41
- **Average Transaction**: $625.40
- **Categories Covered**: 11 unique categories
- **Accounts**: 2 (Checking + Credit Card)

---

**Last Updated**: 2025-10-27
**Status**: ✅ Complete - Ready for development use
