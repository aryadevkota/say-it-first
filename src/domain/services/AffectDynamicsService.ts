/**
 * AffectDynamicsService.ts — Domain Service
 *
 * Implements the discrete-time first-order exponential damping equation
 * for emotional inertia modelling.
 *
 * Specification: say_it_first_system_architecture_manual.md §3.2
 *
 * Equation:
 *   E(t+1) = λ · E(t) + (1 − λ) · ΔE_input
 *
 * Where:
 *   E(t)       — current emotional coordinate vector
 *   ΔE_input   — perturbation vector from LLM reasoning core
 *   λ ∈ [0, 1] — persona Emotional Inertia Coefficient
 *               (0.65 for flexible peers, 0.85 for stressed managers)
 *
 * ZERO external dependencies. Pure domain logic only.
 */

import {
  type AffectVector,
  createAffectVector,
  clampComponent,
} from '../entities/AffectVector';

// ── Inertia Coefficient Presets ──────────────────────────────────────────────

/** λ = 0.65 — adaptable peers, friends, colleagues */
export const INERTIA_PEER = 0.65;

/** λ = 0.85 — stressed supervisors, authority figures */
export const INERTIA_SUPERVISOR = 0.85;

// ── Core Damping ─────────────────────────────────────────────────────────────

/**
 * Applies the exponential damping equation (§3.2):
 *
 *   E(t+1) = λ · E(t) + (1 − λ) · ΔE_input
 *
 * @param current   E(t)      — the persona's current VAD state
 * @param delta     ΔE_input  — perturbation vector from this turn
 * @param lambda    λ         — emotional inertia coefficient ∈ [0.0, 1.0]
 * @returns         E(t+1)    — the resolved next-state vector (clamped)
 *
 * @throws {RangeError} if lambda is outside [0.0, 1.0]
 */
export function applyEmotionalDamping(
  current: AffectVector,
  delta: AffectVector,
  lambda: number,
): AffectVector {
  if (lambda < 0.0 || lambda > 1.0) {
    throw new RangeError(
      `Inertia coefficient λ must be in [0.0, 1.0], received: ${lambda}`,
    );
  }

  const oneMinusLambda = 1.0 - lambda;

  return createAffectVector(
    lambda * current.valence + oneMinusLambda * delta.valence,
    lambda * current.arousal + oneMinusLambda * delta.arousal,
    lambda * current.dominance + oneMinusLambda * delta.dominance,
  );
}

/**
 * Convenience: applies damping with the standard peer inertia (λ = 0.65).
 */
export function applyPeerDamping(
  current: AffectVector,
  delta: AffectVector,
): AffectVector {
  return applyEmotionalDamping(current, delta, INERTIA_PEER);
}

/**
 * Convenience: applies damping with the supervisor inertia (λ = 0.85).
 */
export function applySupervisorDamping(
  current: AffectVector,
  delta: AffectVector,
): AffectVector {
  return applyEmotionalDamping(current, delta, INERTIA_SUPERVISOR);
}

// ── Multi-Step Trajectory ────────────────────────────────────────────────────

/**
 * Simulates N steps of the damping equation with a constant perturbation,
 * returning the full trajectory (length = steps + 1, starting with `initial`).
 *
 * Useful for previewing convergence behaviour in tests and visualisations.
 */
export function simulateTrajectory(
  initial: AffectVector,
  constantDelta: AffectVector,
  lambda: number,
  steps: number,
): AffectVector[] {
  if (steps < 0) {
    throw new RangeError(`Steps must be non-negative, received: ${steps}`);
  }

  const trajectory: AffectVector[] = [initial];
  let state = initial;

  for (let i = 0; i < steps; i++) {
    state = applyEmotionalDamping(state, constantDelta, lambda);
    trajectory.push(state);
  }

  return trajectory;
}
