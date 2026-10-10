'use client';

/**
 * usePartnerVoice.ts — Partner Voice Playback Hook
 *
 * Implements low-latency ElevenLabs-first speech synthesis with:
 * - Server-side ElevenLabs streaming via POST /api/v1/voice/synthesize
 * - Pipelined first-sentence playback: chunk dialogue into sentences,
 *   dispatch sentence 1 immediately (~400-700ms), begin playback instantly,
 *   and pre-fetch subsequent sentences concurrently in the background.
 * - Chained audio queue with seamless transitions on audio 'ended'.
 * - Instant turn cancellation & abort on retry / branch switch / unmount.
 * - No overlapping speech playback; zero queue pollution.
 * - Graceful fallback policy: if ElevenLabs is not configured or fails,
 *   dialogue remains readable; does NOT silently fall back to robotic browser speech
 *   unless user has deliberately enabled browser speech in preferences.
 * - Audio-driven speaking state tracking for avatar mouth synchronization.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

export interface UsePartnerVoiceOptions {
  allowBrowserSpeechFallback?: boolean;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  fetchChunk?: (text: string, signal: AbortSignal) => Promise<Blob>;
}

export interface PartnerVoiceState {
  isPlaying: boolean;
  voiceStatus: 'idle' | 'synthesizing' | 'playing' | 'unavailable' | 'error';
  isMuted: boolean;
  voiceNotice: string | null;
  activeVoiceProvider: 'elevenlabs' | 'browser' | 'none';
}

/**
 * Strip parentheticals, markdown, brackets, and extra whitespace
 * so only true spoken dialogue is synthesized.
 */
export function cleanSpokenText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split conversational dialogue into sentence chunks suitable for low-latency pipelined synthesis.
 * Handles sentence boundaries (. ! ?) and preserves trailing abbreviations.
 */
export function splitIntoSentences(text: string): string[] {
  const cleaned = cleanSpokenText(text);
  if (!cleaned) return [];

  // Match sentences ending with ., !, or ? or newlines
  const rawMatches = cleaned.match(/[^.!?\n]+(?:[.!?]+|\n+|$)/g);
  if (!rawMatches) return [cleaned];

  const rawSentences = rawMatches.map((s) => s.trim()).filter(Boolean);
  const result: string[] = [];

  const abbreviations = /^(mr|mrs|ms|dr|prof|sr|jr|e\.g|i\.e)\.$/i;

  for (let i = 0; i < rawSentences.length; i++) {
    const current = rawSentences[i];
    if (result.length > 0) {
      const prev = result[result.length - 1];
      const prevLastWord = prev.split(' ').pop() || '';
      if (abbreviations.test(prevLastWord)) {
        result[result.length - 1] += ' ' + current;
        continue;
      }
    }
    result.push(current);
  }

  return result.length > 0 ? result : [cleaned];
}

export interface VoicePipelineEngineOptions {
  allowBrowserSpeechFallback?: boolean;
  onStateChange?: (state: {
    isPlaying: boolean;
    voiceStatus: 'idle' | 'synthesizing' | 'playing' | 'unavailable' | 'error';
    activeVoiceProvider: 'elevenlabs' | 'browser' | 'none';
    voiceNotice?: string | null;
  }) => void;
  fetchChunk?: (text: string, signal: AbortSignal) => Promise<Blob>;
}

export async function defaultFetchVoiceChunk(text: string, signal: AbortSignal): Promise<Blob> {
  const res = await fetch('/api/v1/voice/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    const err = new Error(errorJson?.error?.message || `Voice synthesis failed (${res.status})`);
    (err as any).code = errorJson?.error?.code;
    (err as any).status = res.status;
    throw err;
  }

  return await res.blob();
}

/**
 * VoicePipelineQueue — Pipelined sentence synthesis & chained audio player.
 */
export class VoicePipelineQueue {
  private sessionId = 0;
  private abortController: AbortController | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private blobUrls: string[] = [];
  private options: VoicePipelineEngineOptions;

  constructor(options: VoicePipelineEngineOptions = {}) {
    this.options = options;
  }

  public updateOptions(options: VoicePipelineEngineOptions) {
    this.options = { ...this.options, ...options };
  }

