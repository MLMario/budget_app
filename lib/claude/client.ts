/**
 * Claude AI Client
 *
 * Configures and exports the Anthropic Claude client for AI analysis
 */

import Anthropic from '@anthropic-ai/sdk'

/**
 * Anthropic Claude AI client instance
 *
 * This client provides methods for:
 * - Generating weekly AI analysis
 * - Generating monthly AI reports
 * - Analyzing spending patterns
 * - Creating personalized recommendations
 */
export const claudeClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

/**
 * Claude configuration constants
 */
export const CLAUDE_CONFIG = {
  model: 'claude-3-5-sonnet-20241022' as const,
  maxTokens: 4096,
  temperature: 0.7,
  defaultSystemPrompt: `You are an expert financial advisor and budget analyst. Your role is to:
- Analyze user spending patterns with empathy and understanding
- Provide actionable, realistic recommendations
- Respect user-stated preferences and non-negotiable expenses
- Focus on sustainable behavior changes, not extreme restrictions
- Explain recommendations clearly with expected outcomes
- Acknowledge when users are doing well, not just problems

Always format your responses as structured JSON with clear fields for trajectory predictions, recommendations, and confidence levels.`,
} as const

/**
 * Verify Claude API key is configured
 */
export function verifyClaudeConfig(): void {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required')
  }
}

/**
 * Type helper for Claude client
 */
export type ClaudeClient = typeof claudeClient

/**
 * Claude message parameters type
 */
export interface ClaudeMessageParams {
  model?: string
  maxTokens?: number
  temperature?: number
  system?: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

/**
 * Helper function to create Claude message parameters with defaults
 */
export function createClaudeParams(
  userMessage: string,
  systemPrompt?: string
): ClaudeMessageParams {
  return {
    model: CLAUDE_CONFIG.model,
    maxTokens: CLAUDE_CONFIG.maxTokens,
    temperature: CLAUDE_CONFIG.temperature,
    system: systemPrompt || CLAUDE_CONFIG.defaultSystemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  }
}

/**
 * Parse Claude JSON response
 *
 * Extracts JSON from Claude's response, handling various formats:
 * - Direct JSON object
 * - JSON in code blocks (```json ... ```)
 * - JSON with surrounding text
 */
export function parseClaudeResponse<T>(content: string): T {
  // Try to find JSON in code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1])
  }

  // Try to find JSON object directly
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  // If no JSON found, throw error
  throw new Error('No valid JSON found in Claude response')
}
