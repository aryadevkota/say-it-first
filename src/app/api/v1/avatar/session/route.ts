import { NextResponse } from 'next/server';
import {
  ANAM_TARGET_AVATAR_ID,
  isKeyConfigured,
  requestAnamSessionToken,
} from './service';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const rawApiKey = process.env.ANAM_API_KEY;
    const apiKey = rawApiKey ? rawApiKey.trim().replace(/^["']|["']$/g, '') : '';

    if (!isKeyConfigured(apiKey)) {
      return NextResponse.json(
        {
          error: {
            code: 'ANAM_NOT_CONFIGURED',
            message:
              'ANAM_API_KEY is not configured in environment. Add ANAM_API_KEY in .env.local to enable the Anam live avatar stream.',
            avatar_id: ANAM_TARGET_AVATAR_ID,
          },
        },
        { status: 503 },
      );
    }

    try {
      const result = await requestAnamSessionToken(apiKey);
      return NextResponse.json(
        {
          provider: 'anam',
          session_token: result.sessionToken,
          avatar_id: result.avatarId,
          ...(result.deduplicated ? { deduplicated: true } : {}),
        },
        { status: 200 },
      );
    } catch (err: any) {
      const status = err?.status === 401 || err?.status === 403 ? 502 : (err?.status || 500);
      return NextResponse.json(
        {
          error: {
            code: 'ANAM_SESSION_FAILED',
            message: err?.message || 'Failed to initialize Anam avatar session token.',
            details: err?.details,
          },
        },
        { status },
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      {
        error: {
          code: 'ANAM_GATEWAY_ERROR',
          message: `Avatar session gateway encountered an error: ${message}`,
        },
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  return NextResponse.json({ success: true }, { status: 200 });
}
