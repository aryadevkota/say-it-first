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

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ScenarioDefinition } from '../../domain/scenarios/topics';
import { getSophiaPresentationForScenario } from '../../domain/entities/SophiaScenarioPresentation';
import { SophiaLiveAvatar } from './SophiaLiveAvatar';
import type { UserPreferences } from './WelcomeOnboarding';
type AvatarState = 'listening' | 'speaking' | 'thinking' | 'neutral' | 'receptive';
import type { SavedTakeaway } from './MyProgress';
import { useLiveAvatarSession } from '../hooks/useLiveAvatarSession';
import { playCozySound } from '../utils/cozyAudio';
import { ReportGenerationView } from './ReportGenerationView';
import { ConversationReportPage } from './ConversationReportPage';
import { ReportGeneratorService } from '../../domain/services/ReportGeneratorService';
import type { SessionReport } from '../../domain/entities/SessionReport';

interface TurnMessage {
  id: string;
  role: 'partner' | 'user';
  text: string;
  subtext?: string;
  twoWayBridge?: {
    userIntent: string;
    receivedImpact: string;
  };
  postureCue?: string;
  suggestedWording?: string;
}

interface AttemptBranch {
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
  const [isPaused, setIsPaused] = useState<boolean>(false);
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

  // Race condition & cancellation refs
  const activeRequestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Media Refs for LiveKit Video/Audio
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // ElevenLabs Voice Hook
  const {
    isPlaying: isSpeakingAudio,
    voiceNotice,
    isMuted,
    toggleMute,
    sendText,
    disconnect,
    connect,
  } = useLiveAvatarSession({
    mediaRefs: { video: videoRef, audio: audioRef },
    onPlaybackStateChange: (isPlaying) => {
      setPartnerState(isPlaying ? 'speaking' : 'receptive');
    },
    onTranscription: (role, text) => {
      setAttempts((prev) => {
        const copy = [...prev];
        const currentAttemptIdx = activeAttemptIndex;
        if (copy[currentAttemptIdx]) {
          // If the role is 'user', the user's turn was already appended optimistically in handleSubmitTurn
          // So we only append 'agent' turns to avoid duplicates for user.
          if (role === 'agent') {
             const partnerTurn: TurnMessage = {
               id: `partner-${Date.now()}`,
               role: 'partner',
               text: text,
             };
             copy[currentAttemptIdx] = {
               ...copy[currentAttemptIdx],
               turns: [...copy[currentAttemptIdx].turns, partnerTurn],
             };
          }
        }
        return copy;
      });
      if (role === 'agent') {
        setPartnerState('receptive');
      }
    }
  });

  const activeBranch = attempts[activeAttemptIndex] || attempts[0];
  const latestPartnerTurn = [...activeBranch.turns]
    .reverse()
    .find((t) => t.role === 'partner');

