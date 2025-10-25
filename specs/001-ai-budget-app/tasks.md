---
description: "Implementation tasks for AI-Powered Proactive Budget App"
---

# Tasks: AI-Powered Proactive Budget App

**Input**: Design documents from `/specs/001-ai-budget-app/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED per constitution principle II (Test-First Development). Tests MUST be written FIRST and FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Next.js App Router structure: `app/`, `services/`, `lib/`, `types/`, `components/`, `tests/`
- All paths are absolute from repository root: `C:/Users/mario/apps/budget_app/budget_app/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Next.js 14 project with TypeScript 5.3+ using `npx create-next-app@latest budget_app --typescript --app --tailwind`
- [x] T002 [P] Install core dependencies in `package.json`: `@supabase/supabase-js`, `plaid`, `@anthropic-ai/sdk`, `zod`, `vitest`, `@playwright/test`, `msw`
- [x] T003 [P] Configure TypeScript in `tsconfig.json` with strict mode, path aliases (`@/` → `./`, `@/types` → `./types`)
- [x] T004 [P] Configure ESLint and Prettier in `.eslintrc.json` and `.prettierrc`
- [x] T005 [P] Setup Vitest config in `vitest.config.ts` with coverage settings (80% target for services/lib)
- [x] T006 [P] Setup Playwright config in `playwright.config.ts` for E2E tests (chromium, firefox, webkit)
- [x] T007 Create `.env.local.example` with all required environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, PLAID_CLIENT_ID, PLAID_SECRET, ANTHROPIC_API_KEY, NEXT_PUBLIC_APP_URL)
- [x] T008 [P] Create project directory structure: `app/`, `services/`, `lib/`, `types/`, `components/`, `tests/`, `supabase/`
- [x] T009 [P] Setup Git repository and `.gitignore` (exclude `.env.local`, `node_modules/`, `.next/`)

**Checkpoint**: Project structure ready - foundational infrastructure can now be implemented

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**Critical**: No user story work can begin until this phase is complete

### Database & Migrations

- [x] T010 Initialize Supabase local environment using `supabase init` in `supabase/` directory
- [x] T011 Create initial database migration in `supabase/migrations/20251023000000_initial_schema.sql` with all 9 tables (users handled by Supabase Auth, user_preferences, bank_connections, transactions, budgets, budget_categories, goals, ai_analysis_reports, recommendation_feedback)
- [x] T012 Add database indexes to migration file for performance (user_id, date, plaid_transaction_id, category fields)
- [x] T013 Add Row Level Security (RLS) policies to migration file for all tables (users can only access their own data using auth.uid())
- [x] T014 Add database constraints to migration file (check tags mutually exclusive, budget amounts > 0, enum validations)
- [x] T015 Add database triggers to migration file for updated_at timestamps and audit logging
- [x] T016 Enable pgsodium extension in migration file for encrypting plaid_access_token field in bank_connections table
- [x] T017 Create seed data file in `supabase/seed.sql` with 3 test users, bank connections, 30-90 days of transactions, budgets, goals, and sample AI reports
- [x] T018 Test migration by running `supabase db reset` to verify schema creation and seed data

### Type Definitions

- [x] T019 [P] Generate Supabase database types in `types/database.types.ts` using `supabase gen types typescript`
- [x] T020 [P] Create Plaid types in `types/plaid.types.ts` (PlaidTransaction, PlaidLinkSuccess, PlaidWebhookPayload)
- [x] T021 [P] Create AI types in `types/ai.types.ts` (WeeklyAnalysisRequest, WeeklyAnalysisResponse, MonthlyReportRequest, MonthlyReportResponse, Recommendation, TrajectoryPrediction)
- [x] T022 [P] Create app domain types in `types/index.ts` (User, Transaction, Budget, BudgetCategory, Goal, AIAnalysisReport, RecommendationFeedback, DashboardData)

### Client Initialization

- [x] T023 [P] Create Supabase client for client components in `lib/supabase/client.ts` using `createClientComponentClient`
- [x] T024 [P] Create Supabase client for server components in `lib/supabase/server.ts` using `createServerComponentClient` with cookies
- [x] T025 [P] Create Plaid client in `lib/plaid/client.ts` with environment-based configuration (sandbox for dev, production for prod)
- [x] T026 [P] Create Claude SDK client in `lib/claude/client.ts` with API key from environment variables

### Validation & Utilities

- [x] T027 [P] Create Zod validation schemas in `lib/utils/validation.ts` (email, password, transaction, budget, goal schemas)
- [x] T028 [P] Create formatting utilities in `lib/utils/formatting.ts` (formatCurrency, formatDate, formatPercentage functions)

### Authentication Setup

- [x] T029 Implement auth service in `services/auth.service.ts` (signUp, signIn, signOut, resetPassword, getSession functions using Supabase Auth)
- [x] T030 Create auth middleware in `app/middleware.ts` to protect dashboard routes and redirect unauthenticated users to login

### Base UI Components

- [x] T031 [P] Create base Button component in `components/ui/Button.tsx` with variants (primary, secondary, destructive)
- [x] T032 [P] Create base Input component in `components/ui/Input.tsx` with label, error state, and validation
- [x] T033 [P] Create base Card component in `components/ui/Card.tsx` for content containers
- [x] T034 [P] Create ProgressBar component in `components/ui/ProgressBar.tsx` with color-coded indicators (green < 80%, yellow 80-100%, red > 100%)
- [x] T035 [P] Create Loading component in `components/ui/Loading.tsx` for async operations

### Test Infrastructure

- [x] T036 [P] Create MSW handlers for Plaid API in `tests/mocks/plaid.handlers.ts` (mock transaction sync, link token creation, webhook responses)
- [x] T037 [P] Create MSW handlers for Claude SDK in `tests/mocks/claude.handlers.ts` (mock AI analysis responses)
- [x] T038 [P] Create test fixtures for transactions in `tests/fixtures/transactions.json` (30 realistic transactions with various categories)
- [x] T039 [P] Create test fixtures for budgets in `tests/fixtures/budgets.json` (3 months of budget data)
- [x] T040 [P] Create test fixtures for AI reports in `tests/fixtures/ai-reports.json` (sample weekly and monthly reports)
- [x] T041 Setup MSW server in `tests/setup.ts` to intercept API calls during tests
- [x] T042 Create test utilities in `tests/utils/test-helpers.ts` (createTestUser, createTestTransaction, createTestBudget helpers)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Onboarding and First Budget Setup (Priority: P1) - MVP

