/**
 * VoiceSynthesisPort.ts — Outbound Port
 *
 * Contract for speech audio synthesis (Web Speech API or external TTS).
 * Specification: say_it_first_system_architecture_manual.md §1, §2.2
 */

export interface VoiceSynthesisOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
  voiceName?: string;
}

export interface VoiceSynthesisPort {
  speak(text: string, options?: VoiceSynthesisOptions): Promise<void>;
  cancel(): void;
  isSpeaking(): boolean;
}
