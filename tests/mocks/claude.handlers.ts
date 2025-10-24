/**
 * Mock Service Worker (MSW) Handlers for Claude SDK
 *
 * Mock responses for Anthropic Claude API endpoints used in tests
 */

import { http, HttpResponse } from 'msw'

const CLAUDE_BASE_URL = 'https://api.anthropic.com/v1'

/**
 * Mock weekly analysis response
 */
const mockWeeklyAnalysisResponse = {
  trajectory_prediction: {
    projected_total: 1450.00,
    budget_total: 1475.00,
    difference: 25.00,
    status: 'under_budget' as const,
    likelihood_percentage: 85,
  },
  recommendations: [
    {
      id: 'rec_1',
      action: 'Reduce coffee shop visits by 1 per week',
      category: 'Dining Out',
      expected_savings: 30.00,
      implementation:
        'Visit coffee shops 3 times instead of 4 this week. Your preference for coffee shop work sessions is respected - this is a minor adjustment.',
      effort_level: 'easy' as const,
      preferences_respected: [
        'Respects your preference that coffee shop visits are important for mental health',
      ],
      rank: 1,
      affected_transaction_ids: ['tx1', 'tx2', 'tx3'],
    },
    {
      id: 'rec_2',
      action: 'Cook dinner at home instead of dining out once',
      category: 'Dining Out',
      expected_savings: 35.00,
      implementation:
        'Plan one home-cooked meal to replace a restaurant visit this week.',
      effort_level: 'medium' as const,
      preferences_respected: [],
      rank: 2,
      affected_transaction_ids: ['tx4'],
    },
  ],
  confidence_level: 85,
}

/**
 * Mock monthly report response
 */
const mockMonthlyReportResponse = {
  recommendations: [
    {
      id: 'rec_1',
      action: 'Reduce subscription services',
      category: 'Entertainment',
      expected_savings: 50.00,
      implementation:
        'Cancel 2 unused streaming subscriptions. Keep the services you actively use.',
      effort_level: 'easy' as const,
      preferences_respected: [],
      rank: 1,
      affected_transaction_ids: ['tx5', 'tx6'],
    },
    {
      id: 'rec_2',
      action: 'Optimize grocery shopping',
      category: 'Groceries',
      expected_savings: 75.00,
      implementation:
        'Plan meals weekly and buy in bulk. Consider switching to a cheaper store for staples.',
      effort_level: 'medium' as const,
      preferences_respected: [],
      rank: 2,
      affected_transaction_ids: ['tx7', 'tx8', 'tx9'],
    },
    {
      id: 'rec_3',
      action: 'Limit impulse purchases',
      category: 'Shopping',
      expected_savings: 100.00,
      implementation:
        'Wait 24 hours before making non-essential purchases over $50.',
      effort_level: 'medium' as const,
      preferences_respected: [],
      rank: 3,
      affected_transaction_ids: ['tx10'],
    },
  ],
  summary: {
    total_spent: 2850.00,
    total_budget: 3000.00,
    top_categories: [
      {
        category: 'Groceries',
        spent: 650.00,
        budgeted: 700.00,
        is_non_negotiable: false,
      },
      {
        category: 'Dining Out',
        spent: 450.00,
        budgeted: 400.00,
        is_non_negotiable: false,
      },
      {
        category: 'Transportation',
        spent: 350.00,
        budgeted: 400.00,
        is_non_negotiable: false,
      },
    ],
    anomalies: [
      {
        description: 'Unusual spike in shopping expenses',
        suggestion:
          'Consider setting a monthly limit for discretionary purchases',
      },
    ],
  },
  confidence_level: 92,
}

/**
 * Mock Claude messages endpoint
 */
export const claudeMessagesHandler = http.post(
  `${CLAUDE_BASE_URL}/messages`,
  async ({ request }) => {
    const body = await request.json() as any
    const userMessage = body.messages?.[0]?.content || ''

    // Determine which type of analysis based on user message content
    let response
    if (userMessage.includes('weekly') || userMessage.includes('trajectory')) {
      response = mockWeeklyAnalysisResponse
    } else if (userMessage.includes('monthly')) {
      response = mockMonthlyReportResponse
    } else {
      // Default to weekly
      response = mockWeeklyAnalysisResponse
    }

    return HttpResponse.json({
      id: 'msg_test_12345',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
      model: 'claude-3-5-sonnet-20241022',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 1500,
        output_tokens: 800,
      },
    })
  }
)

/**
 * Mock Claude streaming messages endpoint (for future use)
 */
export const claudeStreamingMessagesHandler = http.post(
  `${CLAUDE_BASE_URL}/messages`,
  async ({ request }) => {
    const headers = request.headers.get('accept')

    if (headers?.includes('text/event-stream')) {
      // Return streaming response
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder()

          // Send initial event
          controller.enqueue(
            encoder.encode(
              'event: message_start\ndata: {"type":"message_start","message":{"id":"msg_test_12345","type":"message","role":"assistant"}}\n\n'
            )
          )

          // Send content
          controller.enqueue(
            encoder.encode(
              `event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"${JSON.stringify(
                mockWeeklyAnalysisResponse
              )}"}}\n\n`
            )
          )

          // Send done event
          controller.enqueue(
            encoder.encode(
              'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\n'
            )
          )

          controller.close()
        },
      })

      return new HttpResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // Fallback to regular handler
    return claudeMessagesHandler()
  }
)

/**
 * All Claude mock handlers
 */
export const claudeHandlers = [claudeMessagesHandler]
