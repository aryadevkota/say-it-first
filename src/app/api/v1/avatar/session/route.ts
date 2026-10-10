/**
 * route.ts — Next.js 14 App Router Route Handler: POST /api/v1/avatar/session
 *
 * Dedicated live avatar session negotiation gateway connecting ElevenLabs
 * real-time audio orchestration with HeyGen / LiveAvatar WebRTC video streaming.
 *
 * Target Architecture:
 * - Avatar concept: realistic adult practice partner named Eva.
 * - Locked Voice: "Alexandra — Conversational and Natural" (Voice ID: kdmDKE6EkgrWrrykO9Qt).
 * - Target audio format: PCM 24000 Hz (pcm_24000).
 * - Security: API credentials remain strictly server-side.
 * - Resilience: Gracefully falls back when unconfigured or in offline/local sandboxes.
 */

import { NextResponse } from 'next/server';
import {
  LOCKED_VOICE_ID,
  LOCKED_VOICE_NAME,
  LOCKED_MODEL_ID,
  TARGET_AUDIO_FORMAT,
} from '@/domain/entities/EvaScenarioPresentation';

export const runtime = 'nodejs';

interface AvatarSessionResponse {
  session_id: string;
  status: 'ready' | 'active' | 'connecting' | 'fallback';
  avatar: {
    name: 'Eva';
    voice_id: string;
    outfit?: string;
    background?: string;
  };
  livekit_url?: string | null;
  room_token?: string | null;
  room_name?: string | null;
  audio_format: string;
  mode: 'live' | 'fallback_local';
  voice_contract: {
    voice_id: string;
    voice_name: string;
    model_id: string;
    sample_rate: number;
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

    const liveAvatarKey = process.env.LIVEAVATAR_API_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    const hasLiveAvatarKey = isKeyConfigured(liveAvatarKey);
    const hasElevenLabsKey = isKeyConfigured(elevenLabsKey);

    const fallbackResponse: AvatarSessionResponse = {
      session_id: 'eva-session-local',
      status: 'ready',
      avatar: {
        name: 'Eva',
        voice_id: LOCKED_VOICE_ID,
        outfit: body?.outfit || 'business-attire',
        background: body?.background || 'office',
      },
      livekit_url: null,
      room_token: null,
      room_name: 'eva-local-room',
      audio_format: TARGET_AUDIO_FORMAT,
      mode: 'fallback_local',
      voice_contract: {
        voice_id: LOCKED_VOICE_ID,
        voice_name: LOCKED_VOICE_NAME,
        model_id: LOCKED_MODEL_ID,
        sample_rate: 24000,
      },
    };

    // If neither key is configured, return graceful local fallback without throwing
    if (!hasLiveAvatarKey && !hasElevenLabsKey) {
      return NextResponse.json(fallbackResponse, { status: 200 });
    }

    // When API key is available, negotiate real-time session credentials
    const sessionApiUrl =
      process.env.LIVEAVATAR_API_URL || 'https://api.liveavatar.com/v1/sessions';

    try {
      const activeKey = (liveAvatarKey || elevenLabsKey || '').trim().replace(/^["']|["']$/g, '');
      const upstreamRes = await fetch(sessionApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': activeKey,
          'xi-api-key': elevenLabsKey ? elevenLabsKey.trim().replace(/^["']|["']$/g, '') : '',
        },
        body: JSON.stringify({
          mode: 'LITE',
          avatar_id: process.env.LIVEAVATAR_AVATAR_ID || 'eva',
          elevenlabs_agent_config: {
            agent_id: process.env.ELEVENLABS_AGENT_ID || 'eva-conversational-agent',
            secret_id: process.env.LIVEAVATAR_SECRET_ID || 'eva-secret',
          },
          voice: {
            voice_id: LOCKED_VOICE_ID,
            model_id: LOCKED_MODEL_ID,
          },
          audio_format: TARGET_AUDIO_FORMAT,
          scenario: {
            scenario_id: body?.scenarioId,
            outfit: body?.outfit,
            background: body?.background,
          },
        }),
      });

      if (upstreamRes.ok) {
        const upstreamData = await upstreamRes.json();
        const liveResponse: AvatarSessionResponse = {
          session_id: upstreamData.session_id || upstreamData.id || 'eva-live-session',
          status: (upstreamData.status as any) || 'ready',
          avatar: {
            name: 'Eva',
            voice_id: LOCKED_VOICE_ID,
            outfit: body?.outfit || upstreamData.avatar?.outfit,
            background: body?.background || upstreamData.avatar?.background,
          },
          livekit_url: upstreamData.livekit_url || upstreamData.url || null,
          room_token: upstreamData.room_token || upstreamData.token || null,
          room_name: upstreamData.room_name || upstreamData.roomName || 'eva-live-room',
          audio_format: TARGET_AUDIO_FORMAT,
          mode: 'live',
          voice_contract: {
            voice_id: LOCKED_VOICE_ID,
            voice_name: LOCKED_VOICE_NAME,
            model_id: LOCKED_MODEL_ID,
            sample_rate: 24000,
          },
        };

        return NextResponse.json(liveResponse, { status: 200 });
      }

      // If upstream responded with an error, log and fallback gracefully
      console.warn(
        `[AvatarSession] Upstream returned status ${upstreamRes.status}. Engaging graceful fallback.`,
      );
      return NextResponse.json(fallbackResponse, { status: 200 });
    } catch (fetchErr) {
      console.warn('[AvatarSession] Fetch error reaching session provider. Engaging graceful fallback:', fetchErr);
      return NextResponse.json(fallbackResponse, { status: 200 });
    }
  } catch (err: unknown) {
    // Top-level catch guarantee: never throw unhandled exception
    console.error('[AvatarSession] Unexpected route handler error:', err);
    return NextResponse.json(
      {
        session_id: 'eva-session-local',
        status: 'ready',
        avatar: {
          name: 'Eva',
          voice_id: LOCKED_VOICE_ID,
        },
        mode: 'fallback_local',
        audio_format: TARGET_AUDIO_FORMAT,
      },
      { status: 200 },
    );
  }
}