**Goal**: Enable new users to create account, connect bank via Plaid, auto-categorize transactions, and create first budget within 5 minutes

**Independent Test**: Create new account, connect bank (or skip), verify transactions imported and categorized, budget created with suggestions

### Tests for User Story 1 (Write FIRST - ensure they FAIL before implementation)

- [x] T043 [P] [US1] Unit test for signUp function in `tests/unit/auth.service.test.ts` (valid email/password, duplicate email, weak password cases)
- [x] T044 [P] [US1] Unit test for Plaid link token creation in `tests/unit/plaid.service.test.ts`
- [x] T045 [P] [US1] Unit test for transaction import and categorization in `tests/unit/transaction.service.test.ts` (30 days import, deduplication, auto-categorization)
- [x] T046 [P] [US1] Unit test for budget suggestion logic in `tests/unit/budget.service.test.ts` (calculate average spending per category)
- [x] T047 [P] [US1] Integration test for onboarding flow in `tests/integration/onboarding.test.ts` (signup → Plaid connect → transaction import → budget creation)
- [x] T048 [US1] E2E test for complete onboarding in `tests/e2e/onboarding.spec.ts` (signup form → Plaid Link UI → dashboard with budget in < 5 min)

### Implementation for User Story 1

#### Authentication & Onboarding UI

- [x] T049 [P] [US1] Create signup page in `app/(auth)/signup/page.tsx` with email/password form and validation
- [x] T050 [P] [US1] Create login page in `app/(auth)/login/page.tsx` with email/password form and "Forgot password" link
- [x] T051 [P] [US1] Create password reset page in `app/(auth)/reset-password/page.tsx`
- [x] T052 [US1] Create onboarding layout in `app/(auth)/onboarding/layout.tsx` with multi-step progress indicator

#### Plaid Integration

- [x] T053 [US1] Implement Plaid service in `services/plaid.service.ts` (createLinkToken, exchangePublicToken, syncTransactions, handleWebhook functions)
- [x] T054 [US1] Create Plaid Link component in `components/plaid/PlaidLink.tsx` using Plaid Link SDK for bank connection UI
- [x] T055 [US1] Create bank connection step in `app/(auth)/onboarding/connect-bank/page.tsx` with Plaid Link component and "Skip for now" option
- [x] T056 [US1] Create Plaid webhook endpoint in `app/api/plaid/webhook/route.ts` to handle transaction updates (verify webhook signature, process TRANSACTIONS_UPDATE events)

#### Transaction Management

- [x] T057 [US1] Implement transaction service in `services/transaction.service.ts` (importTransactions, categorizeTransaction, getTransactionsByUser, updateCategory, addTag functions)
- [x] T058 [US1] Create transaction categorization logic in `services/transaction.service.ts` (map Plaid personal_finance_category to app categories, learn from user overrides)
- [x] T059 [US1] Create transaction list component in `components/transaction/TransactionList.tsx` with merchant, amount, category, date display

#### Budget Setup

- [x] T060 [US1] Implement budget service in `services/budget.service.ts` (createBudget, getBudgetByMonth, updateBudgetCategory, suggestBudgetAmounts, calculateSpending functions)
- [x] T061 [US1] Create budget suggestion logic in `services/budget.service.ts` (calculate average spending per category from last 30 days)
- [x] T062 [US1] Create budget setup step in `app/(auth)/onboarding/setup-budget/page.tsx` with suggested amounts and manual override inputs
- [x] T063 [US1] Create budget category input component in `components/budget/BudgetCategoryInput.tsx` with category name, suggested amount, and user input

#### Dashboard (Basic Version for Onboarding)

- [x] T064 [US1] Create dashboard layout in `app/(dashboard)/layout.tsx` with 3-column grid (left sidebar nav, main content, right alerts panel)
- [x] T065 [US1] Create dashboard page in `app/(dashboard)/page.tsx` showing welcome message, recent transactions, and budget summary
- [x] T066 [US1] Create sidebar navigation in `components/layout/Sidebar.tsx` with links to Dashboard, Transactions, Budgets, AI Insights, Goals, Settings

**Checkpoint**: User Story 1 complete - users can sign up, connect bank, see categorized transactions, and create first budget within 5 minutes

---

## Phase 4: User Story 2 - Transaction Management and Categorization (Priority: P1)

**Goal**: Enable users to view, recategorize, tag transactions (non-negotiable/ignored), search and filter, with AI learning from patterns

**Independent Test**: View transactions, recategorize multiple times, tag as non-negotiable/ignored, verify budget tracking updates, search/filter by category and date

### Tests for User Story 2 (Write FIRST - ensure they FAIL before implementation)

- [x] T067 [P] [US2] Unit test for recategorization in `tests/unit/transaction.service.test.ts` (update category, verify budget recalculation)
- [x] T068 [P] [US2] Unit test for tagging logic in `tests/unit/transaction.service.test.ts` (non-negotiable, ignored, mutual exclusivity)
- [x] T069 [P] [US2] Unit test for pattern learning in `tests/unit/transaction.service.test.ts` (detect merchant patterns, suggest auto-categorization)
- [x] T070 [P] [US2] Unit test for search and filter in `tests/unit/transaction.service.test.ts` (filter by date, category, merchant, amount)
- [x] T071 [US2] Integration test for transaction management flow in `tests/integration/transaction-management.test.ts` (recategorize → budget updates → tag → excluded from budget)
- [x] T072 [US2] E2E test for transaction actions in `tests/e2e/transaction-management.spec.ts` (recategorize from dashboard, tag, search, verify UI updates)

### Implementation for User Story 2

#### Transaction UI Enhancements

