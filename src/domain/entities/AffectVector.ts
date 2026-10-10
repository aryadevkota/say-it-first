/**
 * AffectVector.ts — Core Domain Entity
 *
 * 3D Mehrabian-Russell VAD (Valence, Arousal, Dominance) vector
 * bounded within the normalized unit hypercube [-1.0, +1.0]^3.
 *
 * Specification: say_it_first_system_architecture_manual.md §3.1, §4.1
 *
 * INVARIANT: All components are hard-clamped to [-1.0, 1.0].
 * ZERO external dependencies. Pure domain logic only.
 */

// ── Interface ────────────────────────────────────────────────────────────────

export interface AffectVector {
  readonly valence: number;   // [-1.000, 1.000] pleasure ↔ displeasure
  readonly arousal: number;   // [-1.000, 1.000] calm ↔ activated
  readonly dominance: number; // [-1.000, 1.000] submissive ↔ dominant
}

// ── Constants ────────────────────────────────────────────────────────────────

/** Origin vector — neutral affect state. */
export const ZERO_AFFECT: AffectVector = Object.freeze({
  valence: 0,
  arousal: 0,
  dominance: 0,
});

// ── Clamping Utility ─────────────────────────────────────────────────────────

/**
 * Hard clamping invariant from §3.1:
 *   x_clamped = max(-1.0, min(1.0, x))
 */
export function clampComponent(x: number): number {
  return Math.max(-1.0, Math.min(1.0, x));
}

// ── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates an AffectVector with all components hard-clamped to [-1.0, 1.0].
 * This is the ONLY sanctioned construction path — raw object literals
 * bypass the invariant and must not be used outside tests.
 */
export function createAffectVector(
  v: number,
  a: number,
  d: number,
): AffectVector {
  return Object.freeze({
    valence: clampComponent(v),
    arousal: clampComponent(a),
    dominance: clampComponent(d),
  });
}

// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Returns true iff every component sits within the closed interval [-1.0, 1.0].
 */
export function isValidAffectVector(vec: AffectVector): boolean {
  return (
    vec.valence >= -1.0 &&
    vec.valence <= 1.0 &&
    vec.arousal >= -1.0 &&
    vec.arousal <= 1.0 &&
    vec.dominance >= -1.0 &&
    vec.dominance <= 1.0
  );
}

// ── Arithmetic ───────────────────────────────────────────────────────────────

/**
 * Component-wise addition with post-clamp.
 * Returns a new immutable AffectVector.
 */
export function addAffectVectors(
  a: AffectVector,
  b: AffectVector,
): AffectVector {
  return createAffectVector(
    a.valence + b.valence,
    a.arousal + b.arousal,
    a.dominance + b.dominance,
  );
}

/**
 * Uniform scalar multiplication with post-clamp.
 * Returns a new immutable AffectVector.
 */
export function scaleAffectVector(
  vec: AffectVector,
  scalar: number,
): AffectVector {
  return createAffectVector(
    vec.valence * scalar,
    vec.arousal * scalar,
    vec.dominance * scalar,
  );
}

// ── Metrics ──────────────────────────────────────────────────────────────────

/**
 * Euclidean distance in VAD space:
 *   d(a, b) = √((Vₐ−Vᵦ)² + (Aₐ−Aᵦ)² + (Dₐ−Dᵦ)²)
 */
export function affectDistance(
  a: AffectVector,
  b: AffectVector,
): number {
  const dv = a.valence - b.valence;
  const da = a.arousal - b.arousal;
  const dd = a.dominance - b.dominance;
  return Math.sqrt(dv * dv + da * da + dd * dd);
}
