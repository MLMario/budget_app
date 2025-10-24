/**
 * Simple Test with Playwright Test Runner
 */

import { test, expect } from '@playwright/test'

test('should pass a basic test', () => {
  expect(1 + 1).toBe(2)
})

test('should handle strings', () => {
  expect('hello').toBe('hello')
})

test('should handle arrays', () => {
  const arr = [1, 2, 3]
  expect(arr).toHaveLength(3)
  expect(arr[0]).toBe(1)
})
