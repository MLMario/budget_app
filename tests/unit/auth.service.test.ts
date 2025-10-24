import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signUp, signIn, signOut, resetPassword, getSession } from '@/services/auth.service';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      getSession: vi.fn(),
    },
  })),
}));

describe('Auth Service', () => {
  describe('signUp', () => {
    it('should successfully sign up with valid email and password', async () => {
      // This test should FAIL until T029 (auth service) is implemented
      const email = 'test@example.com';
      const password = 'SecurePassword123!';

      const result = await signUp(email, password);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(email);
      expect(result.error).toBeNull();
    });

    it('should fail with duplicate email', async () => {
      // This test should FAIL until T029 (auth service) is implemented
      const email = 'duplicate@example.com';
      const password = 'SecurePassword123!';

      // First signup
      await signUp(email, password);

      // Second signup with same email should fail
      const result = await signUp(email, password);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('already registered');
    });

    it('should fail with weak password', async () => {
      // This test should FAIL until T029 (auth service) is implemented
      const email = 'test@example.com';
      const weakPassword = '123'; // Less than 12 characters

      const result = await signUp(email, weakPassword);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('password');
    });

    it('should fail with invalid email format', async () => {
      // This test should FAIL until T029 (auth service) is implemented
      const invalidEmail = 'not-an-email';
      const password = 'SecurePassword123!';

      const result = await signUp(invalidEmail, password);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('email');
    });
  });

  describe('signIn', () => {
    it('should successfully sign in with valid credentials', async () => {
      // This test should FAIL until T029 (auth service) is implemented
      const email = 'test@example.com';
      const password = 'SecurePassword123!';

      // First sign up
      await signUp(email, password);

      // Then sign in
      const result = await signIn(email, password);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(email);
      expect(result.error).toBeNull();
    });

    it('should fail with incorrect password', async () => {
      // This test should FAIL until T029 (auth service) is implemented
      const email = 'test@example.com';
      const correctPassword = 'SecurePassword123!';
      const wrongPassword = 'WrongPassword123!';

      await signUp(email, correctPassword);

      const result = await signIn(email, wrongPassword);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid');
    });
  });

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      // This test should FAIL until T029 (auth service) is implemented
      const result = await signOut();

      expect(result.error).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email for valid email', async () => {
      // This test should FAIL until T029 (auth service) is implemented
      const email = 'test@example.com';

      const result = await resetPassword(email);

      expect(result.error).toBeNull();
    });

    it('should handle invalid email gracefully', async () => {
      // This test should FAIL until T029 (auth service) is implemented
      const invalidEmail = 'not-an-email';

      const result = await resetPassword(invalidEmail);

      expect(result.error).toBeDefined();
    });
  });

  describe('getSession', () => {
    it('should return session when user is authenticated', async () => {
      // This test should FAIL until T029 (auth service) is implemented
      const email = 'test@example.com';
      const password = 'SecurePassword123!';

      await signUp(email, password);
      await signIn(email, password);

      const result = await getSession();

      expect(result).toBeDefined();
      expect(result.session).toBeDefined();
      expect(result.session?.user.email).toBe(email);
    });

    it('should return null session when user is not authenticated', async () => {
      // This test should FAIL until T029 (auth service) is implemented
      const result = await getSession();

      expect(result.session).toBeNull();
    });
  });
});
