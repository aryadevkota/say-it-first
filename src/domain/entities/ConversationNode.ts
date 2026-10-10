/**
 * ConversationNode.ts — Core Domain Entity
 *
 * Represents a discrete turn in the conversation timeline DAG.
 * Specification: say_it_first_system_architecture_manual.md §4.1
 *
 * ZERO external dependencies beyond sibling domain entities.
 */

import type { AffectVector } from './AffectVector';
import type { TwoWayBridge } from './TwoWayBridge';

// ── Interface ────────────────────────────────────────────────────────────────

export interface ConversationNode {
  readonly turnId: string;
  readonly parentId: string | null;
  readonly branchId: string;
  readonly role: 'user' | 'persona' | 'system';
  readonly content: string;
  readonly inputMode: 'voice' | 'text';
  readonly timestamp: number;
  readonly affectSnapshot: {
    readonly delta: AffectVector;
    readonly resolved: AffectVector;
  };
  readonly twoWayBridge?: TwoWayBridge;
  readonly deEscalationWarning: boolean;
  readonly pocketScriptPivot?: string;
}

// ── Creation Parameters ──────────────────────────────────────────────────────

export interface CreateConversationNodeParams {
  turnId: string;
  parentId: string | null;
  branchId: string;
  role: 'user' | 'persona' | 'system';
  content: string;
  inputMode: 'voice' | 'text';
  timestamp?: number;
  affectSnapshot: {
    delta: AffectVector;
    resolved: AffectVector;
  };
  twoWayBridge?: TwoWayBridge;
  deEscalationWarning: boolean;
  pocketScriptPivot?: string;
}

// ── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates an immutable ConversationNode instance with deep freezing on snapshots.
 */
export function createConversationNode(
  params: CreateConversationNodeParams,
): ConversationNode {
  if (!params.turnId || params.turnId.trim().length === 0) {
    throw new Error('ConversationNode: turnId must be a non-empty string.');
  }
  if (!params.branchId || params.branchId.trim().length === 0) {
    throw new Error('ConversationNode: branchId must be a non-empty string.');
  }

  const frozenAffectSnapshot = Object.freeze({
    delta: params.affectSnapshot.delta,
    resolved: params.affectSnapshot.resolved,
  });

  return Object.freeze({
    turnId: params.turnId.trim(),
    parentId: params.parentId ? params.parentId.trim() : null,
    branchId: params.branchId.trim(),
    role: params.role,
    content: params.content,
    inputMode: params.inputMode,
    timestamp: params.timestamp ?? Date.now(),
    affectSnapshot: frozenAffectSnapshot,
    twoWayBridge: params.twoWayBridge,
    deEscalationWarning: params.deEscalationWarning,
    pocketScriptPivot: params.pocketScriptPivot,
  });
}
