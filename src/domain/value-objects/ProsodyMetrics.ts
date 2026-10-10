/**
 * ProsodyMetrics.ts — Domain Value Object
 *
 * Captures client-side acoustic features extracted via Web Audio API:
 *   - wordsPerMinute: speech cadence (WPM)
 *   - volumeRms: root mean square energy
 *   - pitchVarianceHz: F0 pitch contour instability
 *
 * Specification:
 *   - say_it_first_system_architecture_manual.md §3.3, §5.1
 *   - say_it_first_technical_specification.md §3.3
 *
 * ZERO external dependencies. Pure domain logic only.
 */

// ── Interface ────────────────────────────────────────────────────────────────

export interface ProsodyMetrics {
  readonly wordsPerMinute: number;   // ≥ 0, typical speech 80–220 WPM
  readonly volumeRms: number;        // ≥ 0.0, RMS energy (0.0 = silence, ~1.0 max)
  readonly pitchVarianceHz: number;  // ≥ 0.0, Hz variance of F0 contour
}

// ── Physical Limits ──────────────────────────────────────────────────────────

/** Maximum realistic WPM (auctioneer speed ≈ 400) */
export const MAX_WPM = 500;

/** Maximum RMS energy (normalized float) */
export const MAX_VOLUME_RMS = 1.0;

/** Maximum pitch variance in Hz (physiologically implausible above this) */
export const MAX_PITCH_VARIANCE_HZ = 500.0;

// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates that all prosody metrics are within physically realistic bounds.
 * All values must be non-negative.
 */
export function isValidProsodyMetrics(metrics: ProsodyMetrics): boolean {
  return (
    typeof metrics.wordsPerMinute === 'number' &&
    metrics.wordsPerMinute >= 0 &&
    metrics.wordsPerMinute <= MAX_WPM &&
    typeof metrics.volumeRms === 'number' &&
    metrics.volumeRms >= 0.0 &&
    metrics.volumeRms <= MAX_VOLUME_RMS &&
    typeof metrics.pitchVarianceHz === 'number' &&
    metrics.pitchVarianceHz >= 0.0 &&
    metrics.pitchVarianceHz <= MAX_PITCH_VARIANCE_HZ &&
    Number.isFinite(metrics.wordsPerMinute) &&
    Number.isFinite(metrics.volumeRms) &&
    Number.isFinite(metrics.pitchVarianceHz)
  );
}

// ── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a validated, immutable ProsodyMetrics value object.
 *
 * @throws {RangeError} if any metric is negative or exceeds physical limits.
 */
export function createProsodyMetrics(
  wordsPerMinute: number,
  volumeRms: number,
  pitchVarianceHz: number,
): ProsodyMetrics {
  if (!Number.isFinite(wordsPerMinute) || wordsPerMinute < 0 || wordsPerMinute > MAX_WPM) {
    throw new RangeError(
      `wordsPerMinute must be in [0, ${MAX_WPM}], received: ${wordsPerMinute}`,
    );
  }
  if (!Number.isFinite(volumeRms) || volumeRms < 0.0 || volumeRms > MAX_VOLUME_RMS) {
    throw new RangeError(
      `volumeRms must be in [0.0, ${MAX_VOLUME_RMS}], received: ${volumeRms}`,
    );
  }
  if (!Number.isFinite(pitchVarianceHz) || pitchVarianceHz < 0.0 || pitchVarianceHz > MAX_PITCH_VARIANCE_HZ) {
    throw new RangeError(
      `pitchVarianceHz must be in [0.0, ${MAX_PITCH_VARIANCE_HZ}], received: ${pitchVarianceHz}`,
    );
  }

  return Object.freeze({
    wordsPerMinute,
    volumeRms,
    pitchVarianceHz,
  });
}

// ── Zero/Default Constant ────────────────────────────────────────────────────

/** Silent / text-mode prosody — zero acoustic signal. */
export const SILENT_PROSODY: ProsodyMetrics = Object.freeze({
  wordsPerMinute: 0,
  volumeRms: 0.0,
  pitchVarianceHz: 0.0,
});
