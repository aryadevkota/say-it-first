'use client';

/**
 * useAnamAvatarSession.ts — Anam Avatar Real-Time Video & ElevenLabs Audio Passthrough Hook
 *
 * Implements:
 * - Server-minted ephemeral Anam session token retrieval via POST /api/v1/avatar/session
 * - Anam client initialization with disableInputAudio: true
 * - WebRTC avatar video streaming into HTML5 <video id="anam-avatar-video">
 * - Real-time PCM audio passthrough via createAgentAudioInputStream (pcm_s16le, 16kHz, mono)
 * - ElevenLabs TTS streaming output chunk forwarding to Anam
 * - Simultaneous audible audio playback to user via Web Audio PcmAudioPlayer
 * - Guaranteed barge-in interruption handling (stops Web Audio queue & interrupts Anam avatar)
 * - Mute control (mutes audible playback while keeping avatar video lip-sync active)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient, type AnamClient, AnamEvent } from '@anam-ai/js-sdk';
import { PcmAudioPlayer } from '../utils/pcmAudioPlayer';

export type AvatarSessionLifecycleState =
  | 'idle'
  | 'creating'
  | 'active'
  | 'terminating'
  | 'terminated'
  | 'failed';

export interface UseAnamAvatarSessionOptions {
  videoElementId?: string;
  initialMuted?: boolean;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onStateChange?: (state: AvatarSessionLifecycleState) => void;
}

export function useAnamAvatarSession(options: UseAnamAvatarSessionOptions = {}) {
  const {
    videoElementId = 'anam-avatar-video',
    initialMuted = false,
    onPlaybackStateChange,
    onStateChange,
  } = options;

  const [sessionState, setSessionState] = useState<AvatarSessionLifecycleState>('idle');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(initialMuted);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clientRef = useRef<AnamClient | null>(null);
  const audioStreamRef = useRef<any>(null);
  const pcmPlayerRef = useRef<PcmAudioPlayer | null>(null);
  const activeSpeechAbortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const connectingPromiseRef = useRef<Promise<void> | null>(null);

  const callbacksRef = useRef({ onPlaybackStateChange, onStateChange });
  useEffect(() => {
    callbacksRef.current = { onPlaybackStateChange, onStateChange };
  });

  const updateState = useCallback((nextState: AvatarSessionLifecycleState) => {
    setSessionState(nextState);
    callbacksRef.current.onStateChange?.(nextState);
  }, []);

  // Initialize Web Audio PCM player
  useEffect(() => {
    isMountedRef.current = true;

    const player = new PcmAudioPlayer({
      isMuted: initialMuted,
      onPlaybackEnded: () => {
        if (isMountedRef.current) {
          setIsPlaying(false);
          callbacksRef.current.onPlaybackStateChange?.(false);
        }
      },
    });
    pcmPlayerRef.current = player;

    return () => {
      isMountedRef.current = false;
      player.close();
      pcmPlayerRef.current = null;
    };
  }, [initialMuted]);

  /**
   * Stop active speech playback and flush the Anam avatar lip-sync sequence.
   */
  const interrupt = useCallback(() => {
    // 1. Abort in-flight ElevenLabs synthesis fetch
    if (activeSpeechAbortRef.current) {
      activeSpeechAbortRef.current.abort();
      activeSpeechAbortRef.current = null;
    }

    // 2. Flush Web Audio audible playback buffer
    pcmPlayerRef.current?.stopAndFlush();

    // 3. Signal Anam avatar to interrupt speech and close audio sequence
    if (clientRef.current) {
      try {
        clientRef.current.interruptPersona();
      } catch (err) {
        console.warn('[Anam] Persona interrupt warning:', err);
      }
    }

    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.endSequence();
      } catch (err) {
        console.warn('[Anam] Audio stream endSequence warning:', err);
      }
    }

    setIsPlaying(false);
    callbacksRef.current.onPlaybackStateChange?.(false);
  }, []);

  /**
   * Connect to Anam and stream avatar to target video element.
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
        // 1. Fetch short-lived session token from server
        const sessionRes = await fetch('/api/v1/avatar/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!sessionRes.ok) {
          const errData = await sessionRes.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Session negotiation failed (${sessionRes.status})`);
        }

        const { session_token: sessionToken } = await sessionRes.json();
        if (!sessionToken) {
          throw new Error('No session token received from server');
        }

        if (!isMountedRef.current) return;

        // 2. Initialize Anam client with input audio disabled (handled externally)
        const client = createClient(sessionToken, {
          disableInputAudio: true,
        });
        clientRef.current = client;

        // Listen for session lifecycle events
        client.addListener(AnamEvent.CONNECTION_CLOSED, () => {
          console.log('[Anam] Connection closed');
          if (isMountedRef.current) {
            updateState('terminated');
          }
        });

        // 3. Ensure target video element exists in DOM before starting stream
        let retries = 0;
        while (!document.getElementById(videoElementId) && retries < 20) {
          await new Promise((r) => setTimeout(r, 100));
          retries++;
        }

        if (!document.getElementById(videoElementId)) {
          console.warn(`[Anam] Target video element #${videoElementId} not found in DOM`);
        }

        // 4. Stream avatar video into video element
        await client.streamToVideoElement(videoElementId);

        // 5. Create audio passthrough input stream (pcm_s16le at 16000Hz, mono)
        const inputStream = client.createAgentAudioInputStream({
          encoding: 'pcm_s16le',
          sampleRate: 16000,
          channels: 1,
        });
        audioStreamRef.current = inputStream;

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
  }, [sessionState, updateState, videoElementId]);

  /**
   * Synthesize text via ElevenLabs and pipe raw PCM audio chunks continuously into Anam and Web Audio.
   */
  const speakText = useCallback(
    async (text: string): Promise<void> => {
      const cleanText = text.trim();
      if (!cleanText) return;

      // Ensure active speech is interrupted before starting new sequence
      interrupt();

      const controller = new AbortController();
      activeSpeechAbortRef.current = controller;

      setIsPlaying(true);
      callbacksRef.current.onPlaybackStateChange?.(true);

      try {
        // Request raw 16kHz linear PCM from ElevenLabs synthesis route
        const res = await fetch('/api/v1/voice/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            text: cleanText,
            format: 'pcm_16000',
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn('[ElevenLabs] Synthesis returned error:', errData);
          setIsPlaying(false);
          callbacksRef.current.onPlaybackStateChange?.(false);
          return;
        }

        if (!res.body) {
          console.warn('[ElevenLabs] Synthesis returned empty body');
          setIsPlaying(false);
          callbacksRef.current.onPlaybackStateChange?.(false);
          return;
        }

        const reader = res.body.getReader();

        // Stream raw PCM chunks continuously as they arrive
        while (true) {
          const { done, value } = await reader.read();
          if (done || controller.signal.aborted) {
            break;
          }

          if (value && value.byteLength > 0) {
            // Forward PCM chunk immediately to Anam audio passthrough stream
            if (audioStreamRef.current) {
              try {
                audioStreamRef.current.sendAudioChunk(value);
              } catch (sendErr) {
                console.warn('[Anam] sendAudioChunk warning:', sendErr);
              }
            }

            // Simultaneously feed to Web Audio player for audible sound to user
            if (pcmPlayerRef.current) {
              pcmPlayerRef.current.feedChunk(value);
            }
          }
        }

        // Close Anam sequence when all audio chunks for this utterance have been forwarded
        if (!controller.signal.aborted && audioStreamRef.current) {
          try {
            audioStreamRef.current.endSequence();
          } catch (endErr) {
            console.warn('[Anam] endSequence warning:', endErr);
          }
        }
      } catch (err: unknown) {
        if (controller.signal.aborted || (err as any)?.name === 'AbortError') {
          return;
        }
        console.warn('[ElevenLabs/Anam] Error during speech streaming:', err);
        setIsPlaying(false);
        callbacksRef.current.onPlaybackStateChange?.(false);
      }
    },
    [interrupt],
  );

  /**
   * Toggle mute on audible ElevenLabs playback.
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      pcmPlayerRef.current?.setMuted(next);
      return next;
    });
  }, []);

  /**
   * Disconnect and release all resources.
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
    audioStreamRef.current = null;

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
    return () => {
      interrupt();
      if (clientRef.current) {
        clientRef.current.stopStreaming().catch(() => {});
        clientRef.current = null;
      }
    };
  }, [interrupt]);

  return {
    sessionState,
    isPlaying,
    isMuted,
    errorMessage,
    connect,
    disconnect,
    speakText,
    interrupt,
    toggleMute,
    retrySession,
  };
}
