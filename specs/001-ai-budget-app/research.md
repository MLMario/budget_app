# Technology Stack Research: AI-Powered Budget App

**Feature Branch**: `001-ai-budget-app`
**Created**: 2025-10-23
**Purpose**: Comprehensive research documentation for technology decisions aligned with minimalist, security-first principles

---

## 1. Supabase + Next.js 14 App Router Integration

### Decision

Use **dual Supabase client pattern** with separate client initialization for Server Components (SSR) and Client Components, leveraging `@supabase/ssr` helper package for cookie-based authentication flow.

### Rationale

**Server-First Architecture Benefits**:
- Server Components provide automatic Auth token refresh without client-side JavaScript execution
- Cookie-based session management is more secure than localStorage/sessionStorage
- Reduces client bundle size by keeping database queries on the server
- RLS policies are enforced at the database level regardless of client type

**Authentication Security**:
- `supabase.auth.getUser()` in Server Components/Actions guarantees token revalidation (critical for security)
- `supabase.auth.getSession()` must NEVER be used in server code as it doesn't guarantee fresh token validation
- Middleware automatically refreshes expired tokens and passes them to both server and browser

**Alignment with Constitution**:
- "Security-first" - Cookie-based auth is more secure than client-only token storage
- "Minimalist" - Leverages Next.js 14 SSR capabilities without additional state management complexity
- "Data Privacy Respect" - RLS policies enforce data isolation at database level

### Alternatives Considered

**1. Client-Only Supabase Client**
- **Rejected**: Would require all data fetching in Client Components, increasing bundle size and reducing performance
- **Rejected**: Cannot leverage Next.js SSR for initial page loads with authenticated data
- **Rejected**: More vulnerable to XSS attacks with token storage in localStorage

**2. Single Server-Only Client**
- **Rejected**: Would prevent real-time subscriptions and interactive client features
- **Rejected**: Requires full page reloads for all data updates
- **Rejected**: Poor UX for immediate feedback on user actions

**3. Traditional REST API + Separate Auth Service**
- **Rejected**: Significantly increases implementation complexity
- **Rejected**: Requires maintaining separate auth middleware
- **Rejected**: Violates minimalist principle by introducing unnecessary layers

### Implementation Notes

**Directory Structure**:
```
utils/supabase/
├── client.ts     // Client Component usage (browser operations)
├── server.ts     // Server Component, Server Actions, Route Handlers
└── middleware.ts // Token refresh for all authenticated routes
```

**Server Client Pattern** (`utils/supabase/server.ts`):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

**Client Component Pattern** (`utils/supabase/client.ts`):
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Middleware Token Refresh** (`middleware.ts`):
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session - MUST use getUser() not getSession()
  await supabase.auth.getUser()

  return response
}
```

**RLS Policy Pattern** (Server-side enforcement):
```sql
-- Transactions table: Users can only see their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Budgets table: Users can manage only their own budgets
CREATE POLICY "Users can manage own budgets"
  ON budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Environment Variables**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Critical Security Rules**:
1. Always use `supabase.auth.getUser()` in Server Components/Actions (never `getSession()`)
2. Never trust client-side auth state for authorization decisions
3. Implement RLS policies for ALL tables that contain user data
4. Use middleware to refresh tokens on every request to protected routes
5. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only (never expose to client)

### References

- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js 14 App Router Tutorial with Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Supabase SSR Package Documentation](https://supabase.com/docs/guides/auth/server-side/overview)
- [2025 Guide: Supabase Auth in Next.js](https://www.zestminds.com/blog/supabase-auth-nextjs-setup-guide/)

---

## 2. Plaid SDK Integration

### Decision

Use **Plaid Link** for bank connections with **Transactions Sync API** (`/transactions/sync`) and **webhook-driven daily sync** using `SYNC_UPDATES_AVAILABLE` webhooks for incremental transaction updates.

### Rationale

**Transactions Sync API Over Legacy /transactions/get**:
- Plaid officially recommends `/transactions/sync` for all new integrations (2025)
- Simpler handling of transaction state changes (added, modified, removed)
- Cursor-based pagination prevents data gaps during concurrent updates
- Webhook integration is cleaner with sync-specific `SYNC_UPDATES_AVAILABLE` events

**Webhook-Driven Architecture**:
- Eliminates unnecessary polling - only fetch when changes occur
- Reduces API call volume and associated costs
- Provides near-real-time transaction updates for better UX
- Aligns with "proactive insights" philosophy from design proposal

**Security-First Verification**:
- JWT signature verification ensures webhooks are genuinely from Plaid
- SHA-256 body hash validation prevents tampering
- 5-minute timestamp check prevents replay attacks
- Aligns with constitution's "Security-first" principle

### Alternatives Considered

**1. Plaid /transactions/get (Legacy API)**
- **Rejected**: No longer receiving improvements from Plaid as of 2023
- **Rejected**: Requires date-range polling which is inefficient
- **Rejected**: More complex to track transaction modifications over time
- **Rejected**: Webhook integration less streamlined

**2. Polling-Based Sync (No Webhooks)**
- **Rejected**: Wasteful API calls when no changes exist
- **Rejected**: Introduces latency between transaction occurrence and app visibility
- **Rejected**: Higher infrastructure costs for scheduled jobs
- **Rejected**: Violates minimalist principle by adding unnecessary complexity

**3. Plaid Enrich API for Categorization**
- **Considered**: Provides enhanced categorization with confidence scores
- **Deferred**: Adds additional API cost; Plaid's built-in `personal_finance_category` is sufficient for v1
- **Future**: Can be added later if categorization accuracy is insufficient

### Implementation Notes

**Plaid Link Initialization** (Client-side):
```typescript
import { usePlaidLink } from 'react-plaid-link'

const { open, ready } = usePlaidLink({
  token: linkToken, // Generated server-side via /link/token/create
  onSuccess: async (public_token, metadata) => {
    // Exchange public_token for access_token on server
    await fetch('/api/plaid/exchange', {
      method: 'POST',
      body: JSON.stringify({ public_token, metadata }),
    })
  },
})
```

**Link Token Creation** (Server-side API route):
```typescript
// app/api/plaid/create-link-token/route.ts
const response = await plaidClient.linkTokenCreate({
  user: { client_user_id: userId },
  client_name: 'AI Budget App',
  products: ['transactions'],
  country_codes: ['US'],
  language: 'en',
  webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/plaid`,
})
```

**Token Exchange Flow** (Server-side):
```typescript
// app/api/plaid/exchange/route.ts
const exchangeResponse = await plaidClient.itemPublicTokenExchange({
  public_token: publicToken,
})

