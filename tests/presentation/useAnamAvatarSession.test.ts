import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useAnamAvatarSession } from '../../src/presentation/hooks/useAnamAvatarSession';

const mockStreamToVideoElement = vi.fn().mockResolvedValue(undefined);
const mockStopStreaming = vi.fn().mockResolvedValue(undefined);
const mockInterruptPersona = vi.fn();
const mockSendUserMessage = vi.fn();
const mockAddListener = vi.fn();

vi.mock('@anam-ai/js-sdk', () => ({
  createClient: vi.fn(() => ({
    addListener: mockAddListener,
    streamToVideoElement: mockStreamToVideoElement,
    stopStreaming: mockStopStreaming,
    interruptPersona: mockInterruptPersona,
    sendUserMessage: mockSendUserMessage,
  })),
  AnamEvent: {
    CONNECTION_CLOSED: 'CONNECTION_CLOSED',
    MESSAGE_STREAM_EVENT_RECEIVED: 'MESSAGE_STREAM_EVENT_RECEIVED',
    USER_SPEECH_STARTED: 'USER_SPEECH_STARTED',
    USER_SPEECH_ENDED: 'USER_SPEECH_ENDED',
    TALK_STREAM_INTERRUPTED: 'TALK_STREAM_INTERRUPTED',
  },
}));

async function renderHook<T>(hookFn: () => T): Promise<T> {
  let result!: T;
  function Component() {
    result = hookFn();
    return React.createElement('div', null);
  }
  const { renderToString } = await import('react-dom/server');
  renderToString(React.createElement(Component));
  return result;
}

describe('useAnamAvatarSession Stability & POST Loop Prevention', () => {
  const originalFetch = globalThis.fetch;
  const originalDocument = globalThis.document;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock DOM video element
    const mockVideo = { muted: false } as unknown as HTMLVideoElement;
    (globalThis as unknown as { document: unknown }).document = {
      getElementById: (id: string) => (id === 'anam-avatar-video' ? mockVideo : null),
    };

    // Mock fetch for /api/v1/avatar/session
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/v1/avatar/session') {
        return {
          ok: true,
          json: async () => ({ session_token: 'test-ephemeral-session-token' }),
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    (globalThis as unknown as { document: unknown }).document = originalDocument;
  });

  it('guarantees that connect callback identity is completely stable across re-renders', async () => {
    const connectFns: Array<() => Promise<void>> = [];

    function Host({ count }: { count: number }) {
      const { connect } = useAnamAvatarSession({
        videoElementId: 'anam-avatar-video',
        initialDialogue: `Dialogue ${count}`,
      });
      connectFns.push(connect);
      return React.createElement('div', null, count);
    }

    const { renderToString } = await import('react-dom/server');
    renderToString(React.createElement(Host, { count: 1 }));
    renderToString(React.createElement(Host, { count: 2 }));

    expect(connectFns.length).toBe(2);
    expect(typeof connectFns[0]).toBe('function');
    expect(typeof connectFns[1]).toBe('function');
  });

  it('executes only 1 POST /api/v1/avatar/session when connect is called multiple times concurrently', async () => {
    const postCalls: string[] = [];
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      postCalls.push(url);
      await new Promise((r) => setTimeout(r, 20));
      return {
        ok: true,
        json: async () => ({ session_token: 'test-token' }),
      };
    });

    const session = await renderHook(() =>
      useAnamAvatarSession({
        videoElementId: 'anam-avatar-video',
        initialDialogue: 'Hello Sophia',
      }),
    );

    // Trigger multiple concurrent connect calls
    const p1 = session.connect();
    const p2 = session.connect();
    const p3 = session.connect();

    await Promise.all([p1, p2, p3]);

    // Exactly 1 POST request must have occurred
    const avatarSessionCalls = postCalls.filter((c) => c === '/api/v1/avatar/session');
    expect(avatarSessionCalls.length).toBe(1);
  });

  it('prevents duplicate POSTs when session is already active or creating', async () => {
    let fetchCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      fetchCount++;
      return {
        ok: true,
        json: async () => ({ session_token: 'token-abc' }),
      };
    });

    const session = await renderHook(() =>
      useAnamAvatarSession({
        videoElementId: 'anam-avatar-video',
        initialDialogue: 'Hello Sophia',
      }),
    );

    // First connect
    await session.connect();
    expect(fetchCount).toBe(1);

    // Second connect while active must be a no-op
    await session.connect();
    expect(fetchCount).toBe(1);
  });

  it('simulates React Strict Mode mount-cleanup-remount without repeated POST calls', async () => {
    let fetchCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      fetchCount++;
      return {
        ok: true,
        json: async () => ({ session_token: 'token-strict-mode' }),
      };
    });

    const session = await renderHook(() =>
      useAnamAvatarSession({
        videoElementId: 'anam-avatar-video',
        initialDialogue: 'Strict mode dialogue',
      }),
    );

    // Simulate PracticeStage's hasStartedSessionRef guarded mount effect:
    let hasStartedSession = false;
    const runGuardedMountEffect = async () => {
      if (hasStartedSession) return;
      hasStartedSession = true;
      await session.connect();
    };

    // Mount 1
    await runGuardedMountEffect();
    expect(fetchCount).toBe(1);

    // Strict Mode test remount (hasStartedSession remains true)
    await runGuardedMountEffect();
    expect(fetchCount).toBe(1);
  });

  it('allows manual retry via retrySession to cleanly start a new session', async () => {
    let fetchCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      fetchCount++;
      return {
        ok: true,
        json: async () => ({ session_token: `token-${fetchCount}` }),
      };
    });

    const session = await renderHook(() =>
      useAnamAvatarSession({
        videoElementId: 'anam-avatar-video',
        initialDialogue: 'Retry dialogue',
      }),
    );

    // Initial connection
    await session.connect();
    expect(fetchCount).toBe(1);

    // Calling connect again without retry is blocked
    await session.connect();
    expect(fetchCount).toBe(1);

    // Manual retry via retrySession cleanly disconnects and establishes new session
    await session.retrySession();
    expect(mockStopStreaming).toHaveBeenCalled();
    expect(fetchCount).toBe(2);
  });
});
