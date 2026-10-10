'use client';

/**
 * page.tsx — Say It First Interactive Sandbox
 *
 * Assembles the full sensory-calm UI across 3 functional panels:
 * Panel 1: The Stage (Avatar SVG Rig & Dialogue Captions)
 * Panel 2: The Subtext Lab (Affect Radar & Two-Way Bridge HUD)
 * Panel 3: The Control Dock (Dual-Modality Push-To-Talk & Rewind)
 * Plus Clinical Safety: CoRegulationModal (Tier 3) & PostSessionDebrief
 */

import React, { useState, useCallback } from 'react';
import { AvatarSvgRig } from '../presentation/components/AvatarSvgRig';
import { AffectRadarCanvas } from '../presentation/components/AffectRadarCanvas';
import { SubtextHud } from '../presentation/components/SubtextHud';
import { InputDock } from '../presentation/components/InputDock';
import { CoRegulationModal } from '../presentation/components/CoRegulationModal';
import { PostSessionDebrief } from '../presentation/components/PostSessionDebrief';
import { useTimelineBranching } from '../presentation/hooks/useTimelineBranching';
import { useWebAudioProsody } from '../presentation/hooks/useWebAudioProsody';
import { createAffectVector } from '../domain/entities/AffectVector';
import type { ProcessTurnResponse } from '../application/use-cases/ProcessTurnUseCase';
import type { PocketScriptResult } from '../application/use-cases/GeneratePocketScriptUseCase';

export default function SayItFirstSandbox() {
  const {
    activeTurn,
    linearHistory,
    currentVad,
    scaffoldingLevel,
    rewindTo,
    setScaffoldingLevel,
    resetGraph,
  } = useTimelineBranching();

  const {
    isListening,
    startListening,
    stopListening,
    metrics: liveProsody,
  } = useWebAudioProsody();

  const [isLoading, setIsLoading] = useState(false);
  const [showCoRegulation, setShowCoRegulation] = useState(false);
  const [showDebrief, setShowDebrief] = useState(false);
  const [pocketScript, setPocketScript] = useState<PocketScriptResult | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Latest turn metadata
  const spokenCaption = activeTurn?.content ?? 'Hey, do you have a minute to run through the project rollout?';
  const unspokenSubtext = activeTurn?.role === 'persona'
    ? 'I am already pressed for time before the deadline.'
    : undefined;
  const twoWayBridge = activeTurn?.twoWayBridge;

  const handleTurnSubmit = useCallback(async (input: { text: string; mode: 'voice' | 'text' }) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/conversation/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: 'workplace_written_specs',
          active_branch_id: 'branch_root',
          parent_turn_id: activeTurn?.turnId ?? null,
          user_input: {
            text: input.text,
            input_mode: input.mode,
            prosody: {
              words_per_minute: liveProsody.wordsPerMinute,
              volume_rms: liveProsody.volumeRms,
              pitch_variance_hz: liveProsody.pitchVarianceHz,
            },
          },
          current_vad: {
            valence: currentVad.valence,
            arousal: currentVad.arousal,
            dominance: currentVad.dominance,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const turnData: ProcessTurnResponse = await response.json();

      // Trigger Co-Regulation modal if Tier 3 Curtain Drop
      if (turnData.safety_gate.co_regulation_active) {
        setShowCoRegulation(true);
      }

      // Store pivot recommendation for debrief
      if (turnData.pocket_script_pivot) {
        setPocketScript({
          actionableScript: turnData.pocket_script_pivot.recommended_text,
          clinicalFramework: 'DBT DEAR MAN',
          underlyingIntent: turnData.two_way_bridge.user_intent,
          neurotypicalImpactNeutralized: turnData.two_way_bridge.received_as,
        });
      }
    } catch {
      // Offline fallback handling
    } finally {
      setIsLoading(false);
    }
  }, [activeTurn, currentVad, liveProsody]);

  const handleRewind = useCallback(() => {
    if (activeTurn?.parentId) {
      rewindTo(activeTurn.parentId);
    }
  }, [activeTurn, rewindTo]);

  const handleFinishSession = () => {
    if (!pocketScript) {
      setPocketScript({
        actionableScript:
          'I want to save your time. What if I write a 2-minute bulleted recap after our meetings, and you just give it a quick thumbs-up?',
        clinicalFramework: 'DBT DEAR MAN (Describe, Express, Assert, Reinforce, Mindful, Appear confident, Negotiate)',
        underlyingIntent:
          'Self-advocacy to ensure delivery accuracy and eliminate cognitive overwhelm.',
        neurotypicalImpactNeutralized:
          'Perceived administrative demand placed on the manager that criticizes their verbal briefing style.',
      });
    }
    setShowDebrief(true);
  };

  return (
    <main className="min-h-screen bg-[#0F141C] text-slate-100 flex flex-col p-4 md:p-8 max-w-7xl mx-auto">
      {/* Top Bar: Title & Controls */}
      <header className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100">
            Say It First
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Neurodiversity-Affirming Conversation Sandbox • Workplace Accommodation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setReducedMotion((prev) => !prev)}
            className="px-3 py-1.5 bg-slate-800 text-xs text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700"
          >
            {reducedMotion ? '✓ Calm Motion Active' : 'Calm Motion Toggle'}
          </button>
          <button
            type="button"
            onClick={handleFinishSession}
            className="px-4 py-1.5 bg-[#8B5CF6] text-xs font-semibold text-white rounded-lg hover:bg-[#7C3AED]"
          >
            Finish & Get Script
          </button>
        </div>
      </header>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 flex-1 items-start">
        {/* Panel 1: The Stage (Left Panel) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <AvatarSvgRig
            currentVad={currentVad}
            spokenCaption={spokenCaption}
            reducedMotion={reducedMotion}
          />
        </div>

        {/* Panel 2: The Subtext Lab (Right Panel) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <AffectRadarCanvas
            currentVad={currentVad}
            historyCoordinates={linearHistory.map((n) => n.affectSnapshot.resolved)}
          />

          <SubtextHud
            twoWayBridge={twoWayBridge}
            unspokenSubtext={unspokenSubtext}
            scaffoldingLevel={scaffoldingLevel}
            onScaffoldingChange={setScaffoldingLevel}
          />
        </div>
      </div>

      {/* Panel 3: The Control Dock (Bottom Panel) */}
      <footer className="mt-auto">
        <InputDock
          onSubmit={handleTurnSubmit}
          onRewind={handleRewind}
          isListening={isListening}
          onStartListening={startListening}
          onStopListening={stopListening}
          canRewind={Boolean(activeTurn?.parentId)}
          disabled={isLoading}
        />
      </footer>

      {/* Safety Overlays */}
      <CoRegulationModal
        isOpen={showCoRegulation}
        onComplete={() => setShowCoRegulation(false)}
        onExitScenario={() => {
          setShowCoRegulation(false);
          resetGraph();
        }}
      />

      {showDebrief && pocketScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <PostSessionDebrief
            pocketScript={pocketScript}
            onRestart={() => {
              setShowDebrief(false);
              resetGraph();
            }}
          />
        </div>
      )}
    </main>
  );
}