  private notify(state: {
    isPlaying: boolean;
    voiceStatus: 'idle' | 'synthesizing' | 'playing' | 'unavailable' | 'error';
    activeVoiceProvider: 'elevenlabs' | 'browser' | 'none';
    voiceNotice?: string | null;
  }) {
    this.options.onStateChange?.(state);
  }

  public stop() {
    this.sessionId++;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.removeAttribute('src');
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }

    if (this.blobUrls.length > 0) {
      this.blobUrls.forEach((url) => {
        try {
          if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
            URL.revokeObjectURL(url);
          }
        } catch {
          // ignore
        }
      });
      this.blobUrls = [];
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    this.notify({
      isPlaying: false,
      voiceStatus: 'idle',
      activeVoiceProvider: 'none',
    });
  }

  public async speak(text: string): Promise<void> {
    const sentences = splitIntoSentences(text);
    if (sentences.length === 0) return;

    // Immediately stop and abort any previous playback
    this.stop();

    const currentSession = ++this.sessionId;
    const controller = new AbortController();
    this.abortController = controller;

    this.notify({
      isPlaying: false,
      voiceStatus: 'synthesizing',
      activeVoiceProvider: 'none',
    });

    const fetchChunk = this.options.fetchChunk || defaultFetchVoiceChunk;

    try {
      // 1. Immediately dispatch synthesis for sentence 1
      const firstBlob = await fetchChunk(sentences[0], controller.signal);

      if (controller.signal.aborted || this.sessionId !== currentSession) {
        return;
      }

      const firstUrl = URL.createObjectURL(firstBlob);
      this.blobUrls.push(firstUrl);

      const firstAudio = typeof Audio !== 'undefined' ? new Audio(firstUrl) : ({} as HTMLAudioElement);
      this.currentAudio = firstAudio;

      // Concurrently prefetch sentence 2 and subsequent chunks
      const prefetchChunk = (index: number): Promise<HTMLAudioElement | null> => {
        if (index >= sentences.length) return Promise.resolve(null);
        return (async () => {
          try {
            const blob = await fetchChunk(sentences[index], controller.signal);
            if (controller.signal.aborted || this.sessionId !== currentSession) {
              return null;
            }
            const url = URL.createObjectURL(blob);
            this.blobUrls.push(url);
            const audio = typeof Audio !== 'undefined' ? new Audio(url) : ({} as HTMLAudioElement);
            if ('preload' in audio) audio.preload = 'auto';
            return audio;
          } catch (err) {
            if (controller.signal.aborted || this.sessionId !== currentSession) {
              return null;
            }
            console.warn(`[VoicePipelineQueue] Prefetch sentence ${index} failed:`, err);
            return null;
          }
        })();
      };

      let nextAudioPromise: Promise<HTMLAudioElement | null> | null = null;
      if (sentences.length > 1) {
        nextAudioPromise = prefetchChunk(1);
      }

      const playQueue = async (
        currentIndex: number,
        audioPromise: Promise<HTMLAudioElement | null> | null,
      ) => {
        if (controller.signal.aborted || this.sessionId !== currentSession) return;

        const nextIndex = currentIndex + 1;
        if (nextIndex >= sentences.length) {
          this.notify({
            isPlaying: false,
            voiceStatus: 'idle',
            activeVoiceProvider: 'none',
          });
          return;
        }

        // Concurrently prefetch the chunk after next while nextIndex is queued/playing
        const subsequentPromise = prefetchChunk(nextIndex + 1);

        const nextAudio = audioPromise ? await audioPromise : null;
        if (controller.signal.aborted || this.sessionId !== currentSession) return;

        if (!nextAudio) {
          // If this chunk failed, advance
          await playQueue(nextIndex, subsequentPromise);
          return;
        }

        this.currentAudio = nextAudio;

        nextAudio.onended = () => {
          playQueue(nextIndex, subsequentPromise);
        };

        nextAudio.onerror = () => {
          playQueue(nextIndex, subsequentPromise);
        };

        if (typeof nextAudio.play === 'function') {
          try {
            await nextAudio.play();
          } catch (err) {
            if (controller.signal.aborted || this.sessionId !== currentSession) return;
            playQueue(nextIndex, subsequentPromise);
          }
        }
      };

      firstAudio.onended = () => {
        if (sentences.length > 1 && nextAudioPromise) {
          playQueue(0, nextAudioPromise);
        } else {
          this.notify({
            isPlaying: false,
            voiceStatus: 'idle',
            activeVoiceProvider: 'none',
          });
        }
      };

      firstAudio.onerror = () => {
        if (sentences.length > 1 && nextAudioPromise) {
          playQueue(0, nextAudioPromise);
        } else {
          this.notify({
            isPlaying: false,
            voiceStatus: 'error',
            voiceNotice: 'Audio playback encountered an error.',
            activeVoiceProvider: 'none',
          });
        }
      };

      // Audio ready: start playback immediately (<1s perceived latency!)
      this.notify({
        isPlaying: true,
        voiceStatus: 'playing',
        activeVoiceProvider: 'elevenlabs',
        voiceNotice: null,
      });

      if (typeof firstAudio.play === 'function') {
        await firstAudio.play();
      }
    } catch (err: any) {
      if (controller.signal.aborted || this.sessionId !== currentSession) return;

      const errorCode = err?.code;
      const notice =
        errorCode === 'ELEVENLABS_NOT_CONFIGURED'
          ? 'Natural voice unconfigured — set ELEVENLABS_API_KEY in .env.local'
          : 'Voice synthesis temporarily unavailable.';

      this.notify({
        isPlaying: false,
        voiceStatus: 'unavailable',
        voiceNotice: notice,
        activeVoiceProvider: 'none',
      });

      if (
        this.options.allowBrowserSpeechFallback &&
        typeof window !== 'undefined' &&
        'speechSynthesis' in window
      ) {
        this.fallbackBrowserSpeech(text, controller, currentSession);
      }
    }
  }

  private fallbackBrowserSpeech(
    text: string,
    controller: AbortController,
    session: number,
  ) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanSpokenText(text));
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        if (!controller.signal.aborted && this.sessionId === session) {
          this.notify({
            isPlaying: true,
            voiceStatus: 'playing',
            activeVoiceProvider: 'browser',
          });
        }
      };

      utterance.onend = () => {
        if (this.sessionId === session) {
          this.notify({
            isPlaying: false,
            voiceStatus: 'idle',
            activeVoiceProvider: 'none',
          });
        }
      };

      utterance.onerror = () => {
        if (this.sessionId === session) {
          this.notify({
            isPlaying: false,
            voiceStatus: 'idle',
            activeVoiceProvider: 'none',
          });
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.notify({
        isPlaying: false,
        voiceStatus: 'unavailable',
        activeVoiceProvider: 'none',
      });
    }
  }
}

