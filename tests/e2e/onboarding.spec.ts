import { test, expect } from '@playwright/test';

test.describe('Onboarding E2E', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';

  test('should complete full onboarding flow in under 5 minutes', async ({ page }) => {
    // This test should FAIL until T048 and T049-T066 are implemented
    const startTime = Date.now();

    // Step 1: Navigate to signup page
    await page.goto('/signup');
    await expect(page).toHaveTitle(/Budget App/);

    // Step 2: Fill signup form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // Step 3: Wait for redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/);

    // Step 4: Connect bank with Plaid Link
    await page.click('button:has-text("Connect Bank")');

    // Wait for Plaid Link iframe to load
    const plaidFrame = page.frameLocator('iframe[src*="plaid"]');
    await plaidFrame.locator('button:has-text("Continue")').click();

    // Select test institution (Chase in sandbox)
    await plaidFrame.locator('text=Chase').click();

    // Enter test credentials
    await plaidFrame.locator('input[name="username"]').fill('user_good');
    await plaidFrame.locator('input[name="password"]').fill('pass_good');
    await plaidFrame.locator('button:has-text("Submit")').click();

    // Select accounts
    await plaidFrame.locator('input[type="checkbox"]').first().check();
    await plaidFrame.locator('button:has-text("Continue")').click();

    // Step 5: Wait for transaction import (should show progress indicator)
    await expect(page.locator('text=Importing transactions')).toBeVisible();
    await expect(page.locator('text=Importing transactions')).not.toBeVisible({ timeout: 30000 });

    // Step 6: View categorized transactions
    await expect(page).toHaveURL(/\/onboarding\/setup-budget/);
    await expect(page.locator('text=Recent Transactions')).toBeVisible();

    // Verify at least some transactions are displayed
    const transactionCards = page.locator('[data-testid="transaction-card"]');
    await expect(transactionCards).toHaveCount({ min: 1 });

    // Step 7: Review budget suggestions
    await expect(page.locator('text=Suggested Budget')).toBeVisible();

    // Verify suggested amounts are displayed for common categories
    await expect(page.locator('text=Dining & Coffee')).toBeVisible();
    await expect(page.locator('input[name="budget-dining-coffee"]')).toHaveValue(/\d+/);

    // Step 8: Accept suggested budget or modify amounts
    await page.fill('input[name="budget-dining-coffee"]', '200');
    await page.fill('input[name="budget-transportation"]', '150');
    await page.click('button:has-text("Create Budget")');

    // Step 9: Verify dashboard loads with budget
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();
    await expect(page.locator('text=Current Budget Utilization')).toBeVisible();

    // Verify budget is displayed
    const budgetWidget = page.locator('[data-testid="budget-utilization-widget"]');
    await expect(budgetWidget).toBeVisible();
    await expect(budgetWidget).toContainText(/\$\d+/); // Shows dollar amount

    // Step 10: Verify time constraint (SC-001: < 5 minutes)
    const endTime = Date.now();
    const elapsedSeconds = (endTime - startTime) / 1000;
    expect(elapsedSeconds).toBeLessThan(300); // 5 minutes = 300 seconds
  });

  test('should allow user to skip bank connection', async ({ page }) => {
    // This test should FAIL until T048 and skip flow UI are implemented

    // Step 1: Sign up
    await page.goto('/signup');
    await page.fill('input[name="email"]', `skip-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // Step 2: Skip bank connection
    await expect(page).toHaveURL(/\/onboarding\/connect-bank/);
    await page.click('button:has-text("Skip for now")');

    // Step 3: Create manual budget
    await expect(page).toHaveURL(/\/onboarding\/setup-budget/);
    await expect(page.locator('text=Set Your Budget')).toBeVisible();

    // No suggested amounts (no transaction history)
    await page.fill('input[name="budget-dining-coffee"]', '200');
    await page.fill('input[name="budget-transportation"]', '150');
    await page.fill('input[name="budget-housing"]', '1500');
    await page.click('button:has-text("Create Budget")');

    // Step 4: Verify dashboard loads
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();

    // Verify no transactions but budget exists
    await expect(page.locator('text=No transactions yet')).toBeVisible();
  });

  test('should show validation errors for invalid signup', async ({ page }) => {
    // This test should FAIL until T049 and validation are implemented

    await page.goto('/signup');

    // Test 1: Weak password
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', '123'); // Too short
    await page.fill('input[name="confirmPassword"]', '123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=at least 12 characters')).toBeVisible();

    // Test 2: Invalid email
    await page.fill('input[name="email"]', 'not-an-email');
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=valid email')).toBeVisible();

    // Test 3: Password mismatch
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should display progress indicator during onboarding', async ({ page }) => {
    // This test should FAIL until T052 (onboarding layout with progress) is implemented

    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // Verify progress indicator shows steps
    await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible();
    await expect(page.locator('text=1. Connect Bank')).toBeVisible();
    await expect(page.locator('text=2. Review Transactions')).toBeVisible();
    await expect(page.locator('text=3. Set Budget')).toBeVisible();

    // Current step should be highlighted
    await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/active/);
  });

  test('should handle Plaid Link errors gracefully', async ({ page }) => {
    // This test should FAIL until T048 and error handling are implemented

    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    await page.click('button:has-text("Connect Bank")');

    // Simulate Plaid Link error (exit without completing)
    const plaidFrame = page.frameLocator('iframe[src*="plaid"]');
    await plaidFrame.locator('button:has-text("Exit")').click();

    // Verify error message and retry option
    await expect(page.locator('text=connection was not completed')).toBeVisible();
    await expect(page.locator('button:has-text("Try Again")'))toBeVisible();
    await expect(page.locator('button:has-text("Skip for now")'))toBeVisible();
  });
});