- [x] T073 [US2] Create full transactions page in `app/(dashboard)/transactions/page.tsx` with list, filters, search, and quick actions
- [x] T074 [US2] Create transaction card component in `components/transaction/TransactionCard.tsx` with merchant, amount, category badge, date, and action buttons
- [x] T075 [US2] Create transaction filters component in `components/transaction/TransactionFilters.tsx` with date range, category, merchant, amount filters
- [x] T076 [US2] Create transaction search component in `components/transaction/TransactionSearch.tsx` with merchant name search
- [x] T077 [US2] Create category selector component in `components/transaction/CategorySelector.tsx` for recategorization dropdown

#### Transaction Actions

- [x] T078 [US2] Add recategorization functionality to transaction service in `services/transaction.service.ts` (updateCategory function with budget recalculation trigger)
- [x] T079 [US2] Add tagging functionality to transaction service in `services/transaction.service.ts` (addTag function with mutual exclusivity validation)
- [x] T080 [US2] Create quick action buttons in `components/transaction/QuickActions.tsx` (Recategorize, Non-negotiable, Ignore, Add Note)
- [x] T081 [US2] Create transaction notes modal in `components/transaction/NotesModal.tsx` for adding/editing notes

#### Pattern Learning

- [ ] T082 [US2] Implement pattern detection in `services/transaction.service.ts` (detectMerchantPattern function - track merchant → category mappings)
- [ ] T083 [US2] Create pattern suggestion prompt component in `components/transaction/PatternPrompt.tsx` ("Should future transactions from [Merchant] be [Category]?")
- [ ] T084 [US2] Store learned patterns in database (create merchant_patterns table if needed, or use user_preferences JSONB field)

#### Budget Recalculation

- [ ] T085 [US2] Add real-time budget update logic in `services/budget.service.ts` (recalculateSpending function triggered on category changes)
- [ ] T086 [US2] Add budget exclusion logic in `services/budget.service.ts` (ignore transactions tagged as "ignored" in spending calculations)

**Checkpoint**: User Story 2 complete - users can manage transactions with recategorization, tagging, search/filter, and AI learns patterns

---

## Phase 5: User Story 3 - Budget Creation and Tracking (Priority: P1)

**Goal**: Enable users to create monthly budgets by category, track spending in real-time, see visual progress with warnings/alerts, create future budgets

**Independent Test**: Create budget for current month, add transactions, verify progress bars update, test warning (90%) and alert (100%) indicators, create future month budget

### Tests for User Story 3 (Write FIRST - ensure they FAIL before implementation)

- [ ] T087 [P] [US3] Unit test for budget CRUD in `tests/unit/budget.service.test.ts` (create, read, update, delete budgets)
- [ ] T088 [P] [US3] Unit test for spending calculation in `tests/unit/budget.service.test.ts` (sum transactions by category, exclude ignored)
- [ ] T089 [P] [US3] Unit test for percentage calculation in `tests/unit/budget.service.test.ts` (spent / budgeted * 100, color indicators)
- [ ] T090 [P] [US3] Unit test for future budget creation in `tests/unit/budget.service.test.ts` (copy from last month, use 3-month average, custom amounts)
- [ ] T091 [US3] Integration test for budget tracking in `tests/integration/budget-tracking.test.ts` (create budget → add transaction → verify progress updates)
- [ ] T092 [US3] E2E test for budget management in `tests/e2e/budget-management.spec.ts` (create budget, edit amounts, add transaction, see progress bar change colors)

### Implementation for User Story 3

#### Budget UI

- [ ] T093 [US3] Create budgets page in `app/(dashboard)/budgets/page.tsx` with current month overview, category breakdowns, and edit controls
- [ ] T094 [US3] Create budget overview card in `components/budget/BudgetOverview.tsx` showing total budget, total spent, percentage used, days remaining, average daily budget
- [ ] T095 [US3] Create budget category card in `components/budget/BudgetCategoryCard.tsx` with category name, budgeted amount, spent amount, progress bar with color coding
- [ ] T096 [US3] Create budget edit modal in `components/budget/BudgetEditModal.tsx` for updating category amounts
- [ ] T097 [US3] Create month selector component in `components/budget/MonthSelector.tsx` for navigating between budget months

#### Budget Logic Enhancements

- [ ] T098 [US3] Add real-time spending tracking in `services/budget.service.ts` (query transactions by month/year, filter by category, sum amounts)
- [ ] T099 [US3] Add warning/alert indicator logic in `services/budget.service.ts` (calculateStatus function returns on_track/warning/alert based on percentage)
- [ ] T100 [US3] Add budget comparison logic in `services/budget.service.ts` (compareBudgets function for month-over-month analysis)

#### Future Budget Creation

- [ ] T101 [US3] Create future budget modal in `components/budget/FutureBudgetModal.tsx` with options: copy last month, use 3-month average, custom
- [ ] T102 [US3] Implement copy budget logic in `services/budget.service.ts` (copyFromPreviousMonth function)
- [ ] T103 [US3] Implement average budget logic in `services/budget.service.ts` (calculateThreeMonthAverage function)

#### Visual Indicators

- [ ] T104 [US3] Add color-coded progress bars in `components/budget/BudgetCategoryCard.tsx` (green < 80%, yellow 80-100%, red > 100%)
- [ ] T105 [US3] Create warning badge component in `components/ui/WarningBadge.tsx` for 90%+ spending categories
- [ ] T106 [US3] Create alert badge component in `components/ui/AlertBadge.tsx` for 100%+ spending categories with "Over by $X" text

**Checkpoint**: User Story 3 complete - users can create/track budgets, see real-time progress, warnings/alerts, and plan future months

---

## Phase 6: User Story 7 - Dashboard Budget Utilization and Projection Monitoring (Priority: P2)

**Goal**: Display Current Budget Utilization and Projected Monthly Spend at a glance on dashboard with visual indicators and quick access to insights

**Dependencies**: Requires US1 (onboarding), US2 (transactions), US3 (budgets) to be complete

**Independent Test**: Login to dashboard, verify Current Budget Utilization shows correct total spent/budget/percentage, verify Projected Monthly Spend appears after 7 days of data (or "Building baseline" message for < 7 days)

### Tests for User Story 7 (Write FIRST - ensure they FAIL before implementation)

