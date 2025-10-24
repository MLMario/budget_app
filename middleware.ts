/**
 * Next.js Middleware
 *
 * Handles:
 * - Auth protection for dashboard routes
 * - Redirects for unauthenticated users
 * - Session refresh
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/budgets', '/transactions', '/goals', '/ai-insights', '/settings']
  const isProtectedRoute = protectedRoutes.some((route) =>
    url.pathname.startsWith(route)
  )

  // Auth routes that should redirect to dashboard if already authenticated
  const authRoutes = ['/login', '/signup', '/reset-password']
  const isAuthRoute = authRoutes.some((route) => url.pathname.startsWith(route))

  // If accessing a protected route without authentication, redirect to login
  if (isProtectedRoute && !user) {
    url.pathname = '/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If accessing an auth route while authenticated, redirect to dashboard
  if (isAuthRoute && user) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // If accessing root while authenticated, redirect to dashboard
  if (url.pathname === '/' && user) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