const accessToken = exchangeResponse.data.access_token

// Store encrypted access_token in Supabase
await supabase.from('bank_connections').insert({
  user_id: userId,
  access_token: encrypt(accessToken), // Use AES-256 encryption
  institution_name: metadata.institution.name,
  status: 'active',
})

// Initial sync to activate webhooks
await fetch('/api/plaid/sync', {
  method: 'POST',
  body: JSON.stringify({ accessToken }),
})
```

**Transactions Sync Endpoint** (Server-side):
```typescript
// app/api/plaid/sync/route.ts
let cursor = storedCursor // Retrieved from database per Item
let hasMore = true
let added = []
let modified = []
let removed = []

while (hasMore) {
  const response = await plaidClient.transactionsSync({
    access_token: accessToken,
    cursor: cursor,
  })

  added = added.concat(response.data.added)
  modified = modified.concat(response.data.modified)
  removed = removed.concat(response.data.removed)

  hasMore = response.data.has_more
  cursor = response.data.next_cursor
}

// Store cursor for next sync
await supabase.from('bank_connections')
  .update({ sync_cursor: cursor })
  .eq('access_token_hash', hash(accessToken))

// Process transactions
await processTransactions({ added, modified, removed, userId })
```

**Webhook Handler** (API route):
```typescript
// app/api/webhooks/plaid/route.ts
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('plaid-verification')

  // Verify webhook authenticity
  const isValid = await verifyPlaidWebhook(signature, body)
  if (!isValid) {
    return new Response('Unauthorized', { status: 401 })
  }

  const webhook = JSON.parse(body)

  if (webhook.webhook_code === 'SYNC_UPDATES_AVAILABLE') {
    // Queue sync job for this Item
    await queueTransactionSync({
      itemId: webhook.item_id,
      historicalUpdateComplete: webhook.historical_update_complete,
    })
  }

  return new Response('OK', { status: 200 })
}
```

**Webhook Verification Implementation**:
```typescript
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

async function verifyPlaidWebhook(jwtToken: string, body: string): Promise<boolean> {
  try {
    // Decode JWT header to get key ID
    const decoded = jwt.decode(jwtToken, { complete: true })
    if (!decoded || decoded.header.alg !== 'ES256') {
      return false
    }

    // Get verification key from Plaid
    const keyResponse = await plaidClient.webhookVerificationKeyGet({
      key_id: decoded.header.kid,
    })

    // Verify JWT signature
    const verifiedToken = jwt.verify(jwtToken, keyResponse.data.key.pem, {
      algorithms: ['ES256'],
    })

    // Check timestamp (within 5 minutes)
    const tokenAge = Date.now() / 1000 - verifiedToken.iat
    if (tokenAge > 300) {
      return false
    }

    // Verify body hash
    const bodyHash = crypto.createHash('sha256').update(body).digest('hex')
    if (bodyHash !== verifiedToken.request_body_sha256) {
      return false
    }

    return true
  } catch (error) {
    console.error('Webhook verification failed:', error)
    return false
  }
}
```

**Transaction Processing Pattern**:
```typescript
async function processTransactions({ added, modified, removed, userId }) {
  // Insert new transactions
  const transactionsToInsert = added.map(tx => ({
    user_id: userId,
    plaid_transaction_id: tx.transaction_id,
    merchant_name: tx.merchant_name || tx.name,
    amount: tx.amount,
    date: tx.date,
    category: tx.personal_finance_category?.primary || 'OTHER',
    subcategory: tx.personal_finance_category?.detailed,
    payment_source: tx.account_id,
  }))

  await supabase.from('transactions').insert(transactionsToInsert)

  // Update modified transactions
  for (const tx of modified) {
    await supabase.from('transactions')
      .update({
        merchant_name: tx.merchant_name || tx.name,
        amount: tx.amount,
        category: tx.personal_finance_category?.primary || 'OTHER',
      })
      .eq('plaid_transaction_id', tx.transaction_id)
  }

  // Delete removed transactions
  const removedIds = removed.map(tx => tx.transaction_id)
  await supabase.from('transactions')
    .delete()
    .in('plaid_transaction_id', removedIds)
}
```

**Error Handling Patterns**:
```typescript
// Handle Plaid connection errors
try {
  await plaidClient.transactionsSync({ access_token: token })
} catch (error) {
  if (error.error_code === 'ITEM_LOGIN_REQUIRED') {
    // Bank credentials expired - notify user to re-authenticate
    await supabase.from('bank_connections')
      .update({ status: 'requires_reauth' })
      .eq('access_token_hash', hash(token))

    await sendNotification({
      userId,
      type: 'bank_reauth_required',
      message: 'Please reconnect your bank account',
    })
  }
}
```

**Daily Sync Job Architecture**:
- Webhook-driven: Only sync when `SYNC_UPDATES_AVAILABLE` fires
- Job queue: Use Supabase Edge Functions or Vercel Cron Jobs to process webhook events
- Fallback polling: Daily cron job to catch any missed webhooks (defensive programming)

### References

- [Plaid Transactions Sync API](https://plaid.com/docs/transactions/)
- [Plaid Transactions Webhooks](https://plaid.com/docs/transactions/webhooks/)
- [Plaid Webhook Verification](https://plaid.com/docs/api/webhooks/webhook-verification/)
- [Plaid Transactions Sync Migration Guide](https://plaid.com/docs/transactions/sync-migration/)
- [Plaid Pattern App (Example Implementation)](https://github.com/plaid/pattern)

---

## 3. Claude SDK for AI Analysis

### Decision

Use **Anthropic Claude API** (Claude 4 Sonnet) with **structured prompt engineering** for financial analysis, **streaming responses** for real-time feedback, and **prompt caching** for large transaction datasets.

### Rationale

**Model Selection - Claude 4 Sonnet**:
- Balanced cost/performance for financial analysis workloads
- Strong reasoning capabilities for trajectory predictions
- Good context window (200K tokens) for monthly transaction analysis
- Cost: $5/MTok input, $25/MTok output, $10/MTok thinking tokens (2025 pricing)

**Streaming for User Experience**:
- Provides progressive feedback during analysis generation
- Reduces perceived latency for weekly/monthly reports
- No difference in rate limits between streaming and single response
- Aligns with "proactive insights" by showing analysis as it generates

**Prompt Caching for Efficiency**:
- 90% cost reduction for cached content (prompt cache reads don't count against ITPM limits as of 2025)
- Ideal for transaction data that doesn't change between analysis runs
- Reduces latency for re-analysis requests

**Alignment with Constitution**:
- "Privacy-respecting" - No transaction data persists in Claude API (processed in-memory)
- "Minimalist" - Single API call per analysis vs. complex ML pipeline
- "Security-first" - API key stored securely, never exposed to client

### Alternatives Considered

**1. OpenAI GPT-4 API**
- **Rejected**: Higher cost per token ($10 input, $30 output vs. Claude 4.1 Sonnet $5/$25)
- **Rejected**: Weaker reasoning for financial predictions in benchmarks
- **Rejected**: Less transparent pricing structure with thinking tokens

**2. Self-Hosted Local LLM (e.g., Llama 3)**
- **Rejected**: Requires infrastructure for GPU inference
- **Rejected**: Significantly more complex deployment and maintenance
- **Rejected**: Lower quality financial reasoning compared to frontier models
- **Rejected**: Violates minimalist principle

**3. Rule-Based Analysis (No LLM)**
- **Rejected**: Cannot provide natural language insights
- **Rejected**: Requires extensive manual tuning for different user scenarios
- **Rejected**: Cannot adapt to user preferences expressed in free-form text
- **Rejected**: Misses core value proposition of "AI-powered" insights

**4. Claude 4 Opus**
- **Rejected**: 4x higher cost ($20 input, $80 output, $40 thinking)
- **Rejected**: Overkill for transaction analysis task
- **Future**: Could be offered as premium tier for power users

### Implementation Notes

**Prompt Engineering Structure** (System + User Pattern):

```typescript
// System prompt with role and rules
const systemPrompt = `You are a financial advisor analyzing a user's spending patterns.

ROLE: Proactive budget advisor focused on actionable recommendations

RULES:
1. Always respect transactions marked as "non-negotiable" - never suggest reducing these
2. Reference user preferences explicitly (e.g., "Respecting your preference to maintain coffee shop visits")
3. Provide specific actions with dollar amounts (e.g., "Skip 2 coffee runs this week = $12 savings")
4. Rank recommendations by impact (highest savings potential first)
5. Include confidence levels for predictions (High/Medium/Low)
6. Output structured JSON for programmatic parsing

OUTPUT FORMAT:
{
  "trajectory_prediction": {
    "projected_total": number,
    "confidence": "high" | "medium" | "low",
    "reasoning": string
  },
  "recommendations": [
    {
      "action": string,
      "category": string,
      "savings": number,
      "effort": "easy" | "medium" | "hard",
      "respects_preference": string | null
    }
  ]
}`