  const lastSpokenTurnIdRef = useRef<string | null>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Fetch session and connect
  useEffect(() => {
    let mounted = true;
    const initSession = async () => {
      try {
        const res = await fetch('/api/v1/avatar/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioId: topic.id,
            partnerName: topic.partner.name,
            partnerRole: topic.partner.role,
            userGoal: topic.userGoal,
            initialDialogue: topic.partner.initialDialogue
          })
        });
        const data = await res.json();
        if (mounted) {
          if (data.conversation_url) {
            setConversationUrl(data.conversation_url);
            conversationIdRef.current = data.conversation_id || null;
          } else if (data.session_token) {
            connect(data.session_token, data.ws_url || 'wss://agent.heygen.com');
          }
        }
      } catch (err) {
        console.error('Failed to init session', err);
      }
    };
    initSession();
    return () => { mounted = false; };
  }, [topic.id, topic.partner.name, topic.partner.role, topic.userGoal, topic.partner.initialDialogue, connect]);

  // Cancel any audio & in-flight requests on unmount
  useEffect(() => {
    return () => {
      activeRequestIdRef.current++;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      disconnect();

      // End Tavus conversation if active
      if (conversationIdRef.current) {
        fetch('/api/v1/avatar/session', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: conversationIdRef.current })
        }).catch(() => {});
      }
    };
  }, [disconnect]);

  // Handle submitting a turn to API
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

    const userTurnId = `user-${Date.now()}`;
    const newUserTurn: TurnMessage = {
      id: userTurnId,
      role: 'user',
      text: trimmedInput,
    };

    // Optimistically append user turn and clear draft
    const updatedTurns = [...activeBranch.turns, newUserTurn];
    setAttempts((prev) => {
      const copy = [...prev];
      if (copy[currentAttemptIdx]) {
        copy[currentAttemptIdx] = {
          ...copy[currentAttemptIdx],
          turns: updatedTurns,
        };
      }
      return copy;
    });

    setUserDraft('');
    setDraftsByAttempt((prev) => ({ ...prev, [currentAttemptId]: '' }));
    setIsLoading(true);
    setErrorMessage(null);
    setPartnerState('thinking');

    try {
      // Send the user's text directly to the ElevenLabs Agent
      sendText(trimmedInput);

      // We no longer block on Gemini inference. The ElevenLabs Agent will
      // process the text and respond via the LiveKit data channel (agent_response).
      setIsLoading(false);

      // We still asynchronously call Gemini to get the educational subtext and twoWayBridge
      // This is background guidance and should not block the conversation.
      fetch('/api/v1/conversation/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          scenario_id: topic.id,
          active_branch_id: activeBranch.id,
          parent_turn_id: activeBranch.turns[activeBranch.turns.length - 1]?.id || null,
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
          history: updatedTurns.map((t) => ({
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
      }).then(res => res.json()).then(data => {
        if (requestId !== activeRequestIdRef.current || controller.signal.aborted) return;
        
        // Update the guidance metadata for the latest turn (which will be generated by ElevenLabs)
        // Note: we can store this guidance in state to be displayed alongside the ElevenLabs response
        if (data.pivot_recommendation?.suggested_wording) {
          setEditableTakeaway(data.pivot_recommendation.suggested_wording);
        }
      }).catch(err => console.warn('Background guidance fetch failed', err));

      // Discard response if cancelled or user changed attempt/reset
      if (requestId !== activeRequestIdRef.current || controller.signal.aborted) {
        return;
      }
    } catch (err: unknown) {
      if (controller.signal.aborted || (err as any)?.name === 'AbortError') {
        return;
      }
      if (requestId !== activeRequestIdRef.current) return;

      // Preserve draft on failure so user never loses their work
      setUserDraft(trimmedInput);
      setPartnerState('neutral');
      setErrorMessage(
        'Could not reach the conversational partner right now. Your draft has been preserved.',
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
    disconnect();

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
    disconnect();

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

  // Speech to text toggle (Web Speech API)
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
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => {
        setIsRecording(false);
        setErrorMessage('Microphone access paused. Feel free to type your response.');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setUserDraft((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.start();
    } catch {
      setIsRecording(false);
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
    disconnect();
    activeRequestIdRef.current++;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    onCompleteTopic(topic.id);

    // Synthesize structured report
    const durationSeconds = Math.max(15, Math.round((Date.now() - sessionStartTime) / 1000));
    const service = new ReportGeneratorService();
    const generated = service.generateReport({
      scenarioId: topic.id,
      turns: activeBranch.turns.map((t) => ({
        id: t.id,
        role: t.role,
        text: t.text,
      })),
      durationSeconds,
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
    disconnect();
    activeRequestIdRef.current++;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
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

            {/* Pause Button */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                setIsPaused(true);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-canvas-surface border border-canvas-border text-ink-secondary hover:bg-canvas-subtle transition"
            >
              Pause
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
              isMuted={isMuted}
              onToggleMute={toggleMute}
              onToggleTextMode={() => setHideAvatar(true)}
              conversationUrl={conversationUrl || undefined}
              videoRef={videoRef}
              audioRef={audioRef}
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
                    toggleMute();
                  }}
                  className={`text-xs px-2 py-0.5 rounded-lg border transition ${
                    isMuted
                      ? 'bg-canvas-subtle text-ink-muted border-canvas-border'
                      : 'bg-sif-primarySubtle text-sif-primary border-sif-border font-medium'
                  }`}
                  title={isMuted ? 'Unmute partner voice' : 'Mute partner voice'}
                >
                  {isMuted ? '🔇 Audio muted' : '🔊 Voice active'}
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
            <span>Respond in your own words (Text or Speech)</span>
            <button
              onClick={handleTryAnotherVersion}
              className="text-sif-primary hover:underline font-medium"
            >
              + Try another version
            </button>
          </div>

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
                placeholder="What would you like to say? (Press Enter to send)"
                rows={2}
                disabled={isLoading}
                className="w-full resize-none rounded-2xl bg-canvas-light border border-canvas-border px-4 py-3 text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-sif-primary focus:border-transparent transition"
              />
            </div>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`p-3 rounded-2xl border transition focus:outline-none focus:ring-2 focus:ring-sif-primary ${
                isRecording
                  ? 'bg-topic-apricot text-white border-topic-apricot animate-pulse'
                  : 'bg-canvas-light border-canvas-border text-ink-muted hover:text-ink-primary hover:bg-canvas-subtle'
              }`}
              title={isRecording ? 'Stop recording' : 'Speak your response'}
              aria-label="Microphone input"
            >
              🎤
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

      {/* ── PAUSE / CO-REGULATION MODAL ─────────────────────────────────────── */}
      {isPaused && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/30 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-canvas-surface border border-canvas-border rounded-3xl p-6 shadow-xl max-w-md w-full text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-sif-primarySubtle text-sif-primary flex items-center justify-center mx-auto text-2xl font-light">
              ☕
            </div>

            <div>
              <h2 className="text-xl font-semibold text-ink-primary">Taking a quiet moment</h2>
              <p className="text-xs text-ink-secondary mt-1 max-w-xs mx-auto">
                The conversation is paused. Your draft and timeline are completely preserved.
              </p>
            </div>

            {/* Gentle Optional Breathing Cue */}
            <div className="p-4 rounded-2xl bg-canvas-subtle border border-canvas-borderSubtle flex flex-col items-center">
              <span className="text-xs text-ink-muted mb-2 font-medium">Take a calm breath</span>
              <div className="w-12 h-12 rounded-full border-2 border-sif-primary flex items-center justify-center animate-calm-pulse">
                <span className="text-[10px] text-sif-primary font-medium">Breathe</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-2.5 rounded-xl bg-sif-primary text-canvas-surface text-sm font-medium hover:bg-sif-primaryHover transition shadow-xs"
              >
                Resume conversation
              </button>

              <button
                onClick={() => {
                  setIsPaused(false);
                  handleTryAnotherVersion();
                }}
                className="w-full py-2 rounded-xl bg-canvas-subtle text-ink-secondary text-xs font-medium hover:bg-canvas-border transition"
              >
                Try a different approach
              </button>

              <button
                onClick={handleExitStage}
                className="w-full py-2 text-xs text-ink-muted hover:text-ink-primary transition"
              >
                Exit to dashboard
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
