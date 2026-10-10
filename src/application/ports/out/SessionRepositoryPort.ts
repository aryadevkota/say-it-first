/**
 * SessionRepositoryPort.ts — Outbound Port
 *
 * Contract for in-memory / persistent DAG session state storage.
 * Specification: say_it_first_system_architecture_manual.md §1, ADR-002
 */

import type { ConversationTimelineGraph } from '../../../domain/entities/ConversationTimelineGraph';

export interface SessionRepositoryPort {
  getGraph(sessionId: string): Promise<ConversationTimelineGraph | null>;
  saveGraph(sessionId: string, graph: ConversationTimelineGraph): Promise<void>;
  deleteGraph(sessionId: string): Promise<void>;
}
