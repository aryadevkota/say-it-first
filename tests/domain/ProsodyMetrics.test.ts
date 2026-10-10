import { describe, it, expect } from 'vitest';
import {
  createProsodyMetrics,
  isValidProsodyMetrics,
  SILENT_PROSODY,
  MAX_WPM,
  MAX_VOLUME_RMS,
  MAX_PITCH_VARIANCE_HZ,
} from '../../src/domain/value-objects/ProsodyMetrics';

describe('ProsodyMetrics', () => {
  it('creates valid, immutable ProsodyMetrics with physically plausible inputs', () => {
    const prosody = createProsodyMetrics(185, 0.38, 24.2);

    expect(prosody.wordsPerMinute).toBe(185);
    expect(prosody.volumeRms).toBe(0.38);
    expect(prosody.pitchVarianceHz).toBe(24.2);
    expect(Object.isFrozen(prosody)).toBe(true);
    expect(isValidProsodyMetrics(prosody)).toBe(true);
  });

  it('provides SILENT_PROSODY for text mode', () => {
    expect(SILENT_PROSODY.wordsPerMinute).toBe(0);
    expect(SILENT_PROSODY.volumeRms).toBe(0.0);
    expect(SILENT_PROSODY.pitchVarianceHz).toBe(0.0);
    expect(Object.isFrozen(SILENT_PROSODY)).toBe(true);
    expect(isValidProsodyMetrics(SILENT_PROSODY)).toBe(true);
  });

  it('rejects negative bounds and enforces physical ceilings', () => {
    expect(() => createProsodyMetrics(-1, 0.5, 20)).toThrow(RangeError);
    expect(() => createProsodyMetrics(MAX_WPM + 1, 0.5, 20)).toThrow(RangeError);

    expect(() => createProsodyMetrics(120, -0.1, 20)).toThrow(RangeError);
    expect(() => createProsodyMetrics(120, MAX_VOLUME_RMS + 0.1, 20)).toThrow(RangeError);

    expect(() => createProsodyMetrics(120, 0.5, -5)).toThrow(RangeError);
    expect(() => createProsodyMetrics(120, 0.5, MAX_PITCH_VARIANCE_HZ + 1)).toThrow(RangeError);
  });

  it('rejects NaN or non-finite values', () => {
    expect(() => createProsodyMetrics(NaN, 0.5, 20)).toThrow(RangeError);
    expect(() => createProsodyMetrics(120, Infinity, 20)).toThrow(RangeError);
    expect(() => createProsodyMetrics(120, 0.5, -Infinity)).toThrow(RangeError);
  });
});
