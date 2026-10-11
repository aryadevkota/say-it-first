import { NextResponse } from 'next/server';
import {
  ANAM_TARGET_AVATAR_ID,
  isKeyConfigured,
  requestAnamSessionToken,
} from './service';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const rawAnamKey = process.env.ANAM_API_KEY;
    const anamApiKey = rawAnamKey ? rawAnamKey.trim().replace(/^["']|["']$/g, '') : '';

    const rawElevenLabsKey = process.env.ELEVENLABS_API_KEY;
    const elevenLabsApiKey = rawElevenLabsKey
      ? rawElevenLabsKey.trim().replace(/^["']|["']$/g, '')
      : '';

    if (!isKeyConfigured(anamApiKey)) {
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

    if (!isKeyConfigured(elevenLabsApiKey)) {
      return NextResponse.json(
        {
          error: {
            code: 'ELEVENLABS_NOT_CONFIGURED',
            message:
              'ELEVENLABS_API_KEY is not configured in environment. Add ELEVENLABS_API_KEY in .env.local.',
          },
        },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const agentId = body?.agentId || body?.agent_id || process.env.ELEVENLABS_AGENT_ID || '';
    const avatarId = body?.avatarId || body?.avatar_id || ANAM_TARGET_AVATAR_ID;
    const firstMessage = body?.initialDialogue || body?.initial_dialogue || body?.firstMessage;
    const systemPrompt = body?.systemPrompt || body?.system_prompt;
    const forceFresh = Boolean(body?.forceFresh || body?.force_fresh);
    const disableOverrides = Boolean(body?.disableOverrides || body?.disable_overrides);

    try {
      const result = await requestAnamSessionToken({
        anamApiKey,
        elevenLabsApiKey,
        agentId,
        avatarId,
        firstMessage,
        systemPrompt,
        forceFresh,
        disableOverrides,
      });

      return NextResponse.json(
        {
          provider: 'anam',
          session_token: result.sessionToken,
          avatar_id: result.avatarId,
          agent_id: result.agentId,
          overrides_applied: Boolean(result.overridesApplied),
          conversation_fresh: Boolean(result.conversationFresh),
          ...(result.deduplicated ? { deduplicated: true } : {}),
        },
        { status: 200 },
      );
    } catch (err: any) {
      const status =
        err?.status === 401 || err?.status === 403
          ? 502
          : err?.status || (err?.code?.endsWith('_NOT_CONFIGURED') ? 503 : 500);

      return NextResponse.json(
        {
          error: {
            code: err?.code || 'AVATAR_SESSION_FAILED',
            message: err?.message || 'Failed to initialize avatar session.',
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
          code: 'AVATAR_GATEWAY_ERROR',
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
