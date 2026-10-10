/**
 * useWebAudioProsody.ts — Presentation Hook
 *
 * Client-Side Audio Hook managing AudioProcessor lifecycle and prosody extraction.
 * Provides fallback SILENT_PROSODY state when silent text mode is engaged (FR-02).
 */

import { useState, useRef, useCallback } from 'react';
import { AudioProcessor } from '../../infrastructure/web-audio/AudioProcessor';
import {
  type ProsodyMetrics,
  SILENT_PROSODY,
  createProsodyMetrics,
} from '../../domain/value-objects/ProsodyMetrics';

export interface UseWebAudioProsodyResult {
  isListening: boolean;
  error: string | null;
  metrics: ProsodyMetrics;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetMetrics: () => void;
}

export function useWebAudioProsody(): UseWebAudioProsodyResult {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ProsodyMetrics>(SILENT_PROSODY);

  const processorRef = useRef<AudioProcessor | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const startListening = useCallback(async () => {
    setError(null);

    try {
      if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Web Audio API / getUserMedia is not supported in this environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const processor = new AudioProcessor();
      await processor.initialize(stream);
      processorRef.current = processor;

      setIsListening(true);

      const analyzer = processor.getAnalyzer();
      const sampleRate = processor.getSampleRate();

      // Poll audio characteristics every 100ms
      pollIntervalRef.current = window.setInterval(() => {
        if (!analyzer) return;
        const volumeRms = analyzer.calculateRmsVolume();
        const pitchF0 = analyzer.detectFundamentalPitch(sampleRate);

        try {
          const updated = createProsodyMetrics(
            140, // Baseline cadence or calculated via SpeechRecognition
            Math.min(1.0, Math.max(0.0, volumeRms)),
            Math.min(500.0, Math.max(0.0, pitchF0)),
          );
          setMetrics(updated);
        } catch {
          // Keep prior metrics on momentary bounds clipping
        }
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize audio capture.';
      setError(msg);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.close();
      processorRef.current = null;
    }

    setIsListening(false);
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics(SILENT_PROSODY);
  }, []);

  return {
    isListening,
    error,
    metrics,
    startListening,
    stopListening,
    resetMetrics,
  };
}
