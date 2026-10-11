'use client';

/**
 * PracticeView.tsx — Dedicated Interactive Practice Launcher
 *
 * Implements:
 * - Direct, clean scenario selection with immediate "Start Practice" CTA
 * - Partner profile & scenario context preview
 * - Recommended starter scenarios and quick filter by category
 * - High-contrast, non-glass opaque card architecture
 * - Seamless transition to Layer 1/2 Detail or Layer 3 Live Call
 */

import React, { useState } from 'react';
import { TOPICS, type ScenarioDefinition, type TopicProgressStatus } from '../../domain/scenarios/topics';
import { playCozySound } from '../utils/cozyAudio';

interface PracticeViewProps {
  progressMap: Record<string, TopicProgressStatus>;
  savedScenarioIds: string[];
  customScenarios?: ScenarioDefinition[];
  onSelectScenarioForDetail: (scenario: ScenarioDefinition) => void;
  onLaunchPractice: (scenario: ScenarioDefinition) => void;
  onToggleSave: (scenarioId: string) => void;
  onCreateCustomScenario: () => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  progressMap,
  savedScenarioIds,
  customScenarios = [],
  onSelectScenarioForDetail,
  onLaunchPractice,
  onToggleSave,
  onCreateCustomScenario,
}) => {
  const allScenarios = React.useMemo(() => {
    return [...customScenarios, ...TOPICS];
  }, [customScenarios]);

  // Selected scenario in the preview pane (default to first active or popular)
  const [selectedId, setSelectedId] = useState<string>(allScenarios[0]?.id || 'everyday-smalltalk');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const selectedScenario = React.useMemo(() => {
    return allScenarios.find((s) => s.id === selectedId) || allScenarios[0];
  }, [allScenarios, selectedId]);

  const filteredScenarios = React.useMemo(() => {
    if (categoryFilter === 'all') return allScenarios;
    return allScenarios.filter((s) => s.category === categoryFilter);
  }, [allScenarios, categoryFilter]);

  const categories = [
    { id: 'all', label: 'All Scenarios' },
    { id: 'work-school', label: 'Work & School' },
    { id: 'friendships', label: 'Friendships' },
    { id: 'boundaries', label: 'Boundaries' },
    { id: 'everyday', label: 'Everyday' },
    { id: 'meeting-people', label: 'New People' },
  ];

  if (!selectedScenario) return null;

  const isSaved = savedScenarioIds.includes(selectedScenario.id);
  const progressStatus = progressMap[selectedScenario.id] || 'not-started';

  return (
    <div
      className="max-w-6xl mx-auto w-full py-8 px-4 sm:px-6 space-y-8 animate-page-enter text-ink-primary"
      data-testid="practice-view"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-pill text-xs font-semibold uppercase tracking-wider bg-sif-primarySubtle text-sif-primaryDeep border border-sif-border">
            Interactive Studio
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-ink-primary mt-2">
          Practice Studio
        </h1>
        <p className="text-sm text-ink-secondary mt-1 max-w-2xl">
          Choose a conversation to practice with Sophia in an immersive, low-stakes simulation. Non-destructive retries, explicit subtext translation, and zero judgment.
        </p>
      </div>

      {/* Main Two-Column Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Quick Selector List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  playCozySound('tap');
                  setCategoryFilter(cat.id);
                }}
                className={`px-3 py-1.5 rounded-pill text-xs font-medium transition ${
                  categoryFilter === cat.id
                    ? 'bg-sif-primary text-white font-semibold shadow-xs'
                    : 'bg-canvas-surface border border-canvas-border text-ink-secondary hover:text-ink-primary hover:border-sif-border'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Scenario List */}
          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredScenarios.map((scenario) => {
              const isCurrent = scenario.id === selectedId;
              const status = progressMap[scenario.id];

              return (
                <div
                  key={scenario.id}
                  onClick={() => {
                    playCozySound('tap');
                    setSelectedId(scenario.id);
                  }}
                  className={`p-4 rounded-card border cursor-pointer select-none transition-all text-left ${
                    isCurrent
                      ? 'bg-canvas-surface border-sif-primary shadow-card-hover ring-2 ring-sif-primary/20'
                      : 'bg-canvas-surface border-canvas-border hover:border-sif-border shadow-card hover:shadow-card-hover'
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-sif-primary">
                      {scenario.categoryLabel}
                    </span>
                    <span className="text-[11px] text-ink-muted">~{scenario.estimatedMinutes} min</span>
                  </div>

                  <h3 className="font-semibold text-ink-primary text-sm leading-snug">
                    {scenario.title}
                  </h3>
                  <p className="text-xs text-ink-secondary line-clamp-1 mt-1">
                    {scenario.subtitle}
                  </p>

                  <div className="pt-2 mt-2 border-t border-canvas-borderSubtle flex items-center justify-between text-[11px]">
                    <span className="text-ink-muted">Partner: {scenario.partner.name}</span>
                    {status === 'practiced' ? (
                      <span className="text-emerald-700 font-medium">✓ Practiced</span>
                    ) : status === 'in-progress' ? (
                      <span className="text-sif-primary font-medium">● In Progress</span>
                    ) : (
                      <span className="text-ink-muted">Ready</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              playCozySound('tap');
              onCreateCustomScenario();
            }}
            className="w-full py-3 rounded-card border border-dashed border-canvas-border hover:border-sif-primary text-xs font-semibold text-ink-secondary hover:text-sif-primary bg-canvas-subtle hover:bg-canvas-surface transition text-center"
          >
            + Create a Custom Practice Scenario
          </button>
        </div>

        {/* Right Column: Prominent Practice Action Hero Card (7 Cols) */}
        <div className="lg:col-span-7 bg-canvas-surface border border-canvas-border rounded-card-lg p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-canvas-border">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-pill text-xs font-semibold uppercase tracking-wider bg-sif-primarySubtle text-sif-primaryDeep border border-sif-border">
                {selectedScenario.categoryLabel}
              </span>
              <span className="text-xs text-ink-muted">~{selectedScenario.estimatedMinutes} minutes</span>
            </div>

            <button
              onClick={() => {
                playCozySound('toggle');
                onToggleSave(selectedScenario.id);
              }}
              className={`p-2 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 ${
                isSaved
                  ? 'bg-sif-primarySubtle text-sif-primary border-sif-border font-semibold'
                  : 'bg-canvas-surface border-canvas-border text-ink-secondary hover:text-ink-primary'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save for later'}
            >
              <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          {/* Scenario Details */}
          <div>
            <h2 className="text-2xl font-display font-semibold text-ink-primary">
              {selectedScenario.title}
            </h2>
            <p className="text-sm text-ink-secondary mt-1.5 leading-relaxed">
              {selectedScenario.subtitle}
            </p>
          </div>

          {/* Partner Preview Well */}
          <div className="p-4 rounded-card bg-canvas-subtle border border-canvas-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-primary">Conversational Partner: {selectedScenario.partner.name}</span>
              <span className="px-2 py-0.5 rounded-pill bg-white text-ink-secondary border border-canvas-border text-[11px] font-medium">
                {selectedScenario.partner.role}
              </span>
            </div>
            <p className="text-xs text-ink-secondary italic">
              Opening line: "{selectedScenario.partner.initialDialogue}"
            </p>
          </div>

          {/* Goal Callout */}
          <div className="p-4 rounded-card bg-sif-primarySubtle/60 border border-sif-border flex items-start gap-3 text-xs sm:text-sm">
            <span className="text-sif-primary text-base font-bold shrink-0">🎯</span>
            <div>
              <span className="font-semibold text-ink-primary block mb-0.5">Your Goal:</span>
              <p className="text-ink-secondary leading-relaxed">{selectedScenario.userGoal}</p>
            </div>
          </div>

          {/* Core Dynamic Insight */}
          <div className="space-y-1.5 text-xs">
            <span className="font-semibold text-ink-primary uppercase tracking-wider text-[11px]">
              The Core Social Dynamic
            </span>
            <p className="text-ink-secondary leading-relaxed">
              {selectedScenario.learning.coreInsight}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-4 border-t border-canvas-border flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => {
                playCozySound('pop');
                onLaunchPractice(selectedScenario);
              }}
              className="flex-1 py-3 px-6 rounded-pill bg-sif-primary hover:bg-sif-primaryHover text-white text-sm font-semibold transition shadow-card hover:shadow-card-hover flex items-center justify-center gap-2"
            >
              <span>Start Live Practice Call</span>
              <span>→</span>
            </button>

            <button
              onClick={() => {
                playCozySound('tap');
                onSelectScenarioForDetail(selectedScenario);
              }}
              className="py-3 px-5 rounded-pill bg-canvas-surface hover:bg-canvas-subtle border border-canvas-border text-ink-primary text-xs font-semibold transition text-center"
            >
              Preparation Advice & Insights
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
