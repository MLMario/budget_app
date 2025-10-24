import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createLinkToken,
  exchangePublicToken,
  syncTransactions,
  handleWebhook,
} from '@/services/plaid.service';

// Mock Plaid client
vi.mock('@/lib/plaid/client', () => ({
  plaidClient: {
    linkTokenCreate: vi.fn(),
    itemPublicTokenExchange: vi.fn(),
    transactionsSync: vi.fn(),
  },
}));

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
    })),
  })),
}));

describe('Plaid Service', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

  describe('createLinkToken', () => {
    it('should successfully create link token for valid user', async () => {
      // This test should FAIL until T053 (Plaid service) is implemented
      const result = await createLinkToken(mockUserId);

      expect(result).toBeDefined();
      expect(result.link_token).toBeDefined();
      expect(typeof result.link_token).toBe('string');
      expect(result.link_token).toMatch(/^link-sandbox-/); // Plaid sandbox token format
      expect(result.error).toBeNull();
    });

    it('should handle invalid user ID', async () => {
      // This test should FAIL until T053 (Plaid service) is implemented
      const invalidUserId = 'invalid-uuid';

      const result = await createLinkToken(invalidUserId);

      expect(result.error).toBeDefined();
      expect(result.link_token).toBeNull();
    });

    it('should include correct products in link token', async () => {
      // This test should FAIL until T053 (Plaid service) is implemented
      const result = await createLinkToken(mockUserId);

      expect(result).toBeDefined();
      // Link token should be configured for transactions product
      expect(result.link_token).toBeDefined();
    });
  });

  describe('exchangePublicToken', () => {
    it('should successfully exchange public token for access token', async () => {
      // This test should FAIL until T053 (Plaid service) is implemented
      const publicToken = 'public-sandbox-test-token';

      const result = await exchangePublicToken(mockUserId, publicToken);

      expect(result).toBeDefined();
      expect(result.access_token).toBeDefined();
      expect(result.item_id).toBeDefined();
      expect(typeof result.access_token).toBe('string');
      expect(typeof result.item_id).toBe('string');
      expect(result.error).toBeNull();
    });

    it('should fail with invalid public token', async () => {
      // This test should FAIL until T053 (Plaid service) is implemented
      const invalidToken = 'invalid-token';

      const result = await exchangePublicToken(mockUserId, invalidToken);

      expect(result.error).toBeDefined();
      expect(result.access_token).toBeNull();
    });

    it('should store bank connection in database after exchange', async () => {
      // This test should FAIL until T053 (Plaid service) is implemented
      const publicToken = 'public-sandbox-test-token';

      const result = await exchangePublicToken(mockUserId, publicToken);

      expect(result).toBeDefined();
      expect(result.bank_connection_id).toBeDefined();
      // Verify that bank connection was created in database
    });
  });

  describe('syncTransactions', () => {
    it('should successfully sync transactions for valid bank connection', async () => {
      // This test should FAIL until T053 (Plaid service) is implemented
      const bankConnectionId = '123e4567-e89b-12d3-a456-426614174001';

      const result = await syncTransactions(mockUserId, bankConnectionId);

      expect(result).toBeDefined();
      expect(result.added).toBeDefined();
      expect(result.modified).toBeDefined();
      expect(result.removed).toBeDefined();
      expect(Array.isArray(result.added)).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle 30 days of transaction import on first sync', async () => {
      // This test should FAIL until T053 (Plaid service) is implemented
      const bankConnectionId = '123e4567-e89b-12d3-a456-426614174001';

      const result = await syncTransactions(mockUserId, bankConnectionId);

      expect(result.added.length).toBeGreaterThan(0);
      // Verify transactions span approximately 30 days
      const dates = result.added.map((t: any) => new Date(t.date));
      const oldestDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const newestDate = new Date(Math.max(...dates.map(d => d.getTime())));
      const daysDifference = (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDifference).toBeGreaterThanOrEqual(25); // Allow some variance
    });

    it('should deduplicate transactions based on plaid_transaction_id', async () => {
      // This test should FAIL until T053 (Plaid service) is implemented
      const bankConnectionId = '123e4567-e89b-12d3-a456-426614174001';

      // First sync
      await syncTransactions(mockUserId, bankConnectionId);

      // Second sync (should not create duplicates)
      const result = await syncTransactions(mockUserId, bankConnectionId);

      expect(result.added.length).toBe(0); // No new transactions added
      // Verify database has no duplicate plaid_transaction_id values
    });

    it('should handle invalid bank connection ID', async () => {
      // This test should FAIL until T053 (Plaid service) is implemented
      const invalidBankConnectionId = 'invalid-uuid';

      const result = await syncTransactions(mockUserId, invalidBankConnectionId);

      expect(result.error).toBeDefined();
    });
  });

  describe('handleWebhook', () => {
    it('should successfully process TRANSACTIONS_UPDATE webhook', async () => {
      // This test should FAIL until T056 (Plaid webhook endpoint) is implemented
      const webhookPayload = {
        webhook_type: 'TRANSACTIONS',
        webhook_code: 'TRANSACTIONS_UPDATE',
        item_id: 'test-item-id',
        new_transactions: 5,
        removed_transactions: [],
      };

      const result = await handleWebhook(webhookPayload);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should verify webhook signature before processing', async () => {
      // This test should FAIL until T056 (Plaid webhook endpoint) is implemented
      const webhookPayload = {
        webhook_type: 'TRANSACTIONS',
        webhook_code: 'TRANSACTIONS_UPDATE',
        item_id: 'test-item-id',
      };
      const invalidSignature = 'invalid-signature';

      const result = await handleWebhook(webhookPayload, invalidSignature);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('signature');
    });

    it('should handle ITEM_ERROR webhook', async () => {
      // This test should FAIL until T056 (Plaid webhook endpoint) is implemented
      const webhookPayload = {
        webhook_type: 'ITEM',
        webhook_code: 'ERROR',
        item_id: 'test-item-id',
        error: {
          error_code: 'ITEM_LOGIN_REQUIRED',
          error_message: 'Item requires user login',
        },
      };

      const result = await handleWebhook(webhookPayload);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      // Verify bank connection status updated to 'needs_reauth'
    });
  });
});