// User prompt with transaction data
const userPrompt = `Analyze the following spending data for week 3 of October 2025:

CURRENT MONTH BUDGET: $5,000
TOTAL SPENT SO FAR: $3,200 (64%)
DAYS REMAINING: 9

TRANSACTIONS (last 7 days):
${transactions.map(tx => `- ${tx.date}: ${tx.merchant} - $${tx.amount} [${tx.category}] ${tx.tags.includes('non-negotiable') ? '[NON-NEGOTIABLE]' : ''}`).join('\n')}

USER PREFERENCES:
${userPreferences || 'None provided'}

TASK: Predict end-of-month spending and provide top 3 recommendations to stay within budget.`
```

**Streaming Implementation**:
```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

async function generateWeeklyAnalysis(userId: string) {
  const { transactions, budget, preferences } = await fetchUserData(userId)

  const stream = await client.messages.stream({
    model: 'claude-4-sonnet-20250929',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: buildUserPrompt({ transactions, budget, preferences }),
      },
    ],
  })

  let fullResponse = ''

  stream.on('text', (text) => {
    fullResponse += text
    // Stream to client via Server-Sent Events
    sendSSE({ userId, chunk: text })
  })

  await stream.finalMessage()

  // Parse and store final analysis
  const analysis = JSON.parse(fullResponse)
  await supabase.from('ai_reports').insert({
    user_id: userId,
    report_type: 'weekly',
    analysis_json: analysis,
  })
}
```

**Prompt Caching for Transaction Context**:
```typescript
const messagesWithCache = [
  {
    role: 'user',
    content: [
      {
        type: 'text',
        text: `TRANSACTION HISTORY (cached):
${historicalTransactions.map(tx => `${tx.date}: ${tx.merchant} - $${tx.amount}`).join('\n')}`,
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        text: `NEW TRANSACTIONS THIS WEEK:
${newTransactions.map(tx => `${tx.date}: ${tx.merchant} - $${tx.amount}`).join('\n')}

Provide weekly analysis.`,
      },
    ],
  },
]

// First call: Pays for full input tokens + creates cache
// Subsequent calls: 90% discount on cached historical data
const response = await client.messages.create({
  model: 'claude-4-sonnet-20250929',
  max_tokens: 4000,
  messages: messagesWithCache,
})
```

**Rate Limiting Strategy**:
```typescript
// Rate limits: 5 RPM (requests per minute), 50K TPM (tokens per minute) for Tier 1
// No difference between streaming and single response

const rateLimiter = {
  requests: new Map<string, number[]>(), // userId -> timestamp[]

  async checkLimit(userId: string): Promise<boolean> {
    const now = Date.now()
    const userRequests = this.requests.get(userId) || []

    // Remove requests older than 1 minute
    const recentRequests = userRequests.filter(time => now - time < 60000)

    if (recentRequests.length >= 5) {
      return false // Rate limit exceeded
    }

    recentRequests.push(now)
    this.requests.set(userId, recentRequests)
    return true
  },
}

