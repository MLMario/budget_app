/**
 * Supabase Client for Client Components
 *
 * This client is used in React Client Components (components that run in the browser).
 * It uses the browser's cookie storage for auth session management.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

/**
 * Create a Supabase client for use in Client Components
 *
 * This client:
 * - Runs in the browser
 * - Uses cookies for session management
 * - Automatically handles token refresh
 *
 * @returns Supabase client instance
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Singleton instance of the Supabase client for client components
 * This ensures we only create one client instance across the application
 */
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}

/**
 * Type helper for Supabase client
 */
export type SupabaseClient = ReturnType<typeof createClient>