export function usePartnerVoice(options: UsePartnerVoiceOptions = {}) {
  const { allowBrowserSpeechFallback = false, onPlaybackStateChange, fetchChunk } = options;

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [voiceStatus, setVoiceStatus] = useState<
    'idle' | 'synthesizing' | 'playing' | 'unavailable' | 'error'
  >('idle');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [activeVoiceProvider, setActiveVoiceProvider] = useState<
    'elevenlabs' | 'browser' | 'none'
  >('none');

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const pipelineRef = useRef<VoicePipelineQueue | null>(null);

  // Sync isPlaying callback
  useEffect(() => {
    onPlaybackStateChange?.(isPlaying);
  }, [isPlaying, onPlaybackStateChange]);

  useEffect(() => {
    const pipeline = new VoicePipelineQueue({
      allowBrowserSpeechFallback,
      fetchChunk,
      onStateChange: (state) => {
        setIsPlaying(state.isPlaying);
        setVoiceStatus(state.voiceStatus);
        setActiveVoiceProvider(state.activeVoiceProvider);
        if (state.voiceNotice !== undefined) {
          setVoiceNotice(state.voiceNotice);
        }
      },
    });
    pipelineRef.current = pipeline;

    return () => {
      pipeline.stop();
    };
  }, [allowBrowserSpeechFallback, fetchChunk]);

  const stop = useCallback(() => {
    pipelineRef.current?.stop();
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (isMutedRef.current || !text.trim()) return;
      await pipelineRef.current?.speak(text);
    },
    [],
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        pipelineRef.current?.stop();
      }
      return next;
    });
  }, []);

  return {
    isPlaying,
    voiceStatus,
    isMuted,
    voiceNotice,
    activeVoiceProvider,
    speak,
    stop,
    toggleMute,
  };
}
