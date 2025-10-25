# Implementation Plan: AI-Powered Proactive Budget App

**Branch**: `001-ai-budget-app` | **Date**: 2025-10-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-ai-budget-app/spec.md`

## Summary

Building an AI-powered budget application that proactively helps users manage spending through intelligent recommendations. The application features automated transaction categorization via Plaid integration, real-time budget tracking, and weekly/monthly AI analysis powered by Claude SDK. Technical approach: Next.js 14 with Supabase for PostgreSQL storage and authentication, minimalist architecture prioritizing security-first design, test-first development, and clean service layer separation to enable future mobile support.

## Technical Context

**Language/Version**: Node.js 18+ / TypeScript 5.3+
**Primary Dependencies**: Next.js 14 (App Router), Supabase Client, Plaid Node SDK, Anthropic Claude SDK
**Storage**: Supabase (PostgreSQL with Row Level Security, real-time subscriptions)
**Testing**: Vitest (unit/integration), Playwright (E2E), Mock Service Worker (Plaid/Claude mocking)
**Target Platform**: Web application (responsive design for desktop 1200px+, tablet 768-1199px, mobile <768px)
**Project Type**: Web monolith with service layer separation for future mobile support
**Performance Goals**: Dashboard load <2s (1000 transactions), Projected Monthly Spend <500ms, AI analysis <15min, API <1s (p95)
**Constraints**: WCAG 2.1 AA, 30min session timeout, Plaid daily sync, onboarding <5min, 80% test coverage for business logic
**Scale/Scope**: 10,000 concurrent users, 6 main screens, 8 user stories, 74 functional requirements, 44 non-functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Security-First Architecture
- **Status**: PASS
- **Evidence**:
  - Supabase provides AES-256 encryption at rest, TLS 1.3 in transit
  - Row Level Security (RLS) policies for database-level authorization
  - Supabase Auth handles password hashing (bcrypt), session management
  - Environment variables for all secrets (Plaid, Claude API keys)
  - Input validation through TypeScript types + Zod schema validation
  - Security headers configured via Next.js middleware (CSP, HSTS, X-Frame-Options)
  - Audit logging for transaction modifications via Supabase triggers
- **Notes**: Plaid handles bank token encryption; Claude SDK API keys stored in environment variables only

### ✅ II. Test-First Development
- **Status**: PASS (with planned approach)
- **Evidence**:
  - Unit tests for budget calculations, categorization logic, spend tracking (Vitest)
  - Integration tests for Plaid webhook handlers, transaction import flows (Vitest + MSW)
  - E2E tests for budget CRUD, categorization, AI report generation (Playwright)
  - Mock Plaid SDK responses using Mock Service Worker
  - Mock Claude SDK using test fixtures for AI analysis
  - CI/CD pipeline blocks merge if tests fail
  - 80% code coverage target for `/services` and `/lib` business logic
- **Notes**: Research task: Identify best practices for mocking Plaid webhooks and Claude streaming responses

### ✅ III. Mixed Approach to Cross-Platform Architecture
- **Status**: PASS
- **Evidence**:
  - Next.js App Router for web monolith (single deployment)
  - Business logic isolated in `/services` layer (NOT in React components)
  - Data access through Supabase client (repository pattern via service functions)
  - Clean separation: `/app` (UI) → `/services` (logic) → `/lib/supabase` (data)
  - TypeScript interfaces in `/types` define data contracts
  - Service layer becomes API when mobile needed (~1-2 weeks refactor to Next.js API routes)
- **Notes**: Future mobile: Extract services to API routes, reuse same business logic

### ✅ IV. Local Development & Testing
- **Status**: PASS
- **Evidence**:
  - Complete stack runs locally: `npm run dev` (Next.js) + Supabase local environment
  - Supabase CLI for local PostgreSQL, Auth, and database migrations
  - Mock Plaid SDK using MSW for local testing (no production Plaid calls needed)
  - Mock Claude SDK using test fixtures (no API usage during development)
  - Database migrations via Supabase CLI (reversible with `down` migrations)
  - Seed scripts for realistic test data (users, transactions, budgets)
  - No production dependencies for core development (Supabase local, mocked APIs)
- **Notes**: Research task: Document Supabase local setup and migration workflow

### ✅ V. User-Centric Design
- **Status**: PASS
- **Evidence**:
  - Onboarding flow designed for <5 minutes to first insight (FR-001 to FR-007)
  - Clear error messages with actionable guidance (e.g., "Bank connection needs attention - Reconnect")
  - Core workflows: income tracking via Plaid, expense categorization (one-click), goal setting, AI insights
  - Responsive design: Desktop (1200px+), Tablet (768-1199px), Mobile (<768px) with bottom nav
  - Immediate loading states and visual feedback for all actions
  - Onboarding guides user to first successful action within 2 minutes (bank connection or manual budget)
  - WCAG 2.1 AA: keyboard navigation, 4.5:1 contrast, text labels (no icons), screen reader support
- **Notes**: All budget status uses color + text labels (not color alone)

**Overall Constitution Check**: ✅ PASS - All 5 principles satisfied. Proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-budget-app/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - Technology decisions and patterns
├── data-model.md        # Phase 1 output - Entities, relationships, validation
├── quickstart.md        # Phase 1 output - Local development setup
├── contracts/           # Phase 1 output - API contracts and schemas
│   ├── api-spec.yaml   # OpenAPI specification for future API routes
│   └── types.ts        # TypeScript interfaces for data contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
budget_app/
├── app/                          # Next.js App Router (UI layer)
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── reset-password/
│   ├── (dashboard)/
│   │   ├── layout.tsx           # 3-column grid layout (sidebar, main, alerts)
│   │   ├── page.tsx             # Main dashboard
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── ai-insights/
│   │   ├── goals/
│   │   └── settings/
│   ├── api/                      # API routes (future mobile support)
│   │   ├── plaid/
│   │   │   └── webhook/         # Plaid transaction webhooks
│   │   └── ai/
│   │       ├── weekly-analysis/ # Trigger weekly AI check-in
│   │       └── monthly-report/  # Trigger monthly AI report
│   └── layout.tsx               # Root layout (fonts, metadata)
│
├── services/                     # Business logic layer (CORE)
│   ├── auth.service.ts          # User authentication, session management
│   ├── plaid.service.ts         # Plaid integration (connect, sync, webhooks)
│   ├── transaction.service.ts   # Transaction CRUD, categorization, tagging
│   ├── budget.service.ts        # Budget CRUD, spend tracking, alerts
│   ├── ai.service.ts            # Claude SDK integration for analysis
│   └── notification.service.ts  # Email notifications (Resend or similar)
│
├── lib/                          # Data access and utilities
│   ├── supabase/
│   │   ├── client.ts            # Supabase client initialization
│   │   ├── server.ts            # Server-side Supabase client
│   │   └── migrations/          # Database migration files
│   ├── plaid/
│   │   └── client.ts            # Plaid SDK client initialization
│   ├── claude/
│   │   └── client.ts            # Claude SDK client initialization
│   └── utils/
│       ├── validation.ts        # Zod schemas for input validation
│       └── formatting.ts        # Date, currency formatting
│
├── types/                        # TypeScript interfaces (data contracts)
│   ├── database.types.ts        # Generated from Supabase schema
│   ├── plaid.types.ts           # Plaid API response types
│   ├── ai.types.ts              # AI analysis request/response types
│   └── index.ts                 # Consolidated exports
│
├── components/                   # Reusable React components
│   ├── ui/                      # Base UI components (buttons, inputs, cards)
│   ├── budget/                  # Budget-specific components (progress bars)
│   ├── transaction/             # Transaction list, filters, quick actions
│   └── ai/                      # AI recommendation cards, feedback buttons
│
├── tests/
│   ├── unit/                    # Unit tests for services and utilities
│   │   ├── budget.service.test.ts
│   │   ├── transaction.service.test.ts
│   │   └── ai.service.test.ts
│   ├── integration/             # Integration tests for Plaid/Claude flows
│   │   ├── plaid-webhook.test.ts
│   │   └── ai-analysis.test.ts
│   ├── e2e/                     # Playwright E2E tests
│   │   ├── onboarding.spec.ts
│   │   ├── budget-crud.spec.ts
│   │   └── categorization.spec.ts
│   ├── mocks/                   # MSW handlers for Plaid/Claude
│   │   ├── plaid.handlers.ts
│   │   └── claude.handlers.ts
│   └── fixtures/                # Test data fixtures
│       ├── transactions.json
│       ├── budgets.json
│       └── ai-reports.json
│
├── supabase/                     # Supabase configuration
│   ├── migrations/              # SQL migration files
│   ├── seed.sql                 # Seed data for local development
│   └── config.toml              # Supabase local config
│
├── public/                       # Static assets
├── .env.local.example           # Environment variable template
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── next.config.js
```

