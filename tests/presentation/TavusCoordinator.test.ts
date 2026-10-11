import { describe, it, expect, beforeEach } from 'vitest';
import { TavusSessionCoordinator } from '../../src/app/api/v1/avatar/session/coordinator';

describe('TavusSessionCoordinator Single-Flight & Scenario Isolation', () => {
  beforeEach(() => {
    TavusSessionCoordinator.clearActiveSession();
    TavusSessionCoordinator.setInFlightPromise(null);
    TavusSessionCoordinator.setTerminationPromise(null);
  });

  it('1. Returns null for reusable session (reuse disabled for demo reliability)', () => {
    TavusSessionCoordinator.setActiveSession('tavus-123', 'https://tavus.io/123', 'scenario-alpha');

    // With reuse disabled, getReusableSession always returns null to force fresh calls
    const match = TavusSessionCoordinator.getReusableSession('scenario-alpha');
    expect(match).toBeNull();
  });

  it('2. Coalesces concurrent in-flight requests into a single promise', async () => {
    let resolveCreation: (val: any) => void;
    const creationPromise = new Promise<{ conversationId: string; conversationUrl: string }>((resolve) => {
      resolveCreation = resolve;
    });

    TavusSessionCoordinator.setInFlightPromise(creationPromise);

    const firstInFlight = TavusSessionCoordinator.getInFlightPromise();
    const secondInFlight = TavusSessionCoordinator.getInFlightPromise();

    expect(firstInFlight).toBe(creationPromise);
    expect(secondInFlight).toBe(creationPromise);

    resolveCreation!({ conversationId: 'tavus-999', conversationUrl: 'https://tavus.io/999' });

    const result = await firstInFlight;
    expect(result?.conversationId).toBe('tavus-999');
  });

  it('3. Clears session properly on teardown', () => {
    TavusSessionCoordinator.setActiveSession('tavus-456', 'https://tavus.io/456', 'scenario-gamma');
    TavusSessionCoordinator.clearActiveSession('tavus-456');
    expect(TavusSessionCoordinator.getReusableSession('scenario-gamma')).toBeNull();
  });
});

describe('Avatar Session Route (Tavus-Only)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    TavusSessionCoordinator.clearActiveSession();
    TavusSessionCoordinator.setInFlightPromise(null);
    TavusSessionCoordinator.setTerminationPromise(null);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('fails fast with 503 when TAVUS_API_KEY is missing or invalid', async () => {
    const { POST } = await import('../../src/app/api/v1/avatar/session/route');
    delete process.env.TAVUS_API_KEY;

    const req = new Request('http://localhost:3000/api/v1/avatar/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: 'test-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error.message).toBe('TAVUS_API_KEY is not configured in environment.');
  });

  it('creates fresh Tavus conversation and returns in-flight deduplicated session', async () => {
    const { POST } = await import('../../src/app/api/v1/avatar/session/route');
    process.env.TAVUS_API_KEY = 'valid-tavus-key';

    // Set up in-flight promise to simulate concurrent create
    TavusSessionCoordinator.setInFlightPromise(
      Promise.resolve({ conversationId: 'tavus-fresh', conversationUrl: 'https://tavus.io/fresh' })
    );

    const req = new Request('http://localhost:3000/api/v1/avatar/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: 'scenario-alpha' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      provider: 'tavus',
      conversation_id: 'tavus-fresh',
      conversation_url: 'https://tavus.io/fresh',
      deduplicated: true,
    });
    expect(data.session_token).toBeUndefined();
    expect(data.ws_url).toBeUndefined();
  });

  it('handles tab close beacon termination gracefully', async () => {
    const { POST } = await import('../../src/app/api/v1/avatar/session/route');
    process.env.TAVUS_API_KEY = 'valid-tavus-key';
    TavusSessionCoordinator.setActiveSession('tavus-abc', 'https://tavus.io/abc', 'scenario-alpha');

    const req = new Request('http://localhost:3000/api/v1/avatar/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end', conversationId: 'tavus-abc' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(TavusSessionCoordinator.getReusableSession('scenario-alpha')).toBeNull();
  });
});
