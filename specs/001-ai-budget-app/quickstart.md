# Local Development Quickstart

**Version**: 1.0.0
**Last Updated**: 2025-10-23
**Related**: [plan.md](plan.md), [research.md](research.md)

## Overview

This guide will help you set up the AI-Powered Budget App for local development in under 15 minutes. The complete stack runs locally without production dependencies, using Supabase local environment, mocked Plaid SDK, and mocked Claude SDK.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Docker Desktop** - Required for Supabase local environment ([Download](https://www.docker.com/products/docker-desktop))
- **Supabase CLI** - Install with: `npm install -g supabase`
- **Git** - For version control

### Optional (for production integration testing):
- **Plaid Sandbox Account** - [Sign up](https://dashboard.plaid.com/signup) (free for testing)
- **Anthropic API Key** - [Get key](https://console.anthropic.com/) (for Claude SDK)

## Quick Setup (5 Steps)

### 1. Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd budget_app

# Install npm dependencies
npm install
```

**Expected time**: 2-3 minutes

---

### 2. Start Supabase Local Environment

```bash
# Initialize Supabase (first time only)
supabase init

# Start local Supabase stack (PostgreSQL, Auth, Studio)
supabase start
```

**What this does**:
- Starts PostgreSQL database on `localhost:54322`
- Starts Supabase Auth on `localhost:54321`
- Starts Supabase Studio (dashboard) on `http://localhost:54323`
- Creates default service role and anon keys

**Expected time**: 1-2 minutes (first start may take longer to download Docker images)

**Output**:
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGc...
service_role key: eyJhbGc...
```

**Copy the `anon key` and `service_role key`** - you'll need them in the next step.

---

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.local.example .env.local
```

**Edit `.env.local`** and add your keys:

```bash
# Supabase (from step 2 output)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-step-2>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-step-2>

# Plaid (for local testing, use sandbox)
PLAID_CLIENT_ID=sandbox_test_client_id
PLAID_SECRET=sandbox_test_secret
PLAID_ENV=sandbox

# Claude SDK (optional for local - can use mocks)
ANTHROPIC_API_KEY=sk-ant-test-key-for-mocking

# App Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: For local development, you can use mock values. Real API keys are only needed when testing production integrations.

**Expected time**: 1 minute

---

### 4. Run Database Migrations & Seed Data

```bash
# Apply all migrations to create database schema
supabase db reset

# This command:
# - Drops the database (if exists)
# - Re-creates it
# - Runs all migrations in /supabase/migrations/
# - Runs seed.sql to populate test data
```

**What this creates**:
- All tables (users, transactions, budgets, goals, AI reports)
- Row Level Security (RLS) policies
- Database triggers and functions
- Test users with sample data

**Test Users Created** (from seed.sql):
- `alice@example.com` / `password123` - User with 90 days of transaction history
- `bob@example.com` / `password123` - New user with 7 days of data
- `charlie@example.com` / `password123` - User with insufficient data (<7 days)

**Expected time**: 30 seconds

---

### 5. Start Next.js Development Server

```bash
# Start the Next.js dev server
npm run dev
```

**Expected time**: 10-15 seconds

**Open your browser**: [http://localhost:3000](http://localhost:3000)

**Login with test user**:
- Email: `alice@example.com`
- Password: `password123`

---

## 🎉 You're Ready!

The app is now running locally with:
- ✅ Supabase PostgreSQL database
- ✅ Supabase Auth (email/password)
- ✅ Sample transaction data (90 days for alice@example.com)
- ✅ Sample budgets and goals
- ✅ Mock Plaid SDK (no real bank connections needed)
- ✅ Mock Claude SDK (no API usage)

---

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm run test:unit

# Run unit tests in watch mode
npm run test:unit:watch

# Run unit tests with coverage report
npm run test:unit:coverage
```

**What it tests**:
- `/services` business logic (budget calculations, categorization, spend tracking)
- `/lib/utils` utility functions
- Target: 80% code coverage for business logic

---

### Integration Tests (Vitest + MSW)

```bash
# Run integration tests
npm run test:integration

# Run integration tests in watch mode
npm run test:integration:watch
```

**What it tests**:
- Plaid webhook handlers
- Transaction import flows
- AI analysis with mocked Claude SDK
- Uses Mock Service Worker (MSW) for API mocking

---

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run specific E2E test
npm run test:e2e -- onboarding.spec.ts
```

**What it tests**:
- Onboarding flow (signup, bank connection, budget setup)
- Budget CRUD operations
- Transaction categorization
- AI report generation

---

## Mock APIs (for Local Development)

### Mock Plaid SDK

**Location**: `/tests/mocks/plaid.handlers.ts`

**How it works**:
- Mock Service Worker (MSW) intercepts Plaid SDK requests
- Returns realistic transaction data from `/tests/fixtures/transactions.json`
- Simulates webhook callbacks for transaction updates

**Usage in code**:
```typescript
import { setupServer } from 'msw/node';
import { plaidHandlers } from '@/tests/mocks/plaid.handlers';

const server = setupServer(...plaidHandlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

### Mock Claude SDK

**Location**: `/tests/mocks/claude.handlers.ts`

**How it works**:
- MSW intercepts Claude SDK API calls
- Returns pre-generated AI analysis from `/tests/fixtures/ai-reports.json`
- No API usage, no costs during development

**Usage in code**:
```typescript
import { claudeHandlers } from '@/tests/mocks/claude.handlers';
const server = setupServer(...claudeHandlers);
```

---

## Database Management

### Access Supabase Studio

**URL**: [http://localhost:54323](http://localhost:54323)

**Features**:
- Browse tables and data
- Run SQL queries
- View RLS policies
- Test authentication
- Monitor real-time subscriptions

---

### Create a New Migration

```bash
# Create a new migration file
supabase migration new <descriptive_name>

# Example: Add a new column to transactions table
supabase migration new add_recurring_flag_to_transactions
```

**Edit the migration file** in `/supabase/migrations/`:

```sql
-- Add recurring column to transactions
ALTER TABLE transactions
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;

-- Create index for recurring transactions
CREATE INDEX idx_transactions_recurring
ON transactions(is_recurring);
```

**Apply the migration**:
```bash
supabase db reset
```

---

### Reset Database (Start Fresh)

```bash
# WARNING: This deletes all data and re-runs migrations + seed
supabase db reset
```

---

### View Database Logs

```bash
# View PostgreSQL logs
supabase db logs
```

---

## Seed Data Details

**File**: `/supabase/seed.sql`

**What's included**:
1. **Test Users** (3 accounts):
   - `alice@example.com` - 90 days of transactions, budgets for 3 months
   - `bob@example.com` - 7 days of transactions (minimum for projections)
   - `charlie@example.com` - 3 days of transactions (insufficient data)

2. **Bank Connections** (2-3 per user):
   - Chase checking account
   - Bank of America credit card
   - Wells Fargo savings account

3. **Transactions** (realistic spending patterns):
   - Groceries: $300-600/month
   - Dining Out: $150-300/month
   - Transportation: $100-200/month
   - Entertainment: $50-150/month
   - Utilities: $200/month (fixed)
   - Shopping: $100-400/month (variable)

4. **Budgets** (current month + 2 previous months):
   - All 8 categories defined
   - Realistic budget amounts based on spending patterns

5. **Goals** (1-2 per user):
   - Emergency fund savings goal
   - Vacation savings goal
   - Debt payoff goal

6. **AI Reports** (sample weekly and monthly):
   - 1 weekly check-in with trajectory prediction
   - 1 monthly report with recommendations

---

## Common Issues & Troubleshooting

### Issue: Supabase start fails with "port already in use"

**Solution**:
```bash
# Stop Supabase
supabase stop

# Kill processes using ports 54321-54324
# On macOS/Linux:
lsof -ti:54321 | xargs kill -9

# On Windows:
netstat -ano | findstr :54321
taskkill /PID <PID> /F

# Restart Supabase
supabase start
```

---

### Issue: Database migrations fail

**Solution**:
```bash
# View migration status
supabase migration list

# Check for syntax errors in migration files
cat supabase/migrations/<migration-file>.sql

# Reset database completely
supabase db reset
```

---

### Issue: Next.js server won't start

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Restart dev server
npm run dev
```

---

### Issue: Tests fail with "Supabase client not initialized"

**Solution**:
```bash
# Ensure Supabase is running
supabase status

# Check environment variables in .env.local
cat .env.local | grep SUPABASE

# Restart test with verbose output
npm run test:unit -- --verbose
```

---

## Development Workflow

### 1. Start Your Day

```bash
# Start Supabase
supabase start

# Start Next.js dev server
npm run dev

# Open Supabase Studio (optional)
open http://localhost:54323
```

---

### 2. Make Code Changes

- Edit files in `/app`, `/services`, `/components`
- Next.js auto-reloads on file changes
- Database changes require new migrations

---

### 3. Run Tests Before Committing

```bash
# Run all tests
npm run test

# Or run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

---

### 4. End Your Day

```bash
# Stop Next.js dev server (Ctrl+C)

# Stop Supabase
supabase stop

# Commit your changes
git add .
git commit -m "feat: implement budget tracking"
```

---

## Next Steps

1. **Explore the Dashboard**: Login as `alice@example.com` to see a fully populated dashboard
2. **Review the Code**: Start with `/app/page.tsx` (main dashboard)
3. **Make Your First Change**: Try adding a new budget category
4. **Write a Test**: Add a unit test for budget calculations
5. **Read the Docs**: Check out [plan.md](plan.md) for architecture decisions

---

## Additional Resources

- **Supabase Local Development**: [https://supabase.com/docs/guides/cli/local-development](https://supabase.com/docs/guides/cli/local-development)
- **Next.js 14 App Router**: [https://nextjs.org/docs/app](https://nextjs.org/docs/app)
- **Vitest**: [https://vitest.dev/](https://vitest.dev/)
- **Playwright**: [https://playwright.dev/](https://playwright.dev/)
- **Mock Service Worker**: [https://mswjs.io/](https://mswjs.io/)

---

## Getting Help

- **Check the logs**: `supabase db logs` or browser console
- **View database**: [http://localhost:54323](http://localhost:54323)
- **Review tests**: `/tests` directory for examples
- **Ask the team**: Create an issue or ask in Slack

---

**Happy coding! 🚀**