- [ ] T107 [P] [US7] Unit test for Current Budget Utilization calculation in `tests/unit/budget.service.test.ts` (sum all category budgets, sum all non-ignored spending, calculate percentage)
- [ ] T108 [P] [US7] Unit test for Projected Monthly Spend calculation in `tests/unit/ai.service.test.ts` (require 7+ days data, calculate daily average, project to month end)
- [ ] T109 [P] [US7] Unit test for insufficient data handling in `tests/unit/ai.service.test.ts` (< 7 days returns "Building baseline" message)
- [ ] T110 [US7] Integration test for dashboard data aggregation in `tests/integration/dashboard.test.ts` (fetch budget utilization, projection, alerts, recommendations in single query)
- [ ] T111 [US7] E2E test for dashboard display in `tests/e2e/dashboard.spec.ts` (verify utilization widget, projection widget, color indicators, alerts panel)

### Implementation for User Story 7

#### Dashboard Data Aggregation

- [ ] T112 [US7] Add getDashboardData function to budget service in `services/budget.service.ts` (aggregate current budget utilization, recent transactions, alerts)
- [ ] T113 [US7] Add calculateProjectedSpend function to AI service in `services/ai.service.ts` (check days of data, calculate daily average, project to month end, return confidence level)
- [ ] T114 [US7] Create dashboard data type in `types/index.ts` (DashboardData with currentUtilization, projectedSpend, alerts, recentTransactions, topRecommendations)

#### Dashboard Widgets

- [ ] T115 [US7] Create Current Budget Utilization widget in `components/dashboard/BudgetUtilizationWidget.tsx` (large display: "$3,200 / $5,000 - 64%", horizontal progress bar, color-coded)
- [ ] T116 [US7] Create Projected Monthly Spend widget in `components/dashboard/ProjectedSpendWidget.tsx` (show projection if 7+ days data, else "Building baseline", comparison to budget, confidence level)
- [ ] T117 [US7] Create spending by category widget in `components/dashboard/SpendingByCategoryWidget.tsx` (top categories with progress bars, percentages)
- [ ] T118 [US7] Create recent transactions widget in `components/dashboard/RecentTransactionsWidget.tsx` (last 10 transactions with quick action buttons)
- [ ] T119 [US7] Create alerts panel in `components/dashboard/AlertsPanel.tsx` (budget warnings, category alerts, bank connection status)

#### Dashboard Page Enhancement

- [ ] T120 [US7] Update dashboard page in `app/(dashboard)/page.tsx` to use new widgets and data aggregation
- [ ] T121 [US7] Add visual distinction between Current Budget Utilization (actual) and Projected Monthly Spend (prediction) using labels, borders, or icons
- [ ] T122 [US7] Add quick action buttons to dashboard in `components/dashboard/QuickActions.tsx` (Add Transaction, Import from Bank, Run AI Analysis)

**Checkpoint**: User Story 7 complete - dashboard displays at-a-glance budget utilization and AI projection with clear visual indicators

---

## Phase 7: User Story 4 - Weekly AI Check-ins (Priority: P2)

**Goal**: Generate weekly AI analysis every Monday with trajectory prediction, identify trending categories, provide actionable suggestions respecting non-negotiable tags and preferences

**Dependencies**: Requires US1-3 (transactions, budgets) and US7 (projection logic) to be complete

**Independent Test**: Trigger weekly analysis manually, verify trajectory prediction generated, verify suggestions respect non-negotiable transactions, verify email notification sent

### Tests for User Story 4 (Write FIRST - ensure they FAIL before implementation)

- [ ] T123 [P] [US4] Unit test for weekly analysis prompt construction in `tests/unit/ai.service.test.ts` (include transaction data, budget data, preferences, non-negotiable tags)
- [ ] T124 [P] [US4] Unit test for trajectory prediction parsing in `tests/unit/ai.service.test.ts` (extract projected total, status, likelihood from Claude response)
- [ ] T125 [P] [US4] Unit test for recommendation generation in `tests/unit/ai.service.test.ts` (parse suggestions with action, savings, implementation, effort level)
- [ ] T126 [P] [US4] Unit test for non-negotiable respect in `tests/unit/ai.service.test.ts` (verify non-negotiable categories excluded from suggestions)
- [ ] T127 [US4] Integration test for weekly analysis flow in `tests/integration/weekly-analysis.test.ts` (trigger analysis → Claude API call → parse response → save to database → send notification)
- [ ] T128 [US4] E2E test for weekly check-in in `tests/e2e/weekly-checkin.spec.ts` (trigger analysis, view report in AI Insights, verify suggestions display)

### Implementation for User Story 4

#### AI Service - Weekly Analysis

- [ ] T129 [US4] Implement generateWeeklyAnalysis function in `services/ai.service.ts` (fetch user data, construct Claude prompt, call API, parse response, save report)
- [ ] T130 [US4] Create weekly analysis prompt template in `services/ai.service.ts` (include spending by category, budget status, non-negotiable items, user preferences, trajectory question)
- [ ] T131 [US4] Implement trajectory prediction parsing in `services/ai.service.ts` (extract projected_total, difference, status, likelihood from Claude JSON response)
- [ ] T132 [US4] Implement recommendation parsing in `services/ai.service.ts` (extract action, category, expected_savings, implementation, effort_level, preferences_respected from Claude JSON response)
- [ ] T133 [US4] Add non-negotiable filter to analysis in `services/ai.service.ts` (exclude non-negotiable transactions from suggestion generation, include acknowledgment in prompt)

#### Scheduling & Triggers

- [ ] T134 [US4] Create weekly analysis API endpoint in `app/api/ai/weekly-analysis/route.ts` (trigger manual analysis, verify auth, call AI service)
- [ ] T135 [US4] Implement scheduled job for Monday morning analysis (use Vercel Cron, Next.js API route with cron expression, or external scheduler)
- [ ] T136 [US4] Add re-analysis functionality in `services/ai.service.ts` (allow users to manually trigger updated analysis)

#### Notifications

- [ ] T137 [US4] Implement notification service in `services/notification.service.ts` (sendWeeklyCheckInEmail function using email provider - Resend, SendGrid, or Supabase email)
- [ ] T138 [US4] Create email template for weekly check-in in `services/notification.service.ts` (subject: "Your Weekly Budget Check-In", body: trajectory summary, top 3 suggestions, link to full report)
- [ ] T139 [US4] Add email sending to weekly analysis flow in `services/ai.service.ts` (call notification service after report generation)

