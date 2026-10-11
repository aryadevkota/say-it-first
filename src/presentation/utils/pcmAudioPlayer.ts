/**
 * pcmAudioPlayer.ts — Low-Latency Web Audio PCM Stream Player
 *
 * Plays 16000Hz 16-bit mono PCM chunks in real time:
 * - Direct conversion from signed 16-bit PCM (pcm_s16le) to Float32AudioBuffer
 * - Seamless audio chunk scheduling with timestamp queuing
 * - Instant flush / abort on interruption
 * - Clean mute / unmute gain control
 */

export class PcmAudioPlayer {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private nextPlayTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isMuted: boolean = false;
  private onPlaybackEndedCallback?: () => void;
  private playbackEndTimer: any = null;

  constructor(options?: { isMuted?: boolean; onPlaybackEnded?: () => void }) {
    this.isMuted = !!options?.isMuted;
    this.onPlaybackEndedCallback = options?.onPlaybackEnded;
  }

  private initContext(): void {
    if (typeof window === 'undefined') return;

    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Feed a chunk of raw pcm_s16le audio bytes (16kHz, mono).
   */
  public feedChunk(chunk: Uint8Array): void {
    if (typeof window === 'undefined' || chunk.byteLength < 2) return;
    this.initContext();

    if (!this.ctx || !this.gainNode) return;

    const numSamples = Math.floor(chunk.byteLength / 2);
    const dataView = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
    const float32 = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const sample = dataView.getInt16(i * 2, true); // little-endian
      float32[i] = sample / 32768.0;
    }

    const audioBuffer = this.ctx.createBuffer(1, numSamples, 16000);
    audioBuffer.copyToChannel(float32, 0);

    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.gainNode);

    const now = this.ctx.currentTime;
    const startTime = Math.max(now, this.nextPlayTime);
    source.start(startTime);
    this.nextPlayTime = startTime + audioBuffer.duration;

    this.activeSources.push(source);

    source.onended = () => {
      const idx = this.activeSources.indexOf(source);
      if (idx !== -1) {
        this.activeSources.splice(idx, 1);
      }
    };

    // Schedule callback when playback ends
    if (this.playbackEndTimer) {
      clearTimeout(this.playbackEndTimer);
    }
    const delayMs = Math.max(0, (this.nextPlayTime - now) * 1000);
    this.playbackEndTimer = setTimeout(() => {
      if (this.activeSources.length === 0) {
        this.onPlaybackEndedCallback?.();
      }
    }, delayMs);
  }

  /**
   * Instantly stops all playing audio and resets the schedule buffer.
   */
  public stopAndFlush(): void {
    if (this.playbackEndTimer) {
      clearTimeout(this.playbackEndTimer);
      this.playbackEndTimer = null;
    }

    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Source may already be stopped
      }
    }
    this.activeSources = [];

    if (this.ctx) {
      this.nextPlayTime = this.ctx.currentTime;
    }
  }

  /**
   * Toggle or set mute state on the audio output.
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public close(): void {
    this.stopAndFlush();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.gainNode = null;
    }
  }
}
