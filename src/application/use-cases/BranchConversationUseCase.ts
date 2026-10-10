/**
 * BranchConversationUseCase.ts — Application Use Case
 *
 * Implements non-destructive DAG rewinding and timeline branch spawning.
 * Specification: say_it_first_system_architecture_manual.md §1, §4.2, FR-06
 */

import type { SessionRepositoryPort } from '../ports/out/SessionRepositoryPort';
import type { ConversationNode } from '../../domain/entities/ConversationNode';

export interface BranchConversationCommand {
  sessionId: string;
  targetTurnId: string;
}

export interface BranchConversationResult {
  activeHeadId: string;
  linearHistory: ConversationNode[];
}

export class BranchConversationUseCase {
  constructor(private readonly sessionRepo: SessionRepositoryPort) {}

  public async execute(command: BranchConversationCommand): Promise<BranchConversationResult> {
    const graph = await this.sessionRepo.getGraph(command.sessionId);
    if (!graph) {
      throw new Error(`Session ${command.sessionId} not found.`);
    }

    graph.rewindTo(command.targetTurnId);
    await this.sessionRepo.saveGraph(command.sessionId, graph);

    return {
      activeHeadId: command.targetTurnId,
      linearHistory: graph.getLinearHistory(command.targetTurnId),
    };
  }
}
