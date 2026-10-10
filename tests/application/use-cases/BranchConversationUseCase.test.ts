import { describe, it, expect } from 'vitest';
import { BranchConversationUseCase } from '../../../src/application/use-cases/BranchConversationUseCase';
import type { SessionRepositoryPort } from '../../../src/application/ports/out/SessionRepositoryPort';
import { ConversationTimelineGraph } from '../../../src/domain/entities/ConversationTimelineGraph';
import { createAffectVector } from '../../../src/domain/entities/AffectVector';

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

describe('BranchConversationUseCase', () => {
  const dummyAffect = {
    delta: createAffectVector(0, 0, 0),
    resolved: createAffectVector(0, 0, 0),
  };

  it('rewinds active head to selected turnId without destroying branches', async () => {
    const repo = new MockSessionRepo();
    const graph = new ConversationTimelineGraph();

    const t1 = graph.appendTurn({
      parentId: null,
      branchId: 'main',
      role: 'user',
      content: 'T1',
      inputMode: 'text',
      affectSnapshot: dummyAffect,
      deEscalationWarning: false,
    });

    const t2 = graph.appendTurn({
      parentId: t1,
      branchId: 'main',
      role: 'persona',
      content: 'T2',
      inputMode: 'text',
      affectSnapshot: dummyAffect,
      deEscalationWarning: false,
    });

    await repo.saveGraph('session_1', graph);

    const useCase = new BranchConversationUseCase(repo);
    const result = await useCase.execute({
      sessionId: 'session_1',
      targetTurnId: t1,
    });

    expect(result.activeHeadId).toBe(t1);
    expect(result.linearHistory.length).toBe(1);
    expect(result.linearHistory[0].turnId).toBe(t1);

    // Verify stored graph is rewound
    const updated = await repo.getGraph('session_1');
    expect(updated?.getActiveHeadId()).toBe(t1);
    // Node t2 is still intact in storage
    expect(updated?.getNode(t2)).toBeDefined();
  });

  it('throws when session is missing', async () => {
    const repo = new MockSessionRepo();
    const useCase = new BranchConversationUseCase(repo);
    await expect(
      useCase.execute({ sessionId: 'unknown', targetTurnId: 'some_id' }),
    ).rejects.toThrow('Session unknown not found.');
  });
});
