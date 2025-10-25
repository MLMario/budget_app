# budget_app Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-23

## Active Technologies

- Node.js 18+ / TypeScript 5.3+ + Next.js 14 (App Router), Supabase Client, Plaid Node SDK, Anthropic Claude SDK (001-ai-budget-app)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

Node.js 18+ / TypeScript 5.3+: Follow standard conventions

Critical Architectural Patterns:
1. Server Actions vs Client-Side Fetching ⚠️ MOST IMPORTANT
// ❌ WRONG: Server actions from client components CANNOT use cookies()
const result = await getTransactionsByUserAction(userId);

// ✅ CORRECT: Use browser client directly in client components
const supabase = createBrowserClient(...);
const { data } = await supabase.from('transactions').select('*');
Lesson from Fix #3: cookies() from next/headers only works in Server Components and Route Handlers, NOT in server actions called from client components. 2. Import/Export Patterns
UI Components: MUST use named exports (export function Button() {})
Pages: MUST use default exports (export default function Page() {})
3. Async/Await Requirements
// ✅ ALWAYS await createClient()
const supabase = await createClient();  // Returns Promise!
4. Route Groups in Next.js
app/(dashboard)/          ← NO URL segment (organizational only)
  transactions/page.tsx   → Creates /transactions (NOT /dashboard/transactions)
Lesson from Fix #2: Parentheses exclude folders from URL paths. 5. Database Schema Alignment
Always verify service code matches actual database schema
Example: category vs category_primary mismatch caught in Fix #3
6. E2E Testing Requirements
ALL interactive elements need data-testid attributes
Test setup MUST seed realistic data (all required fields)
Pattern: data-testid="action-element" format

## Recent Changes

- 001-ai-budget-app: Added Node.js 18+ / TypeScript 5.3+ + Next.js 14 (App Router), Supabase Client, Plaid Node SDK, Anthropic Claude SDK

<!-- MANUAL ADDITIONS START -->

## Current project details and status

Only when the user ask you familiarize your self with:

1) Project Principles: C:\Users\mario\apps\budget_ai\budget_app\.specify\memory\constitution.md
2) Project Specs: C:\Users\mario\apps\budget_ai\budget_app\specs\001-ai-budget-app\spec.md
3) Project Implementation Plan: C:\Users\mario\apps\budget_ai\budget_app\specs\001-ai-budget-app\plan.md
4) Project Tasks and Completition: C:\Users\mario\apps\budget_ai\budget_app\specs\001-ai-budget-app\tasks.md
5) Fixes Log: C:\Users\mario\apps\budget_ai\budget_app\fix_log

Make a brief summary of: 

- Principles to Follow when coding
- Coding guidelines and learning based on principles, project plan and fixes
- Progress and current status
- Implemented Fixes

Follow principles and coding guidelines when implementing new tasks.

Ask user input for current state and next task / objectives 



<!-- MANUAL ADDITIONS END -->
