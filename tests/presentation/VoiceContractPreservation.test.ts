/**
 * VoiceContractPreservation.test.ts — Audio Pipeline Preservation & Lockdown Tests
 *
 * Verifies that the ElevenLabs TTS voice pipeline remains completely locked
 * to the specified voice contract with ZERO drift:
 *
 * - Voice Name: "Alexandra — Conversational and Natural"
 * - Voice ID: "kdmDKE6EkgrWrrykO9Qt"
 * - Model: "eleven_multilingual_v2"
 * - Voice Settings:
 *     stability: 0.55
 *     similarity_boost: 0.75
 *     style: 0.15
 *     use_speaker_boost: true
 * - Endpoint: https://api.elevenlabs.io/v1/text-to-speech/{voiceId}
 * - Request Headers: xi-api-key, Content-Type: application/json, Accept: audio/mpeg
 * - Response Content-Type: audio/mpeg
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/v1/voice/synthesize/route';

describe('Voice Contract Preservation & Lockdown Suite', () => {
  const originalEnv = process.env;
  const LOCKED_VOICE_ID = 'kdmDKE6EkgrWrrykO9Qt';
  const LOCKED_VOICE_NAME = 'Alexandra — Conversational and Natural';
  const LOCKED_MODEL_ID = 'eleven_multilingual_v2';
  const LOCKED_VOICE_SETTINGS = {
    stability: 0.55,
    similarity_boost: 0.75,
    style: 0.15,
    use_speaker_boost: true,
  };
  const LOCKED_ENDPOINT = `https://api.elevenlabs.io/v1/text-to-speech/${LOCKED_VOICE_ID}`;
  const LOCKED_ACCEPT_HEADER = 'audio/mpeg';

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('locks default voice ID to Alexandra (kdmDKE6EkgrWrrykO9Qt) and model to eleven_multilingual_v2', async () => {
    process.env.ELEVENLABS_API_KEY = 'locked-valid-elevenlabs-key-999';
    delete process.env.ELEVENLABS_VOICE_ID;
    delete process.env.ELEVENLABS_MODEL_ID;

    let capturedUrl = '';
    let capturedOptions: RequestInit | undefined;

    const mockBuffer = new Uint8Array([0xff, 0xfb, 0x90, 0x64]).buffer; // MP3 header frame
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      capturedUrl = String(url);
      capturedOptions = init;
      return new Response(mockBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
        },
      });
    });

    const request = new Request('http://localhost:3000/api/v1/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'I understand what you mean, let us take this one step at a time.',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Verify endpoint strictly targets locked voice ID
    expect(capturedUrl).toBe(LOCKED_ENDPOINT);

    // Verify payload contract
    expect(capturedOptions).toBeDefined();
    const payload = JSON.parse(String(capturedOptions?.body));

    expect(payload.model_id).toBe(LOCKED_MODEL_ID);
    expect(payload.voice_settings).toEqual(LOCKED_VOICE_SETTINGS);
  });

  it('strictly enforces locked voice settings values (stability: 0.55, similarity: 0.75, style: 0.15, speaker_boost: true)', async () => {
    process.env.ELEVENLABS_API_KEY = 'locked-valid-elevenlabs-key-999';

    let capturedBody: any;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      capturedBody = JSON.parse(String(init?.body));
      return new Response(new ArrayBuffer(64), { status: 200 });
    });

    const request = new Request('http://localhost:3000/api/v1/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Testing audio calibration parameters.',
      }),
    });

    await POST(request);

    expect(capturedBody).toBeDefined();
    expect(capturedBody.voice_settings).toEqual({
      stability: 0.55,
      similarity_boost: 0.75,
      style: 0.15,
      use_speaker_boost: true,
    });

    // Explicit precision assertions
    expect(capturedBody.voice_settings.stability).toBe(0.55);
    expect(capturedBody.voice_settings.similarity_boost).toBe(0.75);
    expect(capturedBody.voice_settings.style).toBe(0.15);
    expect(capturedBody.voice_settings.use_speaker_boost).toBe(true);
  });

  it('strictly enforces required outbound request headers (xi-api-key, Content-Type, Accept: audio/mpeg)', async () => {
    process.env.ELEVENLABS_API_KEY = 'secret-api-key-test-string';

    let capturedHeaders: any;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      capturedHeaders = init?.headers;
      return new Response(new ArrayBuffer(64), { status: 200 });
    });

    const request = new Request('http://localhost:3000/api/v1/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Verifying headers integrity.',
      }),
    });

    await POST(request);

    expect(capturedHeaders).toBeDefined();
    expect(capturedHeaders['xi-api-key']).toBe('secret-api-key-test-string');
    expect(capturedHeaders['Content-Type']).toBe('application/json');
    expect(capturedHeaders['Accept']).toBe(LOCKED_ACCEPT_HEADER);
  });

  it('returns compliant audio/mpeg response with cache suppression headers', async () => {
    process.env.ELEVENLABS_API_KEY = 'valid-test-key-abc';

    const testAudioData = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(testAudioData.buffer, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      }),
    );

    const request = new Request('http://localhost:3000/api/v1/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Testing audio response envelope.',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache');
    const returnedBytes = new Uint8Array(await response.arrayBuffer());
    expect(returnedBytes).toEqual(testAudioData);
  });

  it('safeguards against missing or unconfigured ElevenLabs credentials with explicit 503 error envelope', async () => {
    delete process.env.ELEVENLABS_API_KEY;

    const request = new Request('http://localhost:3000/api/v1/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Testing missing key handling.',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body.error.code).toBe('ELEVENLABS_NOT_CONFIGURED');
    expect(body.error.target_voice).toBe(LOCKED_VOICE_NAME);
    expect(body.error.model_recommended).toBe(LOCKED_MODEL_ID);
  });

  it('rejects placeholder or template API keys (e.g. your_... or test-key)', async () => {
    process.env.ELEVENLABS_API_KEY = 'your_elevenlabs_api_key_here';

    const request = new Request('http://localhost:3000/api/v1/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Testing placeholder key rejection.',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body.error.code).toBe('ELEVENLABS_NOT_CONFIGURED');
  });

  it('sanitizes input text by stripping parentheticals, markdown, and brackets while preserving voice spoken content', async () => {
    process.env.ELEVENLABS_API_KEY = 'valid-key-for-sanitization';

    let sentText = '';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const parsed = JSON.parse(String(init?.body));
      sentText = parsed.text;
      return new Response(new ArrayBuffer(32), { status: 200 });
    });

    const request = new Request('http://localhost:3000/api/v1/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '(takes a deep breath) *I hear you*, [subtext: anxious] and I would like to help.',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(sentText).toBe('I hear you, and I would like to help.');
  });

  it('returns 400 when input text contains only non-spoken cues', async () => {
    process.env.ELEVENLABS_API_KEY = 'valid-key-for-test';

    const request = new Request('http://localhost:3000/api/v1/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '(sighs) [silent pause] * *',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe('NO_SPOKEN_CONTENT');
  });

  it('returns 400 when input text is missing or invalid', async () => {
    process.env.ELEVENLABS_API_KEY = 'valid-key-for-test';

    const request = new Request('http://localhost:3000/api/v1/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe('INVALID_REQUEST');
  });

  it('handles ElevenLabs API failure gracefully with 502 ELEVENLABS_API_ERROR', async () => {
    process.env.ELEVENLABS_API_KEY = 'valid-key-for-error-handling';

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Quota exceeded', {
        status: 429,
        statusText: 'Too Many Requests',
      }),
    );

    const request = new Request('http://localhost:3000/api/v1/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'This request will hit upstream error.',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(502);

    const body = await response.json();
    expect(body.error.code).toBe('ELEVENLABS_API_ERROR');
    expect(body.error.status).toBe(429);
    expect(body.error.details).toBe('Quota exceeded');
  });
});
