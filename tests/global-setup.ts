/**
 * Vitest Global Setup
 *
 * Runs once before all test suites.
 * MSW server is managed per-test-file to avoid context issues.
 */

export async function setup() {
  console.log('✓ Global test setup complete')
}

export async function teardown() {
  console.log('✓ Global test teardown complete')
}
