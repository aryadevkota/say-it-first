/**
 * TwoWayBridge.ts — Core Domain Entity
 *
 * Captures the bidirectional subtext translation:
 *   - userIntent: the functional boundary need the user is expressing
 *   - receivedImpact: how a neurotypical interlocutor pragmatically decodes it
 *
 * Specification: say_it_first_system_architecture_manual.md §4.1, FR-04
 *
 * INVARIANT: Both strings must be non-empty.
 * ZERO external dependencies. Pure domain logic only.
 */

// ── Interface ────────────────────────────────────────────────────────────────

export interface TwoWayBridge {
  readonly userIntent: string;      // Functional boundary need
  readonly receivedImpact: string;  // Neurotypical pragmatic interpretation
}

// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates that both fields of a TwoWayBridge are non-empty strings,
 * per FR-04: "Assert non-empty string pair on every turn payload."
 */
export function isValidTwoWayBridge(bridge: TwoWayBridge): boolean {
  return (
    typeof bridge.userIntent === 'string' &&
    bridge.userIntent.trim().length > 0 &&
    typeof bridge.receivedImpact === 'string' &&
    bridge.receivedImpact.trim().length > 0
  );
}

// ── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a validated, immutable TwoWayBridge.
 *
 * @throws {Error} if either field is empty or whitespace-only.
 */
export function createTwoWayBridge(
  userIntent: string,
  receivedImpact: string,
): TwoWayBridge {
  const trimmedIntent = userIntent.trim();
  const trimmedImpact = receivedImpact.trim();

  if (trimmedIntent.length === 0) {
    throw new Error('TwoWayBridge: userIntent must be a non-empty string.');
  }
  if (trimmedImpact.length === 0) {
    throw new Error('TwoWayBridge: receivedImpact must be a non-empty string.');
  }

  return Object.freeze({
    userIntent: trimmedIntent,
    receivedImpact: trimmedImpact,
  });
}
