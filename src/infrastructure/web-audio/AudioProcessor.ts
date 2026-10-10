/**
 * AudioProcessor.ts — Infrastructure Adapter
 *
 * Web Audio Context & AnalyserNode bindings running client-side at 44.1kHz.
 * Specification: say_it_first_system_architecture_manual.md §1, ADR-003
 */

import { AudioProsodyAnalyzer } from './ProsodyExtractor';

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyzer: AudioProsodyAnalyzer | null = null;

  public async initialize(stream: MediaStream): Promise<void> {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AudioContextClass({ sampleRate: 44100 });

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;

    this.sourceNode = this.audioContext.createMediaStreamSource(stream);
    this.sourceNode.connect(this.analyserNode);

    this.analyzer = new AudioProsodyAnalyzer(this.analyserNode);
  }

  public getAnalyzer(): AudioProsodyAnalyzer | null {
    return this.analyzer;
  }

  public getSampleRate(): number {
    return this.audioContext?.sampleRate ?? 44100;
  }

  public close(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyserNode = null;
    this.analyzer = null;
  }
}
