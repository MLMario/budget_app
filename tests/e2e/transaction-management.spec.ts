/**
 * T072: E2E Test for Transaction Management Actions
 *
 * Tests the complete user workflow for transaction management:
 * 1. View transactions on dashboard
 * 2. Recategorize transaction from UI
 * 3. Add tags (non-negotiable/ignored) via buttons
 * 4. Search and filter transactions
 * 5. Verify UI updates in real-time
 *
 * This test should FAIL until User Story 2 UI implementation is complete
 */

import { test, expect, Page } from '@playwright/test';

test.describe('T072 - Transaction Management E2E Tests', () => {
  let page: Page;
  let testEmail: string;
  let testPassword: string;

  test.beforeAll(async ({ browser }) => {
    // Generate unique test user credentials
    testEmail = `test-e2e-tx-${Date.now()}@example.com`;
    testPassword = 'TestPassword123!';

    // Create isolated browser context with fresh storage (no cookies)
    // This prevents middleware from redirecting /signup to /dashboard
    const context = await browser.newContext();
    page = await context.newPage();

    // Sign up test user
    await page.goto('/signup');
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="signup-button"]');

    // Wait for redirect to onboarding
    await page.waitForURL('/onboarding/connect-bank');

    // Skip bank connection for testing
    await page.click('[data-testid="skip-bank-connection"]');

    // Complete onboarding
    await page.waitForURL('/onboarding/setup-budget');
    await page.fill('[data-testid="budget-category-Dining & Coffee"]', '200');
    await page.fill('[data-testid="budget-category-Entertainment"]', '150');
    await page.click('[data-testid="create-budget-button"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');

    // Import test transactions via API or UI
    // (In real implementation, this would use the transaction import flow)
  });

  test.afterAll(async () => {
    // Cleanup: Close both page and context to ensure clean state
    await page.close();
    await page.context().close();
  });

  test.describe('Transaction Recategorization from Dashboard', () => {
    test('should recategorize transaction from dashboard and update budget', async () => {
      // This test should FAIL until T073-T077 (Transaction UI) are implemented
      // Navigate to transactions page
      await page.click('[data-testid="nav-transactions"]');
      await page.waitForURL('/dashboard/transactions');

      // Verify transactions are loaded
      const transactionCards = page.locator('[data-testid^="transaction-card-"]');
      await expect(transactionCards.first()).toBeVisible();

      // Get initial budget values
      await page.click('[data-testid="nav-dashboard"]');
      const initialDiningBudget = await page.locator('[data-testid="budget-Dining & Coffee-spending"]').textContent();

      // Navigate back to transactions
      await page.click('[data-testid="nav-transactions"]');

      // Click on first transaction to open details
      await transactionCards.first().click();

      // Verify transaction details modal opens
      await expect(page.locator('[data-testid="transaction-details-modal"]')).toBeVisible();

      // Get current category
      const currentCategory = await page.locator('[data-testid="transaction-category"]').textContent();
      expect(currentCategory).toContain('Dining & Coffee');

      // Click recategorize button
      await page.click('[data-testid="recategorize-button"]');

      // Verify category selector appears
      await expect(page.locator('[data-testid="category-selector"]')).toBeVisible();

      // Select new category
      await page.click('[data-testid="category-option-Entertainment"]');

      // Click save
      await page.click('[data-testid="save-category-button"]');

      // Verify success message
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="toast-success"]')).toContainText('Category updated');

      // Verify transaction card updates in real-time
      const updatedCategory = await page.locator('[data-testid="transaction-category"]').textContent();
      expect(updatedCategory).toContain('Entertainment');

      // Navigate to dashboard and verify budget updated
      await page.click('[data-testid="nav-dashboard"]');
      await page.waitForURL('/dashboard');

      // Verify Dining & Coffee budget decreased
      const updatedDiningBudget = await page.locator('[data-testid="budget-Dining & Coffee-spending"]').textContent();
      expect(updatedDiningBudget).not.toBe(initialDiningBudget);

      // Verify Entertainment budget increased
      const entertainmentBudget = await page.locator('[data-testid="budget-Entertainment-spending"]').textContent();
      expect(parseFloat(entertainmentBudget!.replace(/[^0-9.]/g, ''))).toBeGreaterThan(0);
    });

    test('should show loading state during recategorization', async () => {
      // This test should FAIL until T073-T077 are implemented
      await page.click('[data-testid="nav-transactions"]');

      const transactionCards = page.locator('[data-testid^="transaction-card-"]');
      await transactionCards.first().click();

      await page.click('[data-testid="recategorize-button"]');
      await page.click('[data-testid="category-option-Transportation"]');

      // Verify loading spinner appears
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();

      // Wait for completion
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();

      // Verify loading spinner disappears
      await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
    });
  });

  test.describe('Transaction Tagging', () => {
    test('should add non-negotiable tag to transaction', async () => {
      // This test should FAIL until T079-T080 (Tagging UI) are implemented
      await page.click('[data-testid="nav-transactions"]');

      const transactionCards = page.locator('[data-testid^="transaction-card-"]');
      await transactionCards.first().click();

      // Click non-negotiable button
      await page.click('[data-testid="tag-non-negotiable-button"]');

      // Verify success message
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="toast-success"]')).toContainText('Tagged as non-negotiable');

      // Verify tag badge appears
      await expect(page.locator('[data-testid="tag-badge-non-negotiable"]')).toBeVisible();

      // Close modal
      await page.click('[data-testid="close-modal-button"]');

      // Verify tag badge shows on transaction card
      await expect(transactionCards.first().locator('[data-testid="tag-badge-non-negotiable"]')).toBeVisible();
    });

    test('should add ignored tag and exclude from budget', async () => {
      // This test should FAIL until T079-T080 are implemented
      await page.click('[data-testid="nav-transactions"]');

      const transactionCards = page.locator('[data-testid^="transaction-card-"]');
      await transactionCards.nth(1).click();

      // Get transaction amount
      const transactionAmount = await page.locator('[data-testid="transaction-amount"]').textContent();

      // Get current budget spending
      await page.click('[data-testid="nav-dashboard"]');
      const initialSpending = await page.locator('[data-testid="budget-Dining & Coffee-spending"]').textContent();

      // Go back to transaction and tag as ignored
      await page.click('[data-testid="nav-transactions"]');
      await transactionCards.nth(1).click();
      await page.click('[data-testid="tag-ignored-button"]');

      // Verify success message
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();

      // Navigate to dashboard
      await page.click('[data-testid="nav-dashboard"]');

      // Verify budget decreased by transaction amount
      const updatedSpending = await page.locator('[data-testid="budget-Dining & Coffee-spending"]').textContent();
      expect(updatedSpending).not.toBe(initialSpending);
    });

    test('should enforce mutual exclusivity between tags', async () => {
      // This test should FAIL until T079 is implemented
      await page.click('[data-testid="nav-transactions"]');

      const transactionCards = page.locator('[data-testid^="transaction-card-"]');
      await transactionCards.nth(2).click();

      // Add non-negotiable tag
      await page.click('[data-testid="tag-non-negotiable-button"]');
      await expect(page.locator('[data-testid="tag-badge-non-negotiable"]')).toBeVisible();

      // Try to add ignored tag
      await page.click('[data-testid="tag-ignored-button"]');

      // Verify non-negotiable tag is removed
      await expect(page.locator('[data-testid="tag-badge-non-negotiable"]')).not.toBeVisible();

      // Verify ignored tag is now present
      await expect(page.locator('[data-testid="tag-badge-ignored"]')).toBeVisible();
    });
  });

  test.describe('Transaction Search and Filter', () => {
    test('should filter transactions by category', async () => {
      // This test should FAIL until T075 (Transaction Filters) is implemented
      await page.click('[data-testid="nav-transactions"]');

      // Open filter panel
      await page.click('[data-testid="filter-button"]');
      await expect(page.locator('[data-testid="filter-panel"]')).toBeVisible();

      // Select category filter
      await page.click('[data-testid="filter-category-dropdown"]');
      await page.click('[data-testid="filter-category-option-Entertainment"]');

      // Apply filter
      await page.click('[data-testid="apply-filters-button"]');

      // Verify only Entertainment transactions are shown
      const transactionCards = page.locator('[data-testid^="transaction-card-"]');
      const count = await transactionCards.count();

      for (let i = 0; i < count; i++) {
        const category = await transactionCards.nth(i).locator('[data-testid="transaction-category"]').textContent();
        expect(category).toContain('Entertainment');
      }
    });

    test('should search transactions by merchant name', async () => {
      // This test should FAIL until T076 (Transaction Search) is implemented
      await page.click('[data-testid="nav-transactions"]');

      // Type in search box
      await page.fill('[data-testid="transaction-search-input"]', 'Starbucks');

      // Wait for debounced search
      await page.waitForTimeout(500);

      // Verify only matching transactions are shown
      const transactionCards = page.locator('[data-testid^="transaction-card-"]');
      const count = await transactionCards.count();

      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const merchant = await transactionCards.nth(i).locator('[data-testid="transaction-merchant"]').textContent();
        expect(merchant?.toLowerCase()).toContain('starbucks');
      }
    });

    test('should filter by date range', async () => {
      // This test should FAIL until T075 is implemented
      await page.click('[data-testid="nav-transactions"]');

      // Open filter panel
      await page.click('[data-testid="filter-button"]');

      // Set date range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      await page.fill('[data-testid="filter-start-date"]', startDate.toISOString().split('T')[0]);
      await page.fill('[data-testid="filter-end-date"]', endDate.toISOString().split('T')[0]);

      // Apply filter
      await page.click('[data-testid="apply-filters-button"]');

      // Verify transactions are within date range
      const transactionCards = page.locator('[data-testid^="transaction-card-"]');
      const count = await transactionCards.count();

      for (let i = 0; i < count; i++) {
        const dateText = await transactionCards.nth(i).locator('[data-testid="transaction-date"]').textContent();
        const transactionDate = new Date(dateText!);

        expect(transactionDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(transactionDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      }
    });

    test('should combine search and filters', async () => {
      // This test should FAIL until T075-T076 are implemented
      await page.click('[data-testid="nav-transactions"]');

      // Search for merchant
      await page.fill('[data-testid="transaction-search-input"]', 'Coffee');

      // Open filter panel
      await page.click('[data-testid="filter-button"]');

      // Select category
      await page.click('[data-testid="filter-category-dropdown"]');
      await page.click('[data-testid="filter-category-option-Dining & Coffee"]');

      // Apply filter
      await page.click('[data-testid="apply-filters-button"]');

      // Verify results match both search and filter criteria
      const transactionCards = page.locator('[data-testid^="transaction-card-"]');
      const count = await transactionCards.count();

      for (let i = 0; i < count; i++) {
        const merchant = await transactionCards.nth(i).locator('[data-testid="transaction-merchant"]').textContent();
        const category = await transactionCards.nth(i).locator('[data-testid="transaction-category"]').textContent();

        expect(merchant?.toLowerCase()).toContain('coffee');
        expect(category).toContain('Dining & Coffee');
      }
    });

    test('should clear all filters', async () => {
      // This test should FAIL until T075 is implemented
      await page.click('[data-testid="nav-transactions"]');

      // Apply some filters
      await page.click('[data-testid="filter-button"]');
      await page.click('[data-testid="filter-category-dropdown"]');
      await page.click('[data-testid="filter-category-option-Entertainment"]');
      await page.click('[data-testid="apply-filters-button"]');

      // Get filtered count
      const filteredCount = await page.locator('[data-testid^="transaction-card-"]').count();

      // Clear filters
      await page.click('[data-testid="filter-button"]');
      await page.click('[data-testid="clear-filters-button"]');

      // Get unfiltered count
      const unfilteredCount = await page.locator('[data-testid^="transaction-card-"]').count();

      // Unfiltered should have more transactions
      expect(unfilteredCount).toBeGreaterThan(filteredCount);
    });
  });

  test.describe('Real-time UI Updates', () => {
    test('should update transaction list in real-time after recategorization', async () => {
      // This test should FAIL until T073-T077 are implemented
      await page.click('[data-testid="nav-transactions"]');

      // Filter to show only Dining & Coffee transactions
      await page.click('[data-testid="filter-button"]');
      await page.click('[data-testid="filter-category-dropdown"]');
      await page.click('[data-testid="filter-category-option-Dining & Coffee"]');
      await page.click('[data-testid="apply-filters-button"]');

      const initialCount = await page.locator('[data-testid^="transaction-card-"]').count();

      // Recategorize first transaction to Entertainment
      await page.locator('[data-testid^="transaction-card-"]').first().click();
      await page.click('[data-testid="recategorize-button"]');
      await page.click('[data-testid="category-option-Entertainment"]');
      await page.click('[data-testid="save-category-button"]');

      // Close modal
      await page.click('[data-testid="close-modal-button"]');

      // Verify transaction is removed from filtered list
      const updatedCount = await page.locator('[data-testid^="transaction-card-"]').count();
      expect(updatedCount).toBe(initialCount - 1);
    });

    test('should update budget progress bars in real-time', async () => {
      // This test should FAIL until dashboard updates are implemented
      // Open dashboard and transactions in split view (if supported)
      // Or navigate between them and verify updates

      await page.click('[data-testid="nav-dashboard"]');

      // Get initial progress bar widths
      const initialDiningProgress = await page.locator('[data-testid="budget-Dining & Coffee-progress"]').getAttribute('aria-valuenow');

      // Navigate to transactions and recategorize
      await page.click('[data-testid="nav-transactions"]');
      await page.locator('[data-testid^="transaction-card-"]').first().click();
      await page.click('[data-testid="recategorize-button"]');
      await page.click('[data-testid="category-option-Entertainment"]');
      await page.click('[data-testid="save-category-button"]');

      // Navigate back to dashboard
      await page.click('[data-testid="nav-dashboard"]');

      // Verify progress bar updated
      const updatedDiningProgress = await page.locator('[data-testid="budget-Dining & Coffee-progress"]').getAttribute('aria-valuenow');
      expect(updatedDiningProgress).not.toBe(initialDiningProgress);
    });
  });

  test.describe('Error Handling', () => {
    test('should show error message if recategorization fails', async () => {
      // This test should FAIL until error handling is implemented
      await page.click('[data-testid="nav-transactions"]');

      // Simulate network failure (if using MSW)
      // Or test with invalid category

      await page.locator('[data-testid^="transaction-card-"]').first().click();
      await page.click('[data-testid="recategorize-button"]');

      // Try to save with invalid category or during simulated network failure
      await page.click('[data-testid="save-category-button"]');

      // Verify error toast appears
      await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="toast-error"]')).toContainText('Failed to update category');
    });

    test('should handle concurrent updates gracefully', async () => {
      // This test should FAIL until optimistic updates are implemented
      // Test scenario: User updates transaction while another update is in progress

      await page.click('[data-testid="nav-transactions"]');
      await page.locator('[data-testid^="transaction-card-"]').first().click();

      // Start first update (don't wait)
      page.click('[data-testid="recategorize-button"]');
      page.click('[data-testid="category-option-Entertainment"]');
      page.click('[data-testid="save-category-button"]');

      // Immediately try to tag (second update)
      await page.click('[data-testid="tag-non-negotiable-button"]');

      // Verify both operations complete or appropriate error shown
      // (Implementation-dependent behavior)
    });
  });
});
