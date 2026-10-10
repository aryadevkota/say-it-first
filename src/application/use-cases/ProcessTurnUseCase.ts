/**
 * ProcessTurnUseCase.ts — Application Use Case
 *
 * Coordinates turn execution pipeline:
 * 1. Fetch conversation DAG from SessionRepositoryPort
 * 2. Record user turn in DAG
 * 3. Query LLMInferencePort with linear history and prosody metrics
 * 4. Apply exponential damping (AffectDynamicsService) to resolve next VAD state
 * 5. Compute deterministic avatar kinematics (AvatarKinematicsService)
 * 6. Evaluate 3-tier de-escalation safety gate (TensionEvaluatorService)
 * 7. Append persona response node to DAG
 * 8. Persist updated graph to session repository
 * 9. Emit full response payload matching §5.1 200 OK contract
 *
 * Zero external dependencies. Orchestrates domain and outbound ports.
 */

import type { ProcessTurnCommand } from '../ports/in/ProcessTurnCommand';
import type { LLMInferencePort } from '../ports/out/LLMInferencePort';
import type { SessionRepositoryPort } from '../ports/out/SessionRepositoryPort';
import { ConversationTimelineGraph } from '../../domain/entities/ConversationTimelineGraph';
import {
  applyEmotionalDamping,
  INERTIA_PEER,
} from '../../domain/services/AffectDynamicsService';
import { evaluateSafetyGate } from '../../domain/services/TensionEvaluatorService';
import { computeAvatarKinematics } from '../../domain/services/AvatarKinematicsService';
import { createTwoWayBridge } from '../../domain/entities/TwoWayBridge';
import type { AffectVector } from '../../domain/entities/AffectVector';

export interface ProcessTurnResponse {
  turn_id: string;
  spoken_response: string;
  unspoken_subtext: string;
  two_way_bridge: {
    user_intent: string;
    received_as: string;
  };
  affect_computation: {
    delta: AffectVector;
    resolved_vector: AffectVector;
    inertia_applied: number;
  };
  avatar_kinematics: {
    state_label: string;
    posture_cue: string;
    mouth_curvature: number;
    brow_angle: number;
    blink_rate_ms: number;
    breathing_cycle_sec: number;
  };
  safety_gate: {
    tension_index: number;
    trigger_warning: boolean;
    warning_message: string | null;
    co_regulation_active: boolean;
  };
  pocket_script_pivot: {
    recommended_text: string;
    clinical_rationale: string;
  };
}

export class ProcessTurnUseCase {
  constructor(
    private readonly llmPort: LLMInferencePort,
    private readonly sessionRepo: SessionRepositoryPort,
    private readonly defaultInertia: number = INERTIA_PEER,
  ) {}

  public async execute(command: ProcessTurnCommand): Promise<ProcessTurnResponse> {
    const sessionId = command.scenarioId;
    let graph = await this.sessionRepo.getGraph(sessionId);

    if (!graph) {
      graph = new ConversationTimelineGraph();
    }

    if (
      command.parentTurnId &&
      command.parentTurnId !== graph.getActiveHeadId() &&
      graph.getNode(command.parentTurnId)
    ) {
      graph.rewindTo(command.parentTurnId);
    }

    const parentTurnId = command.parentTurnId ?? graph.getActiveHeadId();

    // 1. Append User Turn Node
    const userTurnId = graph.appendTurn({
      parentId: parentTurnId,
      branchId: command.activeBranchId,
      role: 'user',
      content: command.userInput.text,
      inputMode: command.userInput.inputMode,
      timestamp: Date.now(),
      affectSnapshot: {
        delta: { valence: 0, arousal: 0, dominance: 0 },
        resolved: command.currentVad,
      },
      deEscalationWarning: false,
    });

    const linearHistory = graph.getLinearHistory();

    // 2. Query LLM inference
    const llmResult = await this.llmPort.inferTurn({
      scenarioId: command.scenarioId,
      activeBranchId: command.activeBranchId,
      parentTurnId: userTurnId,
      history: linearHistory,
      userInput: command.userInput,
      currentVad: command.currentVad,
      inertiaLambda: this.defaultInertia,
      customScenario: command.customScenario,
    });

    // 3. Resolve next affect state via damping
    const resolvedVad = applyEmotionalDamping(
      command.currentVad,
      llmResult.emotionalDelta,
      this.defaultInertia,
    );

    // 4. Compute kinematics & safety evaluations
    const kinematics = computeAvatarKinematics(resolvedVad, llmResult.postureCue);
    const safety = evaluateSafetyGate(resolvedVad);

    const bridge = createTwoWayBridge(
      llmResult.twoWayBridge.userIntent,
      llmResult.twoWayBridge.receivedImpact,
    );

    // 5. Append Persona Turn Node
    const personaTurnId = graph.appendTurn({
      parentId: userTurnId,
      branchId: command.activeBranchId,
      role: 'persona',
      content: llmResult.spokenResponse,
      inputMode: 'text',
      timestamp: Date.now(),
      affectSnapshot: {
        delta: llmResult.emotionalDelta,
        resolved: resolvedVad,
      },
      twoWayBridge: bridge,
      deEscalationWarning: safety.triggerWarning,
      pocketScriptPivot: llmResult.pivotRecommendation.suggestedWording,
    });

    // 6. Save updated DAG state
    await this.sessionRepo.saveGraph(sessionId, graph);

    // 7. Format 200 OK contract matching §5.1
    return {
      turn_id: personaTurnId,
      spoken_response: llmResult.spokenResponse,
      unspoken_subtext: llmResult.unspokenSubtext,
      two_way_bridge: {
        user_intent: bridge.userIntent,
        received_as: bridge.receivedImpact,
      },
      affect_computation: {
        delta: llmResult.emotionalDelta,
        resolved_vector: resolvedVad,
        inertia_applied: this.defaultInertia,
      },
      avatar_kinematics: {
        state_label: kinematics.stateLabel,
        posture_cue: kinematics.postureCue,
        mouth_curvature: kinematics.mouthCurvature,
        brow_angle: kinematics.browAngle,
        blink_rate_ms: kinematics.blinkRateMs,
        breathing_cycle_sec: kinematics.breathingCycleSec,
      },
      safety_gate: {
        tension_index: Number(safety.tensionIndex.toFixed(1)),
        trigger_warning: safety.triggerWarning,
        warning_message: safety.warningMessage,
        co_regulation_active: safety.coRegulationActive,
      },
      pocket_script_pivot: {
        recommended_text: llmResult.pivotRecommendation.suggestedWording,
        clinical_rationale: llmResult.pivotRecommendation.psychologicalRationale,
      },
    };
  }
}
