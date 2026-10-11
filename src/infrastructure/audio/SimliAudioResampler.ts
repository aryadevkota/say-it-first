/**
 * SimliAudioResampler.ts — Audio Pipeline & Ingestion Resampler
 *
 * Implements linear PCM resampling and chunking for Simli's real-time
 * Speech-to-Video WebRTC pipeline:
 * - Target format: 16kHz linear PCM (pcm_16000), 16-bit signed integer, Little Endian, mono.
 * - Handles downsampling from 44.1kHz / 48kHz / 24kHz Web Audio streams.
 * - Provides chunk packaging for Simli WebRTC DataChannel / audio track ingestion.
 */

/**
 * Resample a single-channel Float32Array (normalized [-1.0, 1.0]) to 16kHz 16-bit linear PCM (Int16Array).
 */
export function resampleFloat32To16kPCM(
  inputData: Float32Array,
  inputSampleRate: number,
): Int16Array {
  if (inputData.length === 0) {
    return new Int16Array(0);
  }

  const targetSampleRate = 16000;
  if (inputSampleRate === targetSampleRate) {
    const output = new Int16Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
      const s = Math.max(-1, Math.min(1, inputData[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }

  const ratio = inputSampleRate / targetSampleRate;
  const newLength = Math.round(inputData.length / ratio);
  const result = new Int16Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const position = i * ratio;
    const index = Math.floor(position);
    const fraction = position - index;

    const sample1 = inputData[index] ?? 0;
    const sample2 = inputData[index + 1] ?? sample1;

    // Linear interpolation
    const interpolated = sample1 + (sample2 - sample1) * fraction;
    const clamped = Math.max(-1, Math.min(1, interpolated));
    result[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }

  return result;
}

/**
 * Convert Int16Array PCM to raw byte buffer (Uint8Array, 16-bit Little Endian) for WebRTC transmission.
 */
export function pcmInt16ToUint8Bytes(pcm16: Int16Array): Uint8Array {
  const buffer = new ArrayBuffer(pcm16.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < pcm16.length; i++) {
    view.setInt16(i * 2, pcm16[i], true); // Little Endian
  }
  return new Uint8Array(buffer);
}

/**
 * Decode an ArrayBuffer (e.g. from ElevenLabs PCM or Web Audio) and ensure 16kHz mono PCM bytes.
 */
export function formatAudioStreamTo16kPCMBytes(
  inputBuffer: ArrayBuffer,
  sourceSampleRate: number = 24000,
): Uint8Array {
  // If source is already raw 16-bit PCM at sourceSampleRate
  const int16View = new Int16Array(inputBuffer);
  const float32 = new Float32Array(int16View.length);

  for (let i = 0; i < int16View.length; i++) {
    float32[i] = int16View[i] / (int16View[i] < 0 ? 0x8000 : 0x7fff);
  }

  const resampledInt16 = resampleFloat32To16kPCM(float32, sourceSampleRate);
  return pcmInt16ToUint8Bytes(resampledInt16);
}
