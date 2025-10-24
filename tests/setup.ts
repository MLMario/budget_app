/**
 * Test Setup
 *
 * Configures test environment with MSW for API mocking
 */

import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { plaidHandlers } from './mocks/plaid.handlers'
import { claudeHandlers } from './mocks/claude.handlers'

// Setup MSW server with all handlers
export const server = setupServer(...plaidHandlers, ...claudeHandlers)

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
})

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
})

// Clean up after all tests
afterAll(() => {
  server.close()
})

// Set up test environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.PLAID_CLIENT_ID = 'test-plaid-client-id'
process.env.PLAID_SECRET = 'test-plaid-secret'
process.env.PLAID_ENV = 'sandbox'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