// Usage in API route
if (!await rateLimiter.checkLimit(userId)) {
  return new Response('Rate limit exceeded. Please try again in 1 minute.', {
    status: 429,
  })
}
```

**Context Management for Large Datasets**:
```typescript
// For users with >1000 transactions, summarize older data
function buildContextWindow(transactions: Transaction[]) {
  const recent = transactions.slice(0, 100) // Last 100 transactions in detail
  const older = transactions.slice(100)

  const olderSummary = older.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount
    return acc
  }, {} as Record<string, number>)

  return {
    recentTransactions: recent,
    historicalSummary: olderSummary,
  }
}
```

**Error Handling**:
```typescript
try {
  const response = await client.messages.create({ ... })
} catch (error) {
  if (error.status === 429) {
    // Rate limit hit - queue for retry
    await queueAnalysisRetry({ userId, retryAfter: 60 })
  } else if (error.status === 529) {
    // Overloaded - exponential backoff
    await queueAnalysisRetry({ userId, retryAfter: 300 })
  } else {
    // Log and notify user
    console.error('Claude API error:', error)
    await sendNotification({
      userId,
      type: 'analysis_failed',
      message: 'Unable to generate AI insights. Please try again later.',
    })
  }
}
```

**Weekly Analysis Cron Job**:
```typescript
// Vercel Cron Job or Supabase Edge Function
// Runs every Monday at 8am UTC
export async function weeklyAnalysisJob() {
  const activeUsers = await supabase
    .from('users')
    .select('id')
    .eq('notifications_enabled', true)

  for (const user of activeUsers) {
    // Stagger requests to avoid rate limits
    await delay(12000) // 5 requests per minute = 12 seconds between
    await generateWeeklyAnalysis(user.id)
  }
}
```

**Cost Optimization Notes**:
- Average weekly analysis: ~2K input tokens, ~1K output tokens
- With caching: ~200 input tokens (cached), ~1K output tokens
- Cost per analysis: ~$0.03 without cache, ~$0.027 with cache
- Monthly cost per user: ~$0.12 (4 weekly + 1 monthly analysis)
- For 10K users: ~$1,200/month in Claude API costs

### References

- [Claude API Documentation](https://docs.claude.com/en/api)
- [Claude API Rate Limits](https://docs.claude.com/en/api/rate-limits)
- [Anthropic Prompt Engineering Guide](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering)
- [Claude 4 Sonnet Announcement](https://www.anthropic.com/news/claude-sonnet-4-5)
- [Token-Saving Updates (Prompt Caching)](https://www.anthropic.com/news/token-saving-updates)

---

## 4. Testing Strategy

### Decision

Use **Mock Service Worker (MSW)** for mocking Plaid and Claude SDK APIs in integration tests, **Vitest** as test runner with Next.js 14 App Router support, and **fixture-based transaction data** for reproducible test scenarios.

### Rationale

**MSW for API Mocking**:
- Intercepts requests at network level (works with any HTTP client)
- Reusable mocks across unit tests, integration tests, and Storybook
- No need to mock individual SDK methods - mocks the HTTP layer
- Browser and Node.js support for unified testing approach

**Vitest Over Jest**:
- Native ESM support (better compatibility with Next.js 14)
- Faster test execution with native code transformation
- Compatible with React Testing Library
- Better developer experience with hot module replacement in watch mode

**Fixture Pattern for Predictability**:
- Reproducible test scenarios across all test suites
- Easy to create "edge case" datasets (e.g., user over budget, empty month)
- Version-controlled test data ensures consistent behavior
- Aligns with minimalist principle by avoiding complex test data generation

### Alternatives Considered

**1. Live API Calls in Tests (Plaid Sandbox)**
- **Rejected**: Flaky tests due to network latency and API availability
- **Rejected**: Slower test execution (network round-trips)
- **Rejected**: Harder to test edge cases (requires specific Sandbox account states)
- **Rejected**: Cannot test Claude API without incurring costs

**2. Manual SDK Method Mocking (jest.mock)**
- **Rejected**: Brittle - breaks when SDK internals change
- **Rejected**: Requires mocking each SDK method individually
- **Rejected**: Cannot test actual HTTP request/response patterns
- **Rejected**: Not reusable across different test types

**3. Jest as Test Runner**
- **Rejected**: Slower than Vitest for large codebases
- **Rejected**: Requires additional configuration for ESM and Next.js 14
- **Rejected**: Less intuitive configuration for App Router components

**4. End-to-End Tests Only (No Unit/Integration)**
- **Rejected**: Too slow for rapid feedback during development
- **Rejected**: Harder to isolate failures to specific components
- **Rejected**: Cannot test all edge cases economically

### Implementation Notes

**MSW Setup** (`tests/mocks/handlers.ts`):
```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Plaid Link Token Creation
  http.post('https://sandbox.plaid.com/link/token/create', async () => {
    return HttpResponse.json({
      link_token: 'link-sandbox-test-token',
      expiration: new Date(Date.now() + 3600000).toISOString(),
    })
  }),

  // Plaid Transactions Sync
  http.post('https://sandbox.plaid.com/transactions/sync', async ({ request }) => {
    const { cursor } = await request.json()

    if (!cursor) {
      // Initial sync - return full transaction set
      return HttpResponse.json({
        added: fixtures.transactions.initial,
        modified: [],
        removed: [],
        next_cursor: 'cursor-initial-complete',
        has_more: false,
      })
    } else {
      // Incremental sync - return updates
      return HttpResponse.json({
        added: fixtures.transactions.new,
        modified: fixtures.transactions.updated,
        removed: [],
        next_cursor: 'cursor-incremental-complete',
        has_more: false,
      })
    }
  }),

  // Claude API Messages
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = await request.json()

    // Parse user prompt to determine test scenario
    const userPrompt = body.messages[0].content
    if (userPrompt.includes('TOTAL SPENT SO FAR: $3,200')) {
      // Weekly analysis - on track scenario
      return HttpResponse.json({
        id: 'msg-test-123',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              trajectory_prediction: {
                projected_total: 4850,
                confidence: 'high',
                reasoning: 'Current pace suggests finishing under budget',
              },
              recommendations: [
                {
                  action: 'Continue current spending pace',
                  category: 'GENERAL',
                  savings: 0,
                  effort: 'easy',
                  respects_preference: null,
                },
              ],
            }),
          },
        ],
        model: 'claude-4-sonnet-20250929',
        role: 'assistant',
      })
    }
  }),
]
```

**MSW Server Setup** (`tests/setup.ts`):
```typescript
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

export const server = setupServer(...handlers)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers between tests
afterEach(() => server.resetHandlers())

