import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration for Unit Tests
 *
 * Using Playwright Test Runner for unit tests instead of Vitest
 * because of "No test suite found" issues with Vitest 4.0.2
 */
export default defineConfig({
  testDir: "./tests/unit",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report-unit" }],
  ],

  // No webServer needed for unit tests
  use: {
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "unit-tests",
      testMatch: /.*\.test\.ts$/,
    },
  ],
});
