import { describe, it, expect } from 'vitest';
import { createConversationNode } from '../../src/domain/entities/ConversationNode';
import { createAffectVector } from '../../src/domain/entities/AffectVector';
import { createTwoWayBridge } from '../../src/domain/entities/TwoWayBridge';

describe('ConversationNode', () => {
  const sampleDelta = createAffectVector(-0.42, 0.51, 0.22);
  const sampleResolved = createAffectVector(-0.238, 0.402, 0.248);

  it('creates an immutable ConversationNode with deep freezing', () => {
    const bridge = createTwoWayBridge('Intent', 'Impact');
    const node = createConversationNode({
      turnId: 'turn_001',
      parentId: 'turn_000',
      branchId: 'branch_main',
      role: 'persona',
      content: 'I understand, but recap emails take time.',
      inputMode: 'voice',
      timestamp: 1717800045000,
      affectSnapshot: {
        delta: sampleDelta,
        resolved: sampleResolved,
      },
      twoWayBridge: bridge,
      deEscalationWarning: true,
      pocketScriptPivot: 'What if I write a 2-minute recap?',
    });

    expect(node.turnId).toBe('turn_001');
    expect(node.parentId).toBe('turn_000');
    expect(node.branchId).toBe('branch_main');
    expect(node.role).toBe('persona');
    expect(node.inputMode).toBe('voice');
    expect(node.timestamp).toBe(1717800045000);
    expect(node.affectSnapshot.delta.valence).toBe(-0.42);
    expect(node.affectSnapshot.resolved.valence).toBe(-0.238);
    expect(node.twoWayBridge?.userIntent).toBe('Intent');
    expect(node.deEscalationWarning).toBe(true);
    expect(node.pocketScriptPivot).toBe('What if I write a 2-minute recap?');

    expect(Object.isFrozen(node)).toBe(true);
    expect(Object.isFrozen(node.affectSnapshot)).toBe(true);
  });

  it('normalizes parentId to null if null or empty', () => {
    const node = createConversationNode({
      turnId: 'turn_root',
      parentId: null,
      branchId: 'branch_root',
      role: 'user',
      content: 'Initial greeting',
      inputMode: 'text',
      affectSnapshot: {
        delta: sampleDelta,
        resolved: sampleResolved,
      },
      deEscalationWarning: false,
    });

    expect(node.parentId).toBeNull();
  });

  it('defaults timestamp to current time when omitted', () => {
    const before = Date.now();
    const node = createConversationNode({
      turnId: 'turn_time',
      parentId: null,
      branchId: 'branch_01',
      role: 'user',
      content: 'Time check',
      inputMode: 'text',
      affectSnapshot: {
        delta: sampleDelta,
        resolved: sampleResolved,
      },
      deEscalationWarning: false,
    });
    const after = Date.now();

    expect(node.timestamp).toBeGreaterThanOrEqual(before);
    expect(node.timestamp).toBeLessThanOrEqual(after);
  });

  it('validates non-empty turnId and branchId', () => {
    expect(() =>
      createConversationNode({
        turnId: '   ',
        parentId: null,
        branchId: 'branch_01',
        role: 'user',
        content: 'Test',
        inputMode: 'text',
        affectSnapshot: { delta: sampleDelta, resolved: sampleResolved },
        deEscalationWarning: false,
      }),
    ).toThrow('ConversationNode: turnId must be a non-empty string.');

    expect(() =>
      createConversationNode({
        turnId: 'turn_01',
        parentId: null,
        branchId: '',
        role: 'user',
        content: 'Test',
        inputMode: 'text',
        affectSnapshot: { delta: sampleDelta, resolved: sampleResolved },
        deEscalationWarning: false,
      }),
    ).toThrow('ConversationNode: branchId must be a non-empty string.');
  });
});
