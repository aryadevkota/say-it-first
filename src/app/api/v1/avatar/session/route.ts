/**
 * route.ts — Next.js 14 App Router Route Handler: POST /api/v1/avatar/session
 *
 * Dedicated live conversational avatar session gateway connecting ElevenLabs
 * real-time speech synthesis with Simli's Speech-to-Video WebRTC API.
 *
 * Target Architecture:
 * - Avatar: Eva, rendered via Simli WebRTC Speech-to-Video
 * - Simli Face ID: afdb6a3e-3939-40aa-92df-01604c23101c
 * - Audio Format: 16kHz linear PCM (pcm_16000, 16-bit, single-channel)
 * - TTS Provider: ElevenLabs
 * - Locked Voice: "Alexandra — Conversational and Natural" (Voice ID: kdmDKE6EkgrWrrykO9Qt)
 * - Fail-Fast Validation: Explicit error responses when SIMLI_API_KEY is missing or fails
 */

import { NextResponse } from 'next/server';
import {
  LOCKED_VOICE_ID,
  LOCKED_VOICE_NAME,
  LOCKED_MODEL_ID,
  SIMLI_TARGET_AUDIO_FORMAT,
  SIMLI_DEFAULT_FACE_ID,
} from '@/domain/entities/EvaScenarioPresentation';

export const runtime = 'nodejs';

export interface SimliSessionPayload {
  apiKey: string;
  faceId: string;
  syncAudio?: boolean;
}

export interface SimliSessionResponse {
  session_id: string;
  session_token?: string | null;
  status: 'ready' | 'active';
  face_id: string;
  webrtc_url?: string | null;
  ice_servers?: Array<{ urls: string | string[]; username?: string; credential?: string }>;
  simli_endpoint?: string;
  audio_format: 'pcm_16000';
  avatar: {
    name: 'Eva';
    voice_id: string;
    face_id: string;
    outfit?: string;
    background?: string;
  };
  voice_contract: {
    voice_id: string;
    voice_name: string;
    model_id: string;
    sample_rate: 16000;
  };
}

function isKeyConfigured(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) return false;
  if (trimmed.startsWith('your_') || trimmed === 'test-key') return false;
  return true;
}

export async function POST(request: Request): Promise<Response> {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body may be empty or absent
    }

    const simliKey = process.env.SIMLI_API_KEY;
    const faceId =
      process.env.SIMLI_FACE_ID ||
      body?.faceId ||
      SIMLI_DEFAULT_FACE_ID;

    // Fail-fast validation: Enforce SIMLI_API_KEY
    if (!isKeyConfigured(simliKey)) {
      return NextResponse.json(
        {
          error: {
            code: 'SIMLI_API_KEY_MISSING',
            message:
              'SIMLI_API_KEY is not configured in .env.local. Configure your Simli API key to enable live WebRTC avatar video.',
            face_id: faceId,
            tts_provider: 'ElevenLabs',
          },
        },
        { status: 503 },
      );
    }

    const cleanedSimliKey = simliKey!.trim().replace(/^["']|["']$/g, '');

    // Simli Speech-to-Video initiation payload
    // Note: Do NOT include ttsProvider or llmProvider here. Simli explicitly forbids them when
    // external TTS (ElevenLabs) audio is streamed over WebRTC, throwing status 401.
    const simliPayload: SimliSessionPayload = {
      apiKey: cleanedSimliKey,
      faceId: faceId,
      syncAudio: true,
    };

    const simliEndpoint =
      process.env.SIMLI_API_URL || 'https://api.simli.ai/startAudioToVideoSession';

    const upstreamRes = await fetch(simliEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-simli-api-key': cleanedSimliKey,
      },
      signal: AbortSignal.timeout(4500),
      body: JSON.stringify(simliPayload),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => 'Unknown Simli error');
      console.warn(`[SimliSession] Upstream returned status ${upstreamRes.status}:`, errText);

      return NextResponse.json(
        {
          error: {
            code: 'SIMLI_SESSION_FAILED',
            status: upstreamRes.status,
            message: `Simli session initiation failed with status ${upstreamRes.status}.`,
            details: errText,
            face_id: faceId,
          },
        },
        { status: 502 },
      );
    }

    const upstreamData = await upstreamRes.json().catch(() => ({}));
    const sessionToken =
      upstreamData.session_token ||
      upstreamData.sessionToken ||
      upstreamData.token ||
      null;

    const sessionId =
      upstreamData.session_id ||
      upstreamData.sessionId ||
      upstreamData.id ||
      sessionToken ||
      `simli-${Date.now()}`;

    const webrtcUrl =
      upstreamData.webrtc_url ||
      upstreamData.webrtcUrl ||
      upstreamData.url ||
      'wss://api.simli.ai/compose/webrtc/';

    const defaultIceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];

    let iceServers = upstreamData.ice_servers || upstreamData.iceServers;
    if (!iceServers || iceServers.length === 0) {
      try {
        const iceRes = await fetch('https://api.simli.ai/compose/ice', {
          headers: {
            'Content-Type': 'application/json',
            'x-simli-api-key': cleanedSimliKey,
          },
          signal: AbortSignal.timeout(2500),
        });
        if (iceRes.ok) {
          const remoteIce = await iceRes.json().catch(() => null);
          if (Array.isArray(remoteIce) && remoteIce.length > 0) {
            iceServers = remoteIce;
          }
        }
      } catch {
        // Fall back to default STUN
      }
    }
    if (!iceServers || iceServers.length === 0) {
      iceServers = defaultIceServers;
    }

    const responsePayload: SimliSessionResponse = {
      session_id: sessionId,
      session_token: sessionToken,
      status: 'ready',
      face_id: faceId,
      webrtc_url: webrtcUrl,
      ice_servers: iceServers,
      simli_endpoint: simliEndpoint,
      audio_format: SIMLI_TARGET_AUDIO_FORMAT,
      avatar: {
        name: 'Eva',
        voice_id: LOCKED_VOICE_ID,
        face_id: faceId,
        outfit: body?.outfit || 'business-attire',
        background: body?.background || 'office',
      },
      voice_contract: {
        voice_id: LOCKED_VOICE_ID,
        voice_name: LOCKED_VOICE_NAME,
        model_id: LOCKED_MODEL_ID,
        sample_rate: 16000,
      },
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal session gateway error';
    console.error('[SimliSession] Unexpected error:', err);

    return NextResponse.json(
      {
        error: {
          code: 'SIMLI_GATEWAY_ERROR',
          message: `Simli session negotiation encountered an error: ${message}`,
        },
      },
      { status: 500 },
    );
  }
}
