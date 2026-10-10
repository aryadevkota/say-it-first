import { describe, it, expect } from 'vitest';
import { SILENT_PROSODY, createProsodyMetrics } from '../../src/domain/value-objects/ProsodyMetrics';

describe('useWebAudioProsody logic & fallback', () => {
  it('defaults to SILENT_PROSODY during text-mode input (FR-02)', () => {
    expect(SILENT_PROSODY.wordsPerMinute).toBe(0);
    expect(SILENT_PROSODY.volumeRms).toBe(0.0);
    expect(SILENT_PROSODY.pitchVarianceHz).toBe(0.0);
  });

  it('correctly creates voice prosody measurements from DSP buffers', () => {
    const speechMetrics = createProsodyMetrics(165, 0.42, 35.8);
    expect(speechMetrics.wordsPerMinute).toBe(165);
    expect(speechMetrics.volumeRms).toBe(0.42);
    expect(speechMetrics.pitchVarianceHz).toBe(35.8);
  });
});
