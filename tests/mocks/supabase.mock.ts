/**
 * Mock Supabase Client for Unit Tests
 *
 * Provides mock implementations of Supabase Auth and Database methods
 * for unit testing without requiring a real Supabase instance.
 */

import { vi } from 'vitest'

// Mock user data
export const mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  created_at: '2025-10-23T00:00:00Z',
  email_confirmed_at: '2025-10-23T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  role: 'authenticated',
}

export const mockExistingUser = {
  id: 'existing-user-id',
  email: 'alice@example.com',
  created_at: '2025-01-01T00:00:00Z',
  email_confirmed_at: '2025-01-01T00:00:00Z',
}

// Create mock Supabase client
export const createMockSupabaseClient = () => {
  const mockAuthSignUp = vi.fn()
  const mockAuthSignIn = vi.fn()
  const mockAuthSignOut = vi.fn()
  const mockAuthResetPassword = vi.fn()
  const mockAuthUpdateUser = vi.fn()
  const mockAuthGetUser = vi.fn()
  const mockAuthVerifyOtp = vi.fn()

  const mockDbInsert = vi.fn()
  const mockDbSelect = vi.fn()
  const mockDbUpdate = vi.fn()
  const mockDbDelete = vi.fn()
  const mockDbFrom = vi.fn()

  const mockSupabase = {
    auth: {
      signUp: mockAuthSignUp,
      signInWithPassword: mockAuthSignIn,
      signOut: mockAuthSignOut,
      resetPasswordForEmail: mockAuthResetPassword,
      updateUser: mockAuthUpdateUser,
      getUser: mockAuthGetUser,
      verifyOtp: mockAuthVerifyOtp,
    },
    from: mockDbFrom,
  }

  // Setup default from() chain with full query builder support
  const createQueryBuilder = () => ({
    insert: mockDbInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockReturnValue({
          data: null,
          error: null
        }),
        data: null,
        error: null
      }),
      data: null,
      error: null
    }),
    select: mockDbSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue({
            data: null,
            error: null
          }),
          data: null,
          error: null
        }),
        single: vi.fn().mockReturnValue({
          data: null,
          error: null
        }),
        order: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              data: [],
              error: null
            }),
            data: [],
            error: null
          }),
          limit: vi.fn().mockReturnValue({
            data: [],
            error: null
          }),
          data: [],
          error: null
        }),
        data: [],
        error: null
      }),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnValue({
            data: [],
            error: null
          }),
          data: [],
          error: null
        }),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue({
          data: [],
          error: null
        }),
        data: [],
        error: null
      }),
      single: vi.fn().mockReturnValue({
        data: null,
        error: null
      }),
      data: [],
      error: null
    }),
    update: mockDbUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: null,
              error: null
            }),
            data: null,
            error: null
          }),
          data: null,
          error: null
        }),
        data: null,
        error: null
      }),
      data: null,
      error: null
    }),
    delete: mockDbDelete.mockReturnValue({
      in: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          data: null,
          error: null
        }),
        data: null,
        error: null
      }),
      eq: vi.fn().mockReturnValue({
        data: null,
        error: null
      }),
      data: null,
      error: null
    }),
  })

  mockDbFrom.mockImplementation(() => createQueryBuilder())

  return {
    client: mockSupabase,
    mocks: {
      auth: {
        signUp: mockAuthSignUp,
        signIn: mockAuthSignIn,
        signOut: mockAuthSignOut,
        resetPassword: mockAuthResetPassword,
        updateUser: mockAuthUpdateUser,
        getUser: mockAuthGetUser,
        verifyOtp: mockAuthVerifyOtp,
      },
      db: {
        from: mockDbFrom,
        insert: mockDbInsert,
        select: mockDbSelect,
        update: mockDbUpdate,
        delete: mockDbDelete,
      },
    },
  }
}

// Helper to setup successful signup
export const setupSuccessfulSignUp = (mockClient: any) => {
  mockClient.mocks.auth.signUp.mockResolvedValue({
    data: {
      user: mockUser,
      session: null,
    },
    error: null,
  })

  mockClient.mocks.db.insert.mockReturnValue({
    data: null,
    error: null,
  })
}

// Helper to setup duplicate email error
export const setupDuplicateEmailError = (mockClient: any) => {
  mockClient.mocks.auth.signUp.mockResolvedValue({
    data: { user: null, session: null },
    error: {
      message: 'User already registered',
      status: 400,
      name: 'AuthApiError',
    },
  })
}

// Helper to setup weak password error
export const setupWeakPasswordError = (mockClient: any) => {
  mockClient.mocks.auth.signUp.mockResolvedValue({
    data: { user: null, session: null },
    error: {
      message: 'Password should be at least 6 characters',
      status: 422,
      name: 'AuthWeakPasswordError',
    },
  })
}

// Helper to setup successful sign in
export const setupSuccessfulSignIn = (mockClient: any) => {
  mockClient.mocks.auth.signIn.mockResolvedValue({
    data: {
      user: mockUser,
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      },
    },
    error: null,
  })
}

// Helper to setup invalid credentials error
export const setupInvalidCredentialsError = (mockClient: any) => {
  mockClient.mocks.auth.signIn.mockResolvedValue({
    data: { user: null, session: null },
    error: {
      message: 'Invalid login credentials',
      status: 400,
      name: 'AuthApiError',
    },
  })
}

// Helper to setup successful sign out
export const setupSuccessfulSignOut = (mockClient: any) => {
  mockClient.mocks.auth.signOut.mockResolvedValue({
    error: null,
  })
}

// Helper to setup successful password reset
export const setupSuccessfulPasswordReset = (mockClient: any) => {
  mockClient.mocks.auth.resetPassword.mockResolvedValue({
    data: {},
    error: null,
  })
}

// Helper to setup successful get user
export const setupSuccessfulGetUser = (mockClient: any) => {
  mockClient.mocks.auth.getUser.mockResolvedValue({
    data: { user: mockUser },
    error: null,
  })
}

// Helper to setup no user (not authenticated)
export const setupNoUser = (mockClient: any) => {
  mockClient.mocks.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  })
}