**Structure Decision**: Web monolith pattern selected based on constitution principle III (Mixed Approach to Cross-Platform Architecture). Current priority is web-only; mobile support is medium priority. Clean `/services` layer enables future API extraction in ~1-2 weeks when mobile is needed. Supabase provides both backend infrastructure (PostgreSQL, Auth, Storage) and real-time capabilities, eliminating need for separate backend project.

### Architecture Layers

The application follows a strict 4-layer architecture pattern to maintain clean separation between client/server boundaries:

```
┌─────────────────────────────────────────────────────────────┐
│ Client Components (app/**/*.tsx with 'use client')         │
│ - React state, forms, interactivity                        │
│ - CANNOT import services directly (Next.js restriction)    │
└────────────────────────┬────────────────────────────────────┘
                         │ calls via 'use server' functions
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Server Actions Layer (app/actions/*.ts with 'use server')  │
│ - Thin wrappers around service functions                   │
│ - Bridge client/server boundary                            │
│ - NO business logic (pass-through only)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ calls
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Service Layer (services/*.ts - NO directives)              │
│ - Business logic, calculations, workflows                  │
│ - Server-side only (uses server.ts Supabase client)        │
│ - Source of truth for all business rules                   │
└────────────────────────┬────────────────────────────────────┘
                         │ calls
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Data Layer (lib/supabase/server.ts)                        │
│ - Database access via Supabase client                      │
│ - Uses next/headers for cookies (server-only)              │
└─────────────────────────────────────────────────────────────┘
```

