import { describe, it, expect, beforeEach } from 'vitest';
import { TavusSessionCoordinator } from '../../src/app/api/v1/avatar/session/coordinator';

describe('TavusSessionCoordinator Single-Flight & Scenario Isolation', () => {
  beforeEach(() => {
    TavusSessionCoordinator.clearActiveSession();
    TavusSessionCoordinator.setInFlightPromise(null);
    TavusSessionCoordinator.setTerminationPromise(null);
  });

  it('1. Reuses session if and only if scenarioId strictly matches', () => {
    TavusSessionCoordinator.setActiveSession('tavus-123', 'https://tavus.io/123', 'scenario-alpha');

    // Matching scenario returns active session
    const match = TavusSessionCoordinator.getReusableSession('scenario-alpha');
    expect(match).toEqual({
      conversationId: 'tavus-123',
      conversationUrl: 'https://tavus.io/123',
    });

    // Different scenario returns null (does NOT leak session across scenarios)
    const mismatch = TavusSessionCoordinator.getReusableSession('scenario-beta');
    expect(mismatch).toBeNull();
  });

  it('2. Coalesces concurrent in-flight requests into a single promise', async () => {
    let resolveCreation: (val: any) => void;
    const creationPromise = new Promise<{ conversationId: string; conversationUrl: string }>((resolve) => {
      resolveCreation = resolve;
    });

    TavusSessionCoordinator.setInFlightPromise(creationPromise);

    const firstInFlight = TavusSessionCoordinator.getInFlightPromise();
    const secondInFlight = TavusSessionCoordinator.getInFlightPromise();

    expect(firstInFlight).toBe(creationPromise);
    expect(secondInFlight).toBe(creationPromise);

    resolveCreation!({ conversationId: 'tavus-999', conversationUrl: 'https://tavus.io/999' });

    const result = await firstInFlight;
    expect(result.conversationId).toBe('tavus-999');
  });

  it('3. Clears session properly on teardown', () => {
    TavusSessionCoordinator.setActiveSession('tavus-456', 'https://tavus.io/456', 'scenario-gamma');
    expect(TavusSessionCoordinator.getReusableSession('scenario-gamma')).not.toBeNull();

    TavusSessionCoordinator.clearActiveSession('tavus-456');
    expect(TavusSessionCoordinator.getReusableSession('scenario-gamma')).toBeNull();
  });
});
