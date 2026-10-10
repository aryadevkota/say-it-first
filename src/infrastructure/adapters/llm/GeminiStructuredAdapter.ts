/**
 * GeminiStructuredAdapter.ts — Infrastructure Adapter
 *
 * Implements LLMInferencePort for Gemini 1.5 Flash (or JSON-mode models)
 * with Zod validation, temperature 0.35, top-p 0.85, max tokens 450,
 * and standard AFFECT_PROCESSING_FAILED error recovery per §5.2.
 */

import { z } from 'zod';
import type {
  LLMInferencePort,
  LLMInferenceParams,
  LLMInferenceResult,
} from '../../../application/ports/out/LLMInferencePort';
import { createAffectVector } from '../../../domain/entities/AffectVector';
import { buildSystemPrompt } from './PromptTemplates';

export const RawLLMResponseSchema = z.object({
  spoken_response: z.string(),
  unspoken_subtext: z.string(),
  two_way_bridge: z.object({
    user_intent: z.string(),
    received_as: z.string(),
  }),
  emotional_delta: z.object({
    valence: z.number().min(-1.0).max(1.0),
    arousal: z.number().min(-1.0).max(1.0),
    dominance: z.number().min(-1.0).max(1.0),
  }),
  posture_cue: z.string(),
  pivot_recommendation: z.object({
    suggested_wording: z.string(),
    psychological_rationale: z.string(),
  }),
});

export type RawLLMResponse = z.infer<typeof RawLLMResponseSchema>;

export interface LLMCaller {
  generateJson(prompt: string, systemPrompt: string): Promise<unknown>;
}

export const FALLBACK_INFERENCE_RESULT: LLMInferenceResult = Object.freeze({
  spokenResponse: 'Could you rephrase that? I want to make sure I understand.',
  unspokenSubtext: 'Processing input...',
  twoWayBridge: {
    userIntent: 'Clarification request due to ambiguity.',
    receivedImpact: 'Momentary conversational pause to regain clarity.',
  },
  emotionalDelta: createAffectVector(0.0, 0.0, 0.0),
  postureCue: 'Slight head tilt, relaxed shoulders',
  pivotRecommendation: {
    suggestedWording: 'Could we revisit that last detail so I can take an accurate note?',
    psychologicalRationale: 'Clarifying factual boundaries without cognitive overload.',
  },
});

export class GeminiStructuredAdapter implements LLMInferencePort {
  public static readonly HYPERPARAMETERS = {
    model: 'gemini-1.5-flash',
    temperature: 0.35,
    topP: 0.85,
    maxOutputTokens: 450,
    responseFormat: 'application/json',
  };

  constructor(private readonly caller?: LLMCaller) {}

  public async inferTurn(params: LLMInferenceParams): Promise<LLMInferenceResult> {
    try {
      const systemPrompt = buildSystemPrompt({
        scenarioId: params.scenarioId,
        personaName: 'Alex',
        systemContext: 'A busy, direct manager balancing high workload.',
        currentVad: params.currentVad,
      });

      const userContentPrompt = JSON.stringify({
        active_branch_id: params.activeBranchId,
        parent_turn_id: params.parentTurnId,
        user_input: params.userInput,
        current_vad: params.currentVad,
      });

      if (!this.caller) {
        // Deterministic mock return when no external API caller is bound
        return {
          spokenResponse:
            'I understand, but taking time to write recap emails for every check-in is a significant extra load on my day.',
          unspokenSubtext:
            "I'm already working through lunch. If I agree to this, I'm taking on extra administrative work that I don't have time for.",
          twoWayBridge: {
            userIntent:
              'Self-advocacy to ensure delivery accuracy and eliminate cognitive overwhelm.',
            receivedImpact:
              'An administrative demand placed on the manager that criticizes their verbal briefing style.',
          },
          emotionalDelta: createAffectVector(-0.42, 0.51, 0.22),
          postureCue: 'Crossed arms tightly, torso angled 6 degrees away from screen',
          pivotRecommendation: {
            suggestedWording:
              'I want to save your time. What if I write a 2-minute bulleted recap after our meetings, and you just give it a quick thumbs-up?',
            psychologicalRationale:
              'Applies DBT Assertiveness: absorbs the administrative burden while obtaining the necessary written record.',
          },
        };
      }

      const rawJson = await this.caller.generateJson(userContentPrompt, systemPrompt);
      const parsed = RawLLMResponseSchema.parse(rawJson);

      return {
        spokenResponse: parsed.spoken_response,
        unspokenSubtext: parsed.unspoken_subtext,
        twoWayBridge: {
          userIntent: parsed.two_way_bridge.user_intent,
          receivedImpact: parsed.two_way_bridge.received_as,
        },
        emotionalDelta: createAffectVector(
          parsed.emotional_delta.valence,
          parsed.emotional_delta.arousal,
          parsed.emotional_delta.dominance,
        ),
        postureCue: parsed.posture_cue,
        pivotRecommendation: {
          suggestedWording: parsed.pivot_recommendation.suggested_wording,
          psychologicalRationale: parsed.pivot_recommendation.psychological_rationale,
        },
      };
    } catch {
      // Standard Fallback Recovery Envelope (§5.2)
      return FALLBACK_INFERENCE_RESULT;
    }
  }
}
