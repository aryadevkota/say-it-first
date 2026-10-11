/**
 * service.ts — Anam Avatar Session Token Minting Service
 *
 * Dedicated server-side service for issuing short-lived Anam session tokens
 * using Anam's native Server-Side ElevenLabs Conversational AI Agent integration.
 *
 * Architecture:
 * 1. Server fetches a short-lived signed WebSocket URL from ElevenLabs Conversational AI.
 * 2. Server creates an Anam session token with environment.elevenLabsAgentSettings
 *    containing the signedUrl and agentId, plus Cara 4 persona settings.
 * 3. Anam connects to ElevenLabs server-side over WebSockets, synchronizes video and audio,
 *    and streams a single lip-synced WebRTC video/audio track to the browser.
 * 4. Zero client-side PCM playback, zero duplicate audio, and zero client-exposed API keys.
 */

export const ANAM_TARGET_AVATAR_ID = 'ae2ea8c1-db28-47e3-b6ea-493e4ed3c554';
export const DEFAULT_AVATAR_MODEL = 'cara-4';

export function isKeyConfigured(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) return false;
  if (trimmed.startsWith('your_') || trimmed === 'test-key') return false;
  return true;
}

// In-flight token creation promise deduplication for concurrent requests (e.g. React Strict Mode)
let inFlightSessionPromise: Promise<AnamSessionResult> | null = null;

export function resetInFlightSessionPromiseForTesting(): void {
  inFlightSessionPromise = null;
}

export interface AnamSessionOptions {
  anamApiKey: string;
  elevenLabsApiKey: string;
  agentId?: string;
  avatarId?: string;
  firstMessage?: string;
  systemPrompt?: string;
}

export interface AnamSessionResult {
  sessionToken: string;
  avatarId: string;
  agentId: string;
  deduplicated?: boolean;
}

export async function requestAnamSessionToken(
  options: AnamSessionOptions,
): Promise<AnamSessionResult> {
  const {
    anamApiKey,
    elevenLabsApiKey,
    agentId = process.env.ELEVENLABS_AGENT_ID?.trim().replace(/^["']|["']$/g, '') || '',
    avatarId = ANAM_TARGET_AVATAR_ID,
    firstMessage,
    systemPrompt,
  } = options;

  if (!isKeyConfigured(anamApiKey)) {
    const error: any = new Error(
      'ANAM_API_KEY is not configured in environment. Add ANAM_API_KEY in .env.local to enable the Anam live avatar stream.',
    );
    error.status = 503;
    error.code = 'ANAM_NOT_CONFIGURED';
    error.avatar_id = avatarId;
    throw error;
  }

  if (!isKeyConfigured(elevenLabsApiKey)) {
    const error: any = new Error(
      'ELEVENLABS_API_KEY is not configured in environment. Add ELEVENLABS_API_KEY in .env.local.',
    );
    error.status = 503;
    error.code = 'ELEVENLABS_NOT_CONFIGURED';
    throw error;
  }

  if (!agentId) {
    const error: any = new Error(
      'ELEVENLABS_AGENT_ID is not configured in environment or request. Add ELEVENLABS_AGENT_ID in .env.local.',
    );
    error.status = 503;
    error.code = 'ELEVENLABS_AGENT_NOT_CONFIGURED';
    throw error;
  }

  // Coalesce rapid concurrent requests (e.g. React Strict Mode)
  if (inFlightSessionPromise) {
    try {
      const shared = await inFlightSessionPromise;
      return {
        ...shared,
        deduplicated: true,
      };
    } catch {
      // Fall through to retry on fresh call
    }
  }

  const executeSessionCreation = async (): Promise<AnamSessionResult> => {
    // 1. Fetch short-lived signed WebSocket URL from ElevenLabs Conversational AI
    const elRes = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
      {
        headers: {
          'xi-api-key': elevenLabsApiKey,
        },
      },
    );

    if (!elRes.ok) {
      const elErrorText = await elRes.text().catch(() => 'Unknown ElevenLabs error');
      console.warn(`[ElevenLabs] Signed URL request failed (${elRes.status}):`, elErrorText);
      const error: any = new Error(
        `Failed to obtain ElevenLabs conversation signed URL (${elRes.status}): ${elErrorText}`,
      );
      error.status = elRes.status === 401 || elRes.status === 403 ? 502 : elRes.status;
      error.code = 'ELEVENLABS_SIGNED_URL_FAILED';
      error.details = elErrorText;
      throw error;
    }

    const elData = await elRes.json();
    const signedUrl = elData?.signed_url;
    if (!signedUrl || typeof signedUrl !== 'string') {
      const error: any = new Error('ElevenLabs response did not contain a valid signed_url');
      error.status = 502;
      error.code = 'ELEVENLABS_INVALID_SIGNED_URL';
      throw error;
    }

    // Build optional conversationConfigOverride if customized
    const conversationConfigOverride: Record<string, any> = {};
    const agentOverride: Record<string, any> = {};

    if (firstMessage && firstMessage.trim()) {
      agentOverride.firstMessage = firstMessage.trim();
    }
    if (systemPrompt && systemPrompt.trim()) {
      agentOverride.prompt = { prompt: systemPrompt.trim() };
    }
    if (Object.keys(agentOverride).length > 0) {
      conversationConfigOverride.agent = agentOverride;
    }

    // 2. Create Anam session token with ElevenLabs agent settings
    const anamRes = await fetch('https://api.anam.ai/v1/auth/session-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anamApiKey}`,
      },
      body: JSON.stringify({
        personaConfig: {
          avatarId,
          avatarModel: DEFAULT_AVATAR_MODEL,
          directorNotes: {
            presetStyle: 'warm',
            expressivity: 0.5,
          },
        },
        environment: {
          elevenLabsAgentSettings: {
            signedUrl,
            agentId,
            ...(Object.keys(conversationConfigOverride).length > 0
              ? { conversationConfigOverride }
              : {}),
          },
        },
      }),
    });

    if (!anamRes.ok) {
      const anamErrorText = await anamRes.text().catch(() => 'Unknown Anam error');
      console.warn(`[Anam] Session token creation failed (${anamRes.status}):`, anamErrorText);
      const error: any = new Error(
        `Anam session token creation failed with status ${anamRes.status}: ${anamErrorText}`,
      );
      error.status = anamRes.status === 401 || anamRes.status === 403 ? 502 : anamRes.status;
      error.code = 'ANAM_SESSION_FAILED';
      error.details = anamErrorText;
      throw error;
    }

    const anamData = await anamRes.json();
    if (!anamData?.sessionToken) {
      const error: any = new Error('Anam response did not contain a valid sessionToken');
      error.status = 502;
      error.code = 'ANAM_INVALID_TOKEN';
      throw error;
    }

    return {
      sessionToken: anamData.sessionToken,
      avatarId,
      agentId,
    };
  };

  inFlightSessionPromise = executeSessionCreation();

  try {
    const result = await inFlightSessionPromise;
    return result;
  } finally {
    inFlightSessionPromise = null;
  }
}
