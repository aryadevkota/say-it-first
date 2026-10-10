/**
 * ProsodyExtractor.ts — Client-Side DSP Module
 *
 * Implements AudioProsodyAnalyzer TypeScript class verbatim from
 * say_it_first_system_architecture_manual.md §3.3:
 * 1. Root Mean Square (RMS) Volume Calculation
 * 2. Fundamental Frequency (F0) Extraction via Normalized Autocorrelation
 *
 * Zero external dependencies. Browser Web Audio API AnalyserNode bindings.
 */

export interface AnalyserNodeLike {
  fftSize: number;
  getFloatTimeDomainData(array: Float32Array): void;
}

export class AudioProsodyAnalyzer {
  private analyser: AnalyserNodeLike;
  private buffer: Float32Array;

  constructor(analyserNode: AnalyserNodeLike) {
    this.analyser = analyserNode;
    this.analyser.fftSize = 2048;
    this.buffer = new Float32Array(this.analyser.fftSize);
  }

  // 1. Root Mean Square (RMS) Volume Calculation
  public calculateRmsVolume(): number {
    this.analyser.getFloatTimeDomainData(this.buffer);
    let sumSquares = 0.0;
    for (let i = 0; i < this.buffer.length; i++) {
      sumSquares += this.buffer[i] * this.buffer[i];
    }
    return Math.sqrt(sumSquares / this.buffer.length);
  }

  // 2. Fundamental Frequency (F0) Extraction via Normalized Autocorrelation
  public detectFundamentalPitch(sampleRate: number): number {
    this.analyser.getFloatTimeDomainData(this.buffer);
    const SIZE = this.buffer.length;
    let r1 = 0;
    let r2 = SIZE - 1;
    const thres = 0.2;

    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(this.buffer[i]) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(this.buffer[SIZE - i]) < thres) {
        r2 = SIZE - i;
        break;
      }
    }

    const trimmed = this.buffer.slice(r1, r2);
    if (trimmed.length === 0) return 0.0;

    const c = new Float32Array(trimmed.length).fill(0);

    for (let lag = 0; lag < trimmed.length; lag++) {
      for (let i = 0; i < trimmed.length - lag; i++) {
        c[lag] += trimmed[i] * trimmed[i + lag];
      }
    }

    let d = 0;
    while (d < c.length - 1 && c[d] > c[d + 1]) {
      d++;
    }

    let maxval = -1;
    let maxpos = -1;
    for (let i = d; i < trimmed.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    return maxpos > 0 ? sampleRate / maxpos : 0.0;
  }
}