#### AI Insights UI

- [ ] T140 [US4] Create AI Insights page in `app/(dashboard)/ai-insights/page.tsx` with tabs for weekly check-ins and monthly reports
- [ ] T141 [US4] Create weekly check-in card in `components/ai/WeeklyCheckInCard.tsx` (display trajectory prediction, on-track status, likelihood percentage)
- [ ] T142 [US4] Create recommendation card in `components/ai/RecommendationCard.tsx` (action, expected savings, implementation steps, preferences respected, effort level badge)
- [ ] T143 [US4] Create trajectory widget in `components/ai/TrajectoryWidget.tsx` (projected amount vs budget, visual indicator, confidence level)

**Checkpoint**: User Story 4 complete - weekly AI check-ins run automatically, provide trajectory predictions and actionable suggestions respecting user constraints

---

## Phase 8: User Story 5 - Monthly AI Reports (Priority: P2)

**Goal**: Generate comprehensive monthly AI analysis on 1st of each month reviewing all spending, identifying highest spend categories, providing top 3-5 ranked recommendations respecting preferences

**Dependencies**: Requires US4 (weekly AI infrastructure) to be complete

**Independent Test**: Trigger monthly analysis manually, verify comprehensive spending review, verify top recommendations ranked by savings, verify non-negotiable acknowledgment, verify email notification

### Tests for User Story 5 (Write FIRST - ensure they FAIL before implementation)

- [ ] T144 [P] [US5] Unit test for monthly analysis prompt construction in `tests/unit/ai.service.test.ts` (include full month data, goals, preferences, non-negotiable categories)
- [ ] T145 [P] [US5] Unit test for recommendation ranking in `tests/unit/ai.service.test.ts` (sort by expected_savings descending, top 3-5 only)
- [ ] T146 [P] [US5] Unit test for anomaly detection in `tests/unit/ai.service.test.ts` (identify unexpected spending, suggest proactive measures)
- [ ] T147 [US5] Integration test for monthly report flow in `tests/integration/monthly-report.test.ts` (trigger analysis → Claude API call → parse comprehensive response → save report → send notification)
- [ ] T148 [US5] E2E test for monthly report in `tests/e2e/monthly-report.spec.ts` (trigger analysis, view report in AI Insights, verify ranked recommendations, expand details)

### Implementation for User Story 5

#### AI Service - Monthly Analysis

- [ ] T149 [US5] Implement generateMonthlyReport function in `services/ai.service.ts` (fetch full month data, construct Claude prompt, call API, parse response, save report)
- [ ] T150 [US5] Create monthly analysis prompt template in `services/ai.service.ts` (include all spending by category, budget comparison, goals, non-negotiable acknowledgment, preferences, anomaly detection request)
- [ ] T151 [US5] Implement comprehensive recommendation parsing in `services/ai.service.ts` (extract top 3-5 recommendations with ranking, action, savings, implementation, effort, preferences)
- [ ] T152 [US5] Implement anomaly detection parsing in `services/ai.service.ts` (extract unexpected spending events, suggested proactive measures like emergency fund)
- [ ] T153 [US5] Add recommendation ranking logic in `services/ai.service.ts` (sort by expected_savings, limit to top 3-5, assign rank numbers)

#### Scheduling & Triggers

- [ ] T154 [US5] Create monthly report API endpoint in `app/api/ai/monthly-report/route.ts` (trigger manual analysis, verify auth, call AI service)
- [ ] T155 [US5] Implement scheduled job for 1st of month analysis (use Vercel Cron, Next.js API route with cron expression, or external scheduler)

#### Notifications

- [ ] T156 [US5] Implement sendMonthlyReportEmail function in `services/notification.service.ts` (email template with month summary, top 3 recommendations, link to full report)
- [ ] T157 [US5] Add email sending to monthly report flow in `services/ai.service.ts` (call notification service after report generation)

#### Monthly Report UI

- [ ] T158 [US5] Create monthly report card in `components/ai/MonthlyReportCard.tsx` (month summary, total spent vs budget, key insights section)
- [ ] T159 [US5] Create ranked recommendations list in `components/ai/RankedRecommendationsList.tsx` (top 3-5 recommendations with rank badges, expected savings, effort level)
- [ ] T160 [US5] Create anomaly highlight component in `components/ai/AnomalyHighlight.tsx` (unexpected spending events with suggested proactive measures)
- [ ] T161 [US5] Update AI Insights page in `app/(dashboard)/ai-insights/page.tsx` to display monthly reports in separate tab

**Checkpoint**: User Story 5 complete - monthly AI reports run automatically, provide comprehensive analysis with ranked recommendations and anomaly detection

---

## Phase 9: User Story 6 - Goals and Preferences Management (Priority: P3)

**Goal**: Enable users to create financial goals (savings/spending limit/debt payoff), track progress, add free-form preferences text to personalize AI recommendations

**Dependencies**: None (enhances AI in US4-5 but works independently)

**Independent Test**: Create goals with different types, verify progress tracking, add preferences text, verify subsequent AI analyses reference preferences

### Tests for User Story 6 (Write FIRST - ensure they FAIL before implementation)

- [ ] T162 [P] [US6] Unit test for goal CRUD in `tests/unit/goal.service.test.ts` (create, read, update, delete goals)
- [ ] T163 [P] [US6] Unit test for goal progress calculation in `tests/unit/goal.service.test.ts` (savings goal progress, spending limit progress, debt payoff progress)
- [ ] T164 [P] [US6] Unit test for goal status transitions in `tests/unit/goal.service.test.ts` (active → paused → completed)
- [ ] T165 [P] [US6] Unit test for preferences update in `tests/unit/preference.service.test.ts` (update preferences_text, verify AI analysis includes preferences)
- [ ] T166 [US6] Integration test for goal tracking in `tests/integration/goal-tracking.test.ts` (create goal → add transactions → verify progress updates)
- [ ] T167 [US6] E2E test for goals and preferences in `tests/e2e/goals-preferences.spec.ts` (create goal, update preferences, trigger AI analysis, verify preferences referenced in recommendations)

