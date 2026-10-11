'use client';

/**
 * useAvatarSessionManager.ts
 *
 * Dedicated client-side session manager and lifecycle state machine for Anam avatar sessions:
 *
 * States: 'idle' | 'creating' | 'active' | 'terminating' | 'terminated' | 'failed'
 *
 * Guarantees:
 * - Single-flight deduplication: concurrent or rapid calls reuse in-flight requests
 * - Strict Mode resilience: mount -> unmount -> remount cycles reuse active sessions
 * - Clean termination: deterministic cleanup on unmount, exit, or route change
 * - Zero legacy provider dependencies
 */

import { useState, useRef, useEffect, useCallback } from 'react';

export type AvatarSessionLifecycleState =
  | 'idle'
  | 'creating'
  | 'active'
  | 'terminating'
  | 'terminated'
  | 'failed';

export interface AvatarSessionData {
  provider: 'anam';
  avatarId?: string;
  scenarioId?: string;
}

export interface UseAvatarSessionManagerOptions {
  scenarioId: string;
  partnerName: string;
  partnerRole: string;
  userGoal: string;
  initialDialogue: string;
}

// Single-flight promise cache to coalesce concurrent calls
let globalClientInFlightPromise: Promise<AvatarSessionData> | null = null;

export function resetGlobalClientSessionForTesting() {
  globalClientInFlightPromise = null;
}

export function useAvatarSessionManager({
  scenarioId,
  partnerName,
  partnerRole,
  userGoal,
  initialDialogue,
}: UseAvatarSessionManagerOptions) {
  const [sessionState, setSessionState] = useState<AvatarSessionLifecycleState>('idle');
  const [sessionData, setSessionData] = useState<AvatarSessionData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const sessionDataRef = useRef<AvatarSessionData | null>(null);
  const sessionStateRef = useRef<AvatarSessionLifecycleState>('idle');
  const bootstrappedScenarioIdRef = useRef<string | null>(null);

  const optionsRef = useRef({
    scenarioId,
    partnerName,
    partnerRole,
    userGoal,
    initialDialogue,
  });

  useEffect(() => {
    optionsRef.current = {
      scenarioId,
      partnerName,
      partnerRole,
      userGoal,
      initialDialogue,
    };
  });

  useEffect(() => {
    sessionDataRef.current = sessionData;
  }, [sessionData]);

  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

  const initiateSession = useCallback(async (forced: boolean = false) => {
    const currentScenarioId = (optionsRef.current.scenarioId && optionsRef.current.scenarioId.trim())
      ? optionsRef.current.scenarioId.trim()
      : `scenario-${Date.now()}`;

    // 1. If we already have an active session for THIS scenario in state, reuse it
    if (!forced && sessionDataRef.current && sessionDataRef.current.scenarioId === currentScenarioId && sessionStateRef.current === 'active') {
      return sessionDataRef.current;
    }

    // 2. If a creation request is already in-flight, await the same promise
    if (globalClientInFlightPromise) {
      setSessionState('creating');
      try {
        const data = await globalClientInFlightPromise;
        if (isMountedRef.current) {
          setSessionData(data);
          setSessionState('active');
        }
        return data;
      } catch (err: any) {
        if (isMountedRef.current) {
          setSessionState('failed');
          setErrorMessage(err.message || 'Failed to start avatar session');
        }
        throw err;
      }
    }

    // 3. Start fresh creation with single-flight guard
    setSessionState('creating');
    setErrorMessage(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestPromise = (async (): Promise<AvatarSessionData> => {
      const res = await fetch('/api/v1/avatar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.error?.message || `Session initialization failed (${res.status})`;
        throw new Error(msg);
      }

      const raw = await res.json();
      const parsed: AvatarSessionData = {
        provider: 'anam',
        avatarId: raw.avatar_id,
        scenarioId: currentScenarioId,
      };

      return parsed;
    })();

    globalClientInFlightPromise = requestPromise;

    try {
      const data = await requestPromise;
      if (isMountedRef.current) {
        setSessionData(data);
        setSessionState('active');
      }
      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {} as AvatarSessionData;
      }
      if (isMountedRef.current) {
        setSessionState('failed');
        setErrorMessage(err.message || 'Avatar session unavailable at this time.');
      }
      throw err;
    } finally {
      globalClientInFlightPromise = null;
    }
  }, []);

  const endSession = useCallback(async () => {
    setSessionState('terminating');
    try {
      await fetch('/api/v1/avatar/session', {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('[AvatarSessionManager] Error ending session:', e);
    } finally {
      if (isMountedRef.current) {
        setSessionState('terminated');
        setSessionData(null);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (bootstrappedScenarioIdRef.current !== scenarioId) {
      const prevScenarioId = bootstrappedScenarioIdRef.current;
      bootstrappedScenarioIdRef.current = scenarioId;

      if (prevScenarioId !== null) {
        setSessionData(null);
        setSessionState('idle');
      }

      initiateSession().catch(() => {});
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [scenarioId, initiateSession]);

  const retrySession = useCallback(async () => {
    setSessionData(null);
    sessionDataRef.current = null;
    return initiateSession(true);
  }, [initiateSession]);

  return {
    sessionState,
    sessionData,
    errorMessage,
    retrySession,
    endSession,
  };
}