// Clean up after all tests
afterAll(() => server.close())
```

**Test Fixtures** (`tests/fixtures/transactions.ts`):
```typescript
export const transactionFixtures = {
  initial: [
    {
      transaction_id: 'tx-1',
      merchant_name: 'Whole Foods',
      amount: 89.43,
      date: '2025-10-01',
      personal_finance_category: {
        primary: 'FOOD_AND_DRINK',
        detailed: 'FOOD_AND_DRINK_GROCERIES',
      },
    },
    // ... more transactions
  ],
  new: [
    {
      transaction_id: 'tx-new-1',
      merchant_name: 'Starbucks',
      amount: 6.25,
      date: '2025-10-23',
      personal_finance_category: {
        primary: 'FOOD_AND_DRINK',
        detailed: 'FOOD_AND_DRINK_COFFEE',
      },
    },
  ],
  updated: [
    {
      transaction_id: 'tx-1',
      merchant_name: 'Whole Foods',
      amount: 92.50, // Amount corrected
      date: '2025-10-01',
      personal_finance_category: {
        primary: 'FOOD_AND_DRINK',
        detailed: 'FOOD_AND_DRINK_GROCERIES',
      },
    },
  ],
}

export const budgetFixtures = {
  onTrack: {
    total_budget: 5000,
    total_spent: 3200,
    percentage: 64,
    days_remaining: 9,
  },
  overBudget: {
    total_budget: 5000,
    total_spent: 5400,
    percentage: 108,
    days_remaining: 5,
  },
}
```

**Integration Test Example** (`tests/integration/webhook-sync.test.ts`):
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { POST as webhookHandler } from '@/app/api/webhooks/plaid/route'

describe('Plaid Webhook Sync', () => {
  beforeEach(async () => {
    // Seed test database with user and bank connection
    await seedTestData({
      userId: 'test-user-1',
      bankConnection: {
        access_token: 'access-sandbox-test',
        sync_cursor: null, // No previous sync
      },
    })
  })

  it('should process SYNC_UPDATES_AVAILABLE webhook and sync transactions', async () => {
    const webhookPayload = {
      webhook_type: 'TRANSACTIONS',
      webhook_code: 'SYNC_UPDATES_AVAILABLE',
      item_id: 'test-item-1',
      historical_update_complete: true,
    }

    const { req, res } = createMocks({
      method: 'POST',
      body: webhookPayload,
      headers: {
        'plaid-verification': 'mock-jwt-token', // MSW will intercept verification
      },
    })

    await webhookHandler(req)

    // Verify transactions were synced
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', 'test-user-1')

    expect(transactions).toHaveLength(transactionFixtures.initial.length)
    expect(transactions[0].merchant_name).toBe('Whole Foods')
  })
})
```

**Unit Test for AI Analysis** (`tests/unit/ai-analysis.test.ts`):
```typescript
import { describe, it, expect } from 'vitest'
import { generateWeeklyAnalysis } from '@/lib/ai/analysis'

describe('AI Weekly Analysis', () => {
  it('should predict under-budget for on-track spending', async () => {
    const result = await generateWeeklyAnalysis({
      userId: 'test-user-1',
      transactions: transactionFixtures.initial,
      budget: budgetFixtures.onTrack,
      preferences: 'Coffee is important for productivity',
    })

    // MSW returns mocked Claude response
    expect(result.trajectory_prediction.projected_total).toBe(4850)
    expect(result.trajectory_prediction.confidence).toBe('high')
    expect(result.recommendations).toHaveLength(1)
  })
})
```

**Webhook Security Test** (`tests/integration/webhook-verification.test.ts`):
```typescript
import { describe, it, expect } from 'vitest'
import { verifyPlaidWebhook } from '@/lib/plaid/webhook-verification'

describe('Plaid Webhook Verification', () => {
  it('should reject webhooks with invalid signatures', async () => {
    const isValid = await verifyPlaidWebhook(
      'invalid-jwt-token',
      JSON.stringify({ webhook_type: 'TRANSACTIONS' })
    )

    expect(isValid).toBe(false)
  })

  it('should reject webhooks older than 5 minutes', async () => {
    const oldToken = generateMockJWT({ iat: Date.now() / 1000 - 400 })

    const isValid = await verifyPlaidWebhook(
      oldToken,
      JSON.stringify({ webhook_type: 'TRANSACTIONS' })
    )

    expect(isValid).toBe(false)
  })
})
```

**Test Coverage Requirements**:
- 80% code coverage for critical paths (auth, transaction sync, AI analysis)
- 100% coverage for webhook verification logic
- Integration tests for all API routes
- Unit tests for all utility functions
- E2E tests for critical user flows (onboarding, weekly check-in)

**Running Tests**:
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run integration tests only
npm run test:integration

# Run in watch mode during development
npm run test:watch
```

### References

- [Mock Service Worker Documentation](https://mswjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Next.js 14 Testing Guide](https://nextjs.org/docs/app/guides/testing)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW in Next.js Guide](https://dev.to/mehakb7/mock-service-worker-msw-in-nextjs-a-guide-for-api-mocking-and-testing-e9m)

---

## 5. Supabase Local Development Setup

### Decision

Use **Supabase CLI** with **Docker-based local stack**, **migration-driven schema management**, and **pgTAP for RLS policy testing**.

### Rationale

**Local-First Development**:
- Zero external dependencies during development (runs fully offline)
- Instant feedback loop for schema changes and RLS policies
- No risk of corrupting production data during experimentation
- Aligns with security-first by testing RLS policies before deployment

**Migration Workflow Benefits**:
- Version-controlled database schema (all changes in Git)
- Reproducible database state across team members
- Easy rollback of schema changes if issues arise
- Automatic migration generation from schema diffs

**pgTAP for RLS Testing**:
- Database-level testing ensures RLS policies work as expected
- Tests run in transactions (fast, isolated, no cleanup needed)
- SQL-based tests are version-controlled with schema
- Catches authorization bugs before deployment

**Alignment with Constitution**:
- "Security-first" - Test RLS policies locally before exposing to users
- "Minimalist" - Single CLI tool manages entire local stack
- "Privacy-respecting" - No production data used in development

### Alternatives Considered

**1. Cloud-Only Development (Direct to Supabase Project)**
- **Rejected**: Requires internet connection for all development
- **Rejected**: Risk of corrupting shared development database
- **Rejected**: Slower feedback loop (network latency)
- **Rejected**: Cannot test destructive migrations safely

**2. Manual PostgreSQL Setup**
- **Rejected**: Requires configuring PostgREST, GoTrue, Realtime separately
- **Rejected**: No automatic parity with Supabase Cloud features
- **Rejected**: More complex onboarding for new developers
- **Rejected**: Violates minimalist principle

**3. Schema-Only Local, Cloud for Data**
- **Rejected**: Still requires internet for testing
- **Rejected**: Cannot test with realistic datasets offline
- **Rejected**: Hybrid approach adds complexity

**4. Application-Level RLS Testing Only**
- **Rejected**: Slower than database-level tests
- **Rejected**: Cannot test complex RLS policies with joins
- **Rejected**: Misses edge cases in SQL policy logic

### Implementation Notes

**Initial Setup**:
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in project
cd budget_app
supabase init

# Start local stack (PostgreSQL, PostgREST, GoTrue, Realtime, Storage)
supabase start
```

