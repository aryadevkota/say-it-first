/**
 * AnamSessionRoute.test.ts — Server-Side Anam Avatar Session Token API Tests
 *
 * Verifies:
 * 1. Safe credential handling: ANAM_API_KEY is kept strictly server-side
 * 2. Fail-fast diagnostics: returns 503 error envelope when ANAM_API_KEY is unconfigured or placeholder
 * 3. Payload contract: sends personaConfig with avatarId ae2ea8c1-db28-47e3-b6ea-493e4ed3c554 and enableAudioPassthrough: true
 * 4. Token delivery: returns session_token to client for browser WebRTC initialization
 * 5. Single-flight deduplication: coalesces concurrent calls without duplicate upstream API requests
 * 6. Error handling: translates upstream errors to structured failure envelopes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST, DELETE } from '../../src/app/api/v1/avatar/session/route';
import { resetInFlightSessionPromiseForTesting, ANAM_TARGET_AVATAR_ID } from '../../src/app/api/v1/avatar/session/service';

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
    expect(data.error.avatar_id).toBe('ae2ea8c1-db28-47e3-b6ea-493e4ed3c554');
    expect(data.error.message).toContain('ANAM_API_KEY is not configured');
  });

  it('rejects placeholder or test keys with 503', async () => {
    process.env.ANAM_API_KEY = 'your_anam_key_here';

    const req = new Request('http://localhost:3000/api/v1/avatar/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error.code).toBe('ANAM_NOT_CONFIGURED');
  });

  it('mints Anam session token with selected avatar ID and audio passthrough enabled', async () => {
    process.env.ANAM_API_KEY = 'valid-test-anam-api-key';

    let capturedUrl = '';
    let capturedOptions: RequestInit | undefined;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      capturedUrl = String(url);
      capturedOptions = init;
      return new Response(
        JSON.stringify({
          sessionToken: 'jwt-mock-session-token-12345',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    const req = new Request('http://localhost:3000/api/v1/avatar/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.provider).toBe('anam');
    expect(data.session_token).toBe('jwt-mock-session-token-12345');
    expect(data.avatar_id).toBe('ae2ea8c1-db28-47e3-b6ea-493e4ed3c554');

    // Verify upstream request contract
    expect(capturedUrl).toBe('https://api.anam.ai/v1/auth/session-token');
    const headers = capturedOptions?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer valid-test-anam-api-key');
    expect(headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(String(capturedOptions?.body));
    expect(body.personaConfig.avatarId).toBe('ae2ea8c1-db28-47e3-b6ea-493e4ed3c554');
    expect(body.personaConfig.enableAudioPassthrough).toBe(true);
  });

  it('coalesces concurrent requests with single-flight deduplication', async () => {
    process.env.ANAM_API_KEY = 'valid-test-anam-api-key';

    let fetchCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      fetchCount++;
      // Simulate network delay
      await new Promise((r) => setTimeout(r, 20));
      return new Response(
        JSON.stringify({ sessionToken: 'shared-session-token' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
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
    expect(fetchCount).toBe(1);
  });

  it('handles upstream Anam failure gracefully with structured error', async () => {
    process.env.ANAM_API_KEY = 'valid-key-but-invalid-permission';

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

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
