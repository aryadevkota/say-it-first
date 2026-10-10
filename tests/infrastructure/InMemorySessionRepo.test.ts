import { describe, it, expect } from 'vitest';
import { InMemorySessionRepo } from '../../src/infrastructure/adapters/storage/InMemorySessionRepo';
import { ConversationTimelineGraph } from '../../src/domain/entities/ConversationTimelineGraph';
import { createAffectVector } from '../../src/domain/entities/AffectVector';

describe('InMemorySessionRepo', () => {
  const dummyAffect = {
    delta: createAffectVector(0, 0, 0),
    resolved: createAffectVector(0, 0, 0),
  };

  it('isolates state across independent sessions and provides snapshot cloning', async () => {
    const repo = new InMemorySessionRepo();

    const graphA = new ConversationTimelineGraph();
    const tA = graphA.appendTurn({
      parentId: null,
      branchId: 'main',
      role: 'user',
      content: 'Turn for session A',
      inputMode: 'text',
      affectSnapshot: dummyAffect,
      deEscalationWarning: false,
    });

    await repo.saveGraph('session_A', graphA);

    const graphB = new ConversationTimelineGraph();
    const tB = graphB.appendTurn({
      parentId: null,
      branchId: 'main',
      role: 'user',
      content: 'Turn for session B',
      inputMode: 'text',
      affectSnapshot: dummyAffect,
      deEscalationWarning: false,
    });

    await repo.saveGraph('session_B', graphB);

    const fetchedA = await repo.getGraph('session_A');
    const fetchedB = await repo.getGraph('session_B');

    expect(fetchedA?.getActiveHeadId()).toBe(tA);
    expect(fetchedB?.getActiveHeadId()).toBe(tB);
    expect(fetchedA?.getLinearHistory().length).toBe(1);
    expect(fetchedB?.getLinearHistory().length).toBe(1);

    // Verify snapshot isolation: mutating fetchedA does not alter stored graph
    fetchedA?.appendTurn({
      parentId: tA,
      branchId: 'main',
      role: 'persona',
      content: 'Unsaved turn',
      inputMode: 'text',
      affectSnapshot: dummyAffect,
      deEscalationWarning: false,
    });

    const reFetchedA = await repo.getGraph('session_A');
    expect(reFetchedA?.getLinearHistory().length).toBe(1);
  });

  it('returns null for non-existent sessions and supports deletion', async () => {
    const repo = new InMemorySessionRepo();
    expect(await repo.getGraph('non_existent')).toBeNull();

    const graph = new ConversationTimelineGraph();
    await repo.saveGraph('to_delete', graph);
    expect(repo.hasSession('to_delete')).toBe(true);

    await repo.deleteGraph('to_delete');
    expect(repo.hasSession('to_delete')).toBe(false);
    expect(await repo.getGraph('to_delete')).toBeNull();
  });
});