**Generated Files**:
```
budget_app/
├── supabase/
│   ├── config.toml           # Local configuration
│   ├── seed.sql              # Seed data for development
│   ├── migrations/           # Database migrations
│   │   └── 20251023_initial_schema.sql
│   └── tests/                # pgTAP tests
│       └── rls_policies.test.sql
```

**Migration Workflow**:

**Create Migration**:
```bash
# Create new migration file
supabase migration new create_transactions_table

# Edit migration file: supabase/migrations/YYYYMMDDHHMMSS_create_transactions_table.sql
```

**Example Migration** (`supabase/migrations/20251023_create_transactions.sql`):
```sql
-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_transaction_id TEXT UNIQUE NOT NULL,
  merchant_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  payment_source TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user queries
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own transactions
CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own transactions
CREATE POLICY "Users can delete own transactions"
  ON transactions
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Apply Migrations**:
```bash
# Apply all pending migrations
supabase db reset

# Alternative: Apply migrations without resetting
supabase migration up
```

**Generate Migration from Schema Diff**:
```bash
# Make changes in Supabase Studio (http://localhost:54323)
# Then generate migration from diff
supabase db diff --schema public > supabase/migrations/$(date +%Y%m%d%H%M%S)_schema_changes.sql
```

**Seed Data Strategy** (`supabase/seed.sql`):
```sql
-- Seed test users
INSERT INTO auth.users (id, email, encrypted_password)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'test@example.com', crypt('password123', gen_salt('bf'))),
  ('22222222-2222-2222-2222-222222222222', 'test2@example.com', crypt('password123', gen_salt('bf')));

-- Seed bank connections
INSERT INTO bank_connections (user_id, institution_name, access_token, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Chase Bank', 'access-sandbox-test', 'active');

-- Seed transactions
INSERT INTO transactions (user_id, plaid_transaction_id, merchant_name, amount, date, category, tags)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'tx-seed-1', 'Whole Foods', 89.43, '2025-10-01', 'GROCERIES', '{}'),
  ('11111111-1111-1111-1111-111111111111', 'tx-seed-2', 'Starbucks', 6.25, '2025-10-02', 'DINING', '{}'),
  ('11111111-1111-1111-1111-111111111111', 'tx-seed-3', 'Shell Gas', 45.00, '2025-10-03', 'TRANSPORTATION', '{non-negotiable}');

-- Seed budgets
INSERT INTO budgets (user_id, month, year, total_budget)
VALUES
  ('11111111-1111-1111-1111-111111111111', 10, 2025, 5000);

INSERT INTO budget_categories (budget_id, category_name, budgeted_amount)
SELECT
  b.id,
  cat.name,
  cat.amount
FROM budgets b
CROSS JOIN (VALUES
  ('GROCERIES', 800),
  ('DINING', 300),
  ('TRANSPORTATION', 400),
  ('ENTERTAINMENT', 200)
) AS cat(name, amount)
WHERE b.user_id = '11111111-1111-1111-1111-111111111111';
```

**pgTAP RLS Policy Tests** (`supabase/tests/rls_policies.test.sql`):
```sql
BEGIN;
SELECT plan(6);

-- Test 1: User can view own transactions
SELECT results_eq(
  $$
    SET request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
    SELECT id FROM transactions;
  $$,
  $$
    SELECT id FROM transactions WHERE user_id = '11111111-1111-1111-1111-111111111111';
  $$,
  'User should only see their own transactions'
);

-- Test 2: User cannot view other users transactions
SELECT is_empty(
  $$
    SET request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
    SELECT id FROM transactions WHERE user_id = '22222222-2222-2222-2222-222222222222';
  $$,
  'User should not see other users transactions'
);

-- Test 3: User can insert own transactions
SELECT lives_ok(
  $$
    SET request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
    INSERT INTO transactions (user_id, plaid_transaction_id, merchant_name, amount, date, category)
    VALUES ('11111111-1111-1111-1111-111111111111', 'tx-test-new', 'Test Merchant', 50.00, '2025-10-23', 'OTHER');
  $$,
  'User should be able to insert their own transactions'
);

-- Test 4: User cannot insert transactions for other users
SELECT throws_ok(
  $$
    SET request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
    INSERT INTO transactions (user_id, plaid_transaction_id, merchant_name, amount, date, category)
    VALUES ('22222222-2222-2222-2222-222222222222', 'tx-test-other', 'Test Merchant', 50.00, '2025-10-23', 'OTHER');
  $$,
  'new row violates row-level security policy',
  'User should not be able to insert transactions for other users'
);

-- Test 5: Verify RLS is enabled on transactions table
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'transactions'),
  true,
  'RLS should be enabled on transactions table'
);

-- Test 6: Verify all expected RLS policies exist
SELECT is(
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'transactions'),
  4::bigint,
  'Should have 4 RLS policies on transactions table (SELECT, INSERT, UPDATE, DELETE)'
);

SELECT * FROM finish();
ROLLBACK;
```

**Run RLS Tests**:
```bash
# Run all pgTAP tests
supabase test db

# Run specific test file
supabase test db tests/rls_policies.test.sql
```

**Environment Variables** (`.env.local`):
```env
# Supabase local development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # From supabase start output
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # From supabase start output
```

**Deployment Workflow**:
```bash
# Link local project to cloud project
supabase link --project-ref your-project-ref

# Push local migrations to cloud
supabase db push

# Alternative: Generate migration from cloud changes
supabase db pull
```

**Useful Commands**:
```bash
# View local database in Supabase Studio
supabase studio

# Reset database to clean state
supabase db reset

# Generate TypeScript types from schema
supabase gen types typescript --local > types/supabase.ts

# View logs
supabase logs

