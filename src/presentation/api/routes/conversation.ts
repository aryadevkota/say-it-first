/**
 * conversation.ts — Presentation Route Handler
 *
 * Implements POST /api/v1/conversation/turn matching:
 * - Request Contract §5.1
 * - Response Contract 200 OK §5.1
 * - Standard Error Envelope §5.2
 */

import { z } from 'zod';
import { ProcessTurnUseCase } from '../../../application/use-cases/ProcessTurnUseCase';
import { GeminiStructuredAdapter } from '../../../infrastructure/adapters/llm/GeminiStructuredAdapter';
import { InMemorySessionRepo } from '../../../infrastructure/adapters/storage/InMemorySessionRepo';
import { createAffectVector } from '../../../domain/entities/AffectVector';
import { createProsodyMetrics } from '../../../domain/value-objects/ProsodyMetrics';

// ── Zod Request Schema (§5.1) ───────────────────────────────────────────────

export const TurnRequestSchema = z.object({
  scenario_id: z.string().min(1, 'scenario_id is required'),
  active_branch_id: z.string().min(1, 'active_branch_id is required'),
  parent_turn_id: z.string().nullable(),
  user_input: z.object({
    text: z.string().min(1, 'user_input.text is required'),
    input_mode: z.enum(['voice', 'text']),
    prosody: z.object({
      words_per_minute: z.number().min(0),
      volume_rms: z.number().min(0).max(1),
      pitch_variance_hz: z.number().min(0),
    }),
  }),
  current_vad: z.object({
    valence: z.number().min(-1).max(1),
    arousal: z.number().min(-1).max(1),
    dominance: z.number().min(-1).max(1),
  }),
  custom_scenario: z
    .object({
      situation: z.string().optional(),
      partner_role: z.string().optional(),
      partner_name: z.string().optional(),
      user_goal: z.string().optional(),
      constraints: z.string().optional(),
    })
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['partner', 'user', 'persona']),
        content: z.string(),
      }),
    )
    .optional(),
});

export type TurnRequestPayload = z.infer<typeof TurnRequestSchema>;

// ── Shared Session Repo & Use Case Factory ───────────────────────────────────

const sessionRepo = new InMemorySessionRepo();
const llmAdapter = new GeminiStructuredAdapter();

export function createProcessTurnUseCase(): ProcessTurnUseCase {
  return new ProcessTurnUseCase(llmAdapter, sessionRepo);
}

// ── Route Handler ────────────────────────────────────────────────────────────

export interface RouteHandlerResult {
  status: number;
  data: unknown;
}

export async function handleTurnRequest(
  body: unknown,
  useCase: ProcessTurnUseCase = createProcessTurnUseCase(),
): Promise<RouteHandlerResult> {
  const parsed = TurnRequestSchema.safeParse(body);

  if (!parsed.success) {
    return {
      status: 400,
      data: {
        error: {
          code: 'INVALID_REQUEST_PAYLOAD',
          message: 'Request payload failed schema validation.',
          issues: parsed.error.issues,
        },
      },
    };
  }

  const {
    scenario_id,
    active_branch_id,
    parent_turn_id,
    user_input,
    current_vad,
  } = parsed.data;

  try {
    const prosody = createProsodyMetrics(
      user_input.prosody.words_per_minute,
      user_input.prosody.volume_rms,
      user_input.prosody.pitch_variance_hz,
    );

    const vad = createAffectVector(
      current_vad.valence,
      current_vad.arousal,
      current_vad.dominance,
    );

    const response = await useCase.execute({
      scenarioId: scenario_id,
      activeBranchId: active_branch_id,
      parentTurnId: parent_turn_id,
      userInput: {
        text: user_input.text,
        inputMode: user_input.input_mode,
        prosody,
      },
      currentVad: vad,
      customScenario: parsed.data.custom_scenario,
      history: parsed.data.history,
    });

    return {
      status: 200,
      data: response,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    // Standard Error Envelope (§5.2)
    return {
      status: 500,
      data: {
        error: {
          code: 'AFFECT_PROCESSING_FAILED',
          message: errorMessage,
          request_id: `req_${Math.random().toString(36).substring(2, 10)}`,
          retryable: true,
          fallback_state: {
            spoken_response: 'Could you rephrase that? I want to make sure I understand.',
            unspoken_subtext: 'Processing input...',
            resolved_vector: { valence: 0.0, arousal: 0.0, dominance: 0.0 },
          },
        },
      },
    };
  }
}