**Key Architectural Rules**:
1. **Client Components** → MUST use Server Actions, CANNOT import services directly
2. **Server Actions** → MUST be thin wrappers (no business logic), import from services only
3. **Services** → Business logic source of truth, server-side only
4. **Data Layer** → Database access, server-side only

**Server Actions Layer Structure**:
```text
app/actions/
├── auth.ts              # Auth server actions (wraps auth.service)
├── budget.ts            # Budget server actions (wraps budget.service)
├── transaction.ts       # Transaction server actions (wraps transaction.service)
└── plaid.ts             # Plaid server actions (wraps plaid.service)
```

**Why Server Actions**:
- Next.js 14 enforces strict client/server boundaries
- Client components cannot import code using `next/headers` (like Supabase server client)
- Server Actions ('use server') bridge this boundary with type safety
- Maintains clean architecture: UI → Actions → Services → Data

**Rationale**: This prevents "You're importing a component that needs next/headers" errors and maintains clean separation between UI, transport, business logic, and data access layers.

### Next.js Routing Patterns

**Route Groups (folders in parentheses)**:

Route groups `(name)` do NOT create URL segments. They are for organization and layout sharing only.

**Examples**:
```text
app/
  (dashboard)/          ← Route group (NO URL segment)
    page.tsx            → Maps to / (root)
    dashboard/          ← Creates /dashboard URL segment
      page.tsx          → Maps to /dashboard ✅
    settings/
      page.tsx          → Maps to /settings ✅
```

**Common Mistake**:
```text
app/
  page.tsx              → / (landing page)
  (dashboard)/
    page.tsx            → / (CONFLICT - also maps to root) ❌
```

**Correct Pattern for /dashboard Route**:
```text
app/
  page.tsx                      → / (landing page)
  (dashboard)/                  ← Layout wrapper, no URL
    layout.tsx                  → Applies to /dashboard/*
    dashboard/                  ← Creates URL segment
      page.tsx                  → /dashboard ✅
```

**Rationale**: Understanding route groups prevents 404 errors and routing confusion. Route groups are for layout sharing and organization, not URL structure.

## Coding Standards

### Import/Export Patterns

**UI Components** (components/**/*.tsx):
- MUST use named exports: `export function Button({ ... }) { ... }`
- NEVER use default exports for UI components
- Enables multi-export pattern (e.g., Card, CardHeader, CardContent)
- Better tree-shaking and IDE auto-complete

