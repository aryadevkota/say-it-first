import { describe, it, expect } from 'vitest';
import { GeneratePocketScriptUseCase } from '../../../src/application/use-cases/GeneratePocketScriptUseCase';
import type { SessionRepositoryPort } from '../../../src/application/ports/out/SessionRepositoryPort';
import { ConversationTimelineGraph } from '../../../src/domain/entities/ConversationTimelineGraph';
import { createAffectVector } from '../../../src/domain/entities/AffectVector';
import { createTwoWayBridge } from '../../../src/domain/entities/TwoWayBridge';

class MockSessionRepo implements SessionRepositoryPort {
  store = new Map<string, ConversationTimelineGraph>();
  async getGraph(sessionId: string) {
    return this.store.get(sessionId) ?? null;
  }
  async saveGraph(sessionId: string, graph: ConversationTimelineGraph) {
    this.store.set(sessionId, graph);
  }
  async deleteGraph(sessionId: string) {
    this.store.delete(sessionId);
  }
}

describe('GeneratePocketScriptUseCase', () => {
  const dummyAffect = {
    delta: createAffectVector(0, 0, 0),
    resolved: createAffectVector(0, 0, 0),
  };

  it('generates an actionable DBT DEAR MAN script synthesized from session turns', async () => {
    const repo = new MockSessionRepo();
    const graph = new ConversationTimelineGraph();

    const bridge = createTwoWayBridge(
      'Need written instructions for clarity',
      'Felt like administrative demand',
    );

    const u1 = graph.appendTurn({
      parentId: null,
      branchId: 'main',
      role: 'user',
      content: 'I need written instructions.',
      inputMode: 'text',
      affectSnapshot: dummyAffect,
      deEscalationWarning: false,
    });

    graph.appendTurn({
      parentId: u1,
      branchId: 'main',
      role: 'persona',
      content: 'I do not have time for that.',
      inputMode: 'text',
      affectSnapshot: dummyAffect,
      twoWayBridge: bridge,
      deEscalationWarning: true,
      pocketScriptPivot:
        'I want to make sure I deliver on time. What if I write a brief bulleted recap after our meetings?',
    });

    await repo.saveGraph('session_1', graph);

    const useCase = new GeneratePocketScriptUseCase(repo);
    const result = await useCase.execute({ sessionId: 'session_1' });

    expect(result.actionableScript).toBe(
      'I want to make sure I deliver on time. What if I write a brief bulleted recap after our meetings?',
    );
    expect(result.clinicalFramework).toContain('DBT DEAR MAN');
    expect(result.underlyingIntent).toBe('Need written instructions for clarity');
    expect(result.neurotypicalImpactNeutralized).toBe('Felt like administrative demand');
  });

  it('throws on empty session history', async () => {
    const repo = new MockSessionRepo();
    await repo.saveGraph('empty_session', new ConversationTimelineGraph());

    const useCase = new GeneratePocketScriptUseCase(repo);
    await expect(
      useCase.execute({ sessionId: 'empty_session' }),
    ).rejects.toThrow('Cannot generate pocket script from empty session history.');
  });
});
