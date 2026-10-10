/**
 * TensionEvaluatorService.ts — Domain Service
 *
 * Computes the mathematical Tension Index and evaluates the
 * 3-Tier De-Escalation Safety Gate state machine.
 *
 * Specification:
 *   - say_it_first_system_architecture_manual.md §4.3
 *   - say_it_first_technical_specification.md §8.2
 *
 * Tension Index:
 *   T = ((A - V + 2.0) / 4.0) × 10.0  ∈ [0.0, 10.0]
 *
 * Safety Tiers:
 *   Tier 1  T < 7.0   Normal Simulation
 *   Tier 2  7.0 ≤ T < 9.0  Impact Warning
 *   Tier 3  T ≥ 9.0   Curtain Drop & Co-Regulation
 *
 * ZERO external dependencies beyond sibling domain entities.
 */

import type { AffectVector } from '../entities/AffectVector';

// ── Safety Tier Enum ─────────────────────────────────────────────────────────

export const SafetyTier = {
  NORMAL: 'NORMAL',
  IMPACT_WARNING: 'IMPACT_WARNING',
  CURTAIN_DROP: 'CURTAIN_DROP',
} as const;

export type SafetyTier = (typeof SafetyTier)[keyof typeof SafetyTier];

// ── Safety Gate Result ───────────────────────────────────────────────────────

export interface SafetyGateResult {
  readonly tensionIndex: number;
  readonly tier: SafetyTier;
  readonly triggerWarning: boolean;
  readonly coRegulationActive: boolean;
  readonly warningMessage: string | null;
}

// ── Tier Thresholds ──────────────────────────────────────────────────────────

/** T < 7.0 → Normal */
export const TIER_2_THRESHOLD = 7.0;

/** T ≥ 9.0 → Curtain Drop */
export const TIER_3_THRESHOLD = 9.0;

// ── Warning Messages (from spec §4.3 / §8.2) ────────────────────────────────

export const IMPACT_WARNING_MESSAGE =
  'Heads-up: Alex feels defensive/time-pressured. Their next response carries high friction.';

export const CURTAIN_DROP_MESSAGE =
  "Let's step out of the scenario for a moment. Let's do a 30-second breath reset together.";

// ── Tension Index Calculation ────────────────────────────────────────────────

/**
 * Computes the Tension Index from §4.3:
 *
 *   T = ((A − V + 2.0) / 4.0) × 10.0
 *
 * The result is hard-clamped to [0.0, 10.0].
 *
 * Derivation:
 *   - When V = +1.0, A = −1.0 → T = ((-1 - 1 + 2) / 4) × 10 = 0.0 (minimal tension)
 *   - When V = −1.0, A = +1.0 → T = ((1 + 1 + 2) / 4) × 10 = 10.0 (maximum tension)
 *   - When V = 0,    A = 0    → T = ((0 - 0 + 2) / 4) × 10 = 5.0 (neutral)
 */
export function calculateTensionIndex(vad: AffectVector): number {
  const raw = ((vad.arousal - vad.valence + 2.0) / 4.0) * 10.0;
  return Math.max(0.0, Math.min(10.0, raw));
}

// ── Safety Gate Evaluation ───────────────────────────────────────────────────

/**
 * Evaluates the 3-Tier De-Escalation State Machine (§4.3, §8.2):
 *
 *   Tier 1 (T < 7.0):  Normal — no warnings
 *   Tier 2 (7.0 ≤ T < 9.0): Impact Warning — pause & surface intercept card
 *   Tier 3 (T ≥ 9.0):  Curtain Drop — halt simulation, co-regulation breathing
 */
export function evaluateSafetyGate(vad: AffectVector): SafetyGateResult {
  const tensionIndex = calculateTensionIndex(vad);

  if (tensionIndex >= TIER_3_THRESHOLD) {
    return Object.freeze({
      tensionIndex,
      tier: SafetyTier.CURTAIN_DROP,
      triggerWarning: true,
      coRegulationActive: true,
      warningMessage: CURTAIN_DROP_MESSAGE,
    });
  }

  if (tensionIndex >= TIER_2_THRESHOLD) {
    return Object.freeze({
      tensionIndex,
      tier: SafetyTier.IMPACT_WARNING,
      triggerWarning: true,
      coRegulationActive: false,
      warningMessage: IMPACT_WARNING_MESSAGE,
    });
  }

  return Object.freeze({
    tensionIndex,
    tier: SafetyTier.NORMAL,
    triggerWarning: false,
    coRegulationActive: false,
    warningMessage: null,
  });
}
