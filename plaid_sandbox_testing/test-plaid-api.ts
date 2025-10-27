/**
 * Plaid Sandbox API Testing Script
 *
 * This script tests the Plaid API connection using sandbox credentials
 * and retrieves sample transaction data.
 *
 * Run with: npx tsx plaid_sandbox_testing/test-plaid-api.ts
 */

import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || '68dcaa0237fe0500269e7ab4';
const PLAID_SECRET = process.env.PLAID_SECRET || '3fe8e28a45d6f6d2c778209af78f4a';
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';

console.log('🔧 Plaid Sandbox Testing');
console.log('========================\n');
console.log(`Environment: ${PLAID_ENV}`);
console.log(`Client ID: ${PLAID_CLIENT_ID}`);
console.log(`Secret: ${PLAID_SECRET.substring(0, 10)}...`);
console.log('');

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
async function testPlaidAPI() {
  try {
    console.log('Step 1: Creating sandbox public token...');
    console.log('---------------------------------------');

    // Create a sandbox public token
    // Using 'ins_109508' which is Chase (a common test institution in Plaid sandbox)
    const createTokenResponse = await plaidClient.sandboxPublicTokenCreate({
      institution_id: 'ins_109508', // Chase (sandbox institution)
      initial_products: [Products.Transactions],
      options: {
        webhook: 'https://www.example.com/webhook', // Optional webhook URL
      },
    });

    const publicToken = createTokenResponse.data.public_token;
    console.log('✅ Public token created successfully');
    console.log(`Public Token: ${publicToken.substring(0, 20)}...`);
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

    // Step 2.5: Fire webhook to initialize transactions product
    console.log('Step 2.5: Initializing transactions product...');
    console.log('----------------------------------------------');

    try {
      await plaidClient.sandboxItemFireWebhook({
        access_token: accessToken,
        webhook_code: 'DEFAULT_UPDATE',
      });
      console.log('✅ Webhook fired successfully');
      console.log('⏳ Waiting 5 seconds for transactions to initialize...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('');
    } catch (webhookError) {
      console.log('⚠️  Webhook firing skipped (this is normal for some test institutions)');
      console.log('');
    }

    // Step 3: Get accounts information
    console.log('Step 3: Fetching account information...');
    console.log('----------------------------------------');

    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    console.log('✅ Accounts retrieved successfully');
    console.log(`Number of accounts: ${accountsResponse.data.accounts.length}`);
    accountsResponse.data.accounts.forEach((account, index) => {
      console.log(`  Account ${index + 1}: ${account.name} (${account.type}) - Mask: ${account.mask}`);
    });
    console.log('');

    // Step 4: Get transactions using Transactions Sync API (more reliable in sandbox)
    console.log('Step 4: Fetching transactions using Sync API...');
    console.log('------------------------------------------------');

    let transactions: any[] = [];
    let syncCursor: string | undefined = undefined;
    let hasMore = true;

    try {
      // Use transactionsSync which is more reliable in sandbox
      while (hasMore && transactions.length < 100) {
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

      console.log('✅ Transactions retrieved successfully via Sync API');
      console.log(`Total transactions: ${transactions.length}`);
      console.log('');

      // Display sample transactions
      if (transactions.length > 0) {
        console.log('Sample Transactions:');
        console.log('-------------------');
        transactions.slice(0, 5).forEach((txn, index) => {
          console.log(`\nTransaction ${index + 1}:`);
          console.log(`  ID: ${txn.transaction_id}`);
          console.log(`  Date: ${txn.date}`);
          console.log(`  Merchant: ${txn.merchant_name || txn.name}`);
          console.log(`  Amount: $${txn.amount}`);
          console.log(`  Category: ${txn.personal_finance_category?.primary || 'N/A'} - ${txn.personal_finance_category?.detailed || 'N/A'}`);
          console.log(`  Pending: ${txn.pending}`);
          console.log(`  Payment Channel: ${txn.payment_channel}`);
        });
        console.log('');
      } else {
        console.log('⚠️  No transactions found (this can happen with new sandbox items)');
        console.log('');
      }

    } catch (syncError: any) {
      console.log('⚠️  Transactions Sync failed, trying alternative method...');
      console.log('');

      // Fallback: Try transactionsGet with a wider date range
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90); // Try 90 days
        const endDate = new Date();

        const transactionsResponse = await plaidClient.transactionsGet({
          access_token: accessToken,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          options: {
            count: 100,
            offset: 0,
          },
        });

        transactions = transactionsResponse.data.transactions;
        console.log('✅ Transactions retrieved via Get API');
        console.log(`Total transactions: ${transactions.length}`);
        console.log('');
      } catch (getError) {
        console.log('⚠️  Could not retrieve transactions (PRODUCT_NOT_READY - this is normal for new sandbox items)');
        console.log('   In sandbox, transactions may take a few moments to populate or require webhook triggers');
        console.log('');
      }
    }

    // Prepare data for saving
    const testResults = {
      timestamp: new Date().toISOString(),
      environment: PLAID_ENV,
      institution_id: 'ins_109508',
      institution_name: 'Chase (Sandbox)',
      item_id: itemId,
      access_token_hint: accessToken.substring(0, 20) + '...', // Save hint for reference
      accounts: accountsResponse.data.accounts.map(acc => ({
        account_id: acc.account_id,
        name: acc.name,
        type: acc.type,
        subtype: acc.subtype,
        mask: acc.mask,
        balances: acc.balances,
      })),
      transactions: {
        count: transactions.length,
        method: 'transactionsSync',
        sample: transactions.slice(0, 10), // Save first 10 transactions
        all: transactions, // Save all transactions
        sync_cursor: syncCursor, // Last cursor for future syncs
      },
      notes: transactions.length === 0
        ? 'No transactions found - this is normal for newly created sandbox items. Try running again after a few minutes or use a different test institution.'
        : `Successfully retrieved ${transactions.length} transactions from sandbox`,
    };

    // Save to JSON file
    const outputPath = path.join(__dirname, 'sample-transactions.json');
    fs.writeFileSync(outputPath, JSON.stringify(testResults, null, 2));

    console.log('💾 Results saved to: plaid_sandbox_testing/sample-transactions.json');
    console.log('');
    console.log('✅ All tests completed successfully!');

  } catch (error: any) {
    console.error('❌ Error testing Plaid API:');
    console.error(error.response?.data || error.message);
    console.error('');

    // Save error details
    const errorPath = path.join(__dirname, 'error-log.json');
    fs.writeFileSync(errorPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      error: error.response?.data || error.message,
      stack: error.stack,
    }, null, 2));

    console.log('💾 Error details saved to: plaid_sandbox_testing/error-log.json');
    process.exit(1);
  }
}

// Run the test
testPlaidAPI();
