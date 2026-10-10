/**
 * GeneratePocketScriptUseCase.ts — Application Use Case
 *
 * Compiles a two-sentence DBT DEAR MAN-aligned actionable blueprint
 * from conversation history and recent pivots.
 *
 * Specification: say_it_first_system_architecture_manual.md §1, §2.1 FR-08
 */

import type { SessionRepositoryPort } from '../ports/out/SessionRepositoryPort';

export interface GeneratePocketScriptCommand {
  sessionId: string;
}

export interface PocketScriptResult {
  actionableScript: string;
  clinicalFramework: string;
  underlyingIntent: string;
  neurotypicalImpactNeutralized: string;
}

export class GeneratePocketScriptUseCase {
  constructor(private readonly sessionRepo: SessionRepositoryPort) {}

  public async execute(command: GeneratePocketScriptCommand): Promise<PocketScriptResult> {
    const graph = await this.sessionRepo.getGraph(command.sessionId);
    if (!graph) {
      throw new Error(`Session ${command.sessionId} not found.`);
    }

    const history = graph.getLinearHistory();
    if (history.length === 0) {
      throw new Error('Cannot generate pocket script from empty session history.');
    }

    // Find latest node with pivot and bridge
    const lastPersonaNodeWithPivot = [...history]
      .reverse()
      .find((node) => node.role === 'persona' && Boolean(node.pocketScriptPivot));

    const lastBridgeNode = [...history]
      .reverse()
      .find((node) => Boolean(node.twoWayBridge));

    const actionableScript =
      lastPersonaNodeWithPivot?.pocketScriptPivot ??
      'I want to ensure we align effectively on deliverables. What if I summarize our key decisions in brief bullet points, and you reply with a confirmation?';

    const underlyingIntent =
      lastBridgeNode?.twoWayBridge?.userIntent ??
      'Self-advocacy to ensure sensory and cognitive clarity without cognitive overload.';

    const neurotypicalImpactNeutralized =
      lastBridgeNode?.twoWayBridge?.receivedImpact ??
      'Perceived administrative overhead or direct critique of verbal instructions.';

    return {
      actionableScript,
      clinicalFramework: 'DBT DEAR MAN (Describe, Express, Assert, Reinforce, Mindful, Appear confident, Negotiate)',
      underlyingIntent,
      neurotypicalImpactNeutralized,
    };
  }
}
