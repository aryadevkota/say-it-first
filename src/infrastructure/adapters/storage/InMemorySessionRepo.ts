/**
 * InMemorySessionRepo.ts — Infrastructure Adapter
 *
 * Implements SessionRepositoryPort using an in-memory thread-safe Map.
 * Specification: say_it_first_system_architecture_manual.md §1, ADR-002
 *
 * Enforces zero server retention of sensitive disclosures.
 */

import type { SessionRepositoryPort } from '../../../application/ports/out/SessionRepositoryPort';
import { ConversationTimelineGraph } from '../../../domain/entities/ConversationTimelineGraph';

export class InMemorySessionRepo implements SessionRepositoryPort {
  private sessions: Map<string, ConversationTimelineGraph> = new Map();

  public async getGraph(sessionId: string): Promise<ConversationTimelineGraph | null> {
    const graph = this.sessions.get(sessionId);
    if (!graph) return null;
    // Clone nodes into a fresh graph to preserve snapshot isolation
    return new ConversationTimelineGraph(graph.getAllNodes(), graph.getActiveHeadId());
  }

  public async saveGraph(sessionId: string, graph: ConversationTimelineGraph): Promise<void> {
    // Clone nodes for thread-safe isolation
    this.sessions.set(
      sessionId,
      new ConversationTimelineGraph(graph.getAllNodes(), graph.getActiveHeadId()),
    );
  }

  public async deleteGraph(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  public clearAll(): void {
    this.sessions.clear();
  }

  public hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}
