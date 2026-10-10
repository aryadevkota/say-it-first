import { describe, it, expect, vi } from 'vitest';
import { ProcessTurnUseCase } from '../../../src/application/use-cases/ProcessTurnUseCase';
import { GeminiStructuredAdapter } from '../../../src/infrastructure/adapters/llm/GeminiStructuredAdapter';
import type { SessionRepositoryPort } from '../../../src/application/ports/out/SessionRepositoryPort';
import { ConversationTimelineGraph } from '../../../src/domain/entities/ConversationTimelineGraph';
import { createAffectVector } from '../../../src/domain/entities/AffectVector';
import { createProsodyMetrics } from '../../../src/domain/value-objects/ProsodyMetrics';

class MemorySessionRepo implements SessionRepositoryPort {
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

describe('Conversational Continuity, Semantic Responsiveness, and Branching (Gate 2 & Gate 3)', () => {
  const dummyVad = createAffectVector(0.0, 0.0, 0.0);
  const dummyProsody = createProsodyMetrics(140, 0.25, 18.0);

  it('1. Semantic Responsiveness: Responds warmly to verbal hesitation ("I don\'t know how to put this")', async () => {
    const adapter = new GeminiStructuredAdapter();
    const repo = new MemorySessionRepo();
    const useCase = new ProcessTurnUseCase(adapter, repo);

    const res = await useCase.execute({
      scenarioId: 'workplace-written-recap',
      activeBranchId: 'version-1',
      parentTurnId: null,
      userInput: {
        text: "I don't know how to put this, but I've been feeling overwhelmed during our morning meetings.",
        inputMode: 'text',
        prosody: dummyProsody,
      },
      currentVad: dummyVad,
    });

    expect(res.spoken_response).toContain('Take your time');
    expect(res.two_way_bridge.user_intent).toContain('processing pause');
    expect(res.affect_computation.resolved_vector.valence).toBeGreaterThan(0);
  });

  it('2. Semantic Responsiveness: Respects firm boundary declarations without defensive escalation', async () => {
    const adapter = new GeminiStructuredAdapter();
    const repo = new MemorySessionRepo();
    const useCase = new ProcessTurnUseCase(adapter, repo);

    const res = await useCase.execute({
      scenarioId: 'boundary-saying-no',
      activeBranchId: 'version-1',
      parentTurnId: null,
      userInput: {
        text: "I won't be able to take on this extra shift on Saturday.",
        inputMode: 'text',
        prosody: dummyProsody,
      },
      currentVad: dummyVad,
    });

    expect(res.spoken_response).toContain('I understand completely');
    expect(res.two_way_bridge.user_intent).toContain('honest boundary');
  });

  it('3. Semantic Responsiveness: Handles unrelated questions/tangents gracefully without confusing for recap refusal', async () => {
    const adapter = new GeminiStructuredAdapter();
    const repo = new MemorySessionRepo();
    const useCase = new ProcessTurnUseCase(adapter, repo);

    const res = await useCase.execute({
      scenarioId: 'workplace-written-recap',
      activeBranchId: 'version-1',
      parentTurnId: null,
      userInput: {
        text: 'What is the weather outside right now?',
        inputMode: 'text',
        prosody: dummyProsody,
      },
      currentVad: dummyVad,
    });

    expect(res.spoken_response).toContain('Wait, haha');
    expect(res.spoken_response).toContain('our check-in notes');
    expect(res.two_way_bridge.user_intent).toContain('tangent');
  });

  it('4. Semantic Responsiveness: Handles correction of misunderstandings with relief and clarification', async () => {
    const adapter = new GeminiStructuredAdapter();
    const repo = new MemorySessionRepo();
    const useCase = new ProcessTurnUseCase(adapter, repo);

    const res = await useCase.execute({
      scenarioId: 'workplace-written-recap',
      activeBranchId: 'version-1',
      parentTurnId: null,
      userInput: {
        text: "That's not what I meant. I wasn't asking you to write it, I was offering to write it myself.",
        inputMode: 'text',
        prosody: dummyProsody,
      },
      currentVad: dummyVad,
    });

    expect(res.spoken_response).toContain('Oh, I see! My apologies');
    expect(res.two_way_bridge.user_intent).toContain('course-correction');
  });

  it('5. Semantic Responsiveness: Accepts collaborative proposals and compromises enthusiastically', async () => {
    const adapter = new GeminiStructuredAdapter();
    const repo = new MemorySessionRepo();
    const useCase = new ProcessTurnUseCase(adapter, repo);

    const res = await useCase.execute({
      scenarioId: 'workplace-written-recap',
      activeBranchId: 'version-1',
      parentTurnId: null,
      userInput: {
        text: "What if we try a quick 2-bullet summary in Slack right after the call?",
        inputMode: 'text',
        prosody: dummyProsody,
      },
      currentVad: dummyVad,
    });

    expect(res.spoken_response).toContain('compromise');
    expect(res.two_way_bridge.user_intent).toContain('compromise');
    expect(res.affect_computation.resolved_vector.valence).toBeGreaterThan(0.1);
  });

  it('6. Branch-specific history isolation: Retries and new versions maintain clean, independent timelines', async () => {
    const adapter = new GeminiStructuredAdapter();
    const repo = new MemorySessionRepo();
    const useCase = new ProcessTurnUseCase(adapter, repo);

    // Turn 1 on Version 1
    const resV1 = await useCase.execute({
      scenarioId: 'workplace-written-recap',
      activeBranchId: 'version-1',
      parentTurnId: null,
      userInput: {
        text: 'When we only have verbal syncs, I lose track of action items.',
        inputMode: 'text',
        prosody: dummyProsody,
      },
      currentVad: dummyVad,
      history: [
        { role: 'partner', content: 'Hey, thanks for jumping on. Ready for our quick sync?' },
        { role: 'user', content: 'When we only have verbal syncs, I lose track of action items.' },
      ],
    });

    // Now user switches to Version 2 ("Try another version")
    const resV2 = await useCase.execute({
      scenarioId: 'workplace-written-recap',
      activeBranchId: 'version-2',
      parentTurnId: null,
      userInput: {
        text: "What if I take 2 minutes after our call to post bullet notes?",
        inputMode: 'text',
        prosody: dummyProsody,
      },
      currentVad: dummyVad,
      history: [
        { role: 'partner', content: 'Starting fresh attempt.' },
        { role: 'user', content: "What if I take 2 minutes after our call to post bullet notes?" },
      ],
    });

    expect(resV1.turn_id).not.toBe(resV2.turn_id);
    expect(resV2.spoken_response).toContain('compromise');
  });

  it('7. Custom Scenario Integration: Preserves custom partner role, user goal, and room context', async () => {
    const adapter = new GeminiStructuredAdapter();
    const repo = new MemorySessionRepo();
    const useCase = new ProcessTurnUseCase(adapter, repo);

    const res = await useCase.execute({
      scenarioId: 'custom-landlord-heat',
      activeBranchId: 'version-1',
      parentTurnId: null,
      userInput: {
        text: "Hi Mr. Henderson, could we agree on a firm date for the radiator inspection this week?",
        inputMode: 'text',
        prosody: dummyProsody,
      },
      currentVad: dummyVad,
      customScenario: {
        id: 'custom-landlord-heat',
        situation: 'Heating is broken in the apartment and landlord has delayed twice.',
        partner_role: 'Landlord',
        partner_name: 'Mr. Henderson',
        user_goal: 'Firm date for radiator inspection',
        constraints: 'Keep it professional and avoid emotional blame',
      },
    });

    expect(res.spoken_response).toBeTruthy();
    expect(res.two_way_bridge.user_intent).toContain('Firm date for radiator inspection');
  });
});
