import { describe, it, expect } from 'vitest';
import { ConversationTimelineGraph } from '../../src/domain/entities/ConversationTimelineGraph';
import { createAffectVector } from '../../src/domain/entities/AffectVector';

describe('ConversationTimelineGraph', () => {
  const dummyAffect = {
    delta: createAffectVector(0, 0, 0),
    resolved: createAffectVector(0, 0, 0),
  };

  it('appends turns and establishes linear history', () => {
    const graph = new ConversationTimelineGraph();

    const turn1 = graph.appendTurn({
      parentId: null,
      branchId: 'main',
      role: 'user',
      content: 'Hello',
      inputMode: 'text',
      timestamp: 1000,
      affectSnapshot: dummyAffect,
      deEscalationWarning: false,
    });

    const turn2 = graph.appendTurn({
      parentId: turn1,
      branchId: 'main',
      role: 'persona',
      content: 'Hi there',
      inputMode: 'text',
      timestamp: 2000,
      affectSnapshot: dummyAffect,
      deEscalationWarning: false,
    });

    expect(graph.getActiveHeadId()).toBe(turn2);
    const history = graph.getLinearHistory();
    expect(history.length).toBe(2);
    expect(history[0].turnId).toBe(turn1);
    expect(history[1].turnId).toBe(turn2);
  });

  it('supports non-destructive rewind and branching (FR-06)', () => {
    const graph = new ConversationTimelineGraph();

    const rootId = graph.appendTurn({
      parentId: null,
      branchId: 'main',
      role: 'user',
      content: 'Turn 1',
      inputMode: 'text',
      timestamp: 1000,
      affectSnapshot: dummyAffect,
      deEscalationWarning: false,
    });

    const turn2A = graph.appendTurn({
      parentId: rootId,
      branchId: 'branch_A',
      role: 'persona',
      content: 'Path A response',
      inputMode: 'text',
      timestamp: 2000,
      affectSnapshot: dummyAffect,
      deEscalationWarning: false,
    });

    expect(graph.getActiveHeadId()).toBe(turn2A);

    // Rewind back to rootId
    graph.rewindTo(rootId);
    expect(graph.getActiveHeadId()).toBe(rootId);

    // Append along alternative branch B
    const turn2B = graph.appendTurn({
      parentId: rootId,
      branchId: 'branch_B',
      role: 'persona',
      content: 'Path B response',
      inputMode: 'text',
      timestamp: 3000,
      affectSnapshot: dummyAffect,
      deEscalationWarning: false,
    });

    expect(graph.getActiveHeadId()).toBe(turn2B);

    // History from active head (Branch B)
    const historyB = graph.getLinearHistory();
    expect(historyB.map((n) => n.turnId)).toEqual([rootId, turn2B]);

    // Non-destructive: History from original Branch A is fully preserved
    const historyA = graph.getLinearHistory(turn2A);
    expect(historyA.map((n) => n.turnId)).toEqual([rootId, turn2A]);
    expect(graph.getAllNodes().length).toBe(3);
  });

  it('throws an error when rewinding to an unknown turnId', () => {
    const graph = new ConversationTimelineGraph();
    expect(() => graph.rewindTo('nonexistent_id')).toThrow(
      'Target turnId nonexistent_id not found in timeline graph.',
    );
  });
});
