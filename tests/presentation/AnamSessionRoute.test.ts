/**
 * AnamSessionRoute.test.ts — Server-Side Anam Avatar & ElevenLabs Agent Session Token API Tests
 *
 * Verifies:
 * 1. Safe credential handling: ANAM_API_KEY and ELEVENLABS_API_KEY are kept strictly server-side
 * 2. Fail-fast diagnostics: returns 503 error envelope when ANAM_API_KEY or ELEVENLABS_API_KEY is unconfigured
 * 3. Payload contract: fetches signed URL from ElevenLabs, passes elevenLabsAgentSettings to Anam with Cara 4
 * 4. Token delivery: returns session_token to client for browser WebRTC initialization
 * 5. Single-flight deduplication: coalesces concurrent calls without duplicate upstream API requests
 * 6. Error handling: translates upstream errors to structured failure envelopes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST, DELETE } from '../../src/app/api/v1/avatar/session/route';
import {
  resetInFlightSessionPromiseForTesting,
  ANAM_TARGET_AVATAR_ID,
  DEFAULT_AVATAR_MODEL,
} from '../../src/app/api/v1/avatar/session/service';

describe('Anam Avatar Session Route (POST /api/v1/avatar/session)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    resetInFlightSessionPromiseForTesting();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    resetInFlightSessionPromiseForTesting();
  });

  it('fails fast with 503 when ANAM_API_KEY is missing', async () => {
    delete process.env.ANAM_API_KEY;
    process.env.ELEVENLABS_API_KEY = 'valid-elevenlabs-key';

    const req = new Request('http://localhost:3000/api/v1/avatar/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);

    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('ANAM_NOT_CONFIGURED');
    expect(data.error.avatar_id).toBe(ANAM_TARGET_AVATAR_ID);
    expect(data.error.message).toContain('ANAM_API_KEY is not configured');
  });

  it('fails fast with 503 when ELEVENLABS_API_KEY is missing', async () => {
    process.env.ANAM_API_KEY = 'valid-anam-key';
    delete process.env.ELEVENLABS_API_KEY;

    const req = new Request('http://localhost:3000/api/v1/avatar/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);

    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('ELEVENLABS_NOT_CONFIGURED');
  });

  it('rejects placeholder or test keys with 503', async () => {
    process.env.ANAM_API_KEY = 'your_anam_key_here';
    process.env.ELEVENLABS_API_KEY = 'valid-elevenlabs-key';

    const req = new Request('http://localhost:3000/api/v1/avatar/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error.code).toBe('ANAM_NOT_CONFIGURED');
  });

  it('mints Anam session token with server-side ElevenLabs agent settings', async () => {
    process.env.ANAM_API_KEY = 'valid-test-anam-api-key';
    process.env.ELEVENLABS_API_KEY = 'valid-test-elevenlabs-key';
    process.env.ELEVENLABS_AGENT_ID = 'test-agent-12345';

    const capturedCalls: Array<{ url: string; options?: RequestInit }> = [];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      capturedCalls.push({ url: String(url), options: init });

      if (String(url).includes('elevenlabs.io')) {
        return new Response(
          JSON.stringify({
            signed_url: 'wss://api.elevenlabs.io/v1/convai/conversation?test_signature=123',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (String(url).includes('anam.ai')) {
        return new Response(
          JSON.stringify({
            sessionToken: 'jwt-mock-session-token-12345',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response('Not found', { status: 404 });
    });

    const req = new Request('http://localhost:3000/api/v1/avatar/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initialDialogue: 'Hello, welcome to our conversation practice.',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.provider).toBe('anam');
    expect(data.session_token).toBe('jwt-mock-session-token-12345');
    expect(data.avatar_id).toBe(ANAM_TARGET_AVATAR_ID);
    expect(data.agent_id).toBe('test-agent-12345');

    // Verify 2-step upstream flow: 1. ElevenLabs signed URL, 2. Anam session token
    expect(capturedCalls.length).toBe(2);

    // Call 1: ElevenLabs
    const elCall = capturedCalls[0];
    expect(elCall.url).toContain('https://api.elevenlabs.io/v1/convai/conversation/get-signed-url');
    expect(elCall.url).toContain('agent_id=test-agent-12345');
    const elHeaders = elCall.options?.headers as Record<string, string>;
    expect(elHeaders['xi-api-key']).toBe('valid-test-elevenlabs-key');

    // Call 2: Anam
    const anamCall = capturedCalls[1];
    expect(anamCall.url).toBe('https://api.anam.ai/v1/auth/session-token');
    const anamHeaders = anamCall.options?.headers as Record<string, string>;
    expect(anamHeaders['Authorization']).toBe('Bearer valid-test-anam-api-key');

    const anamBody = JSON.parse(String(anamCall.options?.body));
    expect(anamBody.personaConfig.avatarId).toBe(ANAM_TARGET_AVATAR_ID);
    expect(anamBody.personaConfig.avatarModel).toBe(DEFAULT_AVATAR_MODEL);
    expect(anamBody.personaConfig.directorNotes).toEqual({
      presetStyle: 'warm',
      expressivity: 0.5,
    });
    expect(anamBody.environment.elevenLabsAgentSettings).toBeDefined();
    expect(anamBody.environment.elevenLabsAgentSettings.signedUrl).toBe(
      'wss://api.elevenlabs.io/v1/convai/conversation?test_signature=123',
    );
    expect(anamBody.environment.elevenLabsAgentSettings.agentId).toBe('test-agent-12345');
    expect(
      anamBody.environment.elevenLabsAgentSettings.conversationConfigOverride.agent.firstMessage,
    ).toBe('Hello, welcome to our conversation practice.');
  });

  it('coalesces concurrent requests with single-flight deduplication', async () => {
    process.env.ANAM_API_KEY = 'valid-test-anam-api-key';
    process.env.ELEVENLABS_API_KEY = 'valid-test-elevenlabs-key';
    process.env.ELEVENLABS_AGENT_ID = 'test-agent-12345';

    let elCalls = 0;
    let anamCalls = 0;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      // Simulate network delay
      await new Promise((r) => setTimeout(r, 20));

      if (String(url).includes('elevenlabs.io')) {
        elCalls++;
        return new Response(
          JSON.stringify({ signed_url: 'wss://api.elevenlabs.io/test-signed-url' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (String(url).includes('anam.ai')) {
        anamCalls++;
        return new Response(
          JSON.stringify({ sessionToken: 'shared-session-token' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response('Not found', { status: 404 });
    });

    const req1 = new Request('http://localhost:3000/api/v1/avatar/session', { method: 'POST' });
    const req2 = new Request('http://localhost:3000/api/v1/avatar/session', { method: 'POST' });

    const [res1, res2] = await Promise.all([POST(req1), POST(req2)]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const data1 = await res1.json();
    const data2 = await res2.json();

    expect(data1.session_token).toBe('shared-session-token');
    expect(data2.session_token).toBe('shared-session-token');
    expect(elCalls).toBe(1);
    expect(anamCalls).toBe(1);
  });

  it('handles upstream Anam failure gracefully with structured error', async () => {
    process.env.ANAM_API_KEY = 'valid-key-but-invalid-permission';
    process.env.ELEVENLABS_API_KEY = 'valid-test-elevenlabs-key';
    process.env.ELEVENLABS_AGENT_ID = 'test-agent-12345';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).includes('elevenlabs.io')) {
        return new Response(
          JSON.stringify({ signed_url: 'wss://api.elevenlabs.io/test-signed-url' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const req = new Request('http://localhost:3000/api/v1/avatar/session', { method: 'POST' });
    const res = await POST(req);

    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error.code).toBe('ANAM_SESSION_FAILED');
  });

  it('DELETE route returns 200 success', async () => {
    const res = await DELETE();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
