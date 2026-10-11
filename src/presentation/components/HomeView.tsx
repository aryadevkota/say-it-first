'use client';

/**
 * HomeView.tsx — Media-Style Learning Discovery Home
 *
 * Implements:
 * - Top hero & welcome panel with prompt to start or explore
 * - "Continue where you left off" active scenario rail (if in progress)
 * - "Recommended Next Practice" rail driven by user interest categories
 * - Category-based horizontal rails:
 *    - Workplace & School Check-Ins
 *    - Friendships & Social Bids
 *    - Setting Boundaries & Saying No
 *    - Everyday Conversations
 *    - Appointments & Meeting People
 * - "Have a specific conversation in mind?" Custom scenario banner
 * - Quick "What to keep doing" repeatable habits insight panel
 */

import React from 'react';
import { TOPICS, type ScenarioDefinition, type TopicProgressStatus } from '../../domain/scenarios/topics';
import { ScenarioRail } from './ScenarioRail';
import type { UserPreferences } from './WelcomeOnboarding';
import { playCozySound } from '../utils/cozyAudio';

interface HomeViewProps {
  preferences: UserPreferences;
  progressMap: Record<string, TopicProgressStatus>;
  savedScenarioIds: string[];
  activeTopicId?: string;
  customScenarios?: ScenarioDefinition[];
  onSelectScenario: (scenario: ScenarioDefinition) => void;
  onToggleSave: (scenarioId: string) => void;
  onCreateCustomScenario: () => void;
  onOpenTutorial: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  preferences,
  progressMap,
  savedScenarioIds,
  activeTopicId,
  customScenarios = [],
  onSelectScenario,
  onToggleSave,
  onCreateCustomScenario,
  onOpenTutorial,
}) => {
  const savedMap = React.useMemo(() => {
    const map: Record<string, boolean> = {};
    savedScenarioIds.forEach((id) => (map[id] = true));
    return map;
  }, [savedScenarioIds]);

  // Combine built-in topics and custom scenarios
  const allScenarios = React.useMemo(() => {
    return [...customScenarios, ...TOPICS];
  }, [customScenarios]);

  // Categorized scenario subsets
  const inProgressScenarios = allScenarios.filter(
    (s) => progressMap[s.id] === 'in-progress' || s.id === activeTopicId,
  );

  const workplaceScenarios = allScenarios.filter((s) => s.category === 'work-school');
  const friendshipScenarios = allScenarios.filter((s) => s.category === 'friendships');
  const boundaryScenarios = allScenarios.filter((s) => s.category === 'boundaries');
  const everydayScenarios = allScenarios.filter((s) => s.category === 'everyday');
  const meetingScenarios = allScenarios.filter(
    (s) => s.category === 'meeting-people' || s.category === 'appointments',
  );

  // Recommended rail based on preferences
  const recommendedScenarios = React.useMemo(() => {
    const matched = allScenarios.filter((scenario) => {
      return preferences.interests.some(
        (interest) =>
          (interest === 'Work or school' && scenario.category === 'work-school') ||
          (interest === 'Friendships' && scenario.category === 'friendships') ||
          (interest === 'Everyday conversations' && scenario.category === 'everyday') ||
          (interest === 'Difficult conversations' && scenario.category === 'boundaries') ||
          (interest === 'Meeting new people' && scenario.category === 'meeting-people') ||
          (interest === 'Appointments' && scenario.category === 'appointments'),
      );
    });
    return matched.length > 0 ? matched : allScenarios.slice(0, 4);
  }, [allScenarios, preferences.interests]);

  return (
    <div
      className="max-w-6xl mx-auto w-full py-6 sm:py-8 px-4 sm:px-6 space-y-12 animate-fadeIn text-ink-primary"
      data-testid="home-learning-view"
    >
      {/* ── TOP HERO BANNER ──────────────────────────────────────────────── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-white/90 via-canvas-subtle/80 to-canvas-surfaceStrong/40 border border-sif-border p-6 sm:p-10 shadow-glass-card overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 backdrop-blur-md">
        {/* Luminous atmospheric background glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-sif-accent/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-sif-primary/15 blur-3xl pointer-events-none" />

        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/90 text-sif-primaryDeep border border-sif-border shadow-2xs">
              Conversational Practice Studio
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight text-ink-primary leading-tight">
            Find more room to say what you mean.
          </h1>

          <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
            Practice workplace boundaries, difficult check-ins, and casual social moments with realistic conversational partner Sophia. Zero judgment, non-destructive retries.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                playCozySound('tap');
                const starter = TOPICS.find((t) => t.id === 'everyday-smalltalk') || TOPICS[0];
                onSelectScenario(starter);
              }}
              className="px-5 py-2.5 rounded-xl bg-sif-primary text-white text-xs font-semibold hover:bg-sif-primaryHover transition shadow-glass-card hover:shadow-glass-elevated flex items-center gap-2"
            >
              <span>Quick Starter Scenario</span>
              <span>→</span>
            </button>

            <button
              onClick={() => {
                playCozySound('tap');
                onCreateCustomScenario();
              }}
              className="px-4 py-2.5 rounded-xl bg-white/80 border border-canvas-border hover:bg-white text-ink-primary text-xs font-medium transition shadow-2xs hover:border-sif-primary/40"
            >
              + Create Custom Scenario
            </button>
          </div>
        </div>

        {/* Right Feature Card */}
        <div className="w-full md:w-72 p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-sif-border shadow-glass-card text-xs space-y-3 shrink-0 relative z-10">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-ink-primary">Current Coaching Focus</span>
            <span className="text-sif-primary font-bold text-sm">✦</span>
          </div>
          <p className="text-ink-secondary leading-relaxed">
            "Acknowledge the other person’s tone or context before asserting your preference."
          </p>
          <div className="pt-2 border-t border-canvas-borderSubtle flex items-center justify-between text-[11px] text-ink-muted">
            <span>Repeatable habit</span>
            <button
              onClick={() => {
                playCozySound('pop');
                onOpenTutorial();
              }}
              className="text-sif-primary font-semibold hover:underline"
            >
              Learn why →
            </button>
          </div>
        </div>
      </div>

      {/* ── RAIL 1: CONTINUE WHERE YOU LEFT OFF (IF ANY) ──────────────────── */}
      {inProgressScenarios.length > 0 && (
        <ScenarioRail
          title="Continue Where You Left Off"
          subtitle="Pick up active simulations and review what you practiced."
          icon="⏳"
          scenarios={inProgressScenarios}
          savedMap={savedMap}
          progressMap={progressMap}
          onSelectScenario={onSelectScenario}
          onToggleSave={onToggleSave}
        />
      )}

      {/* ── RAIL 2: RECOMMENDED NEXT PRACTICE ─────────────────────────────── */}
      <ScenarioRail
        title="Recommended Next Practice"
        subtitle="Tailored to your selected conversational comfort areas."
        icon="⭐"
        scenarios={recommendedScenarios}
        savedMap={savedMap}
        progressMap={progressMap}
        onSelectScenario={onSelectScenario}
        onToggleSave={onToggleSave}
      />

      {/* ── RAIL 3: WORKPLACE & SCHOOL CHECK-INS ─────────────────────────── */}
      <ScenarioRail
        title="Workplace & School Check-Ins"
        subtitle="Managing expectations, asking for written confirmation, and declining overload."
        icon="💼"
        scenarios={workplaceScenarios}
        savedMap={savedMap}
        progressMap={progressMap}
        onSelectScenario={onSelectScenario}
        onToggleSave={onToggleSave}
      />

      {/* ── RAIL 4: FRIENDSHIPS & SOCIAL BIDS ─────────────────────────────── */}
      <ScenarioRail
        title="Friendships & Sensory Comfort"
        subtitle="Suggesting quieter spots, following up with friends, and setting gentle limits."
        icon="☕"
        scenarios={friendshipScenarios}
        savedMap={savedMap}
        progressMap={progressMap}
        onSelectScenario={onSelectScenario}
        onToggleSave={onToggleSave}
      />

      {/* ── RAIL 5: SETTING BOUNDARIES & SAYING NO ────────────────────────── */}
      <ScenarioRail
        title="Setting Boundaries & Difficult Chats"
        subtitle="Saying no without over-explaining, asserting capacity, and protecting energy."
        icon="🛡️"
        scenarios={boundaryScenarios}
        savedMap={savedMap}
        progressMap={progressMap}
        onSelectScenario={onSelectScenario}
        onToggleSave={onToggleSave}
      />

      {/* ── RAIL 6: EVERYDAY CONVERSATIONS ────────────────────────────────── */}
      <ScenarioRail
        title="Everyday & Casual Conversations"
        subtitle="Light low-pressure check-ins, balanced turn-taking, and closing naturally."
        icon="💬"
        scenarios={everydayScenarios}
        savedMap={savedMap}
        progressMap={progressMap}
        onSelectScenario={onSelectScenario}
        onToggleSave={onToggleSave}
      />

      {/* ── RAIL 7: APPOINTMENTS & NEW PEOPLE ─────────────────────────────── */}
      {meetingScenarios.length > 0 && (
        <ScenarioRail
          title="Appointments & Meeting People"
          subtitle="Explaining delays, introducing yourself, and clarifying logistics."
          icon="🤝"
          scenarios={meetingScenarios}
          savedMap={savedMap}
          progressMap={progressMap}
          onSelectScenario={onSelectScenario}
          onToggleSave={onToggleSave}
        />
      )}

      {/* ── CUSTOM SCENARIO INVITATION BANNER ─────────────────────────────── */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-white/90 via-canvas-surfaceStrong/30 to-white/80 border border-sif-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-glass-card backdrop-blur-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-sif-accent/15 blur-2xl pointer-events-none" />
        <div className="space-y-1 max-w-xl relative z-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-sif-primary">
            Tailor-Made Simulations
          </span>
          <h2 className="text-lg sm:text-xl font-semibold text-ink-primary">
            Have a specific real-world conversation coming up?
          </h2>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Paste a situation description or upload notes (.txt, .md, .json) to generate an adaptive practice partner with customized boundaries, tone, and goals.
          </p>
        </div>

        <button
          onClick={() => {
            playCozySound('tap');
            onCreateCustomScenario();
          }}
          className="px-5 py-3 rounded-xl bg-sif-primary text-white text-xs font-semibold hover:bg-sif-primaryHover transition shadow-glass-card hover:shadow-glass-elevated shrink-0 flex items-center gap-2 relative z-10"
        >
          <span>+ Create a Scenario</span>
        </button>
      </div>
    </div>
  );
};
