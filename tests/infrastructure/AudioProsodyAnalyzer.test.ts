import { describe, it, expect } from 'vitest';
import { AudioProsodyAnalyzer, type AnalyserNodeLike } from '../../src/infrastructure/web-audio/ProsodyExtractor';

class MockAnalyserNode implements AnalyserNodeLike {
  public fftSize: number = 2048;
  private syntheticData: Float32Array;

  constructor(syntheticData?: Float32Array) {
    this.syntheticData = syntheticData ?? new Float32Array(this.fftSize);
  }

  public setData(data: Float32Array): void {
    this.syntheticData = data;
  }

  public getFloatTimeDomainData(array: Float32Array): void {
    array.set(this.syntheticData.subarray(0, array.length));
  }
}

describe('AudioProsodyAnalyzer', () => {
  it('calculates RMS volume as 0 for pure silence', () => {
    const mock = new MockAnalyserNode();
    const analyzer = new AudioProsodyAnalyzer(mock);
    expect(analyzer.calculateRmsVolume()).toBe(0.0);
  });

  it('calculates RMS volume for constant DC signal of magnitude 0.5', () => {
    const data = new Float32Array(2048).fill(0.5);
    const mock = new MockAnalyserNode(data);
    const analyzer = new AudioProsodyAnalyzer(mock);
    expect(analyzer.calculateRmsVolume()).toBeCloseTo(0.5, 5);
  });

  it('calculates RMS volume for pure sine wave of peak amplitude 1.0 (expected RMS = 1/√2 ≈ 0.707)', () => {
    const data = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      data[i] = Math.sin((2 * Math.PI * i) / 64);
    }
    const mock = new MockAnalyserNode(data);
    const analyzer = new AudioProsodyAnalyzer(mock);
    expect(analyzer.calculateRmsVolume()).toBeCloseTo(1 / Math.SQRT2, 2);
  });

  it('detects fundamental pitch (F0) accurately for synthetic sine wave at 220Hz', () => {
    const sampleRate = 44100;
    const targetFreq = 220; // Period = 44100 / 220 ≈ 200.45 samples
    const data = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      data[i] = Math.sin((2 * Math.PI * targetFreq * i) / sampleRate);
    }
    const mock = new MockAnalyserNode(data);
    const analyzer = new AudioProsodyAnalyzer(mock);
    const detected = analyzer.detectFundamentalPitch(sampleRate);

    // Should be within ~2% of 220Hz given integer lag resolution
    expect(detected).toBeGreaterThan(210);
    expect(detected).toBeLessThan(230);
  });

  it('detects fundamental pitch (F0) accurately for synthetic sine wave at 440Hz', () => {
    const sampleRate = 44100;
    const targetFreq = 440;
    const data = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      data[i] = Math.sin((2 * Math.PI * targetFreq * i) / sampleRate);
    }
    const mock = new MockAnalyserNode(data);
    const analyzer = new AudioProsodyAnalyzer(mock);
    const detected = analyzer.detectFundamentalPitch(sampleRate);

    expect(detected).toBeGreaterThan(430);
    expect(detected).toBeLessThan(450);
  });

  it('returns 0 pitch for silence', () => {
    const mock = new MockAnalyserNode();
    const analyzer = new AudioProsodyAnalyzer(mock);
    expect(analyzer.detectFundamentalPitch(44100)).toBe(0.0);
  });
});
