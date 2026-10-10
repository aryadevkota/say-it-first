import { describe, it, expect } from 'vitest';
import { computeAvatarKinematics } from '../../../src/domain/services/AvatarKinematicsService';
import { createAffectVector } from '../../../src/domain/entities/AffectVector';

describe('AvatarSvgRig kinematic derivations (ADR-004 & §3.4)', () => {
  it('computes mouth Bezier curvature = clamp(V * 24.0, -24.0, 24.0)', () => {
    // Valence = 0.5 -> Curvature = 12.0
    const vadSmile = createAffectVector(0.5, 0.0, 0.0);
    const kSmile = computeAvatarKinematics(vadSmile);
    expect(kSmile.mouthCurvature).toBe(12.0);

    // Valence = -1.0 -> Curvature = -24.0
    const vadFrown = createAffectVector(-1.0, 0.0, 0.0);
    const kFrown = computeAvatarKinematics(vadFrown);
    expect(kFrown.mouthCurvature).toBe(-24.0);
  });

  it('computes eyebrow slant = clamp(-V * 16.0 + A * 8.0, -20.0, 20.0)', () => {
    // V = -0.5, A = 0.5 -> -(-0.5)*16 + 0.5*8 = 8 + 4 = 12.0 deg
    const vadStress = createAffectVector(-0.5, 0.5, 0.0);
    const kStress = computeAvatarKinematics(vadStress);
    expect(kStress.browAngle).toBe(12.0);
  });

  it('computes blink rate = 3200ms / (1.0 + 0.8 * max(0.0, A))', () => {
    const vadCalm = createAffectVector(0.0, 0.0, 0.0);
    const kCalm = computeAvatarKinematics(vadCalm);
    expect(kCalm.blinkRateMs).toBe(3200);

    const vadAroused = createAffectVector(0.0, 1.0, 0.0);
    const kAroused = computeAvatarKinematics(vadAroused);
    // 3200 / (1 + 0.8) = 3200 / 1.8 ≈ 1778
    expect(kAroused.blinkRateMs).toBe(1778);
  });

  it('computes respiratory breathing cycle = 3.6 - (A * 1.4)', () => {
    const vadCalm = createAffectVector(0.0, 0.0, 0.0);
    expect(computeAvatarKinematics(vadCalm).breathingCycleSec).toBe(3.6);

    const vadHighArousal = createAffectVector(0.0, 1.0, 0.0);
    expect(computeAvatarKinematics(vadHighArousal).breathingCycleSec).toBe(2.2);
  });

  it('computes postural tilt = D * 6.5 deg', () => {
    const vadDominant = createAffectVector(0.0, 0.0, 1.0);
    expect(computeAvatarKinematics(vadDominant).posturalRotationDeg).toBe(6.5);

    const vadSubmissive = createAffectVector(0.0, 0.0, -1.0);
    expect(computeAvatarKinematics(vadSubmissive).posturalRotationDeg).toBe(-6.5);
  });
});