# Stop local stack
supabase stop
```

### References

- [Supabase Local Development Overview](https://supabase.com/docs/guides/local-development/overview)
- [Supabase CLI Getting Started](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Supabase Testing Overview](https://supabase.com/docs/guides/local-development/testing/overview)
- [Advanced pgTAP Testing](https://supabase.com/docs/guides/local-development/testing/pgtap-extended)
- [Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments)

---

## 6. Transaction Categorization Approach

**UPDATE 2025-10-24**: The automatic merchant pattern learning feature has been **removed for MVP simplification**. The current implementation uses:
- **Plaid `personal_finance_category`** for initial automatic categorization
- **Manual user override** via UI (stored in `user_category_override` field)
- **No automatic pattern learning** from user recategorizations

The pattern learning infrastructure documented below can be re-added in future iterations without architectural changes. For now, users must manually recategorize each transaction independently.

---

### Decision (Original - Pattern Learning Removed)

Use **Plaid's `personal_finance_category`** (PFC) as the primary categorization source with **user recategorization learning** stored in a `merchant_category_overrides` table, and **confidence-based fallback** to user patterns.

### Rationale

**Plaid PFC Advantages**:
- 98%+ accuracy for high-confidence categorizations (Plaid's ML model)
- 16 primary categories, 104 detailed categories (granular but manageable)
- Continuously improved by Plaid across millions of transactions
- Includes confidence scores (VERY_HIGH, HIGH, MEDIUM) for adaptive handling
- No additional API costs - included in Transactions API

**User Learning Mechanism**:
- Respects user preferences while maintaining Plaid's baseline accuracy
- Only overrides future transactions from same merchant (not retroactive)
- Tracks confidence with user feedback to improve over time
- Aligns with "context-aware AI" philosophy from design proposal

**Alignment with Constitution**:
- "Minimalist" - Leverage existing Plaid categorization vs. building custom ML
- "Privacy-respecting" - User corrections stay in their database, not shared
- "User agency" - Users can override any categorization

### Alternatives Considered

**1. Custom ML Categorization Model**
- **Rejected**: Requires training data, ongoing model maintenance
- **Rejected**: Cannot match Plaid's accuracy without significant investment
- **Rejected**: Violates minimalist principle
- **Rejected**: Slower to production

**2. Plaid Enrich API**
- **Considered**: Provides enhanced categorization with additional context
- **Deferred**: Additional cost ($0.03 per enrichment as of 2025)
- **Future**: Could be added for premium tier or low-confidence transactions

**3. Rule-Based Categorization (Merchant Name Matching)**
- **Rejected**: Brittle - merchant names vary ("Starbucks #1234" vs "SBUX")
- **Rejected**: Requires extensive manual rule maintenance
- **Rejected**: Cannot handle new merchants or edge cases
- **Rejected**: Lower accuracy than ML-based approaches

**4. No User Overrides (Plaid Only)**
- **Rejected**: Ignores legitimate user preferences (e.g., Target as Groceries vs Shopping)
- **Rejected**: Reduces trust in system if users cannot correct mistakes
- **Rejected**: Misses opportunity for personalization

### Implementation Notes

**Database Schema** (`supabase/migrations/20251023_categorization.sql`):
```sql
-- Merchant category overrides table
CREATE TABLE merchant_category_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_name_normalized TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  confidence INTEGER DEFAULT 1, -- Increments with each confirmation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, merchant_name_normalized)
);

-- Index for fast merchant lookups
CREATE INDEX idx_merchant_overrides_user_merchant
  ON merchant_category_overrides(user_id, merchant_name_normalized);

-- RLS policies
ALTER TABLE merchant_category_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own overrides"
  ON merchant_category_overrides
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Merchant Name Normalization**:
```typescript
function normalizeMerchantName(merchantName: string): string {
  return merchantName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')         // Normalize whitespace
    .replace(/\s*(store|#)\s*\d+/g, '') // Remove store numbers
    .trim()
}

// Examples:
// "Starbucks #1234" -> "starbucks"
// "WHOLE FOODS MKT" -> "whole foods mkt"
// "Target Store #T-0123" -> "target"
```

**Category Mapping** (Plaid PFC to App Categories):
```typescript
// Map Plaid's detailed categories to our 8 primary categories
const CATEGORY_MAPPING: Record<string, string> = {
  'FOOD_AND_DRINK_GROCERIES': 'GROCERIES',
  'FOOD_AND_DRINK_RESTAURANT': 'DINING',
  'FOOD_AND_DRINK_COFFEE': 'DINING',
  'FOOD_AND_DRINK_FAST_FOOD': 'DINING',
  'TRANSPORTATION_GAS': 'TRANSPORTATION',
  'TRANSPORTATION_PARKING': 'TRANSPORTATION',
  'TRANSPORTATION_PUBLIC_TRANSIT': 'TRANSPORTATION',
  'TRANSPORTATION_RIDE_SHARE': 'TRANSPORTATION',
  'ENTERTAINMENT_MOVIES_AND_MUSIC': 'ENTERTAINMENT',
  'ENTERTAINMENT_SPORTING_EVENTS': 'ENTERTAINMENT',
  'GENERAL_MERCHANDISE_DEPARTMENT_STORES': 'SHOPPING',
  'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES': 'SHOPPING',
  'HEALTHCARE_SERVICES': 'HEALTHCARE',
  'HEALTHCARE_PHARMACY': 'HEALTHCARE',
  'UTILITIES': 'UTILITIES',
  // ... more mappings
}

function mapPlaidCategory(plaidCategory: { primary: string; detailed: string }): string {
  // Try detailed category first
  if (plaidCategory.detailed && CATEGORY_MAPPING[plaidCategory.detailed]) {
    return CATEGORY_MAPPING[plaidCategory.detailed]
  }

  // Fall back to primary category
  if (plaidCategory.primary && CATEGORY_MAPPING[plaidCategory.primary]) {
    return CATEGORY_MAPPING[plaidCategory.primary]
  }

  // Default to OTHER
  return 'OTHER'
}
```

