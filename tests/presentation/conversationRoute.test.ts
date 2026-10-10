import { describe, it, expect, vi } from 'vitest';
import { handleTurnRequest } from '../../src/presentation/api/routes/conversation';
import type { ProcessTurnUseCase, ProcessTurnResponse } from '../../src/application/use-cases/ProcessTurnUseCase';
import { createAffectVector } from '../../src/domain/entities/AffectVector';

describe('conversationRoute handler', () => {
  const validPayload = {
    scenario_id: 'workplace_written_specs',
    active_branch_id: 'branch_main_01',
    parent_turn_id: 'turn_1717800000_a1b2c3',
    user_input: {
      text: 'When instructions are only verbal, I get overwhelmed and miss key specifications.',
      input_mode: 'voice',
      prosody: {
        words_per_minute: 185,
        volume_rms: 0.38,
        pitch_variance_hz: 24.2,
      },
    },
    current_vad: {
      valence: 0.1,
      arousal: 0.2,
      dominance: 0.3,
    },
  };

  it('returns HTTP 200 OK with valid response envelope on compliant payload', async () => {
    const result = await handleTurnRequest(validPayload);

    expect(result.status).toBe(200);
    const data = result.data as ProcessTurnResponse;

    expect(data.turn_id).toBeDefined();
    expect(data.spoken_response).toBeDefined();
    expect(data.unspoken_subtext).toBeDefined();
    expect(data.two_way_bridge.user_intent).toBeDefined();
    expect(data.two_way_bridge.received_as).toBeDefined();
    expect(data.affect_computation.resolved_vector).toBeDefined();
    expect(data.avatar_kinematics.state_label).toBeDefined();
    expect(data.safety_gate.tension_index).toBeDefined();
    expect(data.pocket_script_pivot.recommended_text).toBeDefined();
  });

  it('returns HTTP 400 with validation issues on malformed input payload', async () => {
    const invalidPayload = {
      ...validPayload,
      scenario_id: '', // Empty scenario_id
      current_vad: { valence: 5.0, arousal: 0, dominance: 0 }, // Out of bounds
    };

    const result = await handleTurnRequest(invalidPayload);
    expect(result.status).toBe(400);

    const errorData = result.data as { error: { code: string; issues: unknown[] } };
    expect(errorData.error.code).toBe('INVALID_REQUEST_PAYLOAD');
    expect(errorData.error.issues.length).toBeGreaterThan(0);
  });

  it('returns HTTP 500 with Standard Error Envelope (§5.2) on internal use case failure', async () => {
    const mockFailingUseCase = {
      execute: vi.fn().mockRejectedValue(new Error('Internal processing failure')),
    } as unknown as ProcessTurnUseCase;

    const result = await handleTurnRequest(validPayload, mockFailingUseCase);

    expect(result.status).toBe(500);
    const errorData = result.data as {
      error: {
        code: string;
        message: string;
        retryable: boolean;
        fallback_state: { spoken_response: string };
      };
    };

    expect(errorData.error.code).toBe('AFFECT_PROCESSING_FAILED');
    expect(errorData.error.retryable).toBe(true);
    expect(errorData.error.fallback_state.spoken_response).toContain('Could you rephrase that?');
  });
});