### Implementation for User Story 6

#### Goal Service

- [ ] T168 [US6] Create goal service in `services/goal.service.ts` (createGoal, getGoalsByUser, updateGoal, deleteGoal, calculateProgress functions)
- [ ] T169 [US6] Implement progress calculation logic in `services/goal.service.ts` (calculateSavingsProgress, calculateSpendingLimitProgress, calculateDebtPayoffProgress based on goal_type)
- [ ] T170 [US6] Add goal completion detection in `services/goal.service.ts` (auto-update status to completed when target reached)

#### Preference Service

- [ ] T171 [US6] Create preference service in `services/preference.service.ts` (getPreferences, updatePreferences, updateNotificationSettings functions)
- [ ] T172 [US6] Add preference validation in `services/preference.service.ts` (max 5000 characters for preferences_text)

#### Goals UI

- [ ] T173 [US6] Create Goals & Preferences page in `app/(dashboard)/goals/page.tsx` with goals list and preferences section
- [ ] T174 [US6] Create goal card component in `components/goal/GoalCard.tsx` (goal name, type, target amount, target date, progress bar, percentage)
- [ ] T175 [US6] Create goal creation modal in `components/goal/CreateGoalModal.tsx` (name, type selector, target amount, target date, priority)
- [ ] T176 [US6] Create goal edit modal in `components/goal/EditGoalModal.tsx` (update any field, change status)
- [ ] T177 [US6] Create preferences editor in `components/preferences/PreferencesEditor.tsx` (free-form textarea with character counter, save button)

#### AI Integration

- [ ] T178 [US6] Update weekly analysis prompt in `services/ai.service.ts` to include active goals and preferences text
- [ ] T179 [US6] Update monthly report prompt in `services/ai.service.ts` to include active goals and preferences text
- [ ] T180 [US6] Add goal alignment to recommendation parsing in `services/ai.service.ts` (verify recommendations reference which goals they help achieve)

#### Notification Settings

- [ ] T181 [US6] Create notification settings component in `components/preferences/NotificationSettings.tsx` (toggles for weekly email, monthly email, budget warnings, budget alerts)
- [ ] T182 [US6] Add notification settings to preferences page in `app/(dashboard)/goals/page.tsx`

**Checkpoint**: User Story 6 complete - users can create goals, track progress, add preferences, and AI recommendations are personalized to their stated goals and constraints

---

## Phase 10: User Story 8 - AI Recommendation Feedback and Interaction (Priority: P2)

**Goal**: Enable users to interact with AI recommendations via feedback buttons (Helpful/Not helpful/Dismiss), expand for details, view dismissed recommendations

**Dependencies**: Requires US4-5 (AI analysis) to be complete

**Independent Test**: View AI recommendation, click "Helpful", verify feedback recorded, click "Tell me more", verify expanded details, dismiss recommendation, verify it doesn't reappear

### Tests for User Story 8 (Write FIRST - ensure they FAIL before implementation)

