/**
 * service.ts — Anam Avatar Session Token Minting Service
 *
 * Dedicated server-side service for issuing short-lived Anam session tokens
 * with audio passthrough enabled for avatar ae2ea8c1-db28-47e3-b6ea-493e4ed3c554.
 */

export const ANAM_TARGET_AVATAR_ID = 'ae2ea8c1-db28-47e3-b6ea-493e4ed3c554';

export function isKeyConfigured(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) return false;
  if (trimmed.startsWith('your_') || trimmed === 'test-key') return false;
  return true;
}

// In-flight token creation promise deduplication for concurrent requests (e.g. React Strict Mode)
let inFlightSessionPromise: Promise<{ sessionToken: string }> | null = null;

export function resetInFlightSessionPromiseForTesting(): void {
  inFlightSessionPromise = null;
}

export interface AnamSessionResult {
  sessionToken: string;
  avatarId: string;
  deduplicated?: boolean;
}

export async function requestAnamSessionToken(apiKey: string): Promise<AnamSessionResult> {
  // Coalesce rapid concurrent requests
  if (inFlightSessionPromise) {
    try {
      const shared = await inFlightSessionPromise;
      return {
        sessionToken: shared.sessionToken,
        avatarId: ANAM_TARGET_AVATAR_ID,
        deduplicated: true,
      };
    } catch {
      // Fall through to retry on fresh call
    }
  }

  const executeSessionCreation = async (): Promise<{ sessionToken: string }> => {
    const response = await fetch('https://api.anam.ai/v1/auth/session-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personaConfig: {
          avatarId: ANAM_TARGET_AVATAR_ID,
          enableAudioPassthrough: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown upstream error');
      console.warn(`[Anam] Session token creation failed (${response.status}):`, errorText);
      const error: any = new Error(
        `Anam session token creation failed with status ${response.status}`,
      );
      error.status = response.status;
      error.details = errorText;
      throw error;
    }

    const data = await response.json();
    if (!data?.sessionToken) {
      throw new Error('Anam response did not contain a valid sessionToken');
    }

    return { sessionToken: data.sessionToken };
  };

  inFlightSessionPromise = executeSessionCreation();

  try {
    const { sessionToken } = await inFlightSessionPromise;
    return {
      sessionToken,
      avatarId: ANAM_TARGET_AVATAR_ID,
    };
  } finally {
    inFlightSessionPromise = null;
  }
}
