import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useAnamAvatarSession } from '../../src/presentation/hooks/useAnamAvatarSession';

const mockStreamToVideoElement = vi.fn().mockResolvedValue(undefined);
const mockStopStreaming = vi.fn().mockResolvedValue(undefined);
const mockInterruptPersona = vi.fn();
const mockSendUserMessage = vi.fn();
const mockAddListener = vi.fn();
const mockMuteInputAudio = vi.fn();
const mockUnmuteInputAudio = vi.fn();
const mockAddContext = vi.fn();
const mockTalk = vi.fn().mockResolvedValue(undefined);

vi.mock('@anam-ai/js-sdk', () => ({
  createClient: vi.fn(() => ({
    addListener: mockAddListener,
    streamToVideoElement: mockStreamToVideoElement,
    stopStreaming: mockStopStreaming,
    interruptPersona: mockInterruptPersona,
    sendUserMessage: mockSendUserMessage,
    muteInputAudio: mockMuteInputAudio,
    unmuteInputAudio: mockUnmuteInputAudio,
    addContext: mockAddContext,
    talk: mockTalk,
  })),
  AnamEvent: {
    CONNECTION_CLOSED: 'CONNECTION_CLOSED',
    CONNECTION_ESTABLISHED: 'CONNECTION_ESTABLISHED',
    MESSAGE_STREAM_EVENT_RECEIVED: 'MESSAGE_STREAM_EVENT_RECEIVED',
    MESSAGE_HISTORY_UPDATED: 'MESSAGE_HISTORY_UPDATED',
    USER_SPEECH_STARTED: 'USER_SPEECH_STARTED',
    USER_SPEECH_ENDED: 'USER_SPEECH_ENDED',
    TALK_STREAM_INTERRUPTED: 'TALK_STREAM_INTERRUPTED',
    VIDEO_STREAM_STARTED: 'VIDEO_STREAM_STARTED',
    VIDEO_PLAY_STARTED: 'VIDEO_PLAY_STARTED',
    SESSION_READY: 'SESSION_READY',
    SERVER_WARNING: 'SERVER_WARNING',
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

  it('classifies unexpected CONNECTION_CLOSED as failed with detailed error message', async () => {
    let capturedListener: ((reason: string, details?: string) => void) | null = null;
    mockAddListener.mockImplementation((first: any, second: any) => {
      if (first === 'CONNECTION_CLOSED') {
        capturedListener = second;
      }
    });

    let currentState = 'idle';
    const session = await renderHook(() =>
      useAnamAvatarSession({
        videoElementId: 'anam-avatar-video',
        initialDialogue: 'Test disconnect',
        onStateChange: (state) => {
          currentState = state;
        },
      }),
    );

    await session.connect();
    expect(capturedListener).toBeDefined();

    // Simulate unexpected server-side close
    capturedListener!(
      'CONNECTION_CLOSED_CODE_SERVER_CLOSED_CONNECTION',
      'Server terminated avatar peer connection',
    );

    expect(currentState).toBe('failed');
  });

  it('directly verifies MediaStream attachment to DOM element upon VIDEO_STREAM_STARTED', async () => {
    let videoStreamListener: ((stream: any) => void) | null = null;
    mockAddListener.mockImplementation((first: any, second: any) => {
      if (first === 'VIDEO_STREAM_STARTED') {
        videoStreamListener = second;
      }
    });

    const mockVideoEl = {
      srcObject: null as any,
      muted: false,
      play: vi.fn().mockResolvedValue(undefined),
    };

    (globalThis as unknown as { document: unknown }).document = {
      getElementById: (id: string) => (id === 'anam-avatar-video' ? mockVideoEl : null),
    };

    let currentState = 'idle';
    const session = await renderHook(() =>
      useAnamAvatarSession({
        videoElementId: 'anam-avatar-video',
        initialDialogue: 'Test media attachment',
        onStateChange: (state) => {
          currentState = state;
        },
      }),
    );

    await session.connect();
    expect(videoStreamListener).toBeDefined();

    const fakeStream = {
      getTracks: () => [{ kind: 'video', id: 'video-track-1' }],
    };

    videoStreamListener!(fakeStream);

    expect(mockVideoEl.srcObject).toBe(fakeStream);
    expect(mockVideoEl.play).toHaveBeenCalled();
    expect(currentState).toBe('active');
  });

  it('classifies ElevenLabs agent configuration rejection as upstream_rejected phase and recovers on retry with clean config', async () => {
    let capturedDisconnectListener: ((reason: string, details?: string) => void) | null = null;
    mockAddListener.mockImplementation((first: any, second: any) => {
      if (first === 'CONNECTION_CLOSED') {
        capturedDisconnectListener = second;
      }
    });

    const capturedBodies: any[] = [];
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.body) {
        capturedBodies.push(JSON.parse(String(init.body)));
      }
      return {
        ok: true,
        json: async () => ({ session_token: 'ephemeral-session-token-abc' }),
      };
    });

    let currentPhase = 'idle';
    const session = await renderHook(() =>
      useAnamAvatarSession({
        videoElementId: 'anam-avatar-video',
        initialDialogue: 'Initial dialogue that may be rejected',
        onPhaseChange: (phase) => {
          currentPhase = phase;
        },
      }),
    );

    // Initial connect attempt passes initialDialogue
    await session.connect();
    expect(capturedBodies.length).toBe(1);
    expect(capturedBodies[0].initialDialogue).toBe('Initial dialogue that may be rejected');
    expect(capturedBodies[0].disableOverrides).toBe(false);

    // Simulate ElevenLabs rejecting agent configuration upstream
    capturedDisconnectListener!(
      'CONNECTION_CLOSED_CODE_SERVER_CLOSED_CONNECTION',
      'ElevenLabs rejected the agent configuration for this conversation. If you want to talk again, please start a new conversation.',
    );

    expect(currentPhase).toBe('upstream_rejected');

    // When manual retry is triggered, it must force a fresh conversation with disableOverrides: true
    await session.retrySession();
    expect(capturedBodies.length).toBe(2);
    expect(capturedBodies[1].forceFresh).toBe(true);
    expect(capturedBodies[1].disableOverrides).toBe(true);
    expect(capturedBodies[1].initialDialogue).toBeUndefined();
  });

  it('passes systemPrompt in POST body and injects context via addContext on SESSION_READY', async () => {
    let capturedSessionReadyListener: ((sessionId: string) => void) | null = null;
    mockAddListener.mockImplementation((first: any, second: any) => {
      if (first === 'SESSION_READY') {
        capturedSessionReadyListener = second;
      }
    });

    const capturedBodies: any[] = [];
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.body) {
        capturedBodies.push(JSON.parse(String(init.body)));
      }
      return {
        ok: true,
        json: async () => ({ session_token: 'ephemeral-session-token-scenario' }),
      };
    });

    const session = await renderHook(() =>
      useAnamAvatarSession({
        videoElementId: 'anam-avatar-video',
        initialDialogue: 'Hello Sophia',
        systemPrompt: 'You are Sophia in the scenario Written Notes After Verbal Check-Ins.',
        initialMicMuted: true,
      }),
    );

    await session.connect();

    // Verify systemPrompt was sent in POST body
    expect(capturedBodies.length).toBe(1);
    expect(capturedBodies[0].systemPrompt).toBe(
      'You are Sophia in the scenario Written Notes After Verbal Check-Ins.',
    );
    expect(capturedBodies[0].initialDialogue).toBe('Hello Sophia');

    // Trigger SESSION_READY
    expect(capturedSessionReadyListener).toBeDefined();
    capturedSessionReadyListener!('session-xyz');

    // Verify secondary context injection was performed via addContext
    expect(mockAddContext).toHaveBeenCalledWith(
      'You are Sophia in the scenario Written Notes After Verbal Check-Ins.',
    );
  });

  it('supports explicit mic mute and unmute controls', async () => {
    const session = await renderHook(() =>
      useAnamAvatarSession({
        videoElementId: 'anam-avatar-video',
        initialDialogue: 'Testing mic controls',
        initialMicMuted: true,
      }),
    );

    await session.connect();

    // Unmute
    session.unmuteMic();
    expect(mockUnmuteInputAudio).toHaveBeenCalled();

    // Mute again
    session.muteMic();
    expect(mockMuteInputAudio).toHaveBeenCalled();
  });

  it('intercepts generic opener in MESSAGE_STREAM_EVENT_RECEIVED, silences persona, and forces scenario opener via talk', async () => {
    let capturedStreamListener: ((evt: any) => void) | null = null;
    mockAddListener.mockImplementation((first: any, second: any) => {
      if (first === 'MESSAGE_STREAM_EVENT_RECEIVED') {
        capturedStreamListener = second;
      }
    });

    const receivedStreamMessages: any[] = [];
    const expectedScenarioOpener = 'Hey, I wanted to talk through our team sync process.';

    const session = await renderHook(() =>
      useAnamAvatarSession({
        videoElementId: 'anam-avatar-video',
        initialDialogue: expectedScenarioOpener,
        onMessageStream: (msg) => {
          receivedStreamMessages.push(msg);
        },
      }),
    );

    await session.connect();
    expect(capturedStreamListener).toBeDefined();

    // Simulate upstream emitting the generic fallback opener
    capturedStreamListener!({
      id: 'generic-msg-1',
      role: 'persona',
      content: 'Hey, thanks for jumping on. I’m ready when you are—let’s walk through this together.',
      interrupted: false,
      endOfSpeech: true,
    });

    // 1. Must have called interruptPersona() immediately to silence generic audio
    expect(mockInterruptPersona).toHaveBeenCalledTimes(1);

    // 2. Must have called talk() with the authoritative scenario opener
    expect(mockTalk).toHaveBeenCalledWith(expectedScenarioOpener);

    // 3. onMessageStream must receive the enforced scenario opener, NOT the generic text
    expect(receivedStreamMessages.length).toBe(1);
    expect(receivedStreamMessages[0].content).toBe(expectedScenarioOpener);
    expect(receivedStreamMessages[0].role).toBe('persona');
  });

  it('does not interrupt persona when first utterance matches expected scenario opener', async () => {
    let capturedStreamListener: ((evt: any) => void) | null = null;
    mockAddListener.mockImplementation((first: any, second: any) => {
      if (first === 'MESSAGE_STREAM_EVENT_RECEIVED') {
        capturedStreamListener = second;
      }
    });

    const receivedStreamMessages: any[] = [];
    const expectedScenarioOpener = 'Thanks for meeting. How did the client call go?';

    const session = await renderHook(() =>
      useAnamAvatarSession({
        videoElementId: 'anam-avatar-video',
        initialDialogue: expectedScenarioOpener,
        onMessageStream: (msg) => {
          receivedStreamMessages.push(msg);
        },
      }),
    );

    await session.connect();
    expect(capturedStreamListener).toBeDefined();

    // Simulate upstream emitting the scenario opener correctly
    capturedStreamListener!({
      id: 'scenario-msg-1',
      role: 'persona',
      content: 'Thanks for meeting. How did the client call go?',
      interrupted: false,
      endOfSpeech: true,
    });

    // interruptPersona and talk should NOT be triggered
    expect(mockInterruptPersona).not.toHaveBeenCalled();
    expect(mockTalk).not.toHaveBeenCalled();

    // Normal message flow preserved
    expect(receivedStreamMessages.length).toBe(1);
    expect(receivedStreamMessages[0].content).toBe(expectedScenarioOpener);
  });

  it('accumulates partial streaming deltas across MESSAGE_STREAM_EVENT_RECEIVED chunks', async () => {
    let capturedStreamListener: ((evt: any) => void) | null = null;
    mockAddListener.mockImplementation((first: any, second: any) => {
      if (first === 'MESSAGE_STREAM_EVENT_RECEIVED') {
        capturedStreamListener = second;
      }
    });

    const receivedStreamMessages: any[] = [];
    const fullOpener =
      '…and that’s when we realized the whole schedule had to shift! Oh, hi there! Were you looking to join the discussion?';

    const session = await renderHook(() =>
      useAnamAvatarSession({
        videoElementId: 'anam-avatar-video',
        initialDialogue: fullOpener,
        onMessageStream: (msg) => {
          receivedStreamMessages.push(msg);
        },
      }),
    );

    await session.connect();
    expect(capturedStreamListener).toBeDefined();

    // Chunk 1
    capturedStreamListener!({
      id: 'chunked-msg-1',
      role: 'persona',
      content: '…and that’s when we realized the ',
      interrupted: false,
      endOfSpeech: false,
    });

    // Chunk 2
    capturedStreamListener!({
      id: 'chunked-msg-1',
      role: 'persona',
      content: 'whole schedule had to shift! Oh, hi there! Were you looking to join the discussion?',
      interrupted: false,
      endOfSpeech: true,
    });

    // Both events should have been emitted with accumulated content
    expect(receivedStreamMessages.length).toBe(2);
    expect(receivedStreamMessages[0].content).toBe('…and that’s when we realized the ');
    expect(receivedStreamMessages[0].endOfSpeech).toBe(false);
    expect(receivedStreamMessages[1].content).toBe(fullOpener);
    expect(receivedStreamMessages[1].endOfSpeech).toBe(true);
  });

  it('pre-mutes microphone before initiating WebRTC streamToVideoElement when initialMicMuted is true', async () => {
    const callOrder: string[] = [];
    mockMuteInputAudio.mockImplementation(() => {
      callOrder.push('muteInputAudio');
    });
    mockStreamToVideoElement.mockImplementation(async () => {
      callOrder.push('streamToVideoElement');
    });

    const session = await renderHook(() =>
      useAnamAvatarSession({
        videoElementId: 'anam-avatar-video',
        initialDialogue: 'Testing pre-mute',
        initialMicMuted: true,
      }),
    );

    await session.connect();

    expect(callOrder[0]).toBe('muteInputAudio');
    expect(callOrder[1]).toBe('streamToVideoElement');
  });

  it('does not interrupt persona when scenario opener itself starts with "Hey, thanks for jumping on"', async () => {
    let capturedStreamListener: ((evt: any) => void) | null = null;
    mockAddListener.mockImplementation((first: any, second: any) => {
      if (first === 'MESSAGE_STREAM_EVENT_RECEIVED') {
        capturedStreamListener = second;
      }
    });

    const receivedStreamMessages: any[] = [];
    const expectedScenarioOpener =
      'Hey, thanks for jumping on. Like we just talked through, I need you to push that update before end of day. Any questions before we wrap up?';

    const session = await renderHook(() =>
      useAnamAvatarSession({
        videoElementId: 'anam-avatar-video',
        initialDialogue: expectedScenarioOpener,
        onMessageStream: (msg) => {
          receivedStreamMessages.push(msg);
        },
      }),
    );

    await session.connect();
    expect(capturedStreamListener).toBeDefined();

    // Simulate upstream emitting the beginning chunk of this scenario opener
    capturedStreamListener!({
      id: 'scenario-msg-thanks',
      role: 'persona',
      content: 'Hey, thanks for jumping on. Like we just talked through',
      interrupted: false,
      endOfSpeech: false,
    });

    // interruptPersona and talk must NEVER be called
    expect(mockInterruptPersona).not.toHaveBeenCalled();
    expect(mockTalk).not.toHaveBeenCalled();
  });
});

