/**
 * ConversationTimelineGraph.ts — Domain Entity / Aggregate
 *
 * In-memory Directed Acyclic Graph (DAG) state machine for conversation history,
 * non-destructive branching, and rewind checkpoints.
 *
 * Specification: say_it_first_system_architecture_manual.md §4.2, FR-06
 *
 * ZERO external dependencies beyond sibling domain entities.
 */

import type { ConversationNode } from './ConversationNode';

export class ConversationTimelineGraph {
  private nodes: Map<string, ConversationNode> = new Map();
  private activeHeadId: string | null = null;

  constructor(initialNodes?: ConversationNode[], activeHeadId?: string | null) {
    if (initialNodes) {
      for (const node of initialNodes) {
        this.nodes.set(node.turnId, node);
      }
    }
    this.activeHeadId = activeHeadId ?? (initialNodes && initialNodes.length > 0 ? initialNodes[initialNodes.length - 1].turnId : null);
  }

  public appendTurn(node: Omit<ConversationNode, 'turnId'> & { turnId?: string }): string {
    const turnId = node.turnId ?? `turn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const fullNode: ConversationNode = Object.freeze({
      ...node,
      turnId,
    });
    this.nodes.set(turnId, fullNode);
    this.activeHeadId = turnId;
    return turnId;
  }

  public rewindTo(turnId: string): void {
    if (!this.nodes.has(turnId)) {
      throw new Error(`Target turnId ${turnId} not found in timeline graph.`);
    }
    this.activeHeadId = turnId;
  }

  public getActiveHeadId(): string | null {
    return this.activeHeadId;
  }

  public getNode(turnId: string): ConversationNode | undefined {
    return this.nodes.get(turnId);
  }

  public getAllNodes(): ConversationNode[] {
    return Array.from(this.nodes.values());
  }

  public getLinearHistory(headId: string | null = this.activeHeadId): ConversationNode[] {
    const history: ConversationNode[] = [];
    let currentId = headId;
    const visited = new Set<string>();

    while (currentId !== null) {
      if (visited.has(currentId)) {
        // Prevent infinite loops in malformed cycles
        break;
      }
      visited.add(currentId);

      const node = this.nodes.get(currentId);
      if (!node) break;
      history.unshift(node);
      currentId = node.parentId;
    }
    return history;
  }
}
