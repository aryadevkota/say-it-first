/**
 * useTimelineBranching.ts — Presentation Hook
 *
 * Client-Side DAG State Interface managing non-destructive timeline rewind (FR-06)
 * and the Tactile Scaffolding Dial (FR-05).
 */

import { useState, useCallback } from 'react';
import { ConversationTimelineGraph } from '../../domain/entities/ConversationTimelineGraph';
import type { ConversationNode } from '../../domain/entities/ConversationNode';
import {
  type AffectVector,
  ZERO_AFFECT,
} from '../../domain/entities/AffectVector';
import {
  type ScaffoldingLevel,
  ScaffoldingLevel as ScaffoldingLevelEnum,
} from '../../domain/value-objects/ScaffoldingLevel';

export interface UseTimelineBranchingResult {
  graph: ConversationTimelineGraph;
  activeTurn: ConversationNode | null;
  linearHistory: ConversationNode[];
  currentVad: AffectVector;
  scaffoldingLevel: ScaffoldingLevel;
  rewindTo: (turnId: string) => void;
  appendTurn: (node: Omit<ConversationNode, 'turnId'>) => string;
  setScaffoldingLevel: (level: ScaffoldingLevel) => void;
  resetGraph: () => void;
}

export function useTimelineBranching(
  initialGraph: ConversationTimelineGraph = new ConversationTimelineGraph(),
  initialLevel: ScaffoldingLevel = ScaffoldingLevelEnum.LEVEL_2_XRAY,
): UseTimelineBranchingResult {
  const [graph, setGraph] = useState<ConversationTimelineGraph>(initialGraph);
  const [scaffoldingLevel, setScaffoldingLevel] = useState<ScaffoldingLevel>(initialLevel);

  const activeHeadId = graph.getActiveHeadId();
  const activeTurn = activeHeadId ? graph.getNode(activeHeadId) ?? null : null;
  const linearHistory = graph.getLinearHistory();

  const currentVad = activeTurn
    ? activeTurn.affectSnapshot.resolved
    : ZERO_AFFECT;

  const rewindTo = useCallback((turnId: string) => {
    setGraph((prev) => {
      const nextGraph = new ConversationTimelineGraph(prev.getAllNodes(), prev.getActiveHeadId());
      nextGraph.rewindTo(turnId);
      return nextGraph;
    });
  }, []);

  const appendTurn = useCallback((node: Omit<ConversationNode, 'turnId'>) => {
    let newTurnId = '';
    setGraph((prev) => {
      const nextGraph = new ConversationTimelineGraph(prev.getAllNodes(), prev.getActiveHeadId());
      newTurnId = nextGraph.appendTurn(node);
      return nextGraph;
    });
    return newTurnId;
  }, []);

  const resetGraph = useCallback(() => {
    setGraph(new ConversationTimelineGraph());
  }, []);

  return {
    graph,
    activeTurn,
    linearHistory,
    currentVad,
    scaffoldingLevel,
    rewindTo,
    appendTurn,
    setScaffoldingLevel,
    resetGraph,
  };
}
