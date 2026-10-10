/**
 * AvatarKinematicsService.ts — Domain Service
 *
 * Deterministic kinematic parameterization formulas from §3.4:
 * - Oral Kinematics: MouthCurvature(V) = clamp(V × 24.0, -24.0, 24.0)
 * - Ocular Kinematics: BrowAngle(V, A) = clamp(-V × 16.0 + A × 8.0, -20.0, 20.0)
 * - Blink Frequency: BlinkInterval(A) = 3200ms / (1.0 + 0.8 × max(0.0, A))
 * - Respiratory Rhythm: BreathingPeriod(A) = 3.6 - (A × 1.4)
 * - Somatic Posture: PosturalRotation(D) = D × 6.5
 *
 * ZERO external dependencies beyond sibling domain entities.
 */

import type { AffectVector } from '../entities/AffectVector';

export interface AvatarKinematics {
  readonly stateLabel: string;
  readonly postureCue: string;
  readonly mouthCurvature: number;
  readonly browAngle: number;
  readonly blinkRateMs: number;
  readonly breathingCycleSec: number;
  readonly posturalRotationDeg: number;
}

export function computeAvatarKinematics(
  vad: AffectVector,
  postureCue: string = 'Neutral grounded posture',
  stateLabel?: string,
): AvatarKinematics {
  const mouthCurvature = Math.max(-24.0, Math.min(24.0, Number((vad.valence * 24.0).toFixed(2))));
  const browAngle = Math.max(-20.0, Math.min(20.0, Number((-vad.valence * 16.0 + vad.arousal * 8.0).toFixed(2))));
  const blinkRateMs = Math.round(3200.0 / (1.0 + 0.8 * Math.max(0.0, vad.arousal)));
  const breathingCycleSec = Number((3.6 - vad.arousal * 1.4).toFixed(2));
  const posturalRotationDeg = Number((vad.dominance * 6.5).toFixed(2));

  let label = stateLabel;
  if (!label) {
    if (vad.valence < -0.3 && vad.arousal > 0.4) {
      label = 'defensive_guarded';
    } else if (vad.valence > 0.4 && vad.arousal < 0.2) {
      label = 'warmly_receptive';
    } else if (vad.valence < -0.2 && vad.arousal < 0.0) {
      label = 'dismissive_detached';
    } else if (vad.valence < -0.2 && vad.dominance < -0.3) {
      label = 'overwhelmed_confused';
    } else {
      label = 'grounded_neutral';
    }
  }

  return Object.freeze({
    stateLabel: label,
    postureCue,
    mouthCurvature,
    browAngle,
    blinkRateMs,
    breathingCycleSec,
    posturalRotationDeg,
  });
}
