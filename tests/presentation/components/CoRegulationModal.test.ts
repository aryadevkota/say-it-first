import { describe, it, expect } from 'vitest';
import {
  evaluateSafetyGate,
  SafetyTier,
} from '../../../src/domain/services/TensionEvaluatorService';
import { createAffectVector } from '../../../src/domain/entities/AffectVector';

describe('CoRegulationModal clinical activation gates (FR-07)', () => {
  it('activates Tier 3 Curtain Drop and co-regulation flag when Tension T >= 9.0', () => {
    // V = -0.8, A = 0.9 -> T = ((0.9 - (-0.8) + 2) / 4) * 10 = (3.7 / 4) * 10 = 9.25
    const vadCrisis = createAffectVector(-0.8, 0.9, 0.0);
    const gate = evaluateSafetyGate(vadCrisis);

    expect(gate.tier).toBe(SafetyTier.CURTAIN_DROP);
    expect(gate.coRegulationActive).toBe(true);
    expect(gate.warningMessage).toContain('30-second breath reset');
  });

  it('keeps co-regulation inactive when Tension T < 9.0', () => {
    const vadNormal = createAffectVector(0.0, 0.0, 0.0); // T = 5.0
    const gate = evaluateSafetyGate(vadNormal);

    expect(gate.tier).toBe(SafetyTier.NORMAL);
    expect(gate.coRegulationActive).toBe(false);
  });
});
