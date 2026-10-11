// Global single-flight deduplication and active conversation coordination for Tavus
// Preserves state across HMR / Next.js Fast Refresh in development mode

interface TavusSessionState {
  conversationId: string;
  conversationUrl: string;
  scenarioId: string;
  createdAt: number;
}

interface TavusGlobalStore {
  inFlightCreation: Promise<{ conversationId: string; conversationUrl: string }> | null;
  activeSession: TavusSessionState | null;
  terminationPromise: Promise<void> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __tavusSessionStore: TavusGlobalStore | undefined;
}

const store: TavusGlobalStore = globalThis.__tavusSessionStore || {
  inFlightCreation: null,
  activeSession: null,
  terminationPromise: null,
};

if (process.env.NODE_ENV !== 'production') {
  globalThis.__tavusSessionStore = store;
}

export class TavusSessionCoordinator {
  /**
   * Acquire an active session if one exists and matches the scenario (or if reusable).
   * NOTE: Session reuse is disabled for hackathon demo to ensure every live practice call
   * gets a fresh Tavus conversation instead of loading a stale URL.
   */
  static getReusableSession(_scenarioId?: string): { conversationId: string; conversationUrl: string } | null {
    return null;
  }

  /**
   * Return the current in-flight creation promise if one is already running.
   */
  static getInFlightPromise(): Promise<{ conversationId: string; conversationUrl: string }> | null {
    return store.inFlightCreation;
  }

  /**
   * Set or clear the in-flight creation promise.
   */
  static setInFlightPromise(promise: Promise<{ conversationId: string; conversationUrl: string }> | null) {
    store.inFlightCreation = promise;
  }

  /**
   * Register a newly established active session.
   */
  static setActiveSession(conversationId: string, conversationUrl: string, scenarioId: string) {
    store.activeSession = {
      conversationId,
      conversationUrl,
      scenarioId,
      createdAt: Date.now(),
    };
  }

  /**
   * Invalidate the current active session if it matches the given conversationId.
   */
  static clearActiveSession(conversationId?: string) {
    if (!conversationId || store.activeSession?.conversationId === conversationId) {
      store.activeSession = null;
    }
  }

  /**
   * Check if a termination is currently in-flight.
   */
  static getTerminationPromise(): Promise<void> | null {
    return store.terminationPromise;
  }

  /**
   * Set or clear the termination promise.
   */
  static setTerminationPromise(promise: Promise<void> | null) {
    store.terminationPromise = promise;
  }
}
