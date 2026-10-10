import { describe, it, expect } from 'vitest';
import { ConversationTimelineGraph } from '../../src/domain/entities/ConversationTimelineGraph';
import { createAffectVector } from '../../src/domain/entities/AffectVector';
import { ScaffoldingLevel } from '../../src/domain/value-objects/ScaffoldingLevel';

describe('useTimelineBranching state logic', () => {
  const dummyAffect = {
    delta: createAffectVector(0, 0, 0),
    resolved: createAffectVector(0.2, 0.4, 0.6),
  };

  it('manages head pointers, linear history, and non-destructive rewind correctly', () => {
    const graph = new ConversationTimelineGraph();

    const t1 = graph.appendTurn({
      parentId: null,
      branchId: 'main',
      role: 'user',
      content: 'Initial turn',
      inputMode: 'text',
      affectSnapshot: dummyAffect,
      deEscalationWarning: false,
    });

    const t2 = graph.appendTurn({
      parentId: t1,
      branchId: 'main',
      role: 'persona',
      content: 'Persona response',
      inputMode: 'text',
      affectSnapshot: dummyAffect,
      deEscalationWarning: false,
    });

    expect(graph.getActiveHeadId()).toBe(t2);
    expect(graph.getLinearHistory().length).toBe(2);

    // Rewind back to t1
    graph.rewindTo(t1);
    expect(graph.getActiveHeadId()).toBe(t1);
    expect(graph.getLinearHistory().length).toBe(1);

    // Fork new branch B from t1
    const t3 = graph.appendTurn({
      parentId: t1,
      branchId: 'branch_b',
      role: 'persona',
      content: 'Alternative response',
      inputMode: 'text',
      affectSnapshot: dummyAffect,
      deEscalationWarning: false,
    });

    expect(graph.getActiveHeadId()).toBe(t3);
    expect(graph.getLinearHistory().map((n) => n.turnId)).toEqual([t1, t3]);
    // Historical branch node t2 is non-destructively preserved
    expect(graph.getNode(t2)).toBeDefined();
  });

  it('verifies default ScaffoldingLevel initialization and transitions', () => {
    let currentLevel = ScaffoldingLevel.LEVEL_2_XRAY;
    expect(currentLevel).toBe(100);

    currentLevel = ScaffoldingLevel.LEVEL_0_REALITY;
    expect(currentLevel).toBe(0);

    currentLevel = ScaffoldingLevel.LEVEL_1_HINTS;
    expect(currentLevel).toBe(50);
  });
});
