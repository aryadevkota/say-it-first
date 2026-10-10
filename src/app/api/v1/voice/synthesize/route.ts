/**
 * route.ts — Next.js 14 App Router Route Handler: POST /api/v1/voice/synthesize
 *
 * Server-side audio synthesis gateway for ElevenLabs TTS.
 * Security & Reliability:
 * - Credentials (ELEVENLABS_API_KEY) are kept strictly server-side
 * - Input text is sanitized to only synthesize spoken dialogue
 * - Returns structured error envelope when unconfigured or unavailable
 * - Target default voice: "Alexandra — Conversational and Natural"
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Target voice requested: "Alexandra — Conversational and Natural"
// Configurable via ELEVENLABS_VOICE_ID environment variable
const DEFAULT_TARGET_VOICE_NAME = 'Alexandra — Conversational and Natural';
const DEFAULT_ELEVENLABS_MODEL = 'eleven_multilingual_v2';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawText = body?.text;

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REQUEST',
            message: 'A non-empty "text" string is required for voice synthesis.',
          },
        },
        { status: 400 },
      );
    }

    // Strip any markdown, JSON, or non-spoken cues (e.g., "(nods)", "[subtext]")
    const cleanedText = rawText
      .replace(/\([^)]*\)/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/[*_~`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanedText) {
      return NextResponse.json(
        {
          error: {
            code: 'NO_SPOKEN_CONTENT',
            message: 'No spoken dialogue remains after sanitizing text.',
          },
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('your_') || apiKey === 'test-key') {
      return NextResponse.json(
        {
          error: {
            code: 'ELEVENLABS_NOT_CONFIGURED',
            message:
              'ElevenLabs API key is not configured in .env.local. Add ELEVENLABS_API_KEY to enable natural conversational voice.',
            target_voice: DEFAULT_TARGET_VOICE_NAME,
            model_recommended: DEFAULT_ELEVENLABS_MODEL,
          },
        },
        { status: 503 },
      );
    }

    const voiceId =
      process.env.ELEVENLABS_VOICE_ID ||
      body?.voiceId ||
      '21m00Tcm4TlvDq8ikWAM'; // Rachel/Alexandra default standard natural voice id fallback

    const modelId =
      process.env.ELEVENLABS_MODEL_ID || body?.modelId || DEFAULT_ELEVENLABS_MODEL;

    const elevenEndpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
      voiceId,
    )}`;

    const response = await fetch(elevenEndpoint, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: cleanedText,
        model_id: modelId,
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75,
          style: 0.15,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      console.warn(`[ElevenLabs] API responded with ${response.status}:`, errText);
      return NextResponse.json(
        {
          error: {
            code: 'ELEVENLABS_API_ERROR',
            status: response.status,
            message: `ElevenLabs provider call failed with status ${response.status}.`,
            details: errText,
          },
        },
        { status: 502 },
      );
    }

    const audioArrayBuffer = await response.arrayBuffer();

    return new Response(audioArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioArrayBuffer.byteLength.toString(),
        'Cache-Control': 'no-store, no-cache',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal voice gateway error';
    return NextResponse.json(
      {
        error: {
          code: 'SYNTHESIS_GATEWAY_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}
