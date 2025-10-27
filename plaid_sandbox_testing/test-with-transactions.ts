/**
 * Plaid Sandbox Transaction Generation Test
 *
 * This script creates a sandbox item and generates sample transactions
 * using Plaid's sandbox/transactions/fire_webhook endpoint.
 *
 * Run with: npx tsx plaid_sandbox_testing/test-with-transactions.ts
 */

import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || '68dcaa0237fe0500269e7ab4';
const PLAID_SECRET = process.env.PLAID_SECRET || '3fe8e28a45d6f6d2c778209af78f4a';
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';

console.log('🔧 Plaid Sandbox Transaction Generation Test');
console.log('============================================\n');

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

/**
 * Main test function
 */
async function testWithTransactions() {
  try {
    console.log('Step 1: Creating sandbox public token with transactions...');
    console.log('----------------------------------------------------------');

    // Create a sandbox public token with First Platypus Bank (ins_109509)
    // This institution is designed for transaction testing
    const createTokenResponse = await plaidClient.sandboxPublicTokenCreate({
      institution_id: 'ins_109509', // First Platypus Bank - has transaction data
      initial_products: [Products.Transactions],
    });

    const publicToken = createTokenResponse.data.public_token;
    console.log('✅ Public token created successfully');
    console.log(`Institution: First Platypus Bank (ins_109509)`);
    console.log('');

    // Step 2: Exchange public token for access token
    console.log('Step 2: Exchanging public token for access token...');
    console.log('---------------------------------------------------');

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    console.log('✅ Token exchange successful');
    console.log(`Access Token: ${accessToken.substring(0, 20)}...`);
    console.log(`Item ID: ${itemId}`);
    console.log('');

    // Step 3: Fire webhook to trigger transaction generation
    console.log('Step 3: Triggering transaction webhook...');
    console.log('------------------------------------------');

    try {
      await plaidClient.sandboxItemFireWebhook({
        access_token: accessToken,
        webhook_code: 'DEFAULT_UPDATE',
      });
      console.log('✅ Webhook fired successfully');
      console.log('⏳ Waiting 3 seconds for transactions to populate...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('');
    } catch (webhookError) {
      console.log('⚠️  Webhook firing failed (continuing anyway)');
      console.log('');
    }

    // Step 4: Get accounts
    console.log('Step 4: Fetching account information...');
    console.log('----------------------------------------');

    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    console.log('✅ Accounts retrieved successfully');
    console.log(`Number of accounts: ${accountsResponse.data.accounts.length}`);
    accountsResponse.data.accounts.forEach((account, index) => {
      console.log(`  Account ${index + 1}: ${account.name} (${account.type}) - Balance: $${account.balances.current}`);
    });
    console.log('');

    // Step 5: Sync transactions
    console.log('Step 5: Syncing transactions...');
    console.log('--------------------------------');

    let transactions: any[] = [];
    let syncCursor: string | undefined = undefined;
    let hasMore = true;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && transactions.length === 0) {
      attempts++;

      try {
        while (hasMore && transactions.length < 500) {
          const syncResponse = await plaidClient.transactionsSync({
            access_token: accessToken,
            cursor: syncCursor,
          });

          transactions.push(...syncResponse.data.added);
          hasMore = syncResponse.data.has_more;
          syncCursor = syncResponse.data.next_cursor;

          console.log(`  Fetched ${syncResponse.data.added.length} transactions (Total: ${transactions.length})`);

          if (!hasMore) break;
        }

        if (transactions.length === 0 && attempts < maxAttempts) {
          console.log(`  No transactions yet, waiting 5 seconds before retry ${attempts}/${maxAttempts}...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (syncError: any) {
        console.log(`  Sync attempt ${attempts} failed: ${syncError.response?.data?.error_code || syncError.message}`);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    console.log('');
    console.log(`✅ Transaction sync complete - Retrieved ${transactions.length} transactions`);
    console.log('');

    // Display sample transactions
    if (transactions.length > 0) {
      console.log('Sample Transactions (First 10):');
      console.log('================================');
      transactions.slice(0, 10).forEach((txn, index) => {
        console.log(`\nTransaction ${index + 1}:`);
        console.log(`  ID: ${txn.transaction_id}`);
        console.log(`  Date: ${txn.date}`);
        console.log(`  Merchant: ${txn.merchant_name || txn.name}`);
        console.log(`  Amount: $${txn.amount.toFixed(2)}`);
        console.log(`  Category (Primary): ${txn.personal_finance_category?.primary || 'N/A'}`);
        console.log(`  Category (Detailed): ${txn.personal_finance_category?.detailed || 'N/A'}`);
        console.log(`  Pending: ${txn.pending}`);
        console.log(`  Payment Channel: ${txn.payment_channel}`);
        if (txn.location?.city) {
          console.log(`  Location: ${txn.location.city}, ${txn.location.region}`);
        }
      });
      console.log('');

      // Show category breakdown
      console.log('Transaction Categories Breakdown:');
      console.log('=================================');
      const categoryMap = new Map<string, number>();
      transactions.forEach(txn => {
        const category = txn.personal_finance_category?.primary || 'UNCATEGORIZED';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });
      Array.from(categoryMap.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          console.log(`  ${category}: ${count} transactions`);
        });
      console.log('');
    } else {
      console.log('⚠️  No transactions found after multiple attempts');
      console.log('   This can happen with some sandbox institutions.');
      console.log('   The account data is still valid for testing other features.');
      console.log('');
    }

    // Prepare comprehensive test results
    const testResults = {
      metadata: {
        timestamp: new Date().toISOString(),
        environment: PLAID_ENV,
        test_description: 'Plaid Sandbox Transaction Generation Test',
      },
      institution: {
        institution_id: 'ins_109509',
        institution_name: 'First Platypus Bank (Sandbox)',
        purpose: 'Testing institution with transaction data',
      },
      connection: {
        item_id: itemId,
        access_token_hint: accessToken.substring(0, 20) + '...',
        sync_cursor: syncCursor,
      },
      accounts: accountsResponse.data.accounts.map(acc => ({
        account_id: acc.account_id,
        name: acc.name,
        type: acc.type,
        subtype: acc.subtype,
        mask: acc.mask,
        balances: {
          available: acc.balances.available,
          current: acc.balances.current,
          limit: acc.balances.limit,
          currency: acc.balances.iso_currency_code,
        },
      })),
      transactions: {
        total_count: transactions.length,
        method: 'transactionsSync',
        categories: Array.from(
          transactions.reduce((map, txn) => {
            const cat = txn.personal_finance_category?.primary || 'UNCATEGORIZED';
            map.set(cat, (map.get(cat) || 0) + 1);
            return map;
          }, new Map<string, number>()).entries()
        ).map(([category, count]) => ({ category, count })),
        sample_transactions: transactions.slice(0, 20), // Save first 20 for review
        all_transactions: transactions, // Save all for analysis
      },
      statistics: {
        total_amount: transactions.reduce((sum, txn) => sum + txn.amount, 0),
        average_amount: transactions.length > 0
          ? (transactions.reduce((sum, txn) => sum + txn.amount, 0) / transactions.length).toFixed(2)
          : 0,
        pending_count: transactions.filter(txn => txn.pending).length,
        posted_count: transactions.filter(txn => !txn.pending).length,
        date_range: transactions.length > 0 ? {
          earliest: transactions.reduce((min, txn) => txn.date < min ? txn.date : min, transactions[0].date),
          latest: transactions.reduce((max, txn) => txn.date > max ? txn.date : max, transactions[0].date),
        } : null,
      },
      notes: transactions.length > 0
        ? `Successfully retrieved ${transactions.length} sample transactions from Plaid sandbox`
        : 'No transactions found - account data is valid but transactions need more time or different institution',
    };

    // Save to JSON file
    const outputPath = path.join(__dirname, 'sample-transactions-full.json');
    fs.writeFileSync(outputPath, JSON.stringify(testResults, null, 2));

    console.log('💾 Results saved to: plaid_sandbox_testing/sample-transactions-full.json');
    console.log('');
    console.log('✅ Test completed successfully!');
    console.log('');
    console.log('Summary:');
    console.log(`  • Accounts: ${accountsResponse.data.accounts.length}`);
    console.log(`  • Transactions: ${transactions.length}`);
    console.log(`  • Categories: ${testResults.transactions.categories.length}`);
    if (transactions.length > 0) {
      console.log(`  • Date Range: ${testResults.statistics.date_range?.earliest} to ${testResults.statistics.date_range?.latest}`);
      console.log(`  • Total Amount: $${testResults.statistics.total_amount.toFixed(2)}`);
    }

  } catch (error: any) {
    console.error('❌ Error during test:');
    console.error(error.response?.data || error.message);
    console.error('');

    // Save error details
    const errorPath = path.join(__dirname, 'transaction-test-error.json');
    fs.writeFileSync(errorPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      error: error.response?.data || error.message,
      stack: error.stack,
    }, null, 2));

    console.log('💾 Error details saved to: plaid_sandbox_testing/transaction-test-error.json');
    process.exit(1);
  }
}

// Run the test
testWithTransactions();
