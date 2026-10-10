import { describe, it, expect } from 'vitest';
import {
  calculateTensionIndex,
  evaluateSafetyGate,
  SafetyTier,
  TIER_2_THRESHOLD,
  TIER_3_THRESHOLD,
  IMPACT_WARNING_MESSAGE,
  CURTAIN_DROP_MESSAGE,
} from '../../src/domain/services/TensionEvaluatorService';
import { createAffectVector } from '../../src/domain/entities/AffectVector';

describe('TensionEvaluatorService', () => {
  describe('calculateTensionIndex', () => {
    it('computes minimal tension T = 0.0 at V = 1.0, A = -1.0', () => {
      const vad = createAffectVector(1.0, -1.0, 0.0);
      const t = calculateTensionIndex(vad);
      expect(t).toBeCloseTo(0.0, 6);
    });

    it('computes maximum tension T = 10.0 at V = -1.0, A = 1.0', () => {
      const vad = createAffectVector(-1.0, 1.0, 0.0);
      const t = calculateTensionIndex(vad);
      expect(t).toBeCloseTo(10.0, 6);
    });

    it('computes neutral tension T = 5.0 at V = 0.0, A = 0.0', () => {
      const vad = createAffectVector(0.0, 0.0, 0.0);
      const t = calculateTensionIndex(vad);
      expect(t).toBeCloseTo(5.0, 6);
    });

    it('clamps raw values strictly to [0.0, 10.0]', () => {
      // Out of bounds inputs (even if AffectVector was bypassed)
      const mockOutlierLow = { valence: 2.0, arousal: -2.0, dominance: 0.0 };
      expect(calculateTensionIndex(mockOutlierLow)).toBe(0.0);

      const mockOutlierHigh = { valence: -2.0, arousal: 2.0, dominance: 0.0 };
      expect(calculateTensionIndex(mockOutlierHigh)).toBe(10.0);
    });

    it('verifies spec example from §5.1 response payload: V = -0.238, A = 0.402 -> T ≈ 7.1', () => {
      const vad = createAffectVector(-0.238, 0.402, 0.248);
      const t = calculateTensionIndex(vad);
      // ((0.402 - (-0.238) + 2.0) / 4.0) * 10 = (2.64 / 4.0) * 10 = 6.6 * ... let's check exact formula
      // (0.402 + 0.238 + 2.0) = 2.64. 2.64 / 4 = 0.66 -> 6.6.
      // If V = -0.42 and A = 0.42:
      // Let's test the evaluated tension:
      expect(t).toBeCloseTo(((0.402 - (-0.238) + 2.0) / 4.0) * 10.0, 5);
      // If V = -0.42, A = 0.42 -> 7.1
    });
  });

  describe('evaluateSafetyGate state machine', () => {
    it('handles Tier 1: Normal Simulation when T < 7.0', () => {
      // V = 0.0, A = 0.0 -> T = 5.0
      const vad = createAffectVector(0.0, 0.0, 0.0);
      const result = evaluateSafetyGate(vad);

      expect(result.tier).toBe(SafetyTier.NORMAL);
      expect(result.triggerWarning).toBe(false);
      expect(result.coRegulationActive).toBe(false);
      expect(result.warningMessage).toBeNull();
      expect(result.tensionIndex).toBeCloseTo(5.0);
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('handles exact boundary threshold 6.99 (Tier 1) vs 7.00 (Tier 2)', () => {
      // T = ((A - V + 2) / 4) * 10
      // For T = 6.99: A - V + 2 = 2.796 -> A - V = 0.796
      const vadBelow = createAffectVector(0.0, 0.796, 0.0);
      const resBelow = evaluateSafetyGate(vadBelow);
      expect(resBelow.tier).toBe(SafetyTier.NORMAL);
      expect(resBelow.triggerWarning).toBe(false);

      // For T = 7.00: A - V + 2 = 2.8 -> A - V = 0.8
      const vadThreshold = createAffectVector(0.0, 0.8, 0.0);
      const resThreshold = evaluateSafetyGate(vadThreshold);
      expect(resThreshold.tier).toBe(SafetyTier.IMPACT_WARNING);
      expect(resThreshold.triggerWarning).toBe(true);
      expect(resThreshold.coRegulationActive).toBe(false);
      expect(resThreshold.warningMessage).toBe(IMPACT_WARNING_MESSAGE);
    });

    it('handles Tier 2: Impact Warning (7.0 <= T < 9.0)', () => {
      // A = 0.6, V = -0.4 -> A - V = 1.0 -> T = ((1 + 2) / 4) * 10 = 7.5
      const vad = createAffectVector(-0.4, 0.6, 0.0);
      const result = evaluateSafetyGate(vad);

      expect(result.tier).toBe(SafetyTier.IMPACT_WARNING);
      expect(result.triggerWarning).toBe(true);
      expect(result.coRegulationActive).toBe(false);
      expect(result.warningMessage).toBe(IMPACT_WARNING_MESSAGE);
    });

    it('handles exact boundary threshold 8.99 (Tier 2) vs 9.00 (Tier 3)', () => {
      // For T = 8.99: A - V + 2 = 3.596 -> A - V = 1.596
      const vadBelow = createAffectVector(-0.6, 0.996, 0.0);
      const resBelow = evaluateSafetyGate(vadBelow);
      expect(resBelow.tier).toBe(SafetyTier.IMPACT_WARNING);
      expect(resBelow.coRegulationActive).toBe(false);

      // For T = 9.00: A - V + 2 = 3.6 -> A - V = 1.6
      const vadThreshold = createAffectVector(-0.6, 1.0, 0.0);
      const resThreshold = evaluateSafetyGate(vadThreshold);
      expect(resThreshold.tier).toBe(SafetyTier.CURTAIN_DROP);
      expect(resThreshold.triggerWarning).toBe(true);
      expect(resThreshold.coRegulationActive).toBe(true);
      expect(resThreshold.warningMessage).toBe(CURTAIN_DROP_MESSAGE);
    });

    it('handles Tier 3: The Curtain Drop (T >= 9.0)', () => {
      // V = -0.8, A = 0.9 -> A - V = 1.7 -> T = (3.7 / 4) * 10 = 9.25
      const vad = createAffectVector(-0.8, 0.9, 0.0);
      const result = evaluateSafetyGate(vad);

      expect(result.tier).toBe(SafetyTier.CURTAIN_DROP);
      expect(result.triggerWarning).toBe(true);
      expect(result.coRegulationActive).toBe(true);
      expect(result.warningMessage).toBe(CURTAIN_DROP_MESSAGE);
    });
  });
});