**Correct Usage**:
```typescript
// Component file
export function Button({ children, ...props }: ButtonProps) { ... }

// Consumer file
import { Button } from '@/components/ui/Button';  // ✅ Named import
```

**Incorrect Usage**:
```typescript
// Component file
export default function Button({ ... }) { ... }  // ❌ Default export

// Consumer file
import Button from '@/components/ui/Button';     // ❌ Default import
```

**Pages** (app/**/**/page.tsx):
- MUST use default exports: `export default function PageName() { ... }`
- Required by Next.js App Router convention

**Rationale**: Prevents "does not contain a default export" errors and React component rendering failures.

---

### Async/Await Patterns

**Supabase Client Creation**:
- `createClient()` from lib/supabase/server.ts is ASYNC
- MUST always use `await`: `const supabase = await createClient()`
- Forgetting `await` causes "supabase.from is not a function" errors

**Service Function Pattern**:
```typescript
// ✅ Correct
export async function myServiceFunction(userId: string): Promise<Result> {
  try {
    const supabase = await createClient();  // ⚠️ MUST have await

    const { data, error } = await supabase
      .from('my_table')
      .select('*')
      .eq('user_id', userId);

    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error: any) {
    console.error('Error in myServiceFunction:', error);
    return { data: null, error: error.message };
  }
}
```

**Common Mistakes**:
```typescript
// ❌ Wrong - missing await
const supabase = createClient();  // Returns Promise, not client

// ❌ Wrong - no error handling
export async function myFunction() {
  const supabase = await createClient();
  const { data } = await supabase.from('table').select();
  return data;  // No error handling
}
```

**Rationale**: Prevents runtime "is not a function" errors and ensures proper error handling.

---

### Session Type Patterns

**Service Layer Returns**:
- `getSession()` returns `User | null` (flat structure)
- NOT `{ session: { user: User } }` (nested structure)

**Correct Usage**:
```typescript
// ✅ Correct
const session = await getSessionAction();
if (session) {
  const userId = session.id;
  const email = session.email;
}
```

**Incorrect Usage**:
```typescript
// ❌ Wrong - session.session doesn't exist
const session = await getSessionAction();
if (session.session?.user) {
  const userId = session.session.user.id;
}
```

**Rationale**: Prevents "Cannot read properties of undefined" errors. Session is returned directly as User object, not nested.

---

### React Hook Patterns

**Side Effects**:
- Use `useEffect` for async data fetching, NOT `useState` initializer
- `useState` initializer runs synchronously, cannot be async

**Correct Pattern**:
```typescript
// ✅ Correct
const [data, setData] = useState<Data | null>(null);

useEffect(() => {
  async function fetchData() {
    const result = await myServerAction();
    setData(result);
  }
  fetchData();
}, []);  // Dependency array
```

**Incorrect Pattern**:
```typescript
// ❌ Wrong - async code in useState initializer
const [data, setData] = useState<Data | null>(() => {
  async function fetchData() {
    const result = await myServerAction();
    setData(result);
  }
  fetchData();
  return null;
});
```

**Rationale**: Prevents React hook misuse and runtime errors. useState initializer must be synchronous.

## Dependency Management

### Required UI Dependencies

The following dependencies are REQUIRED for UI components to function:

**Core UI Utilities**:
- `clsx` (^2.1.1) - Conditional className construction
- `tailwind-merge` (^3.3.1) - Tailwind CSS class merging with conflict resolution

**Verification Checklist**:
- After creating any file with `import` statements, run `npm install` to verify packages exist
- Before marking task complete, run `npm run build` to catch missing dependencies
- Document required packages in file header comments for complex utilities

**Example** (lib/utils/cn.ts):
```typescript
/**
 * Class Name Utility
 *
 * Required packages:
 * - clsx: npm install clsx
 * - tailwind-merge: npm install tailwind-merge
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
```

**Rationale**: Prevents "Module not found" errors during development by establishing clear dependency documentation patterns.

## Implementation Validation Standards

### Before Marking Task Complete

Every task marked as complete MUST pass these validation checks:

