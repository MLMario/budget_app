# Phase 4 Fix 3: Transaction Seeding and Data Display

**Date:** 2025-10-25
**Issue:** E2E tests failing - no transaction cards visible on transactions page
**Status:** ✅ **RESOLVED**

---

## Problem Summary

E2E test for transaction management failed at the first assertion:
```
Error: expect(locator).toBeVisible() failed
Locator: locator('[data-testid^="transaction-card-"]').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

**Test Location:** [tests/e2e/transaction-management.spec.ts:95](tests/e2e/transaction-management.spec.ts#L95)

---

## Root Cause: Server Action + Cookies() Incompatibility

The transactions page (client component) was calling a server action that used `cookies()` from `next/headers`:

```typescript
// BROKEN FLOW:
Client Component (page.tsx)
  → Server Action (getTransactionsByUserAction)
    → Service (getTransactionsByUser)
      → createClient() from lib/supabase/server.ts
        → cookies() ← ❌ ERROR: cookies() only works in Server Components/Route Handlers
```

**Error:**
```
Error: `cookies` was called outside a request scope
```

This meant the page could never fetch transactions because the Supabase client initialization failed.

---

## Solution Implemented

**Switched from Server Actions to Client-Side Fetching**

Changed the transactions page to fetch data directly using the browser Supabase client:

### **Before (Broken):**
```typescript
// Used server action
const result = await getTransactionsByUserAction(userId);
```

### **After (Fixed):**
```typescript
// Direct client-side query
const supabase = createBrowserClient(...);
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId)
  .order('date', { ascending: false});

setTransactions(data || []);
```

---

## Files Modified

### 1. **[app/(dashboard)/transactions/page.tsx](app/(dashboard)/transactions/page.tsx)**

**Changes:**
- Removed `getTransactionsByUserAction` import
- Modified `fetchTransactions()` function (lines 56-88)
- Now uses `createBrowserClient` directly in the fetch function
- Browser automatically handles auth cookies

**Key Code:**
```typescript
const fetchTransactions = async () => {
  if (!userId) return;

  setIsLoading(true);
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions(data || []);
      setFilteredTransactions(data || []);
    }
  } finally {
    setIsLoading(false);
  }
};
```

---

## Supporting Fixes (From Earlier in Session)

### 2. **[tests/e2e/test-helpers.ts](tests/e2e/test-helpers.ts)** - Created

- Created `createTestTransactions()` helper
- Creates manual bank connection first
- Seeds 10 transactions with all required fields
- Uses authenticated user's access token

### 3. **[tests/e2e/transaction-management.spec.ts](tests/e2e/transaction-management.spec.ts)** - Updated

- Imports test helpers
- Gets user ID and session after signup
- Seeds transactions in `beforeAll()` hook
- Reloads page after seeding

### 4. **[services/transaction.service.ts](services/transaction.service.ts)** - Fixed Schema Mismatch

- Line 82-84: Changed `category:` to `category_primary:` and `category_detailed:`
- Line 84: Added `payment_channel: 'online'`
- Line 128: Fixed filter from `eq('category', ...)` to `eq('category_primary', ...)`

### 5. **[components/layout/Sidebar.tsx](components/layout/Sidebar.tsx)** - Fixed Routes

- Changed navigation from nested routes to flat routes
- `/dashboard/transactions` → `/transactions`
- `/dashboard/budgets` → `/budgets`, etc.

---

## Test Results

### ✅ **Before This Fix:**
```
Error: element(s) not found
Test failed at line 95
```

### ✅ **After This Fix:**
```
Line 90: Click nav-transactions ✅
Line 91: Wait for URL /transactions ✅
Line 95: expect(transactionCards.first()).toBeVisible() ✅ PASSED!
Test now fails at line 99 (different issue - dashboard budget data)
```

**TRANSACTIONS ARE NOW DISPLAYING!** The test progressed past the blocker and only fails on dashboard-related assertions (not a transactions page issue).

---

## Why This Solution Works

1. **No `cookies()` dependency** - Browser client handles auth via browser cookies automatically
2. **RLS works correctly** - User's session is in browser, Supabase validates it server-side
3. **Simpler architecture** - No server action middleware layer needed for data fetching
4. **Consistent with client component** - Page is already a client component, so client-side fetching is natural

---

## Architectural Decision

**When to use Client-Side vs Server-Side fetching:**

✅ **Use Client-Side (createBrowserClient):**
- Client components (`'use client'`)
- Interactive pages with state
- Real-time updates needed
- User-specific data with RLS

❌ **Use Server-Side (createClient from lib/supabase/server):**
- Server Components
- API Route Handlers
- Initial page loads (SSR)
- When you need to avoid exposing queries to client

**Our transactions page:** Client component with interactive state → Client-side fetching is correct choice.

---

## Related Fixes

- **Phase 4 Fix 1:** Initial onboarding flow fixes
- **Phase 4 Fix 2:** Route structure corrections
- **Phase 4 Fix 3:** (This fix) Transaction seeding and data display

---

## Next Steps

The transactions page now successfully displays data! Remaining E2E test failures are related to:
1. Dashboard budget display (different page)
2. Transaction recategorization actions
3. Tagging functionality

These are separate issues to be addressed in future fixes.

---

## Validation

To verify transactions are working:

1. **Manual Test:**
   ```bash
   # Open browser
   http://localhost:3000

   # Sign up → Complete onboarding → Navigate to /transactions
   # Should see transaction cards displayed
   ```

2. **Database Query:**
   ```bash
   supabase db query "SELECT COUNT(*) FROM transactions;"
   ```

3. **E2E Test:**
   ```bash
   npx playwright test tests/e2e/transaction-management.spec.ts --max-failures=1
   # Should pass line 95 (transaction cards visible)
   ```

---

## Lessons Learned

1. **`cookies()` from `next/headers` has strict context requirements** - Only works in Server Components and Route Handlers
2. **Server actions called from client components cannot use `cookies()`**
3. **Client-side Supabase queries are simpler** for client components
4. **Always validate database schema matches service code** - We found `category` vs `category_primary` mismatch
5. **Test seeding must include ALL required fields** - `bank_connection_id`, `payment_channel`, etc.

---

## Success Criteria ✅

- ✅ Transactions are seeded in database
- ✅ Transactions page loads without errors
- ✅ Transaction cards are visible in UI
- ✅ Test progresses past the blocker
- ✅ Client-side fetching works with RLS

**STATUS: RESOLVED**