'use client';

/**
 * useAnamAvatarSession.ts — Anam Avatar & Server-Side ElevenLabs Agent Session Hook
 *
 * Implements:
 * - Server-minted ephemeral Anam session token retrieval via POST /api/v1/avatar/session
 * - Native server-side ElevenLabs Conversational AI Agent connection handled by Anam
 * - WebRTC avatar video & synchronized voice audio streaming into HTML5 <video id="anam-avatar-video">
 * - Single playback path: audio is delivered natively via the WebRTC stream to the video element,
 *   with perfect lip-sync, zero PCM bitshift noise, and zero duplicate audio.
 * - Real-time streaming conversation transcripts via AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED
 * - Programmatic user messaging via client.sendUserMessage(text)
 * - Barge-in interruption handling via client.interruptPersona()
 * - Clean mute control on the native video element
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient, type AnamClient, AnamEvent } from '@anam-ai/js-sdk';

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
}

export interface UseAnamAvatarSessionOptions {
  videoElementId?: string;
  initialMuted?: boolean;
  initialDialogue?: string;
  agentId?: string;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onStateChange?: (state: AvatarSessionLifecycleState) => void;
  onMessageStream?: (message: StreamedTranscriptMessage) => void;
  onUserSpeechStarted?: () => void;
  onUserSpeechEnded?: () => void;
}

export function useAnamAvatarSession(options: UseAnamAvatarSessionOptions = {}) {
  const {
    videoElementId = 'anam-avatar-video',
    initialMuted = false,
    initialDialogue,
    agentId,
    onPlaybackStateChange,
    onStateChange,
    onMessageStream,
    onUserSpeechStarted,
    onUserSpeechEnded,
  } = options;

  const [sessionState, setSessionState] = useState<AvatarSessionLifecycleState>('idle');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(initialMuted);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<StreamedTranscriptMessage[]>([]);

  const clientRef = useRef<AnamClient | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const connectingPromiseRef = useRef<Promise<void> | null>(null);
  const speakingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const callbacksRef = useRef({
    onPlaybackStateChange,
    onStateChange,
    onMessageStream,
    onUserSpeechStarted,
    onUserSpeechEnded,
  });

  useEffect(() => {
    callbacksRef.current = {
      onPlaybackStateChange,
      onStateChange,
      onMessageStream,
      onUserSpeechStarted,
      onUserSpeechEnded,
    };
  });

  const updateState = useCallback((nextState: AvatarSessionLifecycleState) => {
    setSessionState(nextState);
    callbacksRef.current.onStateChange?.(nextState);
  }, []);

  const markSpeaking = useCallback((speaking: boolean) => {
    setIsPlaying(speaking);
    callbacksRef.current.onPlaybackStateChange?.(speaking);

    if (speaking) {
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
      // Auto-reset speaking state after quiet duration if end-of-speech event delayed
      speakingTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setIsPlaying(false);
          callbacksRef.current.onPlaybackStateChange?.(false);
        }
      }, 1500);
    } else {
      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current);
        speakingTimerRef.current = null;
      }
    }
  }, []);

  /**
   * Interrupt the speaking persona immediately.
   */
  const interrupt = useCallback(() => {
    if (clientRef.current) {
      try {
        clientRef.current.interruptPersona();
      } catch (err) {
        console.warn('[Anam] Persona interrupt warning:', err);
      }
    }
    markSpeaking(false);
  }, [markSpeaking]);

  /**
   * Connect to Anam with the server-side ElevenLabs agent integration.
   */
  const connect = useCallback(async (): Promise<void> => {
    if (connectingPromiseRef.current) {
      return connectingPromiseRef.current;
    }

    if (sessionState === 'active' && clientRef.current) {
      return;
    }

    updateState('creating');
    setErrorMessage(null);

    const task = (async () => {
      try {
        // 1. Fetch short-lived session token with ElevenLabs agent settings from server
        const sessionRes = await fetch('/api/v1/avatar/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId,
            initialDialogue,
          }),
        });

        if (!sessionRes.ok) {
          const errData = await sessionRes.json().catch(() => ({}));
          throw new Error(
            errData?.error?.message || `Session negotiation failed (${sessionRes.status})`,
          );
        }

        const data = await sessionRes.json();
        const sessionToken = data?.session_token;
        if (!sessionToken) {
          throw new Error('No session token received from server');
        }

        if (!isMountedRef.current) return;

        // 2. Initialize Anam client
        const client = createClient(sessionToken);
        clientRef.current = client;

        // Listen for session lifecycle and streaming message events
        client.addListener(AnamEvent.CONNECTION_CLOSED, () => {
          console.log('[Anam] Connection closed');
          if (isMountedRef.current) {
            updateState('terminated');
            markSpeaking(false);
          }
        });

        client.addListener(
          AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED,
          (evt: { id: string; content: string; role: string; interrupted: boolean }) => {
            const role = (evt.role === 'user' ? 'user' : 'persona') as 'user' | 'persona';

            if (role === 'persona' && evt.content) {
              markSpeaking(true);
            }

            if (evt.interrupted) {
              markSpeaking(false);
            }

            if (isMountedRef.current) {
              setMessages((prev) => {
                const idx = prev.findIndex((m) => m.id === evt.id);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = {
                    ...updated[idx],
                    content: updated[idx].content + evt.content,
                    interrupted: evt.interrupted,
                  };
                  callbacksRef.current.onMessageStream?.(updated[idx]);
                  return updated;
                }
                const newMsg: StreamedTranscriptMessage = {
                  id: evt.id,
                  role,
                  content: evt.content,
                  interrupted: evt.interrupted,
                };
                callbacksRef.current.onMessageStream?.(newMsg);
                return [...prev, newMsg];
              });
            }
          },
        );

        client.addListener(AnamEvent.USER_SPEECH_STARTED, () => {
          callbacksRef.current.onUserSpeechStarted?.();
        });

        client.addListener(AnamEvent.USER_SPEECH_ENDED, () => {
          callbacksRef.current.onUserSpeechEnded?.();
        });

        client.addListener(AnamEvent.TALK_STREAM_INTERRUPTED, () => {
          markSpeaking(false);
        });

        // 3. Ensure target video element exists in DOM before starting stream
        let retries = 0;
        while (!document.getElementById(videoElementId) && retries < 20) {
          await new Promise((r) => setTimeout(r, 100));
          retries++;
        }

        const videoEl = document.getElementById(videoElementId) as HTMLVideoElement | null;
        if (videoEl) {
          videoEl.muted = isMuted;
        } else {
          console.warn(`[Anam] Target video element #${videoElementId} not found in DOM`);
        }

        // 4. Stream avatar video and synchronized ElevenLabs agent audio into video element
        await client.streamToVideoElement(videoElementId);

        if (isMountedRef.current) {
          updateState('active');
        }
      } catch (err: unknown) {
        console.error('[Anam] Failed to connect live avatar session:', err);
        const msg = err instanceof Error ? err.message : 'Failed to connect Anam avatar session';
        if (isMountedRef.current) {
          setErrorMessage(msg);
          updateState('failed');
        }
        throw err;
      } finally {
        connectingPromiseRef.current = null;
      }
    })();

    connectingPromiseRef.current = task;
    return task;
  }, [agentId, initialDialogue, isMuted, markSpeaking, sessionState, updateState, videoElementId]);

  /**
   * Send a programmatic user text message into the ElevenLabs agent conversation.
   */
  const sendUserMessage = useCallback(
    (text: string): void => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (!clientRef.current) {
        console.warn('[Anam] Cannot send user message: client is not connected');
        return;
      }

      try {
        clientRef.current.sendUserMessage(trimmed);
      } catch (err) {
        console.error('[Anam] Failed to send user message:', err);
      }
    },
    [],
  );

  /**
   * Toggle mute on the HTML5 video element.
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      const videoEl = document.getElementById(videoElementId) as HTMLVideoElement | null;
      if (videoEl) {
        videoEl.muted = next;
      }
      return next;
    });
  }, [videoElementId]);

  /**
   * Disconnect and release all resources cleanly.
   */
  const disconnect = useCallback(async () => {
    interrupt();
    updateState('terminating');

    if (clientRef.current) {
      try {
        await clientRef.current.stopStreaming();
      } catch (e) {
        console.warn('[Anam] Error during stopStreaming:', e);
      }
      clientRef.current = null;
    }

    if (isMountedRef.current) {
      updateState('terminated');
    }
  }, [interrupt, updateState]);

  const retrySession = useCallback(async () => {
    await disconnect();
    return connect();
  }, [disconnect, connect]);

  // Clean shutdown on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
      if (clientRef.current) {
        clientRef.current.stopStreaming().catch(() => {});
        clientRef.current = null;
      }
    };
  }, []);

  return {
    sessionState,
    isPlaying,
    isMuted,
    errorMessage,
    messages,
    connect,
    disconnect,
    sendUserMessage,
    interrupt,
    toggleMute,
    retrySession,
  };
}