**1. Implementation Verification**:
- File exists at path specified in task
- All functions/components from specification are implemented
- Function signatures match specification (parameters, return types)
- Business logic implements specification requirements (not partial)
- Error handling present (try/catch blocks)
- Loading states implemented (for async operations)

**2. Code Quality Verification**:
- All imports resolve correctly (no "module not found")
- Import/export patterns match (named vs default)
- All async functions use `await` on async calls
- Session types used correctly (`User | null`, not nested)
- TypeScript compilation succeeds (`npm run build`)
- ESLint passes (`npm run lint`)

**3. Integration Verification**:
- Component/function works with existing code
- Page renders without console errors (`npm run dev`)
- User flow completes successfully (manual test)
- Database operations succeed (if applicable)
- API calls succeed (if applicable)

**4. Documentation Verification**:
- tasks.md updated with [x] immediately after completion
- Complex code has inline comments explaining "why"
- New dependencies documented in package.json
- Breaking changes documented in commit message

**Validation Frequency**:
- After EACH task (not batch validation)
- Before marking task complete in tasks.md
- Before committing code
- Before requesting code review

**Rationale**: Systematic validation prevents incomplete implementations, catches integration issues early, and maintains alignment between tasks.md and reality.

## Phase 0: Research & Technology Decisions

**Objective**: Resolve all NEEDS CLARIFICATION items and document technology choices.

### Research Tasks

1. **Supabase + Next.js Integration Patterns**
   - Decision: How to structure Supabase client for server components vs client components
   - Research: Next.js App Router best practices with Supabase Auth
   - Output: Document client initialization patterns in research.md

2. **Plaid SDK Integration & Webhooks**
   - Decision: Plaid Link flow for bank connection + webhook handling for daily sync
   - Research: Plaid Transactions API fields (already gathered from web search)
   - Output: Document Plaid integration architecture and webhook security

3. **Claude SDK for AI Analysis**
   - Decision: Prompt engineering for weekly/monthly analysis, streaming vs single response
   - Research: Best practices for financial analysis prompts with context limits
   - Output: Document AI analysis architecture and prompt templates

4. **Testing Strategy for External APIs**
   - Decision: MSW for Plaid/Claude mocking vs SDK-specific mocks
   - Research: Best practices for testing Plaid webhooks and Claude streaming
   - Output: Document testing approach and mock structure

5. **Supabase Local Development Setup**
   - Decision: Supabase CLI vs Docker Compose for local PostgreSQL
   - Research: Migration workflow, seed data strategy, RLS policy testing
   - Output: Document local setup steps and migration best practices

6. **Transaction Categorization Approach**
   - Decision: Use Plaid's `personal_finance_category` for initial categorization
   - Research: Accuracy of Plaid categorization, customization options via user overrides
   - Output: Document categorization logic and manual override workflow

### Research Output

**File**: `specs/001-ai-budget-app/research.md`

**Structure**:
```markdown
# Research: AI-Powered Budget App Technology Decisions

## 1. Supabase + Next.js Integration
- **Decision**: [chosen approach]
- **Rationale**: [why chosen]
- **Alternatives Considered**: [what else evaluated]
- **References**: [documentation links]

## 2. Plaid SDK Integration
[same structure]

## 3. Claude SDK for AI Analysis
[same structure]

## 4. Testing Strategy
[same structure]

## 5. Local Development Setup
[same structure]

## 6. Transaction Categorization
[same structure]
```

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete

### 1. Data Model Design

**File**: `specs/001-ai-budget-app/data-model.md`

**Entities to Design** (from spec.md Key Entities):

1. **User**
   - Fields: id, email (unique), created_at, preferences_text, notification_settings
   - Relationships: has many Bank Connections, Transactions, Budgets, Goals, AI Reports
   - Validation: Email format, unique constraint
   - Notes: Supabase Auth handles password hashing

2. **Bank Connection**
   - Fields: id, user_id, plaid_access_token (encrypted), plaid_item_id, institution_name, account_type, connection_status, last_sync_date
   - Relationships: belongs to User, has many Transactions
   - Validation: Plaid token encryption, status enum (active/needs_reauth/error)
   - Notes: Plaid access tokens stored encrypted in Supabase Vault

