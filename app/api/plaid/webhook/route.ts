import { NextRequest, NextResponse } from 'next/server';
import { handleWebhook } from '@/services/plaid.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('plaid-verification');

    const result = await handleWebhook(body, signature || undefined);

    if (result.success) {
      return NextResponse.json({ received: true }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
