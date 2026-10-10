'use client';

/**
 * usePartnerVoice.ts — Partner Voice Playback Hook
 *
 * Implements ElevenLabs-first speech synthesis with:
 * - Server-side ElevenLabs streaming via POST /api/v1/voice/synthesize
 * - Interruption & cancellation on retry / branch switch / unmount
 * - No overlapping speech playback
 * - Graceful fallback policy: if ElevenLabs is not configured or fails,
 *   dialogue remains readable; does NOT silently fall back to robotic browser speech
 *   unless user has deliberately enabled browser speech in preferences.
 * - Audio-driven speaking state tracking for avatar mouth synchronization.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

export interface UsePartnerVoiceOptions {
  allowBrowserSpeechFallback?: boolean;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
}

export interface PartnerVoiceState {
  isPlaying: boolean;
  voiceStatus: 'idle' | 'synthesizing' | 'playing' | 'unavailable' | 'error';
  isMuted: boolean;
  voiceNotice: string | null;
  activeVoiceProvider: 'elevenlabs' | 'browser' | 'none';
}

export function usePartnerVoice(options: UsePartnerVoiceOptions = {}) {
  const { allowBrowserSpeechFallback = false, onPlaybackStateChange } = options;

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [voiceStatus, setVoiceStatus] = useState<
    'idle' | 'synthesizing' | 'playing' | 'unavailable' | 'error'
  >('idle');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [activeVoiceProvider, setActiveVoiceProvider] = useState<'elevenlabs' | 'browser' | 'none'>(
    'none',
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync isPlaying callback
  useEffect(() => {
    onPlaybackStateChange?.(isPlaying);
  }, [isPlaying, onPlaybackStateChange]);

  // Clean up any active audio on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute('src');
      audioRef.current = null;
    }

    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsPlaying(false);
    setVoiceStatus('idle');
    setActiveVoiceProvider('none');
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (isMuted || !text.trim()) return;

      // Stop any current audio immediately to prevent overlaps
      stop();

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setVoiceStatus('synthesizing');

      try {
        // 1. Attempt ElevenLabs Server Gateway
        const res = await fetch('/api/v1/voice/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (res.ok) {
          const audioBlob = await res.blob();
          if (controller.signal.aborted) return;

          const blobUrl = URL.createObjectURL(audioBlob);
          currentBlobUrlRef.current = blobUrl;

          const audio = new Audio(blobUrl);
          audioRef.current = audio;

          audio.onplay = () => {
            if (!controller.signal.aborted) {
              setIsPlaying(true);
              setVoiceStatus('playing');
              setActiveVoiceProvider('elevenlabs');
              setVoiceNotice(null);
            }
          };

          audio.onended = () => {
            setIsPlaying(false);
            setVoiceStatus('idle');
            setActiveVoiceProvider('none');
            if (currentBlobUrlRef.current) {
              URL.revokeObjectURL(currentBlobUrlRef.current);
              currentBlobUrlRef.current = null;
            }
          };

          audio.onerror = () => {
            setIsPlaying(false);
            setVoiceStatus('error');
            setVoiceNotice('Audio playback encountered an error.');
            setActiveVoiceProvider('none');
          };

          await audio.play();
          return;
        }

        // If ElevenLabs is not configured or failed
        const errorJson = await res.json().catch(() => null);
        const errorCode = errorJson?.error?.code;

        if (errorCode === 'ELEVENLABS_NOT_CONFIGURED') {
          setVoiceNotice('Natural voice unconfigured — set ELEVENLABS_API_KEY in .env.local');
        } else {
          setVoiceNotice('Voice synthesis temporarily unavailable.');
        }

        setVoiceStatus('unavailable');

        // Optional deliberate browser fallback only if explicitly enabled
        if (allowBrowserSpeechFallback && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;

          utterance.onstart = () => {
            if (!controller.signal.aborted) {
              setIsPlaying(true);
              setVoiceStatus('playing');
              setActiveVoiceProvider('browser');
            }
          };

          utterance.onend = () => {
            setIsPlaying(false);
            setVoiceStatus('idle');
            setActiveVoiceProvider('none');
          };

          utterance.onerror = () => {
            setIsPlaying(false);
            setVoiceStatus('idle');
            setActiveVoiceProvider('none');
          };

          window.speechSynthesis.speak(utterance);
        } else {
          setIsPlaying(false);
          setActiveVoiceProvider('none');
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        console.warn('[usePartnerVoice] Voice request failed:', err);
        setVoiceStatus('unavailable');
        setVoiceNotice('Voice synthesis request failed.');
        setIsPlaying(false);
        setActiveVoiceProvider('none');
      }
    },
    [isMuted, allowBrowserSpeechFallback, stop],
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        stop();
      }
      return next;
    });
  }, [stop]);

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
