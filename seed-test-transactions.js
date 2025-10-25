/**
 * Seed test transactions with proper Plaid taxonomy
 * Run: node seed-test-transactions.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedTestTransactions() {
  console.log('🌱 Seeding test transactions with Plaid taxonomy...\n');

  // Get first user
  const { data: users, error: usersError } = await supabase
    .from('user_preferences')
    .select('user_id')
    .limit(1);

  if (usersError || !users || users.length === 0) {
    console.error('❌ No users found. Run tests first to create users.');
    process.exit(1);
  }

  const userId = users[0].user_id;
  console.log(`✓ Using user: ${userId}\n`);

  // Create manual bank connection
  const { data: bankConnection, error: bankError } = await supabase
    .from('bank_connections')
    .insert({
      user_id: userId,
      plaid_access_token: 'manual_seed_token',
      plaid_item_id: 'manual_seed_item',
      institution_name: 'Seed Bank',
      connection_status: 'active',
      account_type: 'checking',
    })
    .select()
    .single();

  if (bankError) {
    console.error('❌ Error creating bank connection:', bankError);
    process.exit(1);
  }

  console.log(`✓ Created bank connection: ${bankConnection.id}\n`);

  // Create test transactions with proper Plaid taxonomy
  const now = new Date();
  const transactions = [
    // Coffee shops (FOOD_AND_DRINK)
    { merchant: 'Starbucks', primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_COFFEE', amount: 5.50, daysAgo: 1 },
    { merchant: 'Starbucks', primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_COFFEE', amount: 6.75, daysAgo: 3 },
    { merchant: 'Starbucks', primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_COFFEE', amount: 4.25, daysAgo: 7 },
    { merchant: 'Local Coffee', primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_COFFEE', amount: 3.50, daysAgo: 2 },

    // Fast food (FOOD_AND_DRINK)
    { merchant: 'McDonald\'s', primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_FAST_FOOD', amount: 12.50, daysAgo: 2 },
    { merchant: 'Subway', primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_FAST_FOOD', amount: 8.99, daysAgo: 5 },

    // Restaurants (FOOD_AND_DRINK)
    { merchant: 'Local Restaurant', primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANTS', amount: 55.00, daysAgo: 9 },
    { merchant: 'Italian Place', primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANTS', amount: 75.00, daysAgo: 15 },

    // Groceries (FOOD_AND_DRINK)
    { merchant: 'Whole Foods', primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES', amount: 78.50, daysAgo: 4 },
    { merchant: 'Safeway', primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES', amount: 125.30, daysAgo: 8 },

    // Transportation
    { merchant: 'Uber', primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_RIDE_SHARE', amount: 25.00, daysAgo: 5 },
    { merchant: 'Lyft', primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_RIDE_SHARE', amount: 18.50, daysAgo: 12 },
    { merchant: 'Shell Gas', primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_GAS', amount: 45.00, daysAgo: 6 },

    // Entertainment
    { merchant: 'Netflix', primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_MOVIES_AND_MUSIC', amount: 15.99, daysAgo: 10 },
    { merchant: 'Spotify', primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_MOVIES_AND_MUSIC', amount: 9.99, daysAgo: 10 },
    { merchant: 'AMC Theaters', primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_MOVIES_AND_MUSIC', amount: 28.00, daysAgo: 14 },

    // Shopping
    { merchant: 'Amazon', primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES', amount: 45.99, daysAgo: 8 },
    { merchant: 'Target', primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_DISCOUNT_STORES', amount: 32.25, daysAgo: 6 },
    { merchant: 'Best Buy', primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_ELECTRONICS', amount: 199.99, daysAgo: 20 },

    // Utilities
    { merchant: 'PG&E', primary: 'RENT_AND_UTILITIES', detailed: 'RENT_AND_UTILITIES_GAS_AND_ELECTRICITY', amount: 125.00, daysAgo: 1 },
    { merchant: 'Comcast', primary: 'RENT_AND_UTILITIES', detailed: 'RENT_AND_UTILITIES_INTERNET_AND_CABLE', amount: 89.99, daysAgo: 1 },
  ];

  const transactionData = transactions.map((txn, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - txn.daysAgo);

    return {
      user_id: userId,
      bank_connection_id: bankConnection.id,
      date: date.toISOString().split('T')[0],
      merchant_name: txn.merchant,
      amount: txn.amount,
      category_primary: txn.primary,
      category_detailed: txn.detailed,
      plaid_transaction_id: `seed_txn_${Date.now()}_${index}`,
      payment_channel: 'online',
      pending: false,
      tag_non_negotiable: false,
      tag_ignored: false,
    };
  });

  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionData)
    .select();

  if (error) {
    console.error('❌ Error inserting transactions:', error);
    process.exit(1);
  }

  console.log(`✓ Created ${data.length} transactions with Plaid taxonomy\n`);

  // Check category distribution
  const { data: categoryDist } = await supabase
    .from('transactions')
    .select('app_category_id, categories(display_name)')
    .eq('user_id', userId);

  const distribution = categoryDist.reduce((acc, txn) => {
    const catName = txn.categories?.display_name || 'Unknown';
    acc[catName] = (acc[catName] || 0) + 1;
    return acc;
  }, {});

  console.log('📊 Category distribution:');
  Object.entries(distribution).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count} transactions`);
  });

  console.log('\n✅ Seeding complete!');
}

seedTestTransactions().catch(console.error);
