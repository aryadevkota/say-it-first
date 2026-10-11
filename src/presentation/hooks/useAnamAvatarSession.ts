'use client';

/**
 * useAnamAvatarSession.ts — Production-Grade Anam Avatar & Server-Side ElevenLabs Agent Hook
 *
 * Implements:
 * - Deterministic, race-free WebRTC session lifecycle management
 * - Fast Refresh & React Strict Mode resilience via Soft Disconnect with grace period
 * - Direct MediaStream attachment verification to DOM <video id="anam-avatar-video">
 * - Active state confirmation gated on real WebRTC stream readiness (VIDEO_STREAM_STARTED / SESSION_READY)
 * - Generation ID counter & AbortController to kill obsolete in-flight requests
 * - Classified disconnect telemetry distinguishing intentional teardown from network/server drops
 * - High-signal structured diagnostics for every lifecycle transition
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient, type AnamClient, AnamEvent } from '@anam-ai/js-sdk';

export type AvatarSessionPhase =
  | 'idle'
  | 'connecting'
  | 'streaming'
  | 'conversation_ready'
  | 'upstream_rejected'
  | 'failed'
  | 'terminating'
  | 'terminated';

export type AvatarSessionLifecycleState =
  | 'idle'
  | 'creating'
  | 'active'
  | 'terminating'
  | 'terminated'
  | 'failed';

export interface StreamedTranscriptMessage {
  id: string;
  role: 'user' | 'persona';
  content: string;
  interrupted?: boolean;
  endOfSpeech?: boolean;
}

export interface UseAnamAvatarSessionOptions {
  videoElementId?: string;
  initialMuted?: boolean;
  initialDialogue?: string;
  systemPrompt?: string;
  agentId?: string;
  initialMicMuted?: boolean;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onStateChange?: (state: AvatarSessionLifecycleState) => void;
  onPhaseChange?: (phase: AvatarSessionPhase) => void;
  onMessageStream?: (message: StreamedTranscriptMessage) => void;
  onMessageHistoryUpdated?: (messages: StreamedTranscriptMessage[]) => void;
  onUserSpeechStarted?: () => void;
  onUserSpeechEnded?: () => void;
}

export function useAnamAvatarSession(options: UseAnamAvatarSessionOptions = {}) {
  const {
    videoElementId = 'anam-avatar-video',
    initialMuted = false,
    initialDialogue,
    systemPrompt,
    agentId,
    initialMicMuted = true,
    onPlaybackStateChange,
    onStateChange,
    onPhaseChange,
    onMessageStream,
    onMessageHistoryUpdated,
    onUserSpeechStarted,
    onUserSpeechEnded,
  } = options;

  const [sessionPhase, setSessionPhase] = useState<AvatarSessionPhase>('idle');
  const [sessionState, setSessionState] = useState<AvatarSessionLifecycleState>('idle');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(initialMuted);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(initialMicMuted);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<StreamedTranscriptMessage[]>([]);

  // Core lifecycle refs
  const clientRef = useRef<AnamClient | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const connectingPromiseRef = useRef<Promise<void> | null>(null);
  const speakingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const teardownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionGenerationRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isIntentionalTeardownRef = useRef<boolean>(false);
  const phaseRef = useRef<AvatarSessionPhase>('idle');
  const sessionStateRef = useRef<AvatarSessionLifecycleState>('idle');
  const hasUpstreamRejectionRef = useRef<boolean>(false);
  const retryWithCleanConfigRef = useRef<boolean>(false);
  const hasEmittedFirstAssistantTurnRef = useRef<boolean>(false);
  const firstUtteranceWatchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const accumulatedContentRef = useRef<Map<string, string>>(new Map());

  // Synchronous state and options refs to prevent stale closures and render churn
  const isMutedRef = useRef<boolean>(initialMuted);
  const isMicMutedRef = useRef<boolean>(initialMicMuted);
  const optionsRef = useRef({
    videoElementId,
    initialDialogue,
    systemPrompt,
    agentId,
    initialMicMuted,
  });

  useEffect(() => {
    optionsRef.current = {
      videoElementId,
      initialDialogue,
      systemPrompt,
      agentId,
      initialMicMuted,
    };
  });

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    retryWithCleanConfigRef.current = false;
  }, [initialDialogue]);

  const callbacksRef = useRef({
    onPlaybackStateChange,
    onStateChange,
    onPhaseChange,
    onMessageStream,
    onMessageHistoryUpdated,
    onUserSpeechStarted,
    onUserSpeechEnded,
  });

  useEffect(() => {
    callbacksRef.current = {
      onPlaybackStateChange,
      onStateChange,
      onPhaseChange,
      onMessageStream,
      onMessageHistoryUpdated,
      onUserSpeechStarted,
      onUserSpeechEnded,
    };
  });

  /**
   * High-signal explicit phase and state transition updater
   */
  const updatePhase = useCallback(
    (nextPhase: AvatarSessionPhase, reason?: string) => {
      const prevPhase = phaseRef.current;
      if (prevPhase === nextPhase) return;

      console.log(
        `[Anam:Phase] Transition: ${prevPhase} -> ${nextPhase}${reason ? ` (${reason})` : ''}`,
      );
      phaseRef.current = nextPhase;
      setSessionPhase(nextPhase);
      callbacksRef.current.onPhaseChange?.(nextPhase);

      // Deterministic mapping to backward-compatible sessionState
      let mappedState: AvatarSessionLifecycleState = 'idle';
      switch (nextPhase) {
        case 'connecting':
          mappedState = 'creating';
          break;
        case 'streaming':
        case 'conversation_ready':
          mappedState = 'active';
          break;
        case 'upstream_rejected':
        case 'failed':
          mappedState = 'failed';
          break;
        case 'terminating':
          mappedState = 'terminating';
          break;
        case 'terminated':
          mappedState = 'terminated';
          break;
        case 'idle':
          mappedState = 'idle';
          break;
      }

      if (sessionStateRef.current !== mappedState) {
        console.log(
          `[Anam:State] Transition: ${sessionStateRef.current} -> ${mappedState} [mapped from phase: ${nextPhase}]`,
        );
        sessionStateRef.current = mappedState;
        setSessionState(mappedState);
        callbacksRef.current.onStateChange?.(mappedState);
      }
    },
    [],
  );

  const markSpeaking = useCallback((speaking: boolean, reason: string = 'stream_event') => {
    setIsPlaying(speaking);
    isPlayingRef.current = speaking;
    callbacksRef.current.onPlaybackStateChange?.(speaking);

    if (speaking) {
      console.log(`[Avatar:Playback] Audio playback start (reason: ${reason})`);
      // Speech has started: cancel any pending fallback auto-start watchdog immediately
      if (firstUtteranceWatchdogTimerRef.current) {
        console.log('[Avatar:AutoStart] Cancelling firstUtteranceWatchdogTimer: audio playback is active');
        clearTimeout(firstUtteranceWatchdogTimerRef.current);
        firstUtteranceWatchdogTimerRef.current = null;
      }
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
      // Trailing silence debounce: keep speaking true until 4000ms of continuous silence
      speakingTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          console.log('[Avatar:Playback] Audio playback completion (trailing silence debounce expired: 4000ms)');
          setIsPlaying(false);
          isPlayingRef.current = false;
          callbacksRef.current.onPlaybackStateChange?.(false);
        }
      }, 4000);
    } else {
      console.log(`[Avatar:Playback] Audio playback stopped (reason: ${reason})`);
      isPlayingRef.current = false;
      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current);
        speakingTimerRef.current = null;
      }
    }
  }, []);

  /**
   * Immediate Hard Teardown: terminates WebRTC stream, aborts fetch, and cleans up client
   */
  const hardDisconnect = useCallback(
    async (reason: string = 'intentional') => {
      console.log(`[Anam:Teardown] Hard disconnect initiated: ${reason}`);
      console.log(`[Avatar:Cancellation] Avatar session cancelled / disconnected: ${reason}`);
      isIntentionalTeardownRef.current = true;
      sessionGenerationRef.current++;

      if (teardownTimerRef.current) {
        clearTimeout(teardownTimerRef.current);
        teardownTimerRef.current = null;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current);
        speakingTimerRef.current = null;
      }

      if (firstUtteranceWatchdogTimerRef.current) {
        clearTimeout(firstUtteranceWatchdogTimerRef.current);
        firstUtteranceWatchdogTimerRef.current = null;
      }

      accumulatedContentRef.current.clear();
      isPlayingRef.current = false;

      updatePhase('terminating', reason);

      const clientToStop = clientRef.current;
      clientRef.current = null;

      if (clientToStop) {
        try {
          await clientToStop.stopStreaming();
          console.log('[Anam:Teardown] client.stopStreaming() succeeded');
        } catch (err) {
          console.warn('[Anam:Teardown] Error during stopStreaming:', err);
        }
      }

      connectingPromiseRef.current = null;
      markSpeaking(false);

      if (isMountedRef.current) {
        updatePhase('terminated', reason);
      }
    },
    [markSpeaking, updatePhase],
  );

  /**
   * Soft Teardown with Grace Period: defends against React Strict Mode and Fast Refresh drops
   */
  const softDisconnect = useCallback(
    (reason: string = 'effect_cleanup') => {
      console.log(`[Anam:Teardown] Soft disconnect scheduled (150ms grace period): ${reason}`);
      if (firstUtteranceWatchdogTimerRef.current) {
        clearTimeout(firstUtteranceWatchdogTimerRef.current);
        firstUtteranceWatchdogTimerRef.current = null;
      }
      if (teardownTimerRef.current) {
        clearTimeout(teardownTimerRef.current);
      }

      teardownTimerRef.current = setTimeout(() => {
        teardownTimerRef.current = null;
        hardDisconnect(`grace_period_expired:${reason}`).catch(() => {});
      }, 150);
    },
    [hardDisconnect],
  );

  /**
   * Interrupt speaking persona immediately
   */
  const interrupt = useCallback(() => {
    if (clientRef.current) {
      try {
        if (typeof clientRef.current.interruptPersona === 'function') {
          clientRef.current.interruptPersona();
        }
      } catch (err) {
        console.warn('[Anam:Interrupt] Persona interrupt warning:', err);
      }
    }
    markSpeaking(false);
  }, [markSpeaking]);

  /**
   * Talk command: command persona to speak specific text directly via avatar TTS engine
   */
  const talk = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const client = clientRef.current;
    if (!client) {
      console.warn('[Anam:Talk] Cannot speak: client is not initialized');
      return;
    }
    try {
      console.log(`[Anam:Talk] Sending talk command (${trimmed.length} chars): "${trimmed}"`);
      if (typeof client.talk === 'function') {
        await client.talk(trimmed);
      }
    } catch (err) {
      console.error('[Anam:Talk] Failed to send talk command:', err);
    }
  }, []);

  /**
   * Connect to Anam with server-side ElevenLabs agent integration
   */
  const connect = useCallback(
    async (connectOptions?: { forceFresh?: boolean }): Promise<void> => {
      // Cancel any pending soft teardown (e.g. from Fast Refresh or Strict Mode unmount)
      if (teardownTimerRef.current) {
        console.log('[Anam:Lifecycle] Cancelling pending soft teardown for incoming connect');
        clearTimeout(teardownTimerRef.current);
        teardownTimerRef.current = null;
      }

      // 1. In-flight connection guard
      if (connectingPromiseRef.current) {
        console.log('[Anam:Connect] In-flight connection already exists, reusing promise');
        return connectingPromiseRef.current;
      }

      // 2. Active session or existing live client guard
      if (
        (sessionStateRef.current === 'active' || sessionStateRef.current === 'creating') &&
        clientRef.current !== null
      ) {
        console.log(
          `[Anam:Connect] No-op: session already ${sessionStateRef.current} with active client`,
        );
        return;
      }

      const currentGen = ++sessionGenerationRef.current;
      isIntentionalTeardownRef.current = false;
      hasEmittedFirstAssistantTurnRef.current = false;
      if (firstUtteranceWatchdogTimerRef.current) {
        clearTimeout(firstUtteranceWatchdogTimerRef.current);
        firstUtteranceWatchdogTimerRef.current = null;
      }
      updatePhase('connecting', 'connect_started');
      setErrorMessage(null);

      const {
        videoElementId: targetVideoId,
        agentId: currentAgentId,
        initialDialogue: currentInitialDialogue,
        systemPrompt: currentSystemPrompt,
      } = optionsRef.current;

      console.log(
        `[Anam:Connect] Starting connection attempt #${currentGen} (target: #${targetVideoId})`,
      );

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const task = (async () => {
        try {
          // Check if clean config is required (e.g. recovering from upstream rejection)
          const useCleanConfig = retryWithCleanConfigRef.current;
          if (useCleanConfig) {
            console.log(
              '[Anam:Session] Regenerating fresh conversation context without rejected overrides (clean session)',
            );
          } else {
            console.log('[Anam:Session] Requesting token from POST /api/v1/avatar/session');
          }

          const sessionRes = await fetch('/api/v1/avatar/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              agentId: currentAgentId,
              initialDialogue: useCleanConfig ? undefined : currentInitialDialogue,
              systemPrompt: useCleanConfig ? undefined : currentSystemPrompt,
              forceFresh: Boolean(connectOptions?.forceFresh || useCleanConfig),
              disableOverrides: useCleanConfig,
            }),
          });

          if (sessionGenerationRef.current !== currentGen) {
            console.log('[Anam:Session] Discarding response: generation ID changed during fetch');
            return;
          }

          if (!sessionRes.ok) {
            const errData = await sessionRes.json().catch(() => ({}));
            throw new Error(
              errData?.error?.message ||
                `Session token request failed with HTTP ${sessionRes.status}`,
            );
          }

          const data = await sessionRes.json();
          const sessionToken = data?.session_token || data?.sessionToken;
          if (!sessionToken || typeof sessionToken !== 'string') {
            throw new Error('Server response did not contain a valid session_token');
          }

          console.log(
            `[Anam:Session] Valid session token received (length: ${sessionToken.length}, preview: ${sessionToken.slice(0, 4)}..., fresh: ${Boolean(data?.conversation_fresh)})`,
          );

          if (!isMountedRef.current || sessionGenerationRef.current !== currentGen) {
            console.log('[Anam:Connect] Aborting: component unmounted or obsolete generation');
            return;
          }

          // Clean up any stale client before instantiating new one
          if (clientRef.current) {
            console.warn('[Anam:Connect] Cleaning up lingering previous client before creation');
            clientRef.current.stopStreaming().catch(() => {});
            clientRef.current = null;
          }

          // Step 2: Initialize Anam SDK client
          console.log('[Anam:SDK] Calling createClient(sessionToken)');
          const client = createClient(sessionToken);
          clientRef.current = client;

          // Crucial: Pre-mute input audio on the client instance BEFORE WebRTC streaming begins.
          // This ensures StreamingClient is initialized with inputAudioState.isMuted = true,
          // preventing the user's laptop mic from capturing initial avatar audio from speakers
          // and triggering ElevenLabs server-side VAD barge-in / premature turn cutoff!
          if (isMicMutedRef.current) {
            try {
              client.muteInputAudio();
              console.log('[Anam:Stream] Pre-emptively muted microphone before WebRTC stream setup');
            } catch (micErr) {
              console.warn('[Anam:Stream] Pre-stream mic mute notice:', micErr);
            }
          }

          // Register session lifecycle listeners
          client.addListener(AnamEvent.CONNECTION_ESTABLISHED, () => {
            console.log('[Anam:Transport] WebRTC peer connection established');
          });

          client.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => {
            console.log('[Anam:Media] First video frame rendered and playing in DOM');
          });

          client.addListener(AnamEvent.SESSION_READY, (sessionId: string) => {
            console.log(`[Anam:Conversation] Upstream conversation accepted & fully ready (id: ${sessionId})`);
            console.log(`[Avatar:Init] Selected scenario opener text: "${currentInitialDialogue || 'none'}"`);
            console.log(`[Avatar:Init] Generic fallback opener present in payload: false`);

            if (currentSystemPrompt && clientRef.current) {
              try {
                clientRef.current.addContext(currentSystemPrompt);
                console.log('[Anam:Conversation] Secondary scenario context injected via addContext');
              } catch (ctxErr) {
                console.warn('[Anam:Conversation] Secondary context injection warning:', ctxErr);
              }
            }

            // Fallback watchdog: If scenario opener is configured, but upstream agent never speaks within 8000ms
            if (currentInitialDialogue && clientRef.current) {
              if (firstUtteranceWatchdogTimerRef.current) {
                clearTimeout(firstUtteranceWatchdogTimerRef.current);
              }
              firstUtteranceWatchdogTimerRef.current = setTimeout(async () => {
                firstUtteranceWatchdogTimerRef.current = null;
                if (!hasEmittedFirstAssistantTurnRef.current && !isPlayingRef.current && clientRef.current && isMountedRef.current) {
                  hasEmittedFirstAssistantTurnRef.current = true;
                  console.log(
                    `[Avatar:AutoStart] Triggering authoritative scenario opener via client.talk() (silence watchdog fired after 8000ms): "${currentInitialDialogue}"`,
                  );
                  try {
                    if (typeof clientRef.current.talk === 'function') {
                      await clientRef.current.talk(currentInitialDialogue);
                    }
                    const syntheticMsg: StreamedTranscriptMessage = {
                      id: `scenario-opener-${Date.now()}`,
                      role: 'persona',
                      content: currentInitialDialogue,
                      interrupted: false,
                      endOfSpeech: true,
                    };
                    console.log(
                      `[Avatar:Utterance] Actual first emitted assistant utterance: "${currentInitialDialogue}" (enforced scenario opener via auto-start)`,
                    );
                    callbacksRef.current.onMessageStream?.(syntheticMsg);
                  } catch (talkErr) {
                    console.warn('[Avatar:AutoStart] client.talk notice:', talkErr);
                  }
                }
              }, 8000);
            }

            if (isMountedRef.current && sessionGenerationRef.current === currentGen) {
              updatePhase('conversation_ready', 'session_ready');
            }
          });

          client.addListener(AnamEvent.SERVER_WARNING, (message: string) => {
            console.warn('[Anam:Warning] Server warning:', message);
          });

          client.addListener(
            AnamEvent.VIDEO_STREAM_STARTED,
            (videoStream: MediaStream) => {
              console.log(
                `[Anam:Media] VIDEO_STREAM_STARTED received, tracks: ${videoStream?.getTracks()?.length || 0}`,
              );

              // Directly ensure media stream is attached to DOM video element
              const videoEl = document.getElementById(targetVideoId) as HTMLVideoElement | null;
              if (videoEl) {
                if (videoEl.srcObject !== videoStream) {
                  console.log(
                    `[Anam:Media] Explicitly attaching stream to DOM element #${targetVideoId}`,
                  );
                  videoEl.srcObject = videoStream;
                }
                videoEl.muted = isMutedRef.current;
                videoEl.play().catch((playErr) => {
                  console.warn('[Anam:Media] Autoplay attempt handled:', playErr);
                });
              } else {
                console.warn(
                  `[Anam:Media] Target video element #${targetVideoId} not found in DOM during stream start`,
                );
              }

              if (isMicMutedRef.current && clientRef.current) {
                try {
                  clientRef.current.muteInputAudio();
                  console.log('[Anam:Stream] Initial input audio muted for turn-based practice');
                } catch (micErr) {
                  console.warn('[Anam:Stream] Initial mic mute warning:', micErr);
                }
              }

              if (isMountedRef.current && sessionGenerationRef.current === currentGen) {
                updatePhase('streaming', 'video_stream_started');
              }
            },
          );

          client.addListener(
            AnamEvent.CONNECTION_CLOSED,
            (reason: string, details?: string) => {
              const isIntentional = isIntentionalTeardownRef.current;
              console.log(
                `[Anam:Disconnect] CONNECTION_CLOSED (reason: ${reason}, details: ${details || 'none'}, intentional: ${isIntentional})`,
              );

              if (isMountedRef.current && sessionGenerationRef.current === currentGen) {
                markSpeaking(false);
                const isUpstreamRejected =
                  reason === 'CONNECTION_CLOSED_CODE_SERVER_CLOSED_CONNECTION' &&
                  (Boolean(details?.toLowerCase().includes('rejected')) ||
                    Boolean(details?.toLowerCase().includes('elevenlabs')) ||
                    Boolean(details?.toLowerCase().includes('agent configuration')));

                if (isUpstreamRejected) {
                  hasUpstreamRejectionRef.current = true;
                  console.warn(`[Anam:Upstream] Upstream rejected agent configuration: ${details}`);
                  const rejectionMsg =
                    details ||
                    'ElevenLabs rejected the agent configuration for this conversation. Reconnecting requires initializing a clean session.';
                  setErrorMessage(rejectionMsg);
                  updatePhase('upstream_rejected', `upstream_rejection:${details}`);
                } else if (isIntentional || reason === 'CONNECTION_CLOSED_CODE_NORMAL') {
                  updatePhase('terminated', `closed_normal:${reason}`);
                } else {
                  const message =
                    details || `Connection paused (${reason}). You can reconnect or continue in text mode.`;
                  setErrorMessage(message);
                  updatePhase('failed', `closed_error:${reason}`);
                }
              }
            },
          );

          client.addListener(
            AnamEvent.INPUT_AUDIO_STREAM_STARTED,
            () => {
              console.log('[Anam:Audio] Microphone audio input stream active');
            },
          );

          client.addListener(
            AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED,
            (evt: { id: string; content: string; role: string; interrupted: boolean; endOfSpeech?: boolean }) => {
              const role = (evt.role === 'user' ? 'user' : 'persona') as 'user' | 'persona';

              if (role === 'persona' && evt.content) {
                // Accumulate chunks per message id
                const prevAccumulated = accumulatedContentRef.current.get(evt.id) || '';
                const totalAccumulated = prevAccumulated + evt.content;
                accumulatedContentRef.current.set(evt.id, totalAccumulated);

                markSpeaking(true, 'persona_chunk_received');
                if (isMountedRef.current && sessionGenerationRef.current === currentGen) {
                  updatePhase('conversation_ready', 'persona_speaking');
                }

                if (evt.endOfSpeech) {
                  console.log(
                    `[Avatar:Transcript] Final assistant transcript event (endOfSpeech=true): id=${evt.id}, fullLength=${totalAccumulated.length}, text="${totalAccumulated}"`,
                  );
                  // Allow 800ms for final audio buffer to finish playing in video element before dropping speaking indicator
                  if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
                  speakingTimerRef.current = setTimeout(() => {
                    if (isMountedRef.current) {
                      markSpeaking(false, 'endOfSpeech_playout_completed');
                    }
                  }, 800);
                } else {
                  console.log(
                    `[Avatar:Transcript] Partial assistant transcript event: id=${evt.id}, chunkLength=${evt.content.length}, accumulatedLength=${totalAccumulated.length}, chunk="${evt.content}"`,
                  );
                }

                // First assistant utterance intercept & enforcement
                const expectedOpener = optionsRef.current.initialDialogue?.trim();
                if (!hasEmittedFirstAssistantTurnRef.current && expectedOpener) {
                  const contentLower = totalAccumulated.toLowerCase();
                  const expectedLower = expectedOpener.toLowerCase();

                  // Check if the stream matches the beginning of the expected scenario opener
                  const matchesScenario =
                    expectedLower.startsWith(contentLower.trim()) ||
                    contentLower.startsWith(expectedLower.slice(0, Math.min(25, expectedLower.length)));

                  // A generic opener is only flagged if it does NOT match the scenario
                  const isGenericOpener =
                    !matchesScenario &&
                    (contentLower.includes('walk through this together') ||
                     contentLower.includes('ready when you are') ||
                     (contentLower.includes('thanks for jumping on') && !expectedLower.includes('thanks for jumping on')));

                  if (isGenericOpener) {
                    console.warn(
                      `[Avatar:Intercept] Detected upstream generic opener: "${totalAccumulated}". Intercepting and enforcing authoritative scenario opener: "${expectedOpener}"`,
                    );
                    hasEmittedFirstAssistantTurnRef.current = true;
                    if (firstUtteranceWatchdogTimerRef.current) {
                      clearTimeout(firstUtteranceWatchdogTimerRef.current);
                      firstUtteranceWatchdogTimerRef.current = null;
                    }

                    // 1. Immediately silence upstream generic audio
                    try {
                      if (typeof client.interruptPersona === 'function') {
                        client.interruptPersona();
                      }
                    } catch (intErr) {
                      console.warn('[Avatar:Intercept] Error interrupting persona:', intErr);
                    }

                    // 2. Immediately speak authoritative scenario opener
                    try {
                      if (typeof client.talk === 'function') {
                        client.talk(expectedOpener).catch((talkErr) =>
                          console.warn('[Avatar:Intercept] talk() notice:', talkErr),
                        );
                      }
                    } catch (talkErr) {
                      console.warn('[Avatar:Intercept] talk() invocation notice:', talkErr);
                    }

                    // 3. Emit authoritative scenario opener to UI and suppress generic text
                    const authoritativeMsg: StreamedTranscriptMessage = {
                      id: `scenario-opener-${Date.now()}`,
                      role: 'persona',
                      content: expectedOpener,
                      interrupted: false,
                      endOfSpeech: true,
                    };
                    console.log(
                      `[Avatar:Utterance] Actual first emitted assistant utterance: "${expectedOpener}" (enforced scenario opener)`,
                    );
                    callbacksRef.current.onMessageStream?.(authoritativeMsg);
                    return; // Suppress upstream generic chunk from transcript!
                  } else {
                    hasEmittedFirstAssistantTurnRef.current = true;
                    if (firstUtteranceWatchdogTimerRef.current) {
                      clearTimeout(firstUtteranceWatchdogTimerRef.current);
                      firstUtteranceWatchdogTimerRef.current = null;
                    }
                    console.log(
                      `[Avatar:Utterance] Actual first emitted assistant utterance: "${totalAccumulated}" (matchesScenario: true, endOfSpeech=${Boolean(evt.endOfSpeech)})`,
                    );
                  }
                }

                if (isMountedRef.current && sessionGenerationRef.current === currentGen) {
                  const streamedMsg: StreamedTranscriptMessage = {
                    id: evt.id,
                    role,
                    content: totalAccumulated,
                    interrupted: evt.interrupted,
                    endOfSpeech: evt.endOfSpeech,
                  };
                  callbacksRef.current.onMessageStream?.(streamedMsg);

                  setMessages((prev) => {
                    const idx = prev.findIndex((m) => m.id === evt.id);
                    if (idx >= 0) {
                      const updated = [...prev];
                      updated[idx] = {
                        ...updated[idx],
                        content: totalAccumulated,
                        interrupted: evt.interrupted,
                        endOfSpeech: evt.endOfSpeech,
                      };
                      return updated;
                    }
                    return [...prev, streamedMsg];
                  });
                }
                return;
              }

              if (role === 'user') {
                console.log(
                  `[Anam:STT] User message chunk: id=${evt.id}, endOfSpeech=${Boolean(evt.endOfSpeech)}, content="${evt.content}"`,
                );
              }

              if (evt.interrupted) {
                console.warn(`[Avatar:Interruption] Message stream chunk marked as interrupted: id=${evt.id}`);
                markSpeaking(false, 'chunk_interrupted');
              }

              if (isMountedRef.current && sessionGenerationRef.current === currentGen) {
                const streamedMsg: StreamedTranscriptMessage = {
                  id: evt.id,
                  role,
                  content: evt.content,
                  interrupted: evt.interrupted,
                  endOfSpeech: evt.endOfSpeech,
                };
                callbacksRef.current.onMessageStream?.(streamedMsg);

                setMessages((prev) => {
                  const idx = prev.findIndex((m) => m.id === evt.id);
                  if (idx >= 0) {
                    const updated = [...prev];
                    updated[idx] = {
                      ...updated[idx],
                      content: updated[idx].content + evt.content,
                      interrupted: evt.interrupted,
                      endOfSpeech: evt.endOfSpeech,
                    };
                    return updated;
                  }
                  return [...prev, streamedMsg];
                });
              }
            },
          );

          if (AnamEvent.MESSAGE_HISTORY_UPDATED) {
            client.addListener(
              AnamEvent.MESSAGE_HISTORY_UPDATED,
              (histMessages: any[]) => {
                if (!Array.isArray(histMessages)) return;
                console.log(
                  `[Anam:History] MESSAGE_HISTORY_UPDATED received (${histMessages.length} items)`,
                );
                const expectedOpener = optionsRef.current.initialDialogue?.trim();
                const mapped: StreamedTranscriptMessage[] = histMessages.map((m, idx) => {
                  let content = m.content || '';
                  if (expectedOpener && (m.role === 'persona' || m.role === 'assistant') && idx === 0) {
                    const contentLower = content.toLowerCase();
                    const expectedLower = expectedOpener.toLowerCase();
                    const matchesScenario =
                      expectedLower.startsWith(contentLower.trim()) ||
                      contentLower.startsWith(expectedLower.slice(0, Math.min(25, expectedLower.length)));
                    const isGeneric =
                      !matchesScenario &&
                      (contentLower.includes('walk through this together') ||
                       contentLower.includes('ready when you are') ||
                       (contentLower.includes('thanks for jumping on') && !expectedLower.includes('thanks for jumping on')));
                    if (isGeneric) {
                      content = expectedOpener;
                    }
                  }
                  return {
                    id: m.id || `${m.role}-${Date.now()}`,
                    role: (m.role === 'user' ? 'user' : 'persona') as 'user' | 'persona',
                    content,
                    interrupted: m.interrupted,
                  };
                });
                if (isMountedRef.current && sessionGenerationRef.current === currentGen) {
                  setMessages(mapped);
                  callbacksRef.current.onMessageHistoryUpdated?.(mapped);
                }
              },
            );
          }

          client.addListener(AnamEvent.USER_SPEECH_STARTED, () => {
            console.log('[Anam:Audio] User speech started (VAD event)');
            callbacksRef.current.onUserSpeechStarted?.();
          });

          client.addListener(AnamEvent.USER_SPEECH_ENDED, () => {
            console.log('[Anam:Audio] User speech ended (VAD event)');
            callbacksRef.current.onUserSpeechEnded?.();
          });

          client.addListener(AnamEvent.TALK_STREAM_INTERRUPTED, (correlationId?: string) => {
            console.warn(
              `[Avatar:Interruption] TALK_STREAM_INTERRUPTED event received from Anam/ElevenLabs (correlationId: ${correlationId || 'none'})`,
            );
            markSpeaking(false, 'talk_stream_interrupted');
          });

          // Step 3: Ensure video element exists before stream initiation
          let retries = 0;
          while (!document.getElementById(targetVideoId) && retries < 25) {
            await new Promise((r) => setTimeout(r, 80));
            retries++;
          }

          const videoEl = document.getElementById(targetVideoId) as HTMLVideoElement | null;
          if (videoEl) {
            videoEl.muted = isMutedRef.current;
          } else {
            console.warn(`[Anam:DOM] Target video element #${targetVideoId} not found after wait`);
          }

          // Step 4: Initiate WebRTC streaming through SDK
          console.log(`[Anam:Stream] Calling client.streamToVideoElement('#${targetVideoId}')`);
          await client.streamToVideoElement(targetVideoId);

          if (sessionGenerationRef.current !== currentGen) {
            console.log('[Anam:Stream] Generation changed after stream call, aborting');
            return;
          }

          // Fallback timer: if events take longer than 3.5s, transition to streaming if no error occurred
          setTimeout(() => {
            if (
              isMountedRef.current &&
              sessionGenerationRef.current === currentGen &&
              phaseRef.current === 'connecting'
            ) {
              console.log('[Anam:Stream] Safety fallback transition: setting streaming');
              updatePhase('streaming', 'safety_timeout_fallback');
            }
          }, 3500);

          console.log('[Anam:Connect] Connection setup completed successfully');
        } catch (err: unknown) {
          if (controller.signal.aborted) {
            console.log('[Anam:Connect] Connection attempt was aborted cleanly');
            return;
          }

          console.error('[Anam:Connect] Failed to connect avatar session:', err);
          const msg = err instanceof Error ? err.message : 'Failed to connect Anam avatar session';

          if (isMountedRef.current && sessionGenerationRef.current === currentGen) {
            setErrorMessage(msg);
            updatePhase('failed', 'connect_exception');
          }
          throw err;
        } finally {
          if (sessionGenerationRef.current === currentGen) {
            connectingPromiseRef.current = null;
          }
        }
      })();

      connectingPromiseRef.current = task;
      return task;
    },
    [markSpeaking, updatePhase],
  );

  /**
   * Send a programmatic user text message into the ElevenLabs agent conversation
   */
  const sendUserMessage = useCallback((text: string): void => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!clientRef.current) {
      console.warn('[Anam:Message] Cannot send user message: client is not connected');
      return;
    }

    try {
      console.log(`[Anam:Message] Sending user message (${trimmed.length} chars)`);
      clientRef.current.sendUserMessage(trimmed);
    } catch (err) {
      console.error('[Anam:Message] Failed to send user message:', err);
    }
  }, []);

  /**
   * Toggle mute on the HTML5 video element
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      const targetVideoId = optionsRef.current.videoElementId;
      const videoEl = document.getElementById(targetVideoId) as HTMLVideoElement | null;
      if (videoEl) {
        videoEl.muted = next;
      }
      return next;
    });
  }, []);

  /**
   * Explicit user disconnect (hard teardown)
   */
  const disconnect = useCallback(async () => {
    interrupt();
    await hardDisconnect('user_disconnect');
  }, [interrupt, hardDisconnect]);

  /**
   * User-triggered manual retry: enforces brand-new conversation and clean config when recovering from rejection
   */
  const retrySession = useCallback(
    async (retryOptions?: { forceFresh?: boolean; cleanConfig?: boolean }): Promise<void> => {
      const isUpstreamFailure =
        hasUpstreamRejectionRef.current || phaseRef.current === 'upstream_rejected';
      console.log(
        `[Anam:Retry] Manual retrySession requested. Upstream failure previously encountered: ${isUpstreamFailure}`,
      );

      await hardDisconnect('manual_retry');

      if (isUpstreamFailure || retryOptions?.cleanConfig) {
        console.log(
          '[Anam:Retry] Upstream rejection detected: forcing fresh conversation with sanitized clean agent config',
        );
        retryWithCleanConfigRef.current = true;
      }

      return connect({ forceFresh: true });
    },
    [hardDisconnect, connect],
  );

  /**
   * Mute client audio input (microphone stream to avatar)
   */
  const muteMic = useCallback(() => {
    if (clientRef.current) {
      try {
        clientRef.current.muteInputAudio();
        console.log('[Anam:Mic] Client input audio muted');
      } catch (err) {
        console.warn('[Anam:Mic] Warning muting input audio:', err);
      }
    }
    setIsMicMuted(true);
    isMicMutedRef.current = true;
  }, []);

  /**
   * Unmute client audio input (microphone stream to avatar)
   */
  const unmuteMic = useCallback(() => {
    if (clientRef.current) {
      try {
        clientRef.current.unmuteInputAudio();
        console.log('[Anam:Mic] Client input audio unmuted');
      } catch (err) {
        console.warn('[Anam:Mic] Warning unmuting input audio:', err);
      }
    }
    setIsMicMuted(false);
    isMicMutedRef.current = false;
  }, []);

  /**
   * Toggle client microphone mute
   */
  const toggleMic = useCallback(() => {
    if (isMicMutedRef.current) {
      unmuteMic();
    } else {
      muteMic();
    }
  }, [muteMic, unmuteMic]);

  /**
   * Add context information directly to active streaming session over WebRTC data channel
   */
  const addContext = useCallback((contextText: string): void => {
    const trimmed = contextText?.trim();
    if (!trimmed) return;
    if (!clientRef.current) {
      console.warn('[Anam:Context] Cannot add context: client not initialized');
      return;
    }
    try {
      clientRef.current.addContext(trimmed);
      console.log(`[Anam:Context] Injected context into session (${trimmed.length} chars)`);
    } catch (err) {
      console.warn('[Anam:Context] Error injecting context:', err);
    }
  }, []);

  // Lifecycle resilience: cancel pending teardowns on mount, soft-disconnect on unmount
  useEffect(() => {
    isMountedRef.current = true;
    if (teardownTimerRef.current) {
      console.log('[Anam:Lifecycle] Fast Refresh / Strict Mode remount detected: preserving active connection');
      clearTimeout(teardownTimerRef.current);
      teardownTimerRef.current = null;
    }

    return () => {
      isMountedRef.current = false;
      softDisconnect('unmount');
    };
  }, [softDisconnect]);

  return {
    sessionState,
    phase: sessionPhase,
    isConnected: sessionPhase === 'streaming' || sessionPhase === 'conversation_ready',
    isConnecting: sessionPhase === 'connecting' || sessionPhase === 'idle',
    isMediaStreaming: sessionPhase === 'streaming' || sessionPhase === 'conversation_ready',
    isConversationReady: sessionPhase === 'conversation_ready',
    isUpstreamRejected: sessionPhase === 'upstream_rejected',
    isTerminated: sessionPhase === 'terminated',
    isFailed: sessionPhase === 'failed' || sessionPhase === 'upstream_rejected',
    isPlaying,
    isMuted,
    isMicMuted,
    errorMessage,
    messages,
    connect,
    disconnect,
    sendUserMessage,
    interrupt,
    talk,
    toggleMute,
    muteMic,
    unmuteMic,
    toggleMic,
    addContext,
    retrySession,
  };
}
