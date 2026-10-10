/**
 * cozyAudio.ts — Subtle, Cozy Web Audio Interaction Synthesizer
 *
 * Provides soft, warm tactile feedback on UI actions (button taps, tab switches,
 * version branches) using Web Audio API synthesis without external audio asset downloads.
 *
 * Specifications:
 * - Extremely gentle gain (0.05 - 0.08)
 * - Low-pass filter (800 - 1200 Hz) to eliminate harsh clicks
 * - Short organic decay (~35ms)
 * - Debounced to prevent acoustic clustering
 * - User toggle persisted in localStorage ('say_it_first_ui_sounds')
 * - Silent graceful degradation if AudioContext is blocked or unavailable
 */

const STORAGE_KEY = 'say_it_first_ui_sounds';

let audioCtx: AudioContext | null = null;
let lastPlayTimestamp = 0;
const MIN_DEBOUNCE_MS = 45;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      try {
        audioCtx = new AudioContextClass();
      } catch {
        return null;
      }
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

let memorySoundEnabled = true;

export function isUiSoundEnabled(): boolean {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return true; // Default ON
    return stored === 'true';
  }
  return memorySoundEnabled;
}

export function setUiSoundEnabled(enabled: boolean): void {
  memorySoundEnabled = enabled;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  }
}

export type SoundEffectType = 'tap' | 'toggle' | 'branch' | 'pop';

export function playCozySound(type: SoundEffectType = 'tap'): void {
  if (typeof window === 'undefined') return;
  if (!isUiSoundEnabled()) return;

  const now = performance.now();
  if (now - lastPlayTimestamp < MIN_DEBOUNCE_MS) return;
  lastPlayTimestamp = now;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Warm, muted lowpass filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'branch' ? 1400 : 950, t);
    filter.Q.setValueAtTime(1.2, t);

    if (type === 'tap') {
      // Soft wooden keycap tap
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(130, t + 0.038);

      gain.gain.setValueAtTime(0.065, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      osc.stop(t + 0.045);
    } else if (type === 'toggle') {
      // Gentle switch toggle
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(420, t + 0.035);

      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      osc.stop(t + 0.045);
    } else if (type === 'branch') {
      // Soft uplifting chime for creating a new conversational branch
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(587.33, t + 0.06);

      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      osc.stop(t + 0.085);
    } else if (type === 'pop') {
      // Gentle bubble pop on pill selection
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(280, t + 0.03);

      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
      osc.stop(t + 0.04);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
  } catch {
    // Fail completely silently if audio cannot play
  }
}
