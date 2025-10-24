/**
 * Authentication Service
 *
 * Handles user authentication using Supabase Auth
 * Provides methods for signup, signin, signout, password reset, and session management
 */

import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types'

export interface SignUpParams {
  email: string
  password: string
}

export interface SignInParams {
  email: string
  password: string
}

export interface ResetPasswordParams {
  email: string
}

export interface AuthResponse {
  user: User | null
  error: Error | null
}

/**
 * Sign up a new user
 *
 * @param params - Email and password
 * @returns User object and error (if any)
 */
export async function signUp(params: SignUpParams): Promise<AuthResponse> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      return { user: null, error }
    }

    if (!data.user) {
      return { user: null, error: new Error('User creation failed') }
    }

    // Create user preferences record
    const { error: prefsError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: data.user.id,
        preferences_text: null,
        notification_email_weekly: true,
        notification_email_monthly: true,
        notification_budget_warning: true,
        notification_budget_alert: true,
      })

    if (prefsError) {
      console.error('Failed to create user preferences:', prefsError)
      // Don't fail signup if preferences creation fails
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
        email_confirmed_at: data.user.email_confirmed_at || null,
      },
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error : new Error('Unknown error during signup'),
    }
  }
}

/**
 * Sign in an existing user
 *
 * @param params - Email and password
 * @returns User object and error (if any)
 */
export async function signIn(params: SignInParams): Promise<AuthResponse> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    })

    if (error) {
      return { user: null, error }
    }

    if (!data.user) {
      return { user: null, error: new Error('Sign in failed') }
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
        email_confirmed_at: data.user.email_confirmed_at || null,
      },
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error : new Error('Unknown error during signin'),
    }
  }
}

/**
 * Sign out the current user
 *
 * @returns Error if any
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error }
    }

    return { error: null }
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Unknown error during signout'),
    }
  }
}

/**
 * Send password reset email
 *
 * @param params - Email address
 * @returns Error if any
 */
export async function resetPassword(
  params: ResetPasswordParams
): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(params.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/confirm`,
    })

    if (error) {
      return { error }
    }

    return { error: null }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error
          : new Error('Unknown error during password reset'),
    }
  }
}

/**
 * Update user password
 *
 * @param newPassword - New password
 * @returns Error if any
 */
export async function updatePassword(
  newPassword: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return { error }
    }

    return { error: null }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error
          : new Error('Unknown error during password update'),
    }
  }
}

/**
 * Get current user session
 *
 * @returns User object or null if not authenticated
 */
export async function getSession(): Promise<User | null> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email!,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at || null,
    }
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Get current user ID
 *
 * @returns User ID or null if not authenticated
 */
export async function getUserId(): Promise<string | null> {
  const user = await getSession()
  return user?.id || null
}

/**
 * Check if user is authenticated
 *
 * @returns True if user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getSession()
  return user !== null
}

/**
 * Verify user email with token
 *
 * @param token - Email verification token
 * @returns Error if any
 */
export async function verifyEmail(token: string): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    })

    if (error) {
      return { error }
    }

    return { error: null }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error
          : new Error('Unknown error during email verification'),
    }
  }
}
