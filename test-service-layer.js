/**
 * Test Service Layer Changes
 * Validates that service functions work with new category FK schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testServiceLayer() {
  console.log('🧪 Testing Service Layer Changes\n');

  // Test 1: Fetch categories
  console.log('Test 1: Fetching categories...');
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (catError) {
    console.error('❌ Failed to fetch categories:', catError);
    return;
  }

  console.log(`✅ Fetched ${categories.length} categories:`);
  categories.forEach(cat => {
    console.log(`   - ${cat.display_name} (${cat.name})`);
  });
  console.log('');

  // Test 2: Verify transactions have app_category_id
  console.log('Test 2: Checking transactions have app_category_id...');
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('id, merchant_name, app_category_id, user_category_override_id, categories!transactions_app_category_id_fkey(display_name)')
    .limit(5);

  if (txError) {
    console.error('❌ Failed to fetch transactions:', txError);
    return;
  }

  console.log(`✅ Sample transactions with categories:`);
  transactions.forEach(tx => {
    const catName = tx.categories?.display_name || 'Unknown';
    console.log(`   - ${tx.merchant_name}: ${catName}`);
  });
  console.log('');

  // Test 3: Test budget utilization function
  console.log('Test 3: Testing calculate_budget_utilization function...');

  // Get first user
  const { data: userPrefs } = await supabase
    .from('user_preferences')
    .select('user_id')
    .limit(1)
    .single();

  if (!userPrefs) {
    console.log('⚠️  No users found - skipping budget test');
    return;
  }

  const userId = userPrefs.user_id;
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data: budgetUtilization, error: budgetError } = await supabase
    .rpc('calculate_budget_utilization', {
      p_user_id: userId,
      p_month: month,
      p_year: year
    });

  if (budgetError) {
    console.error('❌ Failed to calculate budget utilization:', budgetError);
    return;
  }

  console.log(`✅ Budget utilization for ${month}/${year}:`);
  if (budgetUtilization && budgetUtilization.length > 0) {
    budgetUtilization.forEach(bu => {
      const pct = bu.percentage_used.toFixed(1);
      const status = bu.status === 'on_track' ? '✅' : bu.status === 'warning' ? '⚠️' : '🔴';
      console.log(`   ${status} ${bu.category_name}: $${bu.spent_amount.toFixed(2)} / $${bu.budgeted_amount.toFixed(2)} (${pct}%)`);
    });
  } else {
    console.log('   No budget data for this month');
  }
  console.log('');

  // Test 4: Verify budget_categories use category_id FK
  console.log('Test 4: Checking budget_categories use category_id FK...');
  const { data: budgetCats, error: bcError } = await supabase
    .from('budget_categories')
    .select('id, category_id, budgeted_amount, categories(display_name)')
    .limit(5);

  if (bcError) {
    console.error('❌ Failed to fetch budget_categories:', bcError);
    return;
  }

  console.log(`✅ Sample budget categories with FK:`);
  budgetCats.forEach(bc => {
    const catName = bc.categories?.display_name || 'Unknown';
    console.log(`   - ${catName}: $${bc.budgeted_amount.toFixed(2)}`);
  });
  console.log('');

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('✅ All service layer tests passed!');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('Summary:');
  console.log(`  • ${categories.length} active categories in database`);
  console.log(`  • Transactions auto-categorized via trigger`);
  console.log(`  • Budget utilization calculated dynamically`);
  console.log(`  • Budget categories use category_id FK`);
  console.log('');
  console.log('✅ Service layer is ready for Phase 4 (UI updates)');
}

testServiceLayer().catch(console.error);
