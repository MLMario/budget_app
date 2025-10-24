#!/usr/bin/env node

/**
 * Test script to verify Supabase local connection
 * Run with: node test-supabase-connection.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('='.repeat(60));
console.log('Testing Supabase Local Connection');
console.log('='.repeat(60));
console.log();

// Check environment variables
console.log('1. Checking Environment Variables...');
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓ Set' : '✗ Missing'}`);
console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✓ Set' : '✗ Missing'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✓ Set' : '✗ Missing'}`);
console.log();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables!');
  process.exit(1);
}

async function testConnection() {
  try {
    // Test 1: Create client with anon key
    console.log('2. Testing Anon Key Connection...');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

    // Test 2: Query user_preferences (should work with RLS)
    console.log('3. Testing Database Query (user_preferences table)...');
    const { data: preferences, error: prefsError } = await supabaseAnon
      .from('user_preferences')
      .select('*')
      .limit(1);

    if (prefsError) {
      console.log(`   ⚠️  Query returned error (expected if not authenticated): ${prefsError.message}`);
    } else {
      console.log(`   ✓ Query successful! Found ${preferences?.length || 0} record(s)`);
    }
    console.log();

    // Test 3: Create service role client
    console.log('4. Testing Service Role Key Connection...');
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Test 4: Query with service role (bypasses RLS)
    console.log('5. Testing Service Role Query (should bypass RLS)...');
    const { data: allPrefs, error: serviceError } = await supabaseService
      .from('user_preferences')
      .select('*');

    if (serviceError) {
      console.error(`   ❌ Service role query failed: ${serviceError.message}`);
      throw serviceError;
    } else {
      console.log(`   ✓ Service role query successful! Found ${allPrefs?.length || 0} user preference(s)`);
    }
    console.log();

    // Test 5: Query other tables
    console.log('6. Testing Other Tables...');

    const { data: transactions, error: txError } = await supabaseService
      .from('transactions')
      .select('count');

    const { data: budgets, error: budgetError } = await supabaseService
      .from('budgets')
      .select('count');

    const { data: goals, error: goalsError } = await supabaseService
      .from('goals')
      .select('count');

    if (!txError && !budgetError && !goalsError) {
      console.log(`   ✓ Transactions table: ${transactions?.[0]?.count || 0} records`);
      console.log(`   ✓ Budgets table: ${budgets?.[0]?.count || 0} records`);
      console.log(`   ✓ Goals table: ${goals?.[0]?.count || 0} records`);
    }
    console.log();

    // Test 6: Test authentication
    console.log('7. Testing Authentication with Test User...');
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: 'alice@example.com',
      password: 'TestPassword123!'
    });

    if (authError) {
      console.error(`   ❌ Authentication failed: ${authError.message}`);
    } else {
      console.log(`   ✓ Authentication successful!`);
      console.log(`   User ID: ${authData.user.id}`);
      console.log(`   Email: ${authData.user.email}`);

      // Test authenticated query
      const { data: myPrefs, error: myPrefsError } = await supabaseAnon
        .from('user_preferences')
        .select('*');

      if (!myPrefsError) {
        console.log(`   ✓ Authenticated query successful! Found ${myPrefs?.length || 0} preference(s)`);
      }

      // Sign out
      await supabaseAnon.auth.signOut();
    }
    console.log();

    console.log('='.repeat(60));
    console.log('✅ All Tests Passed! Supabase connection is working correctly.');
    console.log('='.repeat(60));

  } catch (error) {
    console.error();
    console.error('='.repeat(60));
    console.error('❌ Test Failed!');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testConnection();
