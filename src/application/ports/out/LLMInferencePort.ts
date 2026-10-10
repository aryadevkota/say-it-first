/**
 * LLMInferencePort.ts — Outbound Port
 *
 * Contract for LLM inference reasoning core.
 * Specification:
 *   - say_it_first_system_architecture_manual.md §5.1, §6
 */

import type { AffectVector } from '../../../domain/entities/AffectVector';
import type { ConversationNode } from '../../../domain/entities/ConversationNode';
import type { ProsodyMetrics } from '../../../domain/value-objects/ProsodyMetrics';

export interface LLMInferenceParams {
  scenarioId: string;
  activeBranchId: string;
  parentTurnId: string | null;
  history: readonly ConversationNode[];
  userInput: {
    text: string;
    inputMode: 'voice' | 'text';
    prosody: ProsodyMetrics;
  };
  currentVad: AffectVector;
  inertiaLambda?: number;
}

export interface LLMInferenceResult {
  spokenResponse: string;
  unspokenSubtext: string;
  twoWayBridge: {
    userIntent: string;
    receivedImpact: string;
  };
  emotionalDelta: AffectVector;
  postureCue: string;
  pivotRecommendation: {
    suggestedWording: string;
    psychologicalRationale: string;
  };
}

export interface LLMInferencePort {
  inferTurn(params: LLMInferenceParams): Promise<LLMInferenceResult>;
}
