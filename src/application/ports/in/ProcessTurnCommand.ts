/**
 * ProcessTurnCommand.ts — Inbound Port Interface
 *
 * Command boundary interface for orchestrating conversational turns.
 * Specification:
 *   - say_it_first_system_architecture_manual.md §1, §5.1
 *
 * Conforms directly to the request envelope:
 * POST /api/v1/conversation/turn
 */

import type { AffectVector } from '../../../domain/entities/AffectVector';
import type { ProsodyMetrics } from '../../../domain/value-objects/ProsodyMetrics';

export interface ProcessTurnUserInput {
  readonly text: string;
  readonly inputMode: 'voice' | 'text';
  readonly prosody: ProsodyMetrics;
}

export interface ProcessTurnCommand {
  readonly scenarioId: string;
  readonly activeBranchId: string;
  readonly parentTurnId: string | null;
  readonly userInput: ProcessTurnUserInput;
  readonly currentVad: AffectVector;
  readonly customScenario?: {
    id?: string;
    situation?: string;
    partner_role?: string;
    partner_name?: string;
    user_goal?: string;
    constraints?: string;
  };
  readonly history?: readonly {
    role: 'partner' | 'user' | 'persona';
    content: string;
  }[];
}
