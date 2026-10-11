'use client';

/**
 * useAvatarSessionManager.ts
 *
 * Dedicated client-side session manager and lifecycle state machine for avatar sessions:
 *
 * States: 'idle' | 'creating' | 'active' | 'terminating' | 'terminated' | 'failed'
 *
 * Guarantees:
 * - Single-flight deduplication: concurrent or rapid calls reuse the existing in-flight promise
 * - Strict Mode resilience: mount -> unmount -> remount cycles reuse active sessions rather than spamming creates
 * - Clean termination: deterministic cleanup on unmount, exit, or route change
 * - Beacon on tab close: guarantees session termination even on hard window close
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
  provider: 'tavus';
  conversationId?: string;
  conversationUrl?: string;
  scenarioId?: string;
}

export interface UseAvatarSessionManagerOptions {
  scenarioId: string;
  partnerName: string;
  partnerRole: string;
  userGoal: string;
  initialDialogue: string;
}

// Single-flight promise cache to coalesce concurrent calls (e.g. React Strict Mode double-mount)
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
  const activeSessionIdRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const sessionDataRef = useRef<AvatarSessionData | null>(null);
  const sessionStateRef = useRef<AvatarSessionLifecycleState>('idle');
  const bootstrappedScenarioIdRef = useRef<string | null>(null);

  // Keep options in a ref to avoid recreating initiateSession on prop identity changes
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

  // Send Beacon on beforeunload / window close for guaranteed termination
  useEffect(() => {
    const handleBeforeUnload = () => {
      const activeId = activeSessionIdRef.current;
      if (activeId) {
        const payload = JSON.stringify({ conversationId: activeId, action: 'end' });
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/v1/avatar/session', payload);
        } else {
          fetch('/api/v1/avatar/session', {
            method: 'POST',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          }).catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const initiateSession = useCallback(async (forced: boolean = false) => {
    const currentScenarioId = (optionsRef.current.scenarioId && optionsRef.current.scenarioId.trim())
      ? optionsRef.current.scenarioId.trim()
      : `scenario-${Date.now()}`;
    const {
      partnerName: currentPartnerName,
      partnerRole: currentPartnerRole,
      userGoal: currentUserGoal,
      initialDialogue: currentInitialDialogue,
    } = optionsRef.current;

    // 1. If we already have an active session for THIS scenario in state, reuse it
    if (!forced && sessionDataRef.current && sessionDataRef.current.scenarioId === currentScenarioId && sessionStateRef.current === 'active') {
      console.log('[AvatarSessionManager] Reusing component-active session for scenario:', currentScenarioId);
      return sessionDataRef.current;
    }

    // 2. If a creation request is already in-flight (Strict Mode double mount), await the same promise
    if (globalClientInFlightPromise) {
      console.log('[AvatarSessionManager] Awaiting existing in-flight session creation...');
      setSessionState('creating');
      try {
        const data = await globalClientInFlightPromise;
        if (isMountedRef.current) {
          activeSessionIdRef.current = data.conversationId || null;
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
    console.log('[AvatarSessionManager] Initiating session bootstrap for scenario:', currentScenarioId);
    setSessionState('creating');
    setErrorMessage(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestPromise = (async (): Promise<AvatarSessionData> => {
      const res = await fetch('/api/v1/avatar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          scenarioId: currentScenarioId,
          partnerName: currentPartnerName,
          partnerRole: currentPartnerRole,
          userGoal: currentUserGoal,
          initialDialogue: currentInitialDialogue,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.error?.message || `Session initialization failed (${res.status})`;
        throw new Error(msg);
      }

      const raw = await res.json();
      const parsed: AvatarSessionData = {
        provider: 'tavus',
        conversationId: raw.conversation_id,
        conversationUrl: raw.conversation_url,
        scenarioId: currentScenarioId,
      };

      return parsed;
    })();

    globalClientInFlightPromise = requestPromise;

    try {
      const data = await requestPromise;
      if (isMountedRef.current) {
        activeSessionIdRef.current = data.conversationId || null;
        setSessionData(data);
        setSessionState('active');
      }
      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[AvatarSessionManager] Creation aborted');
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

  // Clean terminate function
  const endSession = useCallback(async (conversationIdToTerminate?: string) => {
    const targetId = conversationIdToTerminate || activeSessionIdRef.current;

    if (!targetId) {
      setSessionState('terminated');
      return;
    }

    setSessionState('terminating');
    activeSessionIdRef.current = null;

    try {
      await fetch('/api/v1/avatar/session', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: targetId }),
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

  // Lifecycle bootstrap: execute strictly once per scenarioId
  useEffect(() => {
    isMountedRef.current = true;

    if (bootstrappedScenarioIdRef.current !== scenarioId) {
      const prevScenarioId = bootstrappedScenarioIdRef.current;
      bootstrappedScenarioIdRef.current = scenarioId;

      if (prevScenarioId !== null) {
        // Scenario changed within the same mounted hook instance: reset state
        console.log(`[AvatarSessionManager] Transitioning scenario: ${prevScenarioId} -> ${scenarioId}`);
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
    const prevId = activeSessionIdRef.current;
    if (prevId) {
      activeSessionIdRef.current = null;
      try {
        await fetch('/api/v1/avatar/session', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: prevId }),
        });
      } catch (err) {
        console.warn('[AvatarSessionManager] Error ending prior conversation on retry:', err);
      }
    }
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
