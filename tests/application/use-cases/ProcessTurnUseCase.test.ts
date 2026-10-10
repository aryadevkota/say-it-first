import { describe, it, expect, vi } from 'vitest';
import { ProcessTurnUseCase } from '../../../src/application/use-cases/ProcessTurnUseCase';
import type { LLMInferencePort, LLMInferenceResult } from '../../../src/application/ports/out/LLMInferencePort';
import type { SessionRepositoryPort } from '../../../src/application/ports/out/SessionRepositoryPort';
import { ConversationTimelineGraph } from '../../../src/domain/entities/ConversationTimelineGraph';
import { createAffectVector } from '../../../src/domain/entities/AffectVector';
import { createProsodyMetrics } from '../../../src/domain/value-objects/ProsodyMetrics';

class MockSessionRepo implements SessionRepositoryPort {
  private store = new Map<string, ConversationTimelineGraph>();

  async getGraph(sessionId: string): Promise<ConversationTimelineGraph | null> {
    return this.store.get(sessionId) ?? null;
  }
  async saveGraph(sessionId: string, graph: ConversationTimelineGraph): Promise<void> {
    this.store.set(sessionId, graph);
  }
  async deleteGraph(sessionId: string): Promise<void> {
    this.store.delete(sessionId);
  }
}

describe('ProcessTurnUseCase', () => {
  it('executes full turn loop matching §5.1 contract with damping and kinematics', async () => {
    const mockLlmResult: LLMInferenceResult = {
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

    const mockLlmPort: LLMInferencePort = {
      inferTurn: vi.fn().mockResolvedValue(mockLlmResult),
    };
    const mockRepo = new MockSessionRepo();

    const useCase = new ProcessTurnUseCase(mockLlmPort, mockRepo, 0.65);

    const initialVad = createAffectVector(0.1, 0.2, 0.3);
    const prosody = createProsodyMetrics(185, 0.38, 24.2);

    const response = await useCase.execute({
      scenarioId: 'workplace_written_specs',
      activeBranchId: 'branch_main_01',
      parentTurnId: null,
      userInput: {
        text: 'When instructions are only verbal, I get overwhelmed and miss key specifications.',
        inputMode: 'voice',
        prosody,
      },
      currentVad: initialVad,
    });

    // 1. Verify response structure & contents
    expect(response.spoken_response).toBe(mockLlmResult.spokenResponse);
    expect(response.unspoken_subtext).toBe(mockLlmResult.unspokenSubtext);
    expect(response.two_way_bridge.user_intent).toBe(mockLlmResult.twoWayBridge.userIntent);
    expect(response.two_way_bridge.received_as).toBe(mockLlmResult.twoWayBridge.receivedImpact);

    // 2. Verify Affect Damping calculation with lambda = 0.65
    // V: 0.65 * 0.1 + 0.35 * (-0.42) = -0.082
    // A: 0.65 * 0.2 + 0.35 * 0.51 = 0.3085
    // D: 0.65 * 0.3 + 0.35 * 0.22 = 0.272
    expect(response.affect_computation.resolved_vector.valence).toBeCloseTo(-0.082, 3);
    expect(response.affect_computation.resolved_vector.arousal).toBeCloseTo(0.3085, 3);
    expect(response.affect_computation.resolved_vector.dominance).toBeCloseTo(0.272, 3);
    expect(response.affect_computation.inertia_applied).toBe(0.65);

    // 3. Verify Kinematics calculation
    expect(response.avatar_kinematics.mouth_curvature).toBeCloseTo(
      response.affect_computation.resolved_vector.valence * 24.0,
      1,
    );
    expect(response.avatar_kinematics.posture_cue).toBe(mockLlmResult.postureCue);

    // 4. Verify Safety gate
    expect(response.safety_gate.tension_index).toBeDefined();

    // 5. Verify graph persistence
    const savedGraph = await mockRepo.getGraph('workplace_written_specs');
    expect(savedGraph).not.toBeNull();
    const history = savedGraph!.getLinearHistory();
    expect(history.length).toBe(2); // 1 user node + 1 persona node
    expect(history[0].role).toBe('user');
    expect(history[1].role).toBe('persona');
  });
});
