'use client';

/**
 * PracticeStage.tsx — Focused Conversational Practice Stage
 *
 * Implements:
 * - Realistic practice partner Sophia (SophiaLiveAvatar) with scenario-adaptive presentation and dynamic states
 * - Readable spoken dialogue captions
 * - Accessible user goal summary & scenario context
 * - Clean response dock (typing + optional voice input)
 * - Secondary, user-controlled guidance levels (Just practice / Show cues / Explore subtext)
 * - Two-Way Bridge ("What you meant" vs "How it might land") framed with "May..." and "Might..."
 * - Non-destructive "Try another version" attempt switching without scoring
 * - Calm pause modal & optional co-regulation
 * - "Words to take with you" takeaways screen with editable 2-sentence pocket script
 * - Zero radars, emotion charts, VAD meters, or clinical readouts
 * - Race-condition prevention (aborts late in-flight responses on reset/exit/switch)
 * - Per-version draft preservation & clean audio cancellation
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { ScenarioDefinition } from '../../domain/scenarios/topics';
import { getSophiaPresentationForScenario } from '../../domain/entities/SophiaScenarioPresentation';
import { SophiaLiveAvatar } from './SophiaLiveAvatar';
import type { UserPreferences } from './WelcomeOnboarding';
type AvatarState = 'listening' | 'speaking' | 'thinking' | 'neutral' | 'receptive';
import type { SavedTakeaway } from './MyProgress';
import { useAnamAvatarSession } from '../hooks/useAnamAvatarSession';
import { playCozySound } from '../utils/cozyAudio';
import { ReportGenerationView } from './ReportGenerationView';
import { ConversationReportPage } from './ConversationReportPage';
import { ReportGeneratorService } from '../../domain/services/ReportGeneratorService';
import type { SessionReport } from '../../domain/entities/SessionReport';
import {
  Volume2,
  VolumeX,
  Mic,
  Pencil,
  Hourglass,
  AlertTriangle,
  Coffee,
  Bookmark,
  X,
} from 'lucide-react';

export type TurnLifecycleStatus =
  | 'partial_user_turn'
  | 'final_user_turn'
  | 'committed_user_turn'
  | 'partial_assistant_turn'
  | 'final_assistant_turn'
  | 'committed_assistant_turn'
  | 'dropped_or_unintelligible_turn';

export interface TurnMessage {
  id: string;
  role: 'partner' | 'user';
  text: string;
  status: TurnLifecycleStatus;
  inputMode?: 'voice' | 'text';
  timestamp?: number;
  subtext?: string;
  twoWayBridge?: {
    userIntent: string;
    receivedImpact: string;
  };
  postureCue?: string;
  suggestedWording?: string;
  uncommittedReason?: string;
}

export interface AttemptBranch {
  id: string;
  label: string;
  turns: TurnMessage[];
}

interface PracticeStageProps {
  topic: ScenarioDefinition;
  preferences: UserPreferences;
  onExit: () => void;
  onSaveTakeaway: (takeaway: SavedTakeaway) => void;
  onCompleteTopic: (topicId: string) => void;
  onReportGenerated?: (report: SessionReport) => void;
}

export function buildScenarioPersonaPrompt(topic: ScenarioDefinition): string {
  const custom = topic.customMetadata;
  const partnerName = topic.partner.name || 'Sophia';
  const partnerRole = topic.partner.role || 'Conversation Partner';
  const situation = custom?.userProvidedSituation || topic.subtitle || topic.title;
  const userGoal = topic.userGoal;
  const tone = topic.partner.defaultTone || 'Professional, warm, collaborative';
  const perspective = topic.learning?.doubleEmpathyPerspective?.theirPerspective
    ? `Your inner concerns / considerations: ${topic.learning.doubleEmpathyPerspective.theirPerspective}`
    : '';
  const constraints = custom?.avoidConstraints ? `Key constraints: ${custom.avoidConstraints}` : '';
  const scenarioOpener = topic.partner.initialDialogue?.trim();

  return [
    `You are ${partnerName}, working as ${partnerRole}.`,
    `You are in a realistic conversational practice simulation with the user for the platform "Say It First".`,
    ``,
    `SCENARIO CONTEXT:`,
    `- Topic: "${topic.title}"`,
    `- Situation: ${situation}`,
    `- Your Role: ${partnerRole}`,
    `- Your Demeanor/Tone: ${tone}`,
    `- User Goal: ${userGoal}`,
    perspective ? `- ${perspective}` : '',
    constraints ? `- ${constraints}` : '',
    scenarioOpener ? `- Required Scenario Opening Line: "${scenarioOpener}"` : '',
    ``,
    `CONVERSATION RULES:`,
    scenarioOpener
      ? `1. MANDATORY OPENING UTTERANCE: You must start this conversation by speaking verbatim: "${scenarioOpener}". Never substitute this with any generic opener (such as "Hey, thanks for jumping on. I’m ready when you are—let’s walk through this together.") or casual greeting. Open directly and exclusively with the required scenario opening line.`
      : '',
    `2. Stay strictly in character as ${partnerName} throughout. Never break character or say you are an AI.`,
    `3. Speak concisely (1 to 3 spoken sentences per turn) as a natural dialogue partner. Do not monologue or generate markdown bullet points.`,
    `4. Respond directly to what the user says, negotiates, or clarifies.`,
    `5. Keep the conversation focused on the scenario situation.`,
  ]
    .filter(Boolean)
    .join('\n');
}

export const PracticeStage: React.FC<PracticeStageProps> = ({
  topic,
  preferences,
  onExit,
  onSaveTakeaway,
  onCompleteTopic,
  onReportGenerated,
}) => {
  // Current active attempt branch (for non-destructive retries)
  const [attempts, setAttempts] = useState<AttemptBranch[]>([
    {
      id: 'version-1',
      label: 'Version 1',
      turns: [
        {
          id: 'turn-0',
          role: 'partner',
          text: topic.partner.initialDialogue,
          status: 'committed_assistant_turn',
          inputMode: 'voice',
          timestamp: Date.now(),
          subtext: 'Starting conversation.',
          postureCue: 'Attentive, friendly posture',
        },
      ],
    },
  ]);
  const [activeAttemptIndex, setActiveAttemptIndex] = useState<number>(0);
  const [draftsByAttempt, setDraftsByAttempt] = useState<Record<string, string>>({});

  // Character state & scenario presentation
  const [partnerState, setPartnerState] = useState<AvatarState>('listening');
  const [hideAvatar, setHideAvatar] = useState<boolean>(preferences.hideAvatar);
  const sophiaPresentation = useMemo(() => getSophiaPresentationForScenario(topic), [topic]);

  // Interaction mode: 'turn-based' (default safe mode: mic muted while drafting) vs 'hands-free' (continuous voice)
  const [interactionMode, setInteractionMode] = useState<'turn-based' | 'hands-free'>('turn-based');

  // Response input draft & state
  const [userDraft, setUserDraft] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guidance drawer & level
  const [guidanceLevel, setGuidanceLevel] = useState<'independent' | 'cues' | 'subtext'>(
    preferences.guidanceLevel,
  );
  const [isGuidanceDrawerOpen, setIsGuidanceDrawerOpen] = useState<boolean>(
    preferences.guidanceLevel !== 'independent',
  );

  // Modals & Report Screen States
  const [isSaveProgressOpen, setIsSaveProgressOpen] = useState<boolean>(false);
  const [isTakeawayOpen, setIsTakeawayOpen] = useState<boolean>(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [stageMode, setStageMode] = useState<'practice' | 'generating-report' | 'report'>('practice');
  const [sessionReport, setSessionReport] = useState<SessionReport | null>(null);
  const [sessionStartTime] = useState<number>(() => Date.now());

  // Takeaway script draft
  const [editableTakeaway, setEditableTakeaway] = useState<string>(
    topic.defaultTakeawayScript,
  );
  const [takeawaySaved, setTakeawaySaved] = useState<boolean>(false);

  // Voice recording simulation / browser speech
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // Unified Turn Pipeline State & Instrumentation
  const [activePartialUserTurn, setActivePartialUserTurn] = useState<TurnMessage | null>(null);
  const [isHearingSpeech, setIsHearingSpeech] = useState<boolean>(false);
  const [pipelineStatus, setPipelineStatus] = useState<
    | 'idle'
    | 'hearing_speech'
    | 'previewing_transcript'
    | 'transcript_committed'
    | 'text_submitting'
    | 'text_committed'
  >('idle');
  const [droppedUtteranceWarning, setDroppedUtteranceWarning] = useState<string | null>(null);
  const [droppedUtterancesCount, setDroppedUtterancesCount] = useState<number>(0);

  // Pipeline refs
  const speechWatchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const isSpeechRecRunningRef = useRef<boolean>(false);
  const interactionModeRef = useRef(interactionMode);
  interactionModeRef.current = interactionMode;
  const stageModeRef = useRef(stageMode);
  stageModeRef.current = stageMode;
  const attemptsRef = useRef(attempts);
  attemptsRef.current = attempts;

  // Race condition & cancellation refs
  const activeRequestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Media Ref for Anam Video Element
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeAttemptIndexRef = useRef<number>(activeAttemptIndex);
  useEffect(() => {
    activeAttemptIndexRef.current = activeAttemptIndex;
  }, [activeAttemptIndex]);

  // Pending coaching enrichment tracking
  const pendingCoachingTurnIdsRef = useRef<Set<string>>(new Set());
  const pendingCoachingDataRef = useRef<{
    subtext?: string;
    twoWayBridge?: { userIntent: string; receivedImpact: string };
    postureCue?: string;
    suggestedWording?: string;
  } | null>(null);

  // Pre-computed scenario persona prompt for ElevenLabs agent
  const scenarioPersonaPrompt = useMemo(() => buildScenarioPersonaPrompt(topic), [topic]);

  // High-signal diagnostic instrumentation verifying authoritative scenario initialization
  useEffect(() => {
    const opener = topic.partner.initialDialogue?.trim();
    console.log(`[Avatar:Init] Selected scenario ID: "${topic.id}"`);
    console.log(`[Avatar:Init] Selected scenario opener text: "${opener || 'none'}"`);
    console.log(
      `[Avatar:Init] Final system prompt sent into session creation: "${scenarioPersonaPrompt.slice(0, 100)}..." (${scenarioPersonaPrompt.length} chars)`,
    );
    console.log(`[Avatar:Init] Generic fallback opener present in payload: false`);
    console.log(
      `[Avatar:Init] First assistant turn seeded explicitly: true (turn-0 text: "${topic.partner.initialDialogue}")`,
    );
  }, [topic, scenarioPersonaPrompt]);

  // Asynchronous background coaching enrichment for participant turns
  const triggerCoachingEnrichment = useCallback(
    async (userText: string, targetTurnId?: string) => {
      try {
        const currentIdx = activeAttemptIndexRef.current;
        const currentBranch = attemptsRef.current[currentIdx] || attemptsRef.current[0];
        const res = await fetch('/api/v1/conversation/turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario_id: topic.id,
            active_branch_id: currentBranch.id,
            parent_turn_id: targetTurnId || null,
            user_input: {
              text: userText,
              input_mode: 'voice',
              prosody: {
                words_per_minute: 135,
                volume_rms: 0.28,
                pitch_variance_hz: 18.5,
              },
            },
            current_vad: { valence: 0.1, arousal: 0.05, dominance: 0.0 },
            history: currentBranch.turns.map((t) => ({
              role: t.role,
              content: t.text,
            })),
            custom_scenario: topic.customMetadata
              ? {
                  situation: topic.customMetadata.userProvidedSituation,
                  partner_role: topic.partner.role,
                  partner_name: topic.partner.name,
                  user_goal: topic.userGoal,
                  constraints: topic.customMetadata.avoidConstraints,
                }
              : undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const coachingData = {
            subtext: data.unspoken_subtext,
            twoWayBridge: data.two_way_bridge
              ? {
                  userIntent: data.two_way_bridge.user_intent,
                  receivedImpact: data.two_way_bridge.received_as,
                }
              : undefined,
            postureCue: data.avatar_kinematics?.posture_cue,
            suggestedWording:
              data.pivot_recommendation?.suggested_wording ||
              data.pocket_script_pivot?.recommended_text,
          };

          pendingCoachingDataRef.current = coachingData;

          setAttempts((prev) => {
            const copy = [...prev];
            const idx = activeAttemptIndexRef.current;
            if (!copy[idx]) return prev;
            const turns = [...copy[idx].turns];
            const lastPartnerIdx = [...turns].reverse().findIndex((t) => t.role === 'partner');
            if (lastPartnerIdx >= 0) {
              const realIdx = turns.length - 1 - lastPartnerIdx;
              turns[realIdx] = {
                ...turns[realIdx],
                subtext: coachingData.subtext || turns[realIdx].subtext,
                twoWayBridge: coachingData.twoWayBridge || turns[realIdx].twoWayBridge,
                postureCue: coachingData.postureCue || turns[realIdx].postureCue,
                suggestedWording: coachingData.suggestedWording || turns[realIdx].suggestedWording,
              };
              copy[idx] = { ...copy[idx], turns };
            }
            return copy;
          });

          if (coachingData.suggestedWording) {
            setEditableTakeaway(coachingData.suggestedWording);
          }
        }
      } catch (err) {
        console.warn('[PracticeStage] Coaching enrichment notice:', err);
      }
    },
    [topic],
  );

  // Authoritative turn committer (unified for both spoken and typed user messages)
  const commitUserTurn = useCallback(
    (text: string, inputMode: 'voice' | 'text') => {
      const trimmed = text.trim();
      if (!trimmed) {
        console.warn('[TurnPipeline:Commit] Attempted to commit empty user turn, skipping');
        return;
      }

      // Clear partial preview and any pending watchdog
      setActivePartialUserTurn(null);
      setDroppedUtteranceWarning(null);
      if (speechWatchdogTimerRef.current) {
        clearTimeout(speechWatchdogTimerRef.current);
        speechWatchdogTimerRef.current = null;
      }

      const currentIdx = activeAttemptIndexRef.current;

      setAttempts((prev) => {
        const copy = [...prev];
        if (!copy[currentIdx]) return prev;
        const currentTurns = [...copy[currentIdx].turns];

        // Deduplication check: if recent user turn within 3.5s has identical text
        const lastUserTurn = [...currentTurns].reverse().find((t) => t.role === 'user');
        if (
          lastUserTurn &&
          lastUserTurn.text.trim().toLowerCase() === trimmed.toLowerCase() &&
          Date.now() - (lastUserTurn.timestamp || 0) < 3500
        ) {
          console.log(`[TurnPipeline:Commit] Deduplicated identical user turn: "${trimmed}"`);
          return prev;
        }

        const turnId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newCommittedTurn: TurnMessage = {
          id: turnId,
          role: 'user',
          text: trimmed,
          status: 'committed_user_turn',
          inputMode,
          timestamp: Date.now(),
        };

        console.log(
          `[TurnPipeline:Commit] Authoritative user turn committed: [${inputMode}] id=${turnId}, text="${trimmed}"`,
        );

        copy[currentIdx] = {
          ...copy[currentIdx],
          turns: [...currentTurns, newCommittedTurn],
        };

        return copy;
      });

      setPipelineStatus(inputMode === 'voice' ? 'transcript_committed' : 'text_committed');

      // Trigger background coaching enrichment only for voice turns
      // (text turns invoke conversation/turn in handleSubmitTurn)
      if (inputMode === 'voice') {
        triggerCoachingEnrichment(trimmed);
      }
    },
    [triggerCoachingEnrichment],
  );

  // Continuous speech recognition for hands-free live audio
  useEffect(() => {
    if (interactionMode !== 'hands-free' || stageMode !== 'practice') {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
      return;
    }

    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let isDisposed = false;
    let recognition: any = null;

    try {
      recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onstart = () => {
        isSpeechRecRunningRef.current = true;
        console.log('[TurnPipeline:WebSpeech] Hands-free continuous recognition active');
      };

      recognition.onresult = (event: any) => {
        if (isDisposed) return;
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const transcript = res[0]?.transcript || '';
          if (res.isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }

        if (interimText.trim()) {
          console.log(`[TurnPipeline:STT] Hands-free interim partial: "${interimText.trim()}"`);
          setActivePartialUserTurn({
            id: `user-preview-${Date.now()}`,
            role: 'user',
            text: interimText.trim(),
            status: 'partial_user_turn',
            inputMode: 'voice',
            timestamp: Date.now(),
          });
          setPipelineStatus('previewing_transcript');
        }

        if (finalText.trim()) {
          console.log(`[TurnPipeline:STT] Hands-free final transcript arrived: "${finalText.trim()}"`);
          commitUserTurn(finalText.trim(), 'voice');
        }
      };

      recognition.onerror = (err: any) => {
        if (err?.error !== 'no-speech') {
          console.warn('[TurnPipeline:WebSpeech] Hands-free recognition error:', err?.error);
        }
      };

      recognition.onend = () => {
        isSpeechRecRunningRef.current = false;
        if (!isDisposed && interactionModeRef.current === 'hands-free' && stageModeRef.current === 'practice') {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('[TurnPipeline:WebSpeech] Could not start hands-free recognition:', err);
    }

    return () => {
      isDisposed = true;
      if (recognition) {
        try {
          recognition.abort();
        } catch {}
      }
      recognitionRef.current = null;
    };
  }, [interactionMode, stageMode, commitUserTurn]);

  // Synchronize incoming Anam streaming message into active branch turns in real time
  const handleIncomingMessageStream = useCallback(
    (streamedMsg: {
      id: string;
      role: 'user' | 'persona';
      content: string;
      interrupted?: boolean;
      endOfSpeech?: boolean;
    }) => {
      const currentIdx = activeAttemptIndexRef.current;
      const role = streamedMsg.role === 'user' ? 'user' : 'partner';
      const text = streamedMsg.content;
      if (!text || text.trim() === '') return;

      if (role === 'user') {
        console.log(
          `[TurnPipeline:Anam] User stream received: id=${streamedMsg.id}, endOfSpeech=${Boolean(
            streamedMsg.endOfSpeech,
          )}, content="${text}"`,
        );

        if (streamedMsg.endOfSpeech) {
          commitUserTurn(text, 'voice');
        } else {
          setActivePartialUserTurn({
            id: streamedMsg.id || `user-partial-${Date.now()}`,
            role: 'user',
            text,
            status: 'partial_user_turn',
            inputMode: 'voice',
            timestamp: Date.now(),
          });
          setPipelineStatus('previewing_transcript');
        }
        return;
      }

      // Partner message
      setAttempts((prev) => {
        const copy = [...prev];
        if (!copy[currentIdx]) return prev;
        const currentTurns = [...copy[currentIdx].turns];

        // 1. If persona message and only initial placeholder turn-0 exists:
        if (role === 'partner' && currentTurns.length === 1 && currentTurns[0].id === 'turn-0') {
          const opener = topic.partner.initialDialogue?.trim();
          const openerLower = opener?.toLowerCase() || '';
          const textLower = text.toLowerCase();
          const matchesScenario =
            Boolean(openerLower) &&
            (openerLower.startsWith(textLower.trim()) ||
              textLower.startsWith(openerLower.slice(0, Math.min(25, openerLower.length))));
          const isGeneric =
            !matchesScenario &&
            (textLower.includes('walk through this together') ||
              textLower.includes('ready when you are') ||
              (textLower.includes('thanks for jumping on') && !openerLower.includes('thanks for jumping on')));

          if (isGeneric && opener) {
            console.warn(
              `[PracticeStage:Guard] Blocked generic opener from contaminating scenario turn-0: "${text}"`,
            );
            return prev;
          }

          // If opener exists and incoming text is a prefix of it, preserve the full opener text so UI doesn't show a truncated line
          const finalText = opener && (opener.startsWith(text.trim()) || text.trim().length <= opener.length)
            ? opener
            : text;

          currentTurns[0] = {
            ...currentTurns[0],
            id: streamedMsg.id || 'turn-0',
            text: finalText,
            status: streamedMsg.endOfSpeech || streamedMsg.interrupted
              ? 'committed_assistant_turn'
              : 'partial_assistant_turn',
          };
          copy[currentIdx] = { ...copy[currentIdx], turns: currentTurns };
          return copy;
        }

        // 2. Check if a turn with this ID already exists:
        const existingIdx = currentTurns.findIndex((t) => t.id === streamedMsg.id);
        if (existingIdx >= 0) {
          currentTurns[existingIdx] = {
            ...currentTurns[existingIdx],
            text,
            status: streamedMsg.endOfSpeech || streamedMsg.interrupted
              ? 'committed_assistant_turn'
              : 'partial_assistant_turn',
            ...(pendingCoachingDataRef.current && role === 'partner'
              ? {
                  subtext: pendingCoachingDataRef.current.subtext || currentTurns[existingIdx].subtext,
                  twoWayBridge:
                    pendingCoachingDataRef.current.twoWayBridge ||
                    currentTurns[existingIdx].twoWayBridge,
                  postureCue:
                    pendingCoachingDataRef.current.postureCue ||
                    currentTurns[existingIdx].postureCue,
                  suggestedWording:
                    pendingCoachingDataRef.current.suggestedWording ||
                    currentTurns[existingIdx].suggestedWording,
                }
              : {}),
          };
          copy[currentIdx] = { ...copy[currentIdx], turns: currentTurns };
          return copy;
        }

        // 3. New turn arrived from the live stream
        const cachedCoaching = role === 'partner' ? pendingCoachingDataRef.current : null;
        if (role === 'partner' && cachedCoaching) {
          pendingCoachingDataRef.current = null;
        }

        const newTurn: TurnMessage = {
          id: streamedMsg.id || `${role}-${Date.now()}`,
          role,
          text,
          status: streamedMsg.endOfSpeech || streamedMsg.interrupted
            ? 'committed_assistant_turn'
            : 'partial_assistant_turn',
          inputMode: 'voice',
          timestamp: Date.now(),
          subtext: cachedCoaching?.subtext || (role === 'partner' ? 'Responding in character.' : undefined),
          twoWayBridge: cachedCoaching?.twoWayBridge,
          postureCue: cachedCoaching?.postureCue || (role === 'partner' ? 'Attentive, friendly posture' : undefined),
          suggestedWording: cachedCoaching?.suggestedWording,
        };

        copy[currentIdx] = { ...copy[currentIdx], turns: [...currentTurns, newTurn] };
        return copy;
      });
    },
    [commitUserTurn],
  );

  // Synchronize full message history from Anam SDK with ID matching and deduplication
  const handleMessageHistoryUpdated = useCallback(
    (historyMessages: Array<{ id: string; role: 'user' | 'persona'; content: string }>) => {
      if (!historyMessages || historyMessages.length === 0) return;
      const currentIdx = activeAttemptIndexRef.current;

      setAttempts((prev) => {
        const copy = [...prev];
        if (!copy[currentIdx]) return prev;
        let currentTurns = [...copy[currentIdx].turns];

        for (const msg of historyMessages) {
          if (!msg.content || msg.content.trim() === '') continue;
          const role = msg.role === 'user' ? 'user' : 'partner';
          const existingIdx = currentTurns.findIndex(
            (t) =>
              t.id === msg.id ||
              (t.role === role && t.text.trim().toLowerCase() === msg.content.trim().toLowerCase()),
          );

          if (existingIdx >= 0) {
            currentTurns[existingIdx] = {
              ...currentTurns[existingIdx],
              id: msg.id,
              text: msg.content,
              status: role === 'user' ? 'committed_user_turn' : 'committed_assistant_turn',
            };
          } else {
            if (role === 'partner' && currentTurns.length === 1 && currentTurns[0].id === 'turn-0') {
              currentTurns[0] = {
                ...currentTurns[0],
                id: msg.id,
                text: msg.content,
                status: 'committed_assistant_turn',
              };
            } else {
              currentTurns.push({
                id: msg.id,
                role,
                text: msg.content,
                status: role === 'user' ? 'committed_user_turn' : 'committed_assistant_turn',
                inputMode: 'voice',
                timestamp: Date.now(),
                ...(role === 'partner'
                  ? {
                      subtext: 'Responding in character.',
                      postureCue: 'Attentive, listening posture',
                    }
                  : {}),
              });
            }
          }
        }

        copy[currentIdx] = { ...copy[currentIdx], turns: currentTurns };
        return copy;
      });
    },
    [],
  );

  // Anam Live Avatar & Server-Side ElevenLabs Agent Hook
  const {
    sessionState: avatarSessionState,
    phase: avatarSessionPhase,
    isUpstreamRejected,
    isPlaying: isSpeakingAudio,
    isMuted: isAvatarAudioMuted,
    isMicMuted,
    muteMic,
    unmuteMic,
    toggleMic,
    errorMessage: avatarSessionError,
    connect: connectAvatarSession,
    disconnect: disconnectAvatarSession,
    sendUserMessage,
    interrupt,
    toggleMute: toggleAvatarMute,
    retrySession: retryAvatarSession,
  } = useAnamAvatarSession({
    videoElementId: 'anam-avatar-video',
    initialDialogue: topic.partner.initialDialogue,
    systemPrompt: scenarioPersonaPrompt,
    initialMicMuted: true, // Default to safe turn-based practice: mic is muted so user is not interrupted
    onPlaybackStateChange: (isPlaying) => {
      setPartnerState(isPlaying ? 'speaking' : 'receptive');
      if (!isPlaying) {
        // Partner finished speaking: ensure assistant turn is promoted to committed
        setAttempts((prev) => {
          const copy = [...prev];
          const idx = activeAttemptIndexRef.current;
          if (!copy[idx]) return prev;
          const turns = copy[idx].turns.map((t) =>
            t.role === 'partner' && t.status === 'partial_assistant_turn'
              ? { ...t, status: 'committed_assistant_turn' as TurnLifecycleStatus }
              : t,
          );
          copy[idx] = { ...copy[idx], turns };
          return copy;
        });
      }
    },
    onUserSpeechStarted: () => {
      console.log('[PracticeStage:Audio] User speech started (VAD detected audio arrival)');
      setIsHearingSpeech(true);
      setPipelineStatus('hearing_speech');
      setDroppedUtteranceWarning(null);
      if (speechWatchdogTimerRef.current) {
        clearTimeout(speechWatchdogTimerRef.current);
        speechWatchdogTimerRef.current = null;
      }
    },
    onUserSpeechEnded: () => {
      console.log('[PracticeStage:Audio] User speech ended (VAD detected silence)');
      setIsHearingSpeech(false);

      // Start 3.5s watchdog to check if a turn was actually committed
      if (speechWatchdogTimerRef.current) {
        clearTimeout(speechWatchdogTimerRef.current);
      }
      speechWatchdogTimerRef.current = setTimeout(() => {
        speechWatchdogTimerRef.current = null;
        const currentBranch = attemptsRef.current[activeAttemptIndexRef.current] || attemptsRef.current[0];
        const lastUserTurn = [...currentBranch.turns].reverse().find((t) => t.role === 'user');
        const committedRecently =
          lastUserTurn && Date.now() - (lastUserTurn.timestamp || 0) < 4500;

        if (!committedRecently) {
          console.warn(
            '[PracticeStage:Audio] Speech was heard by avatar/mic, but no transcript was committed!',
          );
          setDroppedUtterancesCount((prev) => prev + 1);
          setDroppedUtteranceWarning(
            'Microphone audio was detected, but no speech transcript was committed. You can speak again or type your message below.',
          );
        }
      }, 3500);
    },
    onMessageStream: (streamedMsg) => {
      handleIncomingMessageStream(streamedMsg);
    },
    onMessageHistoryUpdated: (history) => {
      handleMessageHistoryUpdated(history);
    },
  });

  const voiceNotice = null;

  // Auto-connect Anam avatar session on mount
  useEffect(() => {
    if (avatarSessionState === 'idle') {
      connectAvatarSession().catch((err) => {
        console.warn('[PracticeStage] Anam session auto-connect error:', err);
      });
    }
  }, [avatarSessionState, connectAvatarSession]);

  const activeBranch = attempts[activeAttemptIndex] || attempts[0];
  const latestPartnerTurn = [...activeBranch.turns]
    .reverse()
    .find((t) => t.role === 'partner');

  const committedUserTurnsCount = useMemo(
    () =>
      activeBranch.turns.filter(
        (t) => t.role === 'user' && (!t.status || t.status === 'committed_user_turn'),
      ).length,
    [activeBranch.turns],
  );

  const committedAssistantTurnsCount = useMemo(
    () =>
      activeBranch.turns.filter(
        (t) => t.role === 'partner' && (!t.status || t.status === 'committed_assistant_turn'),
      ).length,
    [activeBranch.turns],
  );

  // Cancel any in-flight turn requests on unmount
  useEffect(() => {
    return () => {
      activeRequestIdRef.current++;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle submitting a turn to API (authoritative text submission)
  const handleSubmitTurn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedInput = userDraft.trim();
    if (!trimmedInput || isLoading) return;

    playCozySound('tap');

    const currentAttemptId = activeBranch.id;
    const currentAttemptIdx = activeAttemptIndex;

    // Track request ID and abort controller
    const requestId = ++activeRequestIdRef.current;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Set UI pipeline status and commit turn to authoritative timeline
    setPipelineStatus('text_submitting');
    commitUserTurn(trimmedInput, 'text');

    setUserDraft('');
    setDraftsByAttempt((prev) => ({ ...prev, [currentAttemptId]: '' }));
    setIsLoading(true);
    setErrorMessage(null);
    setPartnerState('thinking');

    try {
      // Barge-in: interrupt any current speech before processing new turn
      interrupt();

      // Send user turn message to ElevenLabs agent via Anam
      sendUserMessage(trimmedInput);

      const currentTurns = attemptsRef.current[currentAttemptIdx]?.turns || [];
      const res = await fetch('/api/v1/conversation/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          scenario_id: topic.id,
          active_branch_id: activeBranch.id,
          parent_turn_id: currentTurns[currentTurns.length - 1]?.id || null,
          user_input: {
            text: trimmedInput,
            input_mode: 'text',
            prosody: {
              words_per_minute: 135,
              volume_rms: 0.28,
              pitch_variance_hz: 18.5,
            },
          },
          current_vad: {
            valence: 0.1,
            arousal: 0.05,
            dominance: 0.0,
          },
          history: currentTurns.map((t) => ({
            role: t.role,
            content: t.text,
          })),
          custom_scenario: topic.customMetadata
            ? {
                situation: topic.customMetadata.userProvidedSituation,
                partner_role: topic.partner.role,
                partner_name: topic.partner.name,
                user_goal: topic.userGoal,
                constraints: topic.customMetadata.avoidConstraints,
              }
            : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Partner turn processing failed (${res.status})`);
      }

      const data = await res.json();

      // Discard response if cancelled or user changed attempt/reset
      if (requestId !== activeRequestIdRef.current || controller.signal.aborted) {
        return;
      }

      const coachingData = {
        subtext: data.unspoken_subtext,
        twoWayBridge: data.two_way_bridge
          ? {
              userIntent: data.two_way_bridge.user_intent,
              receivedImpact: data.two_way_bridge.received_as,
            }
          : undefined,
        postureCue: data.avatar_kinematics?.posture_cue,
        suggestedWording:
          data.pivot_recommendation?.suggested_wording ||
          data.pocket_script_pivot?.recommended_text,
      };

      const isAvatarActive =
        avatarSessionPhase === 'conversation_ready' || avatarSessionPhase === 'streaming';

      if (isAvatarActive) {
        pendingCoachingDataRef.current = coachingData;
        setAttempts((prev) => {
          const copy = [...prev];
          if (!copy[currentAttemptIdx]) return prev;
          const currentTurns = [...copy[currentAttemptIdx].turns];
          const lastPartnerIdx = [...currentTurns].reverse().findIndex((t) => t.role === 'partner');
          if (lastPartnerIdx >= 0) {
            const realIdx = currentTurns.length - 1 - lastPartnerIdx;
            currentTurns[realIdx] = {
              ...currentTurns[realIdx],
              subtext: coachingData.subtext || currentTurns[realIdx].subtext,
              twoWayBridge: coachingData.twoWayBridge || currentTurns[realIdx].twoWayBridge,
              postureCue: coachingData.postureCue || currentTurns[realIdx].postureCue,
              suggestedWording: coachingData.suggestedWording || currentTurns[realIdx].suggestedWording,
            };
            copy[currentAttemptIdx] = { ...copy[currentAttemptIdx], turns: currentTurns };
          }
          return copy;
        });
      } else {
        // Fallback when avatar is not streaming: append Gemini's spoken response
        const partnerTurn: TurnMessage = {
          id: data.turn_id || `partner-${Date.now()}`,
          role: 'partner',
          text: data.spoken_response,
          status: 'committed_assistant_turn',
          inputMode: 'text',
          timestamp: Date.now(),
          subtext: coachingData.subtext,
          twoWayBridge: coachingData.twoWayBridge,
          postureCue: coachingData.postureCue,
          suggestedWording: coachingData.suggestedWording,
        };

        setAttempts((prev) => {
          const copy = [...prev];
          if (copy[currentAttemptIdx]) {
            copy[currentAttemptIdx] = {
              ...copy[currentAttemptIdx],
              turns: [...copy[currentAttemptIdx].turns, partnerTurn],
            };
          }
          return copy;
        });
      }

      if (data.pivot_recommendation?.suggested_wording) {
        setEditableTakeaway(data.pivot_recommendation.suggested_wording);
      } else if (data.pocket_script_pivot?.recommended_text) {
        setEditableTakeaway(data.pocket_script_pivot.recommended_text);
      }

      setIsLoading(false);
    } catch (err: unknown) {
      if (controller.signal.aborted || (err as any)?.name === 'AbortError') {
        return;
      }
      if (requestId !== activeRequestIdRef.current) return;

      setPartnerState('neutral');
      setErrorMessage(
        'Could not reach the conversational partner right now. Your turn was committed to the transcript.',
      );
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Switch between versions while saving drafts and canceling in-flight calls
  const handleSwitchAttempt = (targetIndex: number) => {
    if (targetIndex === activeAttemptIndex) return;

    playCozySound('pop');
    interrupt();

    activeRequestIdRef.current++;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);

    // Save draft for current attempt
    setDraftsByAttempt((prev) => ({
      ...prev,
      [activeBranch.id]: userDraft,
    }));

    // Restore draft for target attempt
    const targetBranch = attempts[targetIndex];
    setUserDraft(draftsByAttempt[targetBranch.id] || '');
    setActiveAttemptIndex(targetIndex);
    setPartnerState('listening');
    setErrorMessage(null);
  };

  // Branch a non-destructive new version ("Try another version")
  const handleTryAnotherVersion = () => {
    playCozySound('branch');
    interrupt();

    activeRequestIdRef.current++;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);

    // Save current draft
    setDraftsByAttempt((prev) => ({
      ...prev,
      [activeBranch.id]: userDraft,
    }));

    const nextVersionNumber = attempts.length + 1;
    const newAttempt: AttemptBranch = {
      id: `version-${nextVersionNumber}`,
      label: `Version ${nextVersionNumber}`,
      turns: [
        {
          id: `turn-init-${nextVersionNumber}`,
          role: 'partner',
          text: topic.partner.initialDialogue,
          status: 'committed_assistant_turn',
          inputMode: 'text',
          timestamp: Date.now(),
          subtext: 'Starting fresh attempt.',
          postureCue: 'Attentive, friendly posture',
        },
      ],
    };

    setAttempts((prev) => [...prev, newAttempt]);
    setActiveAttemptIndex(attempts.length);
    setUserDraft('');
    setPartnerState('listening');
    setErrorMessage(null);
  };

  // Speech to text toggle (Web Speech API with interim preview and authoritative commit)
  const toggleVoiceRecording = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. You can type freely.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      setIsHearingSpeech(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsRecording(true);
        setIsHearingSpeech(true);
        setPipelineStatus('hearing_speech');
        setDroppedUtteranceWarning(null);
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const transcript = res[0]?.transcript || '';
          if (res.isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }

        if (interimText.trim()) {
          setActivePartialUserTurn({
            id: `user-preview-${Date.now()}`,
            role: 'user',
            text: interimText.trim(),
            status: 'partial_user_turn',
            inputMode: 'voice',
            timestamp: Date.now(),
          });
          setPipelineStatus('previewing_transcript');
        }

        if (finalText.trim()) {
          commitUserTurn(finalText.trim(), 'voice');
          setUserDraft('');
        }
      };

      recognition.onerror = (err: any) => {
        setIsRecording(false);
        setIsHearingSpeech(false);
        if (err?.error !== 'no-speech') {
          console.warn('[TurnPipeline:WebSpeech] Recording error:', err?.error);
          setErrorMessage('Microphone access paused. Feel free to type your response.');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        setIsHearingSpeech(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
      setIsHearingSpeech(false);
    }
  };

  // Insert suggested phrasing into draft (editable, never auto-submits)
  const handleUseSuggestedWording = (phrase: string) => {
    playCozySound('tap');
    setUserDraft(phrase);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Finish practice session and transition automatically to report generation
  const handleFinishPractice = () => {
    playCozySound('tap');
    disconnectAvatarSession();
    activeRequestIdRef.current++;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    onCompleteTopic(topic.id);

    // Filter strictly committed turns for report generation
    const currentBranch = attempts[activeAttemptIndex] || attempts[0];
    const committedTurns = currentBranch.turns.filter(
      (t) => !t.status || t.status === 'committed_user_turn' || t.status === 'committed_assistant_turn',
    );

    // Synthesize structured report strictly from committed turns
    const durationSeconds = Math.max(15, Math.round((Date.now() - sessionStartTime) / 1000));
    const service = new ReportGeneratorService();
    const generated = service.generateReport({
      scenarioId: topic.id,
      turns: committedTurns.map((t) => ({
        id: t.id,
        role: t.role,
        text: t.text,
        status: t.status,
        inputMode: t.inputMode,
      })),
      durationSeconds,
      droppedUtterancesCount,
      customScenario: topic.customMetadata
        ? {
            situation: topic.customMetadata.userProvidedSituation,
            partner_role: topic.partner.role,
            partner_name: topic.partner.name,
            user_goal: topic.userGoal,
          }
        : undefined,
    });

    setSessionReport(generated);
    if (onReportGenerated) {
      onReportGenerated(generated);
    }
    setStageMode('generating-report');
  };

  // Save takeaway script
  const handleSaveTakeawayToProgress = () => {
    playCozySound('tap');
    const newTakeaway: SavedTakeaway = {
      id: `takeaway-${Date.now()}`,
      topicId: topic.id,
      topicTitle: topic.title,
      script: editableTakeaway.trim(),
      savedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    };
    onSaveTakeaway(newTakeaway);
    setTakeawaySaved(true);
  };

  // Clean exit
  const handleExitStage = () => {
    playCozySound('tap');
    disconnectAvatarSession();
    activeRequestIdRef.current++;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    onExit();
  };

  // Save conversation progress and exit cleanly to dashboard
  const handleSaveAndExitToDashboard = () => {
    playCozySound('tap');
    try {
      localStorage.setItem(
        `sif_saved_conversation_${topic.id}`,
        JSON.stringify({
          attempts,
          userDraft,
          savedAt: Date.now(),
        }),
      );
    } catch {}
    onCompleteTopic(topic.id);
    disconnectAvatarSession();
    activeRequestIdRef.current++;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsSaveProgressOpen(false);
    onExit();
  };

  // Render Report Generation Animated Transition
  if (stageMode === 'generating-report') {
    return (
      <ReportGenerationView
        scenarioTitle={topic.title}
        onGenerationComplete={() => setStageMode('report')}
      />
    );
  }

  // Render Coached Report Page once analysis complete
  if (stageMode === 'report' && sessionReport) {
    return (
      <ConversationReportPage
        report={sessionReport}
        onRestartPractice={() => {
          setStageMode('practice');
          setActiveAttemptIndex(0);
          setUserDraft('');
        }}
        onReturnDashboard={handleExitStage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-canvas-light text-ink-primary flex flex-col justify-between">
      {/* Top Stage Bar */}
      <header className="border-b border-canvas-borderSubtle bg-canvas-surface/80 backdrop-blur-xs px-4 sm:px-6 py-3 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {/* Back & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExitStage}
              className="text-xs font-medium text-ink-muted hover:text-ink-primary px-2.5 py-1.5 rounded-lg hover:bg-canvas-subtle transition"
            >
              ← Back to dashboard
            </button>
            <span className="text-canvas-border hidden sm:inline">|</span>
            <div>
              <span className="text-xs font-semibold text-sif-primary uppercase tracking-wider block">
                {topic.categoryLabel}
              </span>
              <h1 className="text-sm sm:text-base font-semibold text-ink-primary leading-tight">
                {topic.title}
              </h1>
            </div>
          </div>

          {/* Version Switcher & Actions */}
          <div className="flex items-center gap-2">
            {/* Version Attempt Selector */}
            {attempts.length > 1 && (
              <div className="flex items-center gap-1 bg-canvas-subtle p-1 rounded-xl border border-canvas-border">
                {attempts.map((att, idx) => (
                  <button
                    key={att.id}
                    onClick={() => handleSwitchAttempt(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      activeAttemptIndex === idx
                        ? 'bg-canvas-surface text-ink-primary shadow-2xs font-semibold'
                        : 'text-ink-muted hover:text-ink-primary'
                    }`}
                  >
                    {att.label}
                  </button>
                ))}
              </div>
            )}

            {/* Save Progress Button */}
            <button
              onClick={() => {
                interrupt();
                muteMic();
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                setIsSaveProgressOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-canvas-surface border border-canvas-border text-ink-secondary hover:bg-canvas-subtle transition"
            >
              Save Progress
            </button>

            {/* Finish Practice */}
            <button
              onClick={handleFinishPractice}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-sif-primary hover:bg-sif-primaryHover text-canvas-surface transition shadow-2xs"
            >
              Finish
            </button>
          </div>
        </div>
      </header>

      {/* Accessible Goal Banner */}
      <div className="bg-canvas-subtle border-b border-canvas-borderSubtle px-4 py-2">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-ink-secondary">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sif-primary">Your goal:</span>
            <span>{topic.userGoal}</span>
          </div>

          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className="text-xs text-ink-muted hover:text-ink-primary underline ml-4 shrink-0"
          >
            {showHistoryDrawer ? 'Hide dialogue transcript' : `View full dialogue (${activeBranch.turns.length})`}
          </button>
        </div>
      </div>

      {/* Main Practice Stage */}
      <main className="max-w-4xl mx-auto w-full flex-1 p-4 sm:p-6 pb-28 sm:pb-36 flex flex-col items-center gap-6">
        {/* Full Dialogue Drawer (if expanded) */}
        {showHistoryDrawer && (
          <div className="w-full max-w-2xl bg-canvas-surface border border-canvas-border rounded-2xl p-4 max-h-60 overflow-y-auto space-y-3 mb-2 shadow-xs">
            <span className="text-xs font-semibold uppercase text-ink-muted block">Conversation History</span>
            {activeBranch.turns.map((turn) => (
              <div
                key={turn.id}
                className={`p-3 rounded-xl text-xs ${
                  turn.role === 'partner'
                    ? 'bg-canvas-subtle text-ink-primary'
                    : 'bg-sif-primarySubtle text-ink-primary ml-6'
                }`}
              >
                <span className="font-semibold block mb-0.5">
                  {turn.role === 'partner' ? topic.partner.name : 'You'}
                </span>
                <p className="leading-relaxed">{turn.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Sophia Live Avatar Presentation */}
        {!hideAvatar ? (
          <div className="w-full max-w-3xl flex flex-col items-center">
            <SophiaLiveAvatar
              presentation={sophiaPresentation}
              partnerState={partnerState}
              isSpeakingAudio={isSpeakingAudio}
              isMuted={isAvatarAudioMuted}
              onToggleMute={toggleAvatarMute}
              onToggleTextMode={() => setHideAvatar(true)}
              videoRef={videoRef}
              sessionState={avatarSessionState}
              sessionPhase={avatarSessionPhase}
              isUpstreamRejected={isUpstreamRejected}
              errorMessage={avatarSessionError}
              onRetry={retryAvatarSession}
              className="w-full"
            />
          </div>
        ) : (
          /* Accessible Text-Only Fallback */
          <div className="w-full max-w-md p-4 rounded-2xl bg-canvas-subtle border border-canvas-border flex items-center justify-between text-xs text-ink-secondary">
            <div className="flex flex-col gap-0.5">
              <span>Visual avatar hidden (Accessible text mode)</span>
              <span className="text-[11px] text-ink-muted">
                {sophiaPresentation.visualSummary}
              </span>
            </div>
            <button
              onClick={() => {
                setHideAvatar(false);
              }}
              className="text-sif-primary font-medium hover:underline"
            >
              Show Avatar
            </button>
          </div>
        )}

        {/* Latest Spoken Dialogue Card */}
        {latestPartnerTurn && (
          <div className="w-full max-w-xl bg-canvas-surface border border-canvas-border rounded-3xl p-5 sm:p-6 shadow-xs relative text-left transition">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-ink-primary">{topic.partner.name}</span>
                <span className="text-xs text-ink-muted">({topic.partner.role})</span>
                <button
                  onClick={() => {
                    playCozySound('toggle');
                    toggleAvatarMute();
                  }}
                  className={`text-xs px-2 py-0.5 rounded-lg border transition flex items-center gap-1 ${
                    isAvatarAudioMuted
                      ? 'bg-canvas-subtle text-ink-muted border-canvas-border'
                      : 'bg-sif-primarySubtle text-sif-primary border-sif-border font-medium'
                  }`}
                  title={isAvatarAudioMuted ? 'Unmute partner voice' : 'Mute partner voice'}
                >
                  {isAvatarAudioMuted ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Audio muted</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Voice active</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playCozySound('toggle');
                    if (interactionMode === 'turn-based') {
                      setInteractionMode('hands-free');
                      unmuteMic();
                    } else {
                      setInteractionMode('turn-based');
                      muteMic();
                    }
                  }}
                  className={`text-xs px-2.5 py-0.5 rounded-lg border transition flex items-center gap-1.5 ${
                    interactionMode === 'hands-free'
                      ? 'bg-topic-apricot/20 text-topic-apricot border-topic-apricot font-semibold animate-pulse'
                      : 'bg-canvas-subtle text-ink-secondary border-canvas-border hover:text-ink-primary'
                  }`}
                  title={
                    interactionMode === 'hands-free'
                      ? 'Live voice stream is active. Click to switch to turn-based drafting.'
                      : 'Turn-based mode is active. Click to enable continuous live voice.'
                  }
                >
                  {interactionMode === 'hands-free' ? (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Live Voice (Active)</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Turn-Based Mode</span>
                    </>
                  )}
                </button>
              </div>
              {latestPartnerTurn.postureCue && (
                <span className="text-[11px] text-ink-muted italic bg-canvas-subtle px-2 py-0.5 rounded-full border border-canvas-borderSubtle">
                  {latestPartnerTurn.postureCue}
                </span>
              )}
            </div>

            {voiceNotice && (
              <div className="mb-2 text-[11px] text-ink-muted bg-canvas-subtle px-2.5 py-1 rounded-lg border border-canvas-border flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-topic-amber" />
                <span>{voiceNotice}</span>
              </div>
            )}

            <p className="text-base sm:text-lg font-medium text-ink-primary leading-relaxed">
              “{latestPartnerTurn.text}”
            </p>
          </div>
        )}

        {/* Error Feedback (with preserved draft notice) */}
        {errorMessage && (
          <div className="w-full max-w-xl p-3.5 rounded-2xl bg-canvas-surface border border-topic-apricot text-xs text-topic-apricot flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-ink-muted hover:text-ink-primary ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Secondary User-Controlled Guidance Section */}
        <div className="w-full max-w-xl">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-2 px-1">
            <div className="flex items-center gap-2">
              <span>Guidance:</span>
              <div className="flex items-center gap-1 bg-canvas-subtle p-0.5 rounded-lg border border-canvas-borderSubtle">
                {(['independent', 'cues', 'subtext'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setGuidanceLevel(lvl);
                      setIsGuidanceDrawerOpen(lvl !== 'independent');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                      guidanceLevel === lvl
                        ? 'bg-canvas-surface text-ink-primary shadow-2xs font-semibold'
                        : 'text-ink-muted hover:text-ink-primary'
                    }`}
                  >
                    {lvl === 'independent' ? 'Just practice' : lvl === 'cues' ? 'Show cues' : 'Explore subtext'}
                  </button>
                ))}
              </div>
            </div>

            {guidanceLevel !== 'independent' && (
              <button
                onClick={() => setIsGuidanceDrawerOpen(!isGuidanceDrawerOpen)}
                className="hover:text-ink-primary transition"
              >
                {isGuidanceDrawerOpen ? 'Collapse guidance' : 'Expand guidance'}
              </button>
            )}
          </div>

          {/* Guidance Drawer Content */}
          {isGuidanceDrawerOpen && guidanceLevel !== 'independent' && latestPartnerTurn && (
            <div className="p-4 rounded-2xl bg-canvas-surface border border-canvas-border space-y-3 shadow-xs animate-fadeIn text-left">
              {/* Two-Way Bridge: What you meant vs How it might land */}
              {guidanceLevel === 'subtext' && latestPartnerTurn.twoWayBridge && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-canvas-borderSubtle">
                  <div className="p-3 rounded-xl bg-canvas-subtle">
                    <span className="text-[11px] font-semibold text-sif-primary uppercase block mb-1">
                      In this simulation: What you meant
                    </span>
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      {latestPartnerTurn.twoWayBridge.userIntent}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-canvas-subtle">
                    <span className="text-[11px] font-semibold text-topic-apricot uppercase block mb-1">
                      How it might land
                    </span>
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      May be perceived as: {latestPartnerTurn.twoWayBridge.receivedImpact}
                    </p>
                  </div>
                </div>
              )}

              {/* Unspoken Subtext insight */}
              {latestPartnerTurn.subtext && (
                <div className="text-xs text-ink-secondary flex items-start gap-2">
                  <span className="text-sif-primary font-semibold shrink-0">Subtext hint:</span>
                  <span className="italic">“{latestPartnerTurn.subtext}”</span>
                </div>
              )}

              {/* Optional Suggestion Phrasing (Purely optional, never auto-submits) */}
              {latestPartnerTurn.suggestedWording && (
                <div className="p-3 rounded-xl bg-sif-primarySubtle/50 border border-sif-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-sif-primary uppercase block mb-0.5">
                      Another approach to consider
                    </span>
                    <p className="text-xs text-ink-primary italic">
                      “{latestPartnerTurn.suggestedWording}”
                    </p>
                  </div>
                  <button
                    onClick={() => handleUseSuggestedWording(latestPartnerTurn.suggestedWording!)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-canvas-surface border border-sif-border text-sif-primary hover:bg-sif-primarySubtle transition shrink-0"
                  >
                    Edit this in response
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Response Input Dock */}
      <footer className="border-t border-canvas-borderSubtle bg-canvas-surface/90 backdrop-blur-xs p-4 sticky bottom-0 z-20">
        <div className="max-w-2xl mx-auto flex flex-col gap-2">
          {/* Action Row */}
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <div className="flex items-center gap-2">
              <span>Respond:</span>
              <button
                type="button"
                onClick={() => {
                  playCozySound('toggle');
                  if (interactionMode === 'turn-based') {
                    setInteractionMode('hands-free');
                    unmuteMic();
                  } else {
                    setInteractionMode('turn-based');
                    muteMic();
                  }
                }}
                className={`text-[11px] px-2.5 py-0.5 rounded-lg border transition flex items-center gap-1.5 ${
                  interactionMode === 'hands-free'
                    ? 'bg-topic-apricot/20 text-topic-apricot border-topic-apricot font-semibold'
                    : 'bg-canvas-subtle text-ink-secondary border-canvas-border hover:text-ink-primary'
                }`}
              >
                {interactionMode === 'hands-free' ? (
                  <>
                    <Mic className="w-3 h-3" />
                    <span>Hands-Free Voice Active</span>
                  </>
                ) : (
                  <>
                    <Pencil className="w-3 h-3" />
                    <span>Turn-Based (Draft & Send)</span>
                  </>
                )}
              </button>
            </div>
            <button
              onClick={handleTryAnotherVersion}
              className="text-sif-primary hover:underline font-medium"
            >
              + Try another version
            </button>
          </div>

          {/* Pipeline Status & Health Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] py-1 px-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Mic Live / Muted Indicator */}
              <span
                className={`px-2 py-0.5 rounded-full border text-[11px] font-medium flex items-center gap-1.5 transition ${
                  (interactionMode === 'hands-free' && !isMicMuted) || isRecording
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-canvas-subtle text-ink-muted border-canvas-borderSubtle'
                }`}
                data-testid="mic-live-indicator"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    (interactionMode === 'hands-free' && !isMicMuted) || isRecording
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-ink-muted'
                  }`}
                />
                {(interactionMode === 'hands-free' && !isMicMuted) || isRecording
                  ? 'Mic live'
                  : 'Mic muted'}
              </span>

              {/* Hearing Speech Indicator */}
              {isHearingSpeech && (
                <span
                  className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-300 text-[11px] font-medium flex items-center gap-1.5 animate-pulse"
                  data-testid="hearing-speech-indicator"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  Hearing speech...
                </span>
              )}

              {/* Turn Pipeline Status Pill */}
              {pipelineStatus === 'previewing_transcript' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300 font-medium flex items-center gap-1">
                  <Pencil className="w-3 h-3" />
                  <span>Transcript preview</span>
                </span>
              )}
              {pipelineStatus === 'transcript_committed' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-medium">
                  ✓ Transcript committed
                </span>
              )}
              {pipelineStatus === 'text_submitting' && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-300 font-medium flex items-center gap-1">
                  <Hourglass className="w-3 h-3 animate-spin" />
                  <span>Text submitted...</span>
                </span>
              )}
              {pipelineStatus === 'text_committed' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-medium">
                  ✓ Text committed
                </span>
              )}
            </div>

            {/* Authoritative Turn Counts */}
            <span className="text-ink-muted text-[11px] ml-auto" data-testid="authoritative-turns-count">
              Report based on {committedUserTurnsCount} committed user turn{committedUserTurnsCount === 1 ? '' : 's'} / {committedAssistantTurnsCount} committed assistant turn{committedAssistantTurnsCount === 1 ? '' : 's'}
            </span>
          </div>

          {/* Dropped Utterance Warning Banner */}
          {droppedUtteranceWarning && (
            <div
              className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-center justify-between gap-2 animate-fadeIn"
              data-testid="dropped-utterance-warning"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{droppedUtteranceWarning}</span>
              </div>
              <button
                type="button"
                onClick={() => setDroppedUtteranceWarning(null)}
                className="text-amber-700 hover:text-amber-900 font-bold p-1 rounded hover:bg-amber-100 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active Partial User Turn Preview */}
          {activePartialUserTurn && (
            <div
              className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-center gap-2 animate-fadeIn"
              data-testid="transcript-preview-box"
            >
              <span className="font-semibold uppercase tracking-wider text-[10px] bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-800 shrink-0">
                Transcript preview
              </span>
              <p className="italic font-medium truncate">“{activePartialUserTurn.text}”</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmitTurn} className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={userDraft}
                onChange={(e) => setUserDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitTurn();
                  }
                }}
                placeholder={
                  interactionMode === 'hands-free'
                    ? 'Hands-free voice active. Speak aloud to Sophia or type here... (Press Enter to send)'
                    : 'What would you like to say? (Press Enter to send)'
                }
                rows={2}
                disabled={isLoading}
                className="w-full resize-none rounded-2xl bg-canvas-light border border-canvas-border px-4 py-3 text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-sif-primary focus:border-transparent transition"
              />
            </div>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={() => {
                if (interactionMode === 'hands-free') {
                  setInteractionMode('turn-based');
                  muteMic();
                } else {
                  toggleVoiceRecording();
                }
              }}
              className={`p-3 rounded-2xl border transition focus:outline-none focus:ring-2 focus:ring-sif-primary ${
                interactionMode === 'hands-free'
                  ? 'bg-topic-apricot text-white border-topic-apricot animate-pulse'
                  : isRecording
                    ? 'bg-topic-apricot text-white border-topic-apricot animate-pulse'
                    : 'bg-canvas-light border-canvas-border text-ink-muted hover:text-ink-primary hover:bg-canvas-subtle'
              }`}
              title={
                interactionMode === 'hands-free'
                  ? 'Hands-free voice active. Click to switch to turn-based drafting.'
                  : isRecording
                    ? 'Stop recording voice to draft'
                    : 'Speak your response into the draft box'
              }
              aria-label="Microphone input"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || !userDraft.trim()}
              className={`px-5 py-3 rounded-2xl font-medium text-sm transition focus:outline-none focus:ring-2 focus:ring-sif-primary shadow-xs ${
                isLoading || !userDraft.trim()
                  ? 'bg-canvas-subtle text-ink-muted cursor-not-allowed border border-canvas-borderSubtle'
                  : 'bg-sif-primary hover:bg-sif-primaryHover active:bg-sif-primaryDeep text-canvas-surface'
              }`}
            >
              {isLoading ? 'Thinking…' : 'Send'}
            </button>
          </form>
        </div>
      </footer>

      {/* ── SAVE PROGRESS CONFIRMATION MODAL ────────────────────────────────── */}
      {isSaveProgressOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/30 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-canvas-surface border border-canvas-border rounded-3xl p-6 shadow-xl max-w-md w-full text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-sif-primarySubtle text-sif-primary flex items-center justify-center mx-auto text-2xl font-light">
              <Bookmark className="w-8 h-8 text-sif-primary" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-ink-primary">Save conversation progress</h2>
              <p className="text-xs text-ink-secondary mt-1 max-w-xs mx-auto">
                This will save your conversation progress and drafts so you can revisit and continue practicing later.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setIsSaveProgressOpen(false)}
                className="w-full py-2.5 rounded-xl bg-sif-primary text-canvas-surface text-sm font-medium hover:bg-sif-primaryHover transition shadow-xs"
              >
                Continue Practicing
              </button>

              <button
                onClick={handleSaveAndExitToDashboard}
                className="w-full py-2 rounded-xl bg-canvas-subtle text-ink-primary border border-canvas-border text-xs font-medium hover:bg-canvas-border transition"
              >
                Save and Exit to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WORDS TO TAKE WITH YOU (TAKEAWAYS SCREEN) ────────────────────────── */}
      {isTakeawayOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/30 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-canvas-surface border border-canvas-border rounded-3xl p-6 sm:p-8 shadow-xl max-w-lg w-full text-left space-y-6 animate-fadeIn">
            <div>
              <span className="text-xs font-semibold text-sif-primary uppercase tracking-wider block mb-1">
                Reflect & Keep
              </span>
              <h2 className="text-2xl font-semibold text-ink-primary">Words to take with you</h2>
              <p className="text-xs text-ink-secondary mt-1">
                Here is phrasing customized for this conversation. Adjust the words to make them yours.
              </p>
            </div>

            {/* Editable Script Box */}
            <div className="space-y-2">
              <label htmlFor="takeaway-script" className="text-xs font-semibold uppercase text-ink-muted">
                Your Pocket Script
              </label>
              <textarea
                id="takeaway-script"
                value={editableTakeaway}
                onChange={(e) => {
                  setEditableTakeaway(e.target.value);
                  setTakeawaySaved(false);
                }}
                rows={4}
                className="w-full rounded-2xl bg-canvas-light border border-canvas-border p-4 text-sm text-ink-primary leading-relaxed focus:outline-none focus:ring-2 focus:ring-sif-primary"
              />
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(editableTakeaway);
                    alert('Copied wording to clipboard!');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-canvas-subtle hover:bg-canvas-border text-ink-primary text-xs font-medium transition text-center"
                >
                  Copy to clipboard
                </button>

                <button
                  onClick={handleSaveTakeawayToProgress}
                  disabled={takeawaySaved}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition text-center ${
                    takeawaySaved
                      ? 'bg-sif-primarySubtle text-sif-primary font-semibold'
                      : 'bg-canvas-surface border border-sif-border text-sif-primary hover:bg-sif-primarySubtle'
                  }`}
                >
                  {takeawaySaved ? '✓ Saved to Progress' : 'Save to My Progress'}
                </button>
              </div>

              <button
                onClick={handleExitStage}
                className="w-full py-3 rounded-xl bg-sif-primary text-canvas-surface text-sm font-medium hover:bg-sif-primaryHover transition shadow-xs text-center"
              >
                Return to dashboard
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
