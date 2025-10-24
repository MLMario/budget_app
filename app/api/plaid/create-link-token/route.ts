import { NextRequest, NextResponse } from 'next/server';
import { createLinkToken } from '@/services/plaid.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const result = await createLinkToken(userId);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { link_token: result.link_token },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error creating link token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
