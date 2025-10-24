/**
 * Example E2E Test
 *
 * Basic Playwright test to verify test setup is working
 */

import { test, expect } from '@playwright/test'

test.describe('Basic Setup Verification', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/')

    // Verify page loads
    await expect(page).toHaveTitle(/Budget App/)

    // Verify basic elements exist
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login')

    // Verify login page loads
    await expect(page).toHaveURL(/\/login/)

    // Verify login form exists
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()

    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()

    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/signup')

    // Verify signup page loads
    await expect(page).toHaveURL(/\/signup/)

    // Verify signup form exists
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()

    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
  })

  test('should redirect to login when accessing protected route unauthenticated', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('should show validation errors on invalid login attempt', async ({ page }) => {
    await page.goto('/login')

    // Try to submit without filling fields
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Should show validation errors
    const errorMessages = page.locator('[role="alert"]')
    await expect(errorMessages.first()).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('login page should have proper ARIA labels', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveAttribute('aria-label', /email/i)

    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toHaveAttribute('aria-label', /password/i)
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')

    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()

    // Should only have one h1
    await expect(h1).toHaveCount(1)
  })

  test('should have skip to main content link', async ({ page }) => {
    await page.goto('/')

    const skipLink = page.locator('a[href="#main-content"]')
    await expect(skipLink).toBeInViewport()
  })
})

test.describe('Responsive Design', () => {
  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Verify page loads properly on mobile
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
  })

  test('should be tablet responsive', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    // Verify page loads properly on tablet
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
  })

  test('should be desktop responsive', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')

    // Verify page loads properly on desktop
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
  })
})

test.describe('Performance', () => {
  test('should load home page within 2 seconds', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(2000)
  })

  test('should have no console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/')

    expect(consoleErrors).toHaveLength(0)
  })
})
