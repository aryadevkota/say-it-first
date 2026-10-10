/**
 * AffectVector.test.ts — Comprehensive Unit Tests
 *
 * Covers: clamping bounds, factory correctness, immutability,
 * vector arithmetic, distance metrics, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  type AffectVector,
  ZERO_AFFECT,
  clampComponent,
  createAffectVector,
  isValidAffectVector,
  addAffectVectors,
  scaleAffectVector,
  affectDistance,
} from '../../src/domain/entities/AffectVector';

// ── clampComponent ───────────────────────────────────────────────────────────

describe('clampComponent', () => {
  it('passes through values within [-1.0, 1.0]', () => {
    expect(clampComponent(0)).toBe(0);
    expect(clampComponent(0.5)).toBe(0.5);
    expect(clampComponent(-0.5)).toBe(-0.5);
    expect(clampComponent(1.0)).toBe(1.0);
    expect(clampComponent(-1.0)).toBe(-1.0);
  });

  it('clamps values above 1.0 to 1.0', () => {
    expect(clampComponent(1.001)).toBe(1.0);
    expect(clampComponent(100)).toBe(1.0);
    expect(clampComponent(Infinity)).toBe(1.0);
  });

  it('clamps values below -1.0 to -1.0', () => {
    expect(clampComponent(-1.001)).toBe(-1.0);
    expect(clampComponent(-100)).toBe(-1.0);
    expect(clampComponent(-Infinity)).toBe(-1.0);
  });

  it('handles boundary floats precisely', () => {
    expect(clampComponent(0.999999)).toBeCloseTo(0.999999, 6);
    expect(clampComponent(-0.999999)).toBeCloseTo(-0.999999, 6);
  });
});

// ── createAffectVector ───────────────────────────────────────────────────────

describe('createAffectVector', () => {
  it('creates a vector with in-range values unchanged', () => {
    const v = createAffectVector(0.1, 0.2, 0.3);
    expect(v.valence).toBeCloseTo(0.1, 10);
    expect(v.arousal).toBeCloseTo(0.2, 10);
    expect(v.dominance).toBeCloseTo(0.3, 10);
  });

  it('clamps over-range valence', () => {
    const v = createAffectVector(5.0, 0, 0);
    expect(v.valence).toBe(1.0);
  });

  it('clamps under-range arousal', () => {
    const v = createAffectVector(0, -3.0, 0);
    expect(v.arousal).toBe(-1.0);
  });

  it('clamps all three components simultaneously', () => {
    const v = createAffectVector(2.0, -2.0, 1.5);
    expect(v.valence).toBe(1.0);
    expect(v.arousal).toBe(-1.0);
    expect(v.dominance).toBe(1.0);
  });

  it('returns an immutable (frozen) object', () => {
    const v = createAffectVector(0.5, 0.5, 0.5);
    expect(Object.isFrozen(v)).toBe(true);
  });

  it('handles zero vector correctly', () => {
    const v = createAffectVector(0, 0, 0);
    expect(v.valence).toBe(0);
    expect(v.arousal).toBe(0);
    expect(v.dominance).toBe(0);
  });

  it('handles negative boundary values', () => {
    const v = createAffectVector(-1.0, -1.0, -1.0);
    expect(v.valence).toBe(-1.0);
    expect(v.arousal).toBe(-1.0);
    expect(v.dominance).toBe(-1.0);
  });

  it('handles positive boundary values', () => {
    const v = createAffectVector(1.0, 1.0, 1.0);
    expect(v.valence).toBe(1.0);
    expect(v.arousal).toBe(1.0);
    expect(v.dominance).toBe(1.0);
  });
});

// ── ZERO_AFFECT ──────────────────────────────────────────────────────────────

describe('ZERO_AFFECT', () => {
  it('has all components at zero', () => {
    expect(ZERO_AFFECT.valence).toBe(0);
    expect(ZERO_AFFECT.arousal).toBe(0);
    expect(ZERO_AFFECT.dominance).toBe(0);
  });

  it('is immutable', () => {
    expect(Object.isFrozen(ZERO_AFFECT)).toBe(true);
  });

  it('is a valid affect vector', () => {
    expect(isValidAffectVector(ZERO_AFFECT)).toBe(true);
  });
});

// ── isValidAffectVector ──────────────────────────────────────────────────────

describe('isValidAffectVector', () => {
  it('returns true for in-range vectors', () => {
    expect(isValidAffectVector({ valence: 0, arousal: 0, dominance: 0 })).toBe(true);
    expect(isValidAffectVector({ valence: 1.0, arousal: -1.0, dominance: 0.5 })).toBe(true);
    expect(isValidAffectVector({ valence: -1.0, arousal: 1.0, dominance: -1.0 })).toBe(true);
  });

  it('returns false when valence is out of range', () => {
    expect(isValidAffectVector({ valence: 1.001, arousal: 0, dominance: 0 })).toBe(false);
    expect(isValidAffectVector({ valence: -1.001, arousal: 0, dominance: 0 })).toBe(false);
  });

  it('returns false when arousal is out of range', () => {
    expect(isValidAffectVector({ valence: 0, arousal: 2.0, dominance: 0 })).toBe(false);
  });

  it('returns false when dominance is out of range', () => {
    expect(isValidAffectVector({ valence: 0, arousal: 0, dominance: -5.0 })).toBe(false);
  });

  it('validates vectors created by factory as always valid', () => {
    // Even with extreme inputs, the factory clamps
    const v = createAffectVector(100, -100, 50);
    expect(isValidAffectVector(v)).toBe(true);
  });
});

// ── addAffectVectors ─────────────────────────────────────────────────────────

describe('addAffectVectors', () => {
  it('adds two zero vectors to zero', () => {
    const result = addAffectVectors(ZERO_AFFECT, ZERO_AFFECT);
    expect(result.valence).toBe(0);
    expect(result.arousal).toBe(0);
    expect(result.dominance).toBe(0);
  });

  it('adds component-wise correctly', () => {
    const a = createAffectVector(0.3, 0.2, 0.1);
    const b = createAffectVector(0.1, 0.2, 0.3);
    const result = addAffectVectors(a, b);
    expect(result.valence).toBeCloseTo(0.4, 10);
    expect(result.arousal).toBeCloseTo(0.4, 10);
    expect(result.dominance).toBeCloseTo(0.4, 10);
  });

  it('clamps the result when sum exceeds bounds', () => {
    const a = createAffectVector(0.8, 0.8, 0.8);
    const b = createAffectVector(0.5, 0.5, 0.5);
    const result = addAffectVectors(a, b);
    expect(result.valence).toBe(1.0);
    expect(result.arousal).toBe(1.0);
    expect(result.dominance).toBe(1.0);
  });

  it('clamps the result when sum goes below -1.0', () => {
    const a = createAffectVector(-0.7, -0.7, -0.7);
    const b = createAffectVector(-0.5, -0.5, -0.5);
    const result = addAffectVectors(a, b);
    expect(result.valence).toBe(-1.0);
    expect(result.arousal).toBe(-1.0);
    expect(result.dominance).toBe(-1.0);
  });

  it('returns an immutable vector', () => {
    const result = addAffectVectors(ZERO_AFFECT, ZERO_AFFECT);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('handles mixed positive/negative additions', () => {
    const a = createAffectVector(0.5, -0.3, 0.7);
    const b = createAffectVector(-0.2, 0.4, -0.9);
    const result = addAffectVectors(a, b);
    expect(result.valence).toBeCloseTo(0.3, 10);
    expect(result.arousal).toBeCloseTo(0.1, 10);
    expect(result.dominance).toBeCloseTo(-0.2, 10);
  });
});

// ── scaleAffectVector ────────────────────────────────────────────────────────

describe('scaleAffectVector', () => {
  it('scaling by 1.0 returns the same values', () => {
    const v = createAffectVector(0.5, -0.3, 0.7);
    const result = scaleAffectVector(v, 1.0);
    expect(result.valence).toBeCloseTo(0.5, 10);
    expect(result.arousal).toBeCloseTo(-0.3, 10);
    expect(result.dominance).toBeCloseTo(0.7, 10);
  });

  it('scaling by 0 returns zero vector', () => {
    const v = createAffectVector(0.5, -0.3, 0.7);
    const result = scaleAffectVector(v, 0);
    // Note: JavaScript produces -0 for negative * 0, which is mathematically ≈ 0
    expect(result.valence).toBeCloseTo(0, 10);
    expect(result.arousal).toBeCloseTo(0, 10);
    expect(result.dominance).toBeCloseTo(0, 10);
  });

  it('scaling by -1 negates components', () => {
    const v = createAffectVector(0.5, -0.3, 0.7);
    const result = scaleAffectVector(v, -1);
    expect(result.valence).toBeCloseTo(-0.5, 10);
    expect(result.arousal).toBeCloseTo(0.3, 10);
    expect(result.dominance).toBeCloseTo(-0.7, 10);
  });

  it('clamps when scalar pushes beyond bounds', () => {
    const v = createAffectVector(0.5, 0.5, 0.5);
    const result = scaleAffectVector(v, 3.0);
    expect(result.valence).toBe(1.0);
    expect(result.arousal).toBe(1.0);
    expect(result.dominance).toBe(1.0);
  });

  it('returns an immutable vector', () => {
    const result = scaleAffectVector(ZERO_AFFECT, 2);
    expect(Object.isFrozen(result)).toBe(true);
  });
});

// ── affectDistance ────────────────────────────────────────────────────────────

describe('affectDistance', () => {
  it('distance from a vector to itself is 0', () => {
    const v = createAffectVector(0.5, -0.3, 0.7);
    expect(affectDistance(v, v)).toBe(0);
  });

  it('distance from zero to (1,0,0) is 1', () => {
    const a = ZERO_AFFECT;
    const b = createAffectVector(1, 0, 0);
    expect(affectDistance(a, b)).toBeCloseTo(1.0, 10);
  });

  it('distance from zero to (1,1,1) is √3', () => {
    const a = ZERO_AFFECT;
    const b = createAffectVector(1, 1, 1);
    expect(affectDistance(a, b)).toBeCloseTo(Math.sqrt(3), 10);
  });

  it('distance is symmetric', () => {
    const a = createAffectVector(0.2, 0.5, -0.3);
    const b = createAffectVector(-0.4, 0.1, 0.8);
    expect(affectDistance(a, b)).toBeCloseTo(affectDistance(b, a), 10);
  });

  it('maximum distance in VAD space is 2√3 (diagonal of [-1,1]^3 cube)', () => {
    const a = createAffectVector(-1, -1, -1);
    const b = createAffectVector(1, 1, 1);
    expect(affectDistance(a, b)).toBeCloseTo(2 * Math.sqrt(3), 10);
  });

  it('computes correct distance for arbitrary vectors', () => {
    const a = createAffectVector(0.1, 0.2, 0.3);
    const b = createAffectVector(0.4, 0.6, 0.1);
    // √((0.3)² + (0.4)² + (0.2)²) = √(0.09 + 0.16 + 0.04) = √0.29
    expect(affectDistance(a, b)).toBeCloseTo(Math.sqrt(0.29), 10);
  });
});