- [ ] T183 [P] [US8] Unit test for feedback recording in `tests/unit/feedback.service.test.ts` (create feedback, verify user_id, ai_report_id, recommendation_id, feedback_type)
- [ ] T184 [P] [US8] Unit test for dismissed recommendations in `tests/unit/feedback.service.test.ts` (dismiss recommendation, verify it's excluded from future reports of same type)
- [ ] T185 [P] [US8] Unit test for feedback analysis in `tests/unit/feedback.service.test.ts` (aggregate helpful/not helpful counts, identify patterns)
- [ ] T186 [US8] Integration test for feedback flow in `tests/integration/recommendation-feedback.test.ts` (submit feedback → record in database → update future AI prompts)
- [ ] T187 [US8] E2E test for recommendation interaction in `tests/e2e/recommendation-interaction.spec.ts` (click Helpful, click Tell me more, dismiss, verify dismissed list)

### Implementation for User Story 8

#### Feedback Service

- [ ] T188 [US8] Create feedback service in `services/feedback.service.ts` (recordFeedback, getDismissedRecommendations, analyzeFeedbackPatterns functions)
- [ ] T189 [US8] Add feedback recording logic in `services/feedback.service.ts` (validate feedback_type, prevent duplicate feedback on same recommendation)
- [ ] T190 [US8] Add dismissed recommendation filter in `services/feedback.service.ts` (getFeedbackByType function to exclude dismissed recommendations from display)

#### Recommendation UI Enhancements

- [ ] T191 [US8] Add feedback buttons to recommendation card in `components/ai/RecommendationCard.tsx` (Helpful, Not helpful, Tell me more, Dismiss)
- [ ] T192 [US8] Create expanded recommendation modal in `components/ai/ExpandedRecommendationModal.tsx` (detailed explanation, affected transactions list, calculation methodology, implementation steps)
- [ ] T193 [US8] Add feedback state to recommendation card in `components/ai/RecommendationCard.tsx` (show "Marked as helpful" or "Marked as not helpful" after feedback)
- [ ] T194 [US8] Create dismissed recommendations list in `components/ai/DismissedRecommendationsList.tsx` (show all dismissed recommendations with re-enable button)

#### Feedback API

- [ ] T195 [US8] Create feedback API endpoint in `app/api/ai/feedback/route.ts` (POST to record feedback, GET to retrieve feedback by user)
- [ ] T196 [US8] Add feedback recording to recommendation click handlers in `components/ai/RecommendationCard.tsx` (call API on button clicks)

#### AI Feedback Integration

- [ ] T197 [US8] Update weekly analysis prompt in `services/ai.service.ts` to include feedback patterns (e.g., "User consistently dismisses coffee-related suggestions")
- [ ] T198 [US8] Update monthly report prompt in `services/ai.service.ts` to include feedback patterns
- [ ] T199 [US8] Add dismissed recommendation filter to AI analysis in `services/ai.service.ts` (exclude previously dismissed suggestion types)

#### Dismissed Recommendations UI

- [ ] T200 [US8] Add "Dismissed Recommendations" section to AI Insights page in `app/(dashboard)/ai-insights/page.tsx`
- [ ] T201 [US8] Create re-enable button in `components/ai/DismissedRecommendationsList.tsx` (remove dismissed feedback, allow suggestion type to reappear)

**Checkpoint**: User Story 8 complete - users can interact with AI recommendations via feedback, expand for details, dismiss suggestions, and AI learns from feedback patterns

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, optimizations, and validation across all user stories

### Responsive Design

- [ ] T202 [P] Test and fix mobile layout (< 768px) - single column, bottom navigation bar replacing sidebar
- [ ] T203 [P] Test and fix tablet layout (768-1199px) - 2-column layout, right panel moves below main content
- [ ] T204 [P] Test and fix desktop layout (1200px+) - full 3-column grid layout

### Accessibility (WCAG 2.1 AA)

- [ ] T205 [P] Add keyboard navigation to all interactive elements with visible focus indicators
- [ ] T206 [P] Add ARIA labels to all components (buttons, inputs, progress bars, cards)
- [ ] T207 [P] Verify color contrast ratios meet 4.5:1 for normal text, 3:1 for large text
- [ ] T208 [P] Test screen reader navigation with NVDA or JAWS
- [ ] T209 [P] Add text labels to all color indicators (not color alone)

### Performance Optimization

- [ ] T210 [P] Implement pagination for transaction lists (50 per page, cursor-based)
- [ ] T211 [P] Add caching for dashboard queries (5 min cache for budget utilization)
- [ ] T212 [P] Optimize budget calculation queries with database indexes
- [ ] T213 [P] Add loading skeletons to all async components
- [ ] T214 [P] Test dashboard load time with 1000 transactions (target < 2s)
- [ ] T215 [P] Test Projected Monthly Spend calculation performance (target < 500ms)

### Security Hardening

- [ ] T216 [P] Add Content Security Policy (CSP) headers in Next.js middleware
- [ ] T217 [P] Add HSTS, X-Frame-Options, X-Content-Type-Options headers
- [ ] T218 [P] Implement rate limiting on API routes (Plaid webhook, AI analysis endpoints)
- [ ] T219 [P] Add input sanitization to all user inputs (prevent XSS)
- [ ] T220 [P] Verify Plaid webhook signature validation
- [ ] T221 [P] Test session timeout (30 min inactivity)

### Error Handling

- [ ] T222 [P] Add global error boundary in `app/error.tsx`
- [ ] T223 [P] Add error handling to all API routes with clear error messages
- [ ] T224 [P] Add error handling to Plaid connection with re-authentication prompts
- [ ] T225 [P] Add error handling to Claude API calls with retry logic
- [ ] T226 [P] Add validation error messages to all forms

### Documentation

- [ ] T227 [P] Create quickstart.md validation (follow setup steps, verify works in < 15 min)
- [ ] T228 [P] Update README.md with project overview, tech stack, getting started
- [ ] T229 [P] Document environment variables in .env.local.example with descriptions
- [ ] T230 [P] Add inline code comments to complex business logic in services/

### Testing Completion

- [ ] T231 [P] Run full unit test suite, verify 80% coverage for services/ and lib/
- [ ] T232 [P] Run full integration test suite, verify all flows pass
- [ ] T233 [P] Run full E2E test suite across all user stories
- [ ] T234 [P] Fix any failing tests and add missing test coverage

### Code Quality

- [ ] T235 [P] Run ESLint and fix all warnings
- [ ] T236 [P] Run Prettier and format all code
- [ ] T237 [P] Remove unused imports and dead code
- [ ] T238 [P] Refactor any duplicated code into shared utilities

### Browser Compatibility

- [ ] T239 [P] Test in Chrome (latest 2 versions)
- [ ] T240 [P] Test in Firefox (latest 2 versions)
- [ ] T241 [P] Test in Safari (latest 2 versions)
- [ ] T242 [P] Test in Edge (latest 2 versions)

### Final Validation

- [ ] T243 Complete all success criteria from spec.md (onboarding < 5 min, 95% categorization accuracy, AI analysis < 15 min, dashboard < 2s, projection < 500ms)
- [ ] T244 Test all 8 user stories end-to-end independently
- [ ] T245 Verify constitution principles: Security-First, Test-First, Cross-Platform Ready, Local Development, User-Centric
- [ ] T246 Run production build and verify no build errors

**Checkpoint**: Application complete, tested, accessible, performant, and ready for deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories US1-3 (Phase 3-5)**: All depend on Foundational phase completion, P1 priority
  - US1: Onboarding (no dependencies on other stories)
  - US2: Transaction Management (can start after Foundational, integrates with US1)
  - US3: Budget Tracking (can start after Foundational, integrates with US1-2)
- **User Story US7 (Phase 6)**: Depends on US1-3 completion (Dashboard needs transactions and budgets), P2 priority
- **User Stories US4-5 (Phase 7-8)**: Depend on US1-3 and US7 completion (AI needs transaction/budget data and projection logic), P2 priority
  - US4: Weekly AI Check-ins (depends on US1-3, US7)
  - US5: Monthly AI Reports (depends on US4 infrastructure)
- **User Story US6 (Phase 9)**: No dependencies (enhances AI but works independently), P3 priority
- **User Story US8 (Phase 10)**: Depends on US4-5 completion (feedback on AI recommendations), P2 priority
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Completion Order (by Priority)

**Priority 1 (P1) - Core MVP**:
1. US1: Onboarding and First Budget Setup (Phase 3)
2. US2: Transaction Management and Categorization (Phase 4)
3. US3: Budget Creation and Tracking (Phase 5)

**Priority 2 (P2) - AI Features**:
4. US7: Dashboard Budget Utilization and Projection Monitoring (Phase 6) - depends on US1-3
5. US4: Weekly AI Check-ins (Phase 7) - depends on US1-3, US7
6. US5: Monthly AI Reports (Phase 8) - depends on US4
7. US8: AI Recommendation Feedback and Interaction (Phase 10) - depends on US4-5

**Priority 3 (P3) - Enhancements**:
8. US6: Goals and Preferences Management (Phase 9) - independent

### Within Each User Story

- Tests MUST be written FIRST and FAIL before implementation (Test-First Development)
- Models/types before services
- Services before UI components
- Core implementation before integration
- Story complete and tested before moving to next priority

### Parallel Opportunities

**Setup Phase (Phase 1)**:
- T002, T003, T004, T005, T006, T008, T009 can all run in parallel

**Foundational Phase (Phase 2)**:
- After database migration (T010-T018), these can run in parallel:
  - Type definitions (T019-T022)
  - Client initialization (T023-T026)
  - Validation & utilities (T027-T028)
  - Base UI components (T031-T035)
  - Test infrastructure (T036-T042)

**User Story Tests** (within each story):
- All unit tests marked [P] can run in parallel
- Integration and E2E tests run sequentially after unit tests pass

**User Story Implementation** (within each story):
- Models/types marked [P] can run in parallel
- UI components marked [P] can run in parallel (if they don't share state)
- Different user stories can be worked on in parallel by different team members AFTER Foundational phase

**Cross-Story Parallelization** (if team capacity allows):
- After Foundational complete:
  - Team member 1: US1 (Onboarding)
  - Team member 2: US2 (Transaction Management) - starts after US1 completes
  - Team member 3: US3 (Budget Tracking) - starts after US1 completes
- After US1-3 complete:
  - Team member 1: US7 (Dashboard)
  - Team member 2: US6 (Goals) - independent, can start anytime
- After US7 complete:
  - Team member 1: US4 (Weekly AI)
  - Team member 2: Continue US6 or start US5 prep
- After US4-5 complete:
  - Team member 1: US8 (Feedback)

---

## Parallel Example: User Story 1

### Phase 1: Tests (All Parallel)
```bash
# Launch all US1 tests together (write FIRST, ensure they FAIL):
T043: Unit test for signUp in tests/unit/auth.service.test.ts
T044: Unit test for Plaid link token in tests/unit/plaid.service.test.ts
T045: Unit test for transaction import in tests/unit/transaction.service.test.ts
T046: Unit test for budget suggestion in tests/unit/budget.service.test.ts
T047: Integration test for onboarding flow in tests/integration/onboarding.test.ts
```

### Phase 2: Models/Types (All Parallel)
```bash
T019: Generate Supabase types in types/database.types.ts
T020: Create Plaid types in types/plaid.types.ts
T021: Create AI types in types/ai.types.ts
T022: Create app domain types in types/index.ts
```

### Phase 3: Auth UI (All Parallel)
```bash
T049: Create signup page in app/(auth)/signup/page.tsx
T050: Create login page in app/(auth)/login/page.tsx
T051: Create password reset page in app/(auth)/reset-password/page.tsx
```

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup (~1 day)
2. Complete Phase 2: Foundational (~2-3 days) - CRITICAL, blocks all stories
3. Complete Phase 3: US1 Onboarding (~3-4 days)
4. **STOP and VALIDATE**: Test US1 independently (onboarding < 5 min, transactions imported, budget created)
5. Complete Phase 4: US2 Transaction Management (~2-3 days)
6. **STOP and VALIDATE**: Test US2 independently (recategorization works, tags work, budget updates)
7. Complete Phase 5: US3 Budget Tracking (~2-3 days)
8. **STOP and VALIDATE**: Test US3 independently (budgets track spending, warnings/alerts work, future budgets)
9. **MVP COMPLETE**: Users can onboard, manage transactions, track budgets

### Incremental Delivery (Add P2 AI Features)

10. Complete Phase 6: US7 Dashboard (~2 days) - depends on US1-3
11. **VALIDATE**: Dashboard shows utilization and projection
12. Complete Phase 7: US4 Weekly AI (~3-4 days) - depends on US1-3, US7
13. **VALIDATE**: Weekly check-ins generate, email notifications work
14. Complete Phase 8: US5 Monthly AI (~2-3 days) - depends on US4
15. **VALIDATE**: Monthly reports generate, recommendations ranked
16. Complete Phase 10: US8 Feedback (~2 days) - depends on US4-5
17. **VALIDATE**: Feedback recorded, dismissed recommendations work
18. **AI FEATURES COMPLETE**: Full AI-powered proactive budget app

### Optional Enhancements (P3)

19. Complete Phase 9: US6 Goals (~2-3 days) - can be done anytime
20. **VALIDATE**: Goals track progress, AI references preferences

### Final Polish

21. Complete Phase 11: Polish & Cross-Cutting (~3-4 days)
22. **FINAL VALIDATION**: All success criteria met, constitution principles verified

**Total Estimated Timeline**:
- MVP (P1): ~8-11 days
- + AI Features (P2): ~17-24 days total
- + Goals (P3): ~19-27 days total
- + Polish: ~22-31 days total

### Parallel Team Strategy

With 2-3 developers:

**Week 1**:
- All: Setup + Foundational together (~3 days)
- Dev 1: Start US1 Onboarding (~2 days to complete)

**Week 2**:
- Dev 1: Complete US1, start US2 Transaction Management
- Dev 2: Start US3 Budget Tracking (parallel with US2)
- Dev 3: Start US6 Goals (independent, can run in parallel)

**Week 3**:
- Dev 1: Complete US2, start US7 Dashboard
- Dev 2: Complete US3, help with US7
- Dev 3: Complete US6

**Week 4**:
- Dev 1: Complete US7, start US4 Weekly AI
- Dev 2: Start US5 Monthly AI (depends on US4 infrastructure, coordinate with Dev 1)
- Dev 3: Start US8 Feedback prep

**Week 5**:
- Dev 1: Complete US4
- Dev 2: Complete US5
- Dev 3: Complete US8
- All: Polish & final validation

**Parallel Timeline**: ~4-5 weeks with 3 developers vs ~5-6 weeks solo

---

## Notes

- **[P]** tasks = different files, no dependencies, safe to parallelize
- **[Story]** label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **Test-First Development**: Verify tests FAIL before implementing (constitution principle II)
- Commit after each task or logical group of tasks
- Stop at any checkpoint to validate story independently
- Run `npm run test:unit` frequently during development
- Run `npm run test:e2e` after completing each user story
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Use MSW mocks for all Plaid and Claude API calls during local development
- Follow quickstart.md for local setup validation
- Refer to data-model.md for database schema and RLS policies
- Refer to plan.md for architecture decisions and technology choices