3. **Transaction** (Plaid-sourced fields)
   - Fields: id, user_id, bank_connection_id, plaid_transaction_id (unique), merchant_name, amount, date, authorized_date, pending, payment_channel, category_primary, category_detailed, user_category_override, tags (non_negotiable, ignored), notes, location (JSON), iso_currency_code, original_description
   - Relationships: belongs to User, belongs to Bank Connection
   - Validation: Amount numeric, date format, category enum, deduplication by plaid_transaction_id
   - Notes: Store Plaid's `personal_finance_category.primary` and `personal_finance_category.detailed` separately

4. **Budget**
   - Fields: id, user_id, month, year, total_budget, created_at, updated_at
   - Relationships: belongs to User, has many Budget Categories
   - Validation: Unique per user per month/year
   - Notes: Total budget calculated from sum of category budgets

5. **Budget Category**
   - Fields: id, budget_id, category_name, budgeted_amount, spent_amount (calculated), percentage_used (calculated)
   - Relationships: belongs to Budget
   - Validation: Category enum matches transaction categories, budgeted_amount > 0
   - Notes: Spent amount calculated from transactions, not stored

6. **Goal**
   - Fields: id, user_id, name, goal_type (savings/spending_limit/debt_payoff), target_amount, target_date, current_progress (calculated), priority (high/medium/low), status (active/paused/completed), created_at
   - Relationships: belongs to User
   - Validation: Target amount > 0, target date future, status enum
   - Notes: Current progress calculated based on goal type

7. **AI Analysis Report**
   - Fields: id, user_id, report_type (weekly/monthly), generation_date, analysis_period_start, analysis_period_end, trajectory_prediction (JSON), recommendations (JSON array), confidence_level
   - Relationships: belongs to User
   - Validation: Report type enum, confidence 0-100
   - Notes: Recommendations stored as JSONB with structure defined in types.ts

8. **Recommendation Feedback**
   - Fields: id, user_id, ai_report_id, recommendation_id, feedback_type (helpful/not_helpful/dismissed), created_at
   - Relationships: belongs to User, belongs to AI Report
   - Validation: Feedback type enum
   - Notes: Used to improve future AI recommendations

### 2. API Contracts

**Directory**: `specs/001-ai-budget-app/contracts/`

**Files to Create**:

1. **`types.ts`** - TypeScript interfaces for all data contracts
   ```typescript
   // User types
   export interface User { ... }

   // Transaction types (matching Plaid structure)
   export interface PlaidTransaction { ... }
   export interface Transaction { ... }

   // Budget types
   export interface Budget { ... }
   export interface BudgetCategory { ... }

   // AI types
   export interface WeeklyAnalysisRequest { ... }
   export interface WeeklyAnalysisResponse { ... }
   export interface MonthlyReportRequest { ... }
   export interface MonthlyReportResponse { ... }
   export interface Recommendation { ... }
   ```

2. **`api-spec.yaml`** - OpenAPI specification for future API routes
   - Endpoints: `/api/plaid/webhook`, `/api/ai/weekly-analysis`, `/api/ai/monthly-report`
   - Authentication: Bearer token (Supabase JWT)
   - Request/response schemas matching types.ts

### 3. Quickstart Guide

**File**: `specs/001-ai-budget-app/quickstart.md`

**Content**:
```markdown
# Local Development Quickstart

## Prerequisites
- Node.js 18+
- Supabase CLI
- Plaid Sandbox account
- Anthropic API key

## Setup Steps
1. Install dependencies: `npm install`
2. Start Supabase local: `supabase start`
3. Copy environment variables: `cp .env.local.example .env.local`
4. Run migrations: `supabase db reset`
5. Seed test data: `npm run seed`
6. Start dev server: `npm run dev`

## Running Tests
- Unit tests: `npm run test:unit`
- Integration tests: `npm run test:integration`
- E2E tests: `npm run test:e2e`

## Mock APIs
- Plaid: MSW handlers in `/tests/mocks/plaid.handlers.ts`
- Claude: Test fixtures in `/tests/fixtures/ai-reports.json`
```

### 4. Agent Context Update

**Action**: Run `.specify/scripts/bash/update-agent-context.sh claude`

**Effect**: Adds Next.js, Supabase, Plaid SDK, Claude SDK to agent-specific context file

## Phase 1 Complete: Re-evaluate Constitution Check

After Phase 1 design artifacts are generated, re-run constitution check to ensure:

