'use client';

/**
 * HomeView.tsx — Structured Media-Style Learning Discovery Home
 *
 * Implements the 4 distinct modular sections:
 * 1. "Resume Practice" Active Banner (if user has active/in-progress scenario)
 * 2. "Suggested Next Scenario" High-Value Spotlight
 * 3. "Latest Report Summary" Quick-glance coaching feedback card
 * 4. "Progress Snapshot" & Categorized Rails
 *
 * Design:
 * - Opaque canvas cards with crisp borders and deep indigo typography
 * - Zero washed-out blur, low contrast overlays, or generic SaaS beige/teal
 * - Single unmistakable primary CTA per view
 */

import React from 'react';
import { TOPICS, type ScenarioDefinition, type TopicProgressStatus } from '../../domain/scenarios/topics';
import { ScenarioRail } from './ScenarioRail';
import type { UserPreferences } from './WelcomeOnboarding';
import type { SessionReport } from '../../domain/entities/SessionReport';
import { playCozySound } from '../utils/cozyAudio';

interface HomeViewProps {
  preferences: UserPreferences;
  progressMap: Record<string, TopicProgressStatus>;
  savedScenarioIds: string[];
  activeTopicId?: string;
  customScenarios?: ScenarioDefinition[];
  latestReport?: SessionReport | null;
  onSelectScenario: (scenario: ScenarioDefinition) => void;
  onLaunchPracticeDirect?: (scenario: ScenarioDefinition) => void;
  onToggleSave: (scenarioId: string) => void;
  onCreateCustomScenario: () => void;
  onOpenTutorial: () => void;
  onNavigateTab: (tab: 'practice' | 'scenarios' | 'reports' | 'progress') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  preferences,
  progressMap,
  savedScenarioIds,
  activeTopicId,
  customScenarios = [],
  latestReport,
  onSelectScenario,
  onLaunchPracticeDirect,
  onToggleSave,
  onCreateCustomScenario,
  onOpenTutorial,
  onNavigateTab,
}) => {
  const savedMap = React.useMemo(() => {
    const map: Record<string, boolean> = {};
    savedScenarioIds.forEach((id) => (map[id] = true));
    return map;
  }, [savedScenarioIds]);

  const allScenarios = React.useMemo(() => {
    return [...customScenarios, ...TOPICS];
  }, [customScenarios]);

  // Active / In-progress scenario for "Resume Practice" row
  const activeScenario = React.useMemo(() => {
    if (activeTopicId) {
      return allScenarios.find((s) => s.id === activeTopicId);
    }
    return allScenarios.find((s) => progressMap[s.id] === 'in-progress');
  }, [allScenarios, activeTopicId, progressMap]);

  // Suggested next scenario
  const suggestedNextScenario = React.useMemo(() => {
    const unpracticed = allScenarios.filter((s) => progressMap[s.id] !== 'practiced');
    if (unpracticed.length > 0) return unpracticed[0];
    return allScenarios[0];
  }, [allScenarios, progressMap]);

  // Categorized scenario subsets for horizontal rails
  const workplaceScenarios = allScenarios.filter((s) => s.category === 'work-school');
  const friendshipScenarios = allScenarios.filter((s) => s.category === 'friendships');
  const boundaryScenarios = allScenarios.filter((s) => s.category === 'boundaries');
  const everydayScenarios = allScenarios.filter((s) => s.category === 'everyday');

  // Stats calculation
  const exploredCount = Object.values(progressMap).filter(
    (s) => s === 'explored' || s === 'practiced' || s === 'revisited',
  ).length;
  const practicedCount = Object.values(progressMap).filter(
    (s) => s === 'practiced' || s === 'revisited',
  ).length;

  return (
    <div
      className="max-w-6xl mx-auto w-full py-6 sm:py-8 px-4 sm:px-6 space-y-10 animate-page-enter text-ink-primary"
      data-testid="home-learning-view"
    >
      {/* ── ROW 1: RESUME PRACTICE OR HERO SPOTLIGHT ───────────────────────── */}
      {activeScenario ? (
        /* Resume Practice Card */
        <div className="bg-canvas-surface border-2 border-sif-primary/40 rounded-card-lg p-6 sm:p-8 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sif-primary animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-sif-primary">
                Resume In-Progress Practice
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-ink-primary">
              {activeScenario.title}
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              {activeScenario.subtitle}
            </p>
            <div className="text-xs text-ink-muted flex items-center gap-3 pt-1">
              <span>Partner: {activeScenario.partner.name}</span>
              <span>•</span>
              <span>~{activeScenario.estimatedMinutes} min</span>
              <span>•</span>
              <span className="text-sif-primary font-medium">Session in progress</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                playCozySound('pop');
                if (onLaunchPracticeDirect) {
                  onLaunchPracticeDirect(activeScenario);
                } else {
                  onSelectScenario(activeScenario);
                }
              }}
              className="py-3 px-6 rounded-pill bg-sif-primary hover:bg-sif-primaryHover text-white text-xs font-semibold transition shadow-card flex items-center gap-2"
            >
              <span>Resume Live Call</span>
              <span>→</span>
            </button>
            <button
              onClick={() => {
                playCozySound('tap');
                onSelectScenario(activeScenario);
              }}
              className="py-3 px-4 rounded-pill bg-canvas-surface hover:bg-canvas-subtle border border-canvas-border text-ink-primary text-xs font-semibold transition"
            >
              View Preparation
            </button>
          </div>
        </div>
      ) : (
        /* Hero Platform Welcome Banner */
        <div className="bg-canvas-surface border border-canvas-border rounded-card-lg p-6 sm:p-8 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-pill text-xs font-semibold uppercase tracking-wider bg-sif-primarySubtle text-sif-primaryDeep border border-sif-border">
                Conversational Practice Platform
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight text-ink-primary leading-tight">
              Find more room to say what you mean.
            </h1>

            <p className="text-sm text-ink-secondary leading-relaxed">
              Practice workplace boundaries, difficult check-ins, and casual social moments with realistic conversational partner Sophia. Zero judgment, non-destructive retries.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  playCozySound('tap');
                  onNavigateTab('practice');
                }}
                className="px-5 py-2.5 rounded-pill bg-sif-primary text-white text-xs font-semibold hover:bg-sif-primaryHover transition shadow-card flex items-center gap-2"
              >
                <span>Launch Practice Studio</span>
                <span>→</span>
              </button>

              <button
                onClick={() => {
                  playCozySound('tap');
                  onCreateCustomScenario();
                }}
                className="px-4 py-2.5 rounded-pill bg-canvas-surface border border-canvas-border hover:bg-canvas-subtle text-ink-primary text-xs font-semibold transition shadow-xs"
              >
                + Create Custom Scenario
              </button>
            </div>
          </div>

          {/* Right Habit Card */}
          <div className="w-full md:w-72 p-5 rounded-card bg-canvas-subtle border border-canvas-border shadow-xs text-xs space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink-primary">Coaching Habit of the Day</span>
              <span className="w-2 h-2 rounded-full bg-sif-primary" />
            </div>
            <p className="text-ink-secondary leading-relaxed">
              "Acknowledge the other person’s tone or context before asserting your boundary."
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
      )}

      {/* ── ROW 2: SUGGESTED NEXT SCENARIO & LATEST REPORT CARDS ───────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Suggested Next Scenario */}
        {suggestedNextScenario && (
          <div className="bg-canvas-surface border border-canvas-border rounded-card p-6 shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-sif-primary">
                  Suggested Next Practice
                </span>
                <span className="text-xs text-ink-muted">~{suggestedNextScenario.estimatedMinutes} min</span>
              </div>
              <h3 className="text-lg font-semibold text-ink-primary">
                {suggestedNextScenario.title}
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                {suggestedNextScenario.subtitle}
              </p>
              <div className="p-3 rounded-card bg-canvas-subtle text-xs text-ink-secondary border border-canvas-borderSubtle">
                <span className="font-semibold text-ink-primary">Goal: </span>
                {suggestedNextScenario.userGoal}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-ink-muted">Partner: {suggestedNextScenario.partner.name}</span>
              <button
                onClick={() => {
                  playCozySound('tap');
                  onSelectScenario(suggestedNextScenario);
                }}
                className="px-4 py-2 rounded-pill bg-sif-primary hover:bg-sif-primaryHover text-white text-xs font-semibold transition"
              >
                Practice This →
              </button>
            </div>
          </div>
        )}

        {/* Latest Report Snapshot Card */}
        {latestReport ? (
          <div className="bg-canvas-surface border border-canvas-border rounded-card p-6 shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-pill border border-emerald-200">
                  Latest Coaching Report
                </span>
                <span className="text-xs text-ink-muted">
                  {new Date(latestReport.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-ink-primary">
                {latestReport.snapshot.scenarioTitle}
              </h3>
              <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                {latestReport.snapshot.plainLanguageSummary}
              </p>
              <div className="text-xs text-ink-secondary">
                <span className="font-semibold text-ink-primary">Observed strength: </span>
                <span>{latestReport.whatYouDidWell[0] || 'Clear, respectful phrasing.'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-ink-muted">Tone: {latestReport.snapshot.overallToneSummary}</span>
              <button
                onClick={() => {
                  playCozySound('tap');
                  onNavigateTab('reports');
                }}
                className="px-4 py-2 rounded-pill bg-canvas-surface hover:bg-canvas-subtle border border-canvas-border text-ink-primary text-xs font-semibold transition"
              >
                Read Full Report →
              </button>
            </div>
          </div>
        ) : (
          /* Progress Snapshot if no report yet */
          <div className="bg-canvas-surface border border-canvas-border rounded-card p-6 shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-sif-primary">
                  Learning Snapshot
                </span>
                <span className="text-xs text-ink-muted">{allScenarios.length} scenarios total</span>
              </div>
              <h3 className="text-lg font-semibold text-ink-primary">
                Your Practice Milestones
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Complete structured scenarios with partner Sophia to generate behavioral feedback, communication habits, and personalized pocket scripts.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-card bg-canvas-subtle border border-canvas-borderSubtle">
                  <span className="text-lg font-semibold text-ink-primary">{exploredCount}</span>
                  <span className="text-[11px] text-ink-muted block">Explored</span>
                </div>
                <div className="p-3 rounded-card bg-canvas-subtle border border-canvas-borderSubtle">
                  <span className="text-lg font-semibold text-sif-primary">{practicedCount}</span>
                  <span className="text-[11px] text-ink-muted block">Completed</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                playCozySound('tap');
                onNavigateTab('progress');
              }}
              className="w-full py-2 rounded-pill bg-canvas-surface hover:bg-canvas-subtle border border-canvas-border text-ink-primary text-xs font-semibold transition text-center"
            >
              View Progress Center →
            </button>
          </div>
        )}
      </div>

      {/* ── ROW 3: CATEGORIZED SCENARIO RAILS ──────────────────────────────── */}
      <div className="space-y-8">
        <ScenarioRail
          title="Workplace & School Check-Ins"
          subtitle="Managing expectations, asking for confirmation, and declining overload."
          icon="💼"
          scenarios={workplaceScenarios}
          savedMap={savedMap}
          progressMap={progressMap}
          onSelectScenario={onSelectScenario}
          onToggleSave={onToggleSave}
        />

        <ScenarioRail
          title="Friendships & Social Bids"
          subtitle="Suggesting alternative plans, following up with friends, and gentle honesty."
          icon="☕"
          scenarios={friendshipScenarios}
          savedMap={savedMap}
          progressMap={progressMap}
          onSelectScenario={onSelectScenario}
          onToggleSave={onToggleSave}
        />

        <ScenarioRail
          title="Setting Boundaries & Saying No"
          subtitle="Saying no without over-explaining, asserting capacity, and protecting energy."
          icon="🛡️"
          scenarios={boundaryScenarios}
          savedMap={savedMap}
          progressMap={progressMap}
          onSelectScenario={onSelectScenario}
          onToggleSave={onToggleSave}
        />

        <ScenarioRail
          title="Everyday & Casual Conversations"
          subtitle="Low-pressure check-ins, balanced turn-taking, and closing naturally."
          icon="💬"
          scenarios={everydayScenarios}
          savedMap={savedMap}
          progressMap={progressMap}
          onSelectScenario={onSelectScenario}
          onToggleSave={onToggleSave}
        />
      </div>

      {/* ── ROW 4: CUSTOM SCENARIO BUILDER CALLOUT ─────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-card-lg bg-canvas-surface border border-canvas-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-card">
        <div className="space-y-1 max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-sif-primary">
            Tailor-Made Simulations
          </span>
          <h2 className="text-lg sm:text-xl font-semibold text-ink-primary">
            Have a specific real-world conversation coming up?
          </h2>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Describe a situation or upload notes to generate an adaptive practice partner with customized boundaries, tone, and goals.
          </p>
        </div>

        <button
          onClick={() => {
            playCozySound('tap');
            onCreateCustomScenario();
          }}
          className="px-5 py-3 rounded-pill bg-sif-primary text-white text-xs font-semibold hover:bg-sif-primaryHover transition shadow-card shrink-0 flex items-center gap-2"
        >
          <span>+ Create a Scenario</span>
        </button>
      </div>
    </div>
  );
};
