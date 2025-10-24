/**
 * Supabase Client for Server Components
 *
 * This client is used in React Server Components, Server Actions, and Route Handlers.
 * It uses Next.js cookies() for auth session management.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

/**
 * Create a Supabase client for use in Server Components
 *
 * This client:
 * - Runs on the server
 * - Uses Next.js cookies() for session management
 * - Automatically handles token refresh
 * - Respects cookie attributes for security
 *
 * @returns Supabase client instance
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase admin client with service role key
 *
 * WARNING: This client bypasses Row Level Security (RLS).
 * Only use for admin operations or server-side tasks that
 * require elevated permissions.
 *
 * @returns Supabase admin client instance
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op for admin client
        },
      },
    }
  )
}

/**
 * Type helper for Supabase server client
 */
export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