1. **Security-First Architecture**: RLS policies defined, encryption documented
2. **Test-First Development**: Test structure created, mocking strategy documented
3. **Cross-Platform Architecture**: Service layer separation maintained
4. **Local Development**: Quickstart guide enables full local development
5. **User-Centric Design**: Data model supports all user workflows from spec

**Expected Result**: All 5 principles still PASS. If violations found, document in Complexity Tracking.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None identified | N/A | N/A |

**Note**: If violations emerge during Phase 1 design, they will be documented here with justification.

---

## Phase 1 Design Complete: Post-Design Constitution Re-Evaluation

**Date**: 2025-10-23

After completing Phase 0 (research.md) and Phase 1 design artifacts (data-model.md, contracts/, quickstart.md), re-running constitution check:

### ✅ I. Security-First Architecture
- **Status**: PASS
- **Post-Design Evidence**:
  - RLS policies defined in data-model.md for all 9 tables
  - Encryption documented: plaid_access_token uses Supabase Vault (pgsodium)
  - Audit logging implemented via PostgreSQL triggers
  - API spec (api-spec.yaml) enforces Bearer token auth on all endpoints
  - Input validation schemas defined in types.ts
- **Conclusion**: Security architecture maintained throughout design

### ✅ II. Test-First Development
- **Status**: PASS
- **Post-Design Evidence**:
  - Test structure created in quickstart.md (unit, integration, E2E)
  - Mocking strategy documented in research.md (MSW for Plaid/Claude)
  - Test fixtures defined in quickstart.md
  - Coverage target: 80% for `/services` and `/lib`
- **Conclusion**: Testing infrastructure supports test-first development

### ✅ III. Mixed Approach to Cross-Platform Architecture
- **Status**: PASS
- **Post-Design Evidence**:
  - Service layer separation maintained in data-model.md and project structure
  - Business logic isolated in `/services` (not in UI components)
  - Data access through Supabase client (repository pattern)
  - Clean separation: `/app` (UI) → `/services` (logic) → `/lib/supabase` (data)
  - TypeScript interfaces in `/types` define data contracts (contracts/types.ts)
- **Conclusion**: Architecture supports future mobile API extraction

### ✅ IV. Local Development & Testing
- **Status**: PASS
- **Post-Design Evidence**:
  - Quickstart.md enables full local development in 5 steps (~15 min)
  - Supabase local environment via CLI (no production dependencies)
  - Database migrations documented with reversible workflow
  - Seed scripts defined in quickstart.md (3 test users with realistic data)
  - Mock Plaid and Claude SDK via MSW (no production API calls)
- **Conclusion**: Complete local development stack operational

### ✅ V. User-Centric Design
- **Status**: PASS
- **Post-Design Evidence**:
  - Data model supports all user workflows from spec.md
  - Onboarding flow supported: user preferences, bank connections, budgets
  - WCAG 2.1 AA features documented (RLS ensures data access, color + text labels)
  - Error messages defined in API spec (clear, actionable)
  - Dashboard data structure optimized for quick insights (DashboardData type)
- **Conclusion**: Data model and API design support user-centric requirements

**Overall Re-Evaluation**: ✅ ALL 5 PRINCIPLES PASS - No violations identified during Phase 1 design.

**Next Step**: Proceed to Phase 2 (/speckit.tasks) to generate implementation tasks.

---

## Planning Phase Complete

**Summary**:
- ✅ Phase 0: Research completed (research.md with 6 technology decisions)
- ✅ Phase 1: Design completed (data-model.md, contracts/, quickstart.md)
- ✅ Agent context updated (CLAUDE.md)
- ✅ Constitution check re-evaluated (all principles PASS)

**Generated Artifacts**:
- [plan.md](plan.md) - This file (implementation plan)
- [research.md](research.md) - Technology decisions and best practices
- [data-model.md](data-model.md) - Complete database schema with Plaid transaction structure
- [contracts/types.ts](contracts/types.ts) - TypeScript data contracts
- [contracts/api-spec.yaml](contracts/api-spec.yaml) - OpenAPI specification
- [quickstart.md](quickstart.md) - Local development guide

**Ready for Implementation**: Use `/speckit.tasks` to generate actionable implementation tasks from this plan.
