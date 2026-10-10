import { describe, it, expect, vi } from 'vitest';
import {
  GeminiStructuredAdapter,
  RawLLMResponseSchema,
  FALLBACK_INFERENCE_RESULT,
  type LLMCaller,
} from '../../src/infrastructure/adapters/llm/GeminiStructuredAdapter';
import { createAffectVector } from '../../src/domain/entities/AffectVector';
import { createProsodyMetrics } from '../../src/domain/value-objects/ProsodyMetrics';

describe('GeminiStructuredAdapter', () => {
  const dummyVad = createAffectVector(0.1, 0.2, 0.3);
  const dummyProsody = createProsodyMetrics(140, 0.25, 18.0);

  it('validates a schema-compliant LLM payload via Zod', () => {
    const validJson = {
      spoken_response: 'I see what you mean.',
      unspoken_subtext: 'I am under immense time pressure.',
      two_way_bridge: {
        user_intent: 'Needs written summaries for clarity.',
        received_as: 'Feels like extra work on manager.',
      },
      emotional_delta: {
        valence: -0.4,
        arousal: 0.5,
        dominance: 0.2,
      },
      posture_cue: 'Crossed arms',
      pivot_recommendation: {
        suggested_wording: 'Can I draft the summary for you?',
        psychological_rationale: 'Absorbs work while securing notes.',
      },
    };

    const parsed = RawLLMResponseSchema.parse(validJson);
    expect(parsed.spoken_response).toBe('I see what you mean.');
    expect(parsed.emotional_delta.valence).toBe(-0.4);
  });

  it('rejects emotional_delta outside [-1.0, 1.0] in Zod validation', () => {
    const outOfBoundsJson = {
      spoken_response: 'Test',
      unspoken_subtext: 'Test',
      two_way_bridge: { user_intent: 'A', received_as: 'B' },
      emotional_delta: { valence: 1.5, arousal: 0, dominance: 0 },
      posture_cue: 'Posture',
      pivot_recommendation: { suggested_wording: 'W', psychological_rationale: 'R' },
    };

    expect(() => RawLLMResponseSchema.parse(outOfBoundsJson)).toThrow();
  });

  it('returns fallback response on caller failure or malformed payload (§5.2)', async () => {
    const failingCaller: LLMCaller = {
      generateJson: vi.fn().mockRejectedValue(new Error('Network timeout / JSON error')),
    };

    const adapter = new GeminiStructuredAdapter(failingCaller);
    const result = await adapter.inferTurn({
      scenarioId: 'test_scenario',
      activeBranchId: 'main',
      parentTurnId: null,
      history: [],
      userInput: {
        text: 'Hello',
        inputMode: 'text',
        prosody: dummyProsody,
      },
      currentVad: dummyVad,
    });

    expect(result.spokenResponse).toBe(FALLBACK_INFERENCE_RESULT.spokenResponse);
    expect(result.emotionalDelta.valence).toBe(0.0);
    expect(result.emotionalDelta.arousal).toBe(0.0);
  });

  it('operates with deterministic default mock when no caller is provided', async () => {
    const adapter = new GeminiStructuredAdapter();
    const result = await adapter.inferTurn({
      scenarioId: 'test_scenario',
      activeBranchId: 'main',
      parentTurnId: null,
      history: [],
      userInput: {
        text: 'Hello',
        inputMode: 'voice',
        prosody: dummyProsody,
      },
      currentVad: dummyVad,
    });

    expect(result.spokenResponse).toContain('taking time to write recap emails');
    expect(result.emotionalDelta.valence).toBeCloseTo(-0.42);
    expect(result.emotionalDelta.arousal).toBeCloseTo(0.51);
  });

  it('adapts to custom scenario context and user text dynamically', async () => {
    const adapter = new GeminiStructuredAdapter();
    const result = await adapter.inferTurn({
      scenarioId: 'custom-roommate-noise-123',
      activeBranchId: 'main',
      parentTurnId: null,
      history: [],
      userInput: {
        text: 'Hey Alex, could we agree on keeping music to headphones after 10 PM?',
        inputMode: 'text',
      },
      customScenario: {
        id: 'custom-roommate-noise-123',
        partner: {
          name: 'Alex',
          role: 'Roommate',
          concerns: 'Felt defensive about previous noise complaints',
        },
      },
      currentVad: dummyVad,
    });

    expect(result.spokenResponse).toBeTruthy();
    expect(result.spokenResponse).not.toContain('recap emails');
    expect(result.twoWayBridge.userIntent).toBeTruthy();
  });

  it('recognizes verbal hesitation without defensive escalation', async () => {
    const adapter = new GeminiStructuredAdapter();
    const result = await adapter.inferTurn({
      scenarioId: 'custom-hesitation-456',
      activeBranchId: 'main',
      parentTurnId: null,
      history: [],
      userInput: {
        text: "I don't know how to put this, but things have felt a bit overwhelming lately.",
        inputMode: 'text',
      },
      currentVad: dummyVad,
    });

    expect(result.spokenResponse).toContain('Take your time');
    expect(result.twoWayBridge.userIntent).toContain('processing pause');
  });

  it('respects user boundaries without demanding compromise', async () => {
    const adapter = new GeminiStructuredAdapter();
    const result = await adapter.inferTurn({
      scenarioId: 'work-boundaries',
      activeBranchId: 'main',
      parentTurnId: null,
      history: [],
      userInput: {
        text: "I can't take on this extra project right now.",
        inputMode: 'text',
      },
      currentVad: dummyVad,
    });

    expect(result.spokenResponse).toBeTruthy();
    expect(result.twoWayBridge.userIntent).toContain('Self-advocacy');
  });
});