**Categorization Logic with User Learning**:
```typescript
async function categorizeTransaction(
  transaction: PlaidTransaction,
  userId: string
): Promise<{ category: string; subcategory: string | null; source: 'user' | 'plaid' }> {
  const normalizedMerchant = normalizeMerchantName(
    transaction.merchant_name || transaction.name
  )

  // 1. Check for user override first
  const { data: override } = await supabase
    .from('merchant_category_overrides')
    .select('category, subcategory')
    .eq('user_id', userId)
    .eq('merchant_name_normalized', normalizedMerchant)
    .single()

  if (override) {
    return {
      category: override.category,
      subcategory: override.subcategory,
      source: 'user',
    }
  }

  // 2. Use Plaid's categorization
  const plaidCategory = transaction.personal_finance_category

  if (plaidCategory) {
    return {
      category: mapPlaidCategory(plaidCategory),
      subcategory: plaidCategory.detailed,
      source: 'plaid',
    }
  }

  // 3. Fallback to OTHER
  return {
    category: 'OTHER',
    subcategory: null,
    source: 'plaid',
  }
}
```

**User Recategorization Handler**:
```typescript
async function recategorizeTransaction(
  transactionId: string,
  newCategory: string,
  userId: string
) {
  // 1. Update transaction
  const { data: transaction } = await supabase
    .from('transactions')
    .update({
      category: newCategory,
      user_modified: true,
    })
    .eq('id', transactionId)
    .eq('user_id', userId)
    .select('merchant_name')
    .single()

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  const normalizedMerchant = normalizeMerchantName(transaction.merchant_name)

  // 2. Check if override already exists
  const { data: existingOverride } = await supabase
    .from('merchant_category_overrides')
    .select('id, confidence')
    .eq('user_id', userId)
    .eq('merchant_name_normalized', normalizedMerchant)
    .single()

  if (existingOverride) {
    // 3a. Update existing override (increment confidence)
    await supabase
      .from('merchant_category_overrides')
      .update({
        category: newCategory,
        confidence: existingOverride.confidence + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingOverride.id)
  } else {
    // 3b. Create new override
    await supabase
      .from('merchant_category_overrides')
      .insert({
        user_id: userId,
        merchant_name_normalized: normalizedMerchant,
        category: newCategory,
        confidence: 1,
      })
  }

  // 4. Check for pattern and prompt user
  const { count: merchantTransactionCount } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .ilike('merchant_name', `%${normalizedMerchant}%`)

  if (merchantTransactionCount >= 3) {
    // Show prompt: "Should future transactions from [Merchant] be [Category]?"
    return {
      showPrompt: true,
      merchantName: transaction.merchant_name,
      suggestedCategory: newCategory,
    }
  }

  return { showPrompt: false }
}
```

**Bulk Recategorization with Learning**:
```typescript
async function bulkRecategorizeTransactions(
  transactionIds: string[],
  newCategory: string,
  userId: string
) {
  // 1. Update all transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .update({
      category: newCategory,
      user_modified: true,
    })
    .in('id', transactionIds)
    .eq('user_id', userId)
    .select('merchant_name')

  if (!transactions) {
    throw new Error('Transactions not found')
  }

  // 2. Group by merchant and update overrides
  const merchantGroups = transactions.reduce((acc, tx) => {
    const normalized = normalizeMerchantName(tx.merchant_name)
    acc[normalized] = (acc[normalized] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  for (const [merchant, count] of Object.entries(merchantGroups)) {
    await supabase
      .from('merchant_category_overrides')
      .upsert({
        user_id: userId,
        merchant_name_normalized: merchant,
        category: newCategory,
        confidence: count,
      })
  }
}
```

**Confidence-Based UI Indicators**:
```typescript
function getCategoryConfidenceIndicator(transaction: Transaction): string {
  if (transaction.user_modified) {
    return 'User confirmed'
  }

  if (transaction.categorization_source === 'user') {
    return 'Based on your past categorizations'
  }

  // Plaid confidence levels (if stored)
  if (transaction.plaid_confidence === 'VERY_HIGH') {
    return 'High confidence'
  } else if (transaction.plaid_confidence === 'HIGH') {
    return 'Confident'
  } else {
    return 'Suggested - please review'
  }
}
```

**Category Distribution Analytics**:
```typescript
// For AI analysis - provide category accuracy metrics
async function getCategoryAccuracyMetrics(userId: string) {
  const { data: stats } = await supabase.rpc('get_category_stats', {
    p_user_id: userId,
  })

  return {
    totalTransactions: stats.total,
    userModifiedCount: stats.user_modified,
    userModifiedPercentage: (stats.user_modified / stats.total) * 100,
    topMerchantOverrides: stats.top_overrides,
  }
}
```

**Database Function for Stats** (SQL):
```sql
CREATE OR REPLACE FUNCTION get_category_stats(p_user_id UUID)
RETURNS TABLE (
  total INTEGER,
  user_modified INTEGER,
  top_overrides JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total,
    COUNT(*) FILTER (WHERE user_modified = true)::INTEGER AS user_modified,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'merchant', merchant_name_normalized,
          'category', category,
          'count', confidence
        )
        ORDER BY confidence DESC
        LIMIT 10
      )
      FROM merchant_category_overrides
      WHERE user_id = p_user_id
    ) AS top_overrides
  FROM transactions
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

### References

- [Plaid Personal Finance Categories](https://plaid.com/blog/transactions-categorization-taxonomy/)
- [Plaid PFC Migration Guide](https://plaid.com/docs/transactions/pfc-migration/)
- [Plaid Personal Finance Category Taxonomy (CSV)](https://plaid.com/documents/transactions-personal-finance-category-taxonomy.csv)
- [Plaid Transactions API](https://plaid.com/docs/api/products/transactions/)
- [Plaid Enrich API](https://plaid.com/docs/api/products/enrich/)

---

## Summary

This research documentation provides comprehensive technology decisions for the AI-Powered Budget App, aligned with the project's constitution principles of minimalism, security-first design, and privacy respect. Each section includes:

1. **Clear decisions** with rationale tied to project goals
2. **Evaluated alternatives** with rejection reasons
3. **Implementation notes** with code examples
4. **References** to authoritative 2025 documentation

The technology stack leverages proven, production-ready tools (Supabase, Plaid, Claude) while maintaining simplicity and security. All decisions prioritize user privacy, data security, and maintainable code over premature optimization or unnecessary complexity.

**Key Principles Demonstrated**:
- Security-first: RLS policies, webhook verification, encrypted tokens
- Minimalist: Leverage existing services vs. building custom solutions
- Privacy-respecting: User data stays in their database, no external sharing
- User agency: User overrides, preferences, and controls throughout

**Next Steps**:
1. Review research findings with stakeholders
2. Create implementation plan based on these decisions
3. Set up local development environment using Supabase CLI
4. Begin with core authentication and transaction sync features
5. Iterate on AI analysis once foundational features are stable
