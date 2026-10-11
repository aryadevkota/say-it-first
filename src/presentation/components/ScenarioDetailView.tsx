'use client';

/**
 * ScenarioDetailView.tsx — 3-Layer Scenario Experience Gateway
 *
 * Implements:
 * Layer 1: Scenario Overview
 *   - Plain language scenario explanation
 *   - Social context & partner role
 *   - Targeted skills and tone/difficulty tags
 *   - Save / favorite bookmarking toggle
 *   - Clear CTA to continue to preparation
 *
 * Layer 2: Preparation / Coaching Advice
 *   - "Before you begin" guidance
 *   - What the other person may be looking for
 *   - What to listen for
 *   - What a strong response might include
 *   - What to avoid overthinking
 *   - "Start Live Practice" CTA transitions to Layer 3
 *
 * Layer 3 is the live practice stage in PracticeStage.tsx (enlarged & centered).
 */

import React, { useState } from 'react';
import type { ScenarioDefinition } from '../../domain/scenarios/topics';
import { playCozySound } from '../utils/cozyAudio';

interface ScenarioDetailViewProps {
  scenario: ScenarioDefinition;
  isSaved?: boolean;
  onBack: () => void;
  onToggleSave?: (scenarioId: string) => void;
  onLaunchLivePractice: (scenario: ScenarioDefinition) => void;
}

export const ScenarioDetailView: React.FC<ScenarioDetailViewProps> = ({
  scenario,
  isSaved = false,
  onBack,
  onToggleSave,
  onLaunchLivePractice,
}) => {
  const [currentLayer, setCurrentLayer] = useState<'overview' | 'preparation'>('overview');

  const handleStartPractice = () => {
    playCozySound('pop');
    onLaunchLivePractice(scenario);
  };

  return (
    <div
      className="max-w-4xl mx-auto w-full py-6 sm:py-10 px-4 sm:px-6 space-y-8 animate-fadeIn text-ink-primary"
      data-testid="scenario-detail-view"
    >
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between gap-4 border-b border-canvas-border pb-4">
        <button
          onClick={() => {
            playCozySound('tap');
            onBack();
          }}
          className="text-xs font-medium text-ink-muted hover:text-ink-primary px-3 py-1.5 rounded-xl hover:bg-canvas-subtle transition flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          {onToggleSave && (
            <button
              onClick={() => {
                playCozySound('toggle');
                onToggleSave(scenario.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
                isSaved
                  ? 'bg-teal-subtle text-teal-brand border-teal-border font-semibold'
                  : 'bg-canvas-surface border-canvas-border text-ink-secondary hover:bg-canvas-subtle'
              }`}
            >
              <span>{isSaved ? '★ Saved to Favorites' : '☆ Save Scenario'}</span>
            </button>
          )}

          {/* Stepper indicator between Layer 1 & 2 */}
          <div className="flex items-center gap-1 bg-canvas-subtle p-1 rounded-xl border border-canvas-borderSubtle text-xs">
            <button
              onClick={() => setCurrentLayer('overview')}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                currentLayer === 'overview'
                  ? 'bg-canvas-surface text-ink-primary shadow-2xs font-semibold'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              1. Overview
            </button>
            <button
              onClick={() => setCurrentLayer('preparation')}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                currentLayer === 'preparation'
                  ? 'bg-canvas-surface text-ink-primary shadow-2xs font-semibold'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              2. Preparation Advice
            </button>
          </div>
        </div>
      </div>

      {/* ── LAYER 1: SCENARIO OVERVIEW ─────────────────────────────────────── */}
      {currentLayer === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Main Title & Hero Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-canvas-surface via-canvas-subtle/40 to-canvas-light border border-canvas-border shadow-xs space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-teal-subtle text-teal-brand border border-teal-border">
                {scenario.categoryLabel}
              </span>
              <span className="text-canvas-border">•</span>
              <span className="text-xs text-ink-muted">~{scenario.estimatedMinutes} min practice</span>
              <span className="text-canvas-border">•</span>
              <span className="text-xs text-ink-secondary">Partner: {scenario.partner.name} ({scenario.partner.role})</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-ink-primary leading-tight">
              {scenario.title}
            </h1>

            <p className="text-base sm:text-lg text-ink-secondary leading-relaxed">
              {scenario.subtitle}
            </p>

            {/* Goal pill */}
            <div className="p-4 rounded-2xl bg-canvas-surface border border-canvas-border flex items-start gap-3 text-xs sm:text-sm">
              <span className="text-teal-brand font-bold text-base shrink-0">🎯</span>
              <div>
                <span className="font-semibold text-ink-primary block mb-0.5">Your Scenario Goal:</span>
                <p className="text-ink-secondary leading-relaxed">{scenario.userGoal}</p>
              </div>
            </div>
          </div>

          {/* Core Idea & Double Empathy Perspectives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Core Insight */}
            <div className="p-6 rounded-3xl bg-canvas-surface border border-canvas-border space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-brand block">
                The Core Social Dynamic
              </span>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                {scenario.learning.coreInsight}
              </p>
            </div>

            {/* Two-Way Perspectives */}
            <div className="p-6 rounded-3xl bg-canvas-surface border border-canvas-border space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted block">
                Double Empathy Perspectives
              </span>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-canvas-subtle">
                  <span className="font-semibold text-teal-brand block mb-0.5">Your Need:</span>
                  <p className="text-ink-secondary">{scenario.learning.doubleEmpathyPerspective.yourNeed}</p>
                </div>
                <div className="p-3 rounded-xl bg-canvas-subtle">
                  <span className="font-semibold text-topic-apricot block mb-0.5">Their Perspective:</span>
                  <p className="text-ink-secondary">{scenario.learning.doubleEmpathyPerspective.theirPerspective}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action to proceed to Layer 2 */}
          <div className="p-6 rounded-3xl bg-teal-subtle/40 border border-teal-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase text-teal-brand block mb-0.5">Ready for advice?</span>
              <h2 className="text-base font-semibold text-ink-primary">
                Review preparation coaching before stepping into the call
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentLayer('preparation')}
                className="px-5 py-2.5 rounded-xl bg-teal-brand text-canvas-surface text-xs font-semibold hover:bg-teal-hover transition shadow-2xs"
              >
                Continue to Preparation Advice →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LAYER 2: SCENARIO PREPARATION / ADVICE ─────────────────────────── */}
      {currentLayer === 'preparation' && (
        <div className="space-y-8 animate-fadeIn">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-brand block mb-1">
              Layer 2 • Preparation Guidance
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-ink-primary">
              Before You Begin Practicing
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary mt-1">
              Keep these grounded perspectives in mind. There is no single "perfect" reply—only choices that support clarity and comfort.
            </p>
          </div>

          {/* 4 Advice Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-canvas-surface border border-canvas-border space-y-2">
              <span className="text-base">👂</span>
              <h3 className="font-semibold text-ink-primary text-sm">What to Listen For</h3>
              <p className="text-ink-secondary leading-relaxed">
                Listen for the partner's opening tone. Notice whether they seem hurried, warm, enthusiastic, or seeking quick reassurance.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-canvas-surface border border-canvas-border space-y-2">
              <span className="text-base">💬</span>
              <h3 className="font-semibold text-ink-primary text-sm">What a Strong Response Might Include</h3>
              <p className="text-ink-secondary leading-relaxed">
                A brief acknowledgment of what they said, followed by your preference or question in plain, unhurried words.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-canvas-surface border border-canvas-border space-y-2">
              <span className="text-base">🌿</span>
              <h3 className="font-semibold text-ink-primary text-sm">What to Avoid Overthinking</h3>
              <p className="text-ink-secondary leading-relaxed">
                Do not worry about awkward pauses or needing a moment to think. Pauses are completely natural in thoughtful communication.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-canvas-surface border border-canvas-border space-y-2">
              <span className="text-base">🔄</span>
              <h3 className="font-semibold text-ink-primary text-sm">Non-Destructive Retries</h3>
              <p className="text-ink-secondary leading-relaxed">
                You can try "Version 2" or "Version 3" anytime inside the stage without losing your previous answers or receiving a score.
              </p>
            </div>
          </div>

          {/* Example Phrasings */}
          <div className="p-6 rounded-3xl bg-canvas-surface border border-canvas-border space-y-3">
            <span className="text-xs font-semibold uppercase text-ink-muted block">
              Helpful Phrasing Approaches
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-canvas-subtle">
                <span className="font-semibold text-teal-brand block mb-1">A Gentle Option:</span>
                <p className="text-ink-primary italic">"{scenario.learning.examplePhrases.gentle}"</p>
              </div>
              <div className="p-3.5 rounded-xl bg-canvas-subtle">
                <span className="font-semibold text-topic-apricot block mb-1">A More Direct Option:</span>
                <p className="text-ink-primary italic">"{scenario.learning.examplePhrases.direct}"</p>
              </div>
            </div>
          </div>

          {/* Launch Practice CTA (Layer 3 Transition) */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-brand to-[#15565A] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <span className="text-xs font-semibold uppercase text-teal-subtle block mb-0.5">
                Layer 3 • Live Simulation
              </span>
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Ready to practice with {scenario.partner.name}?
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                The conversation partner will be centered and spacious on screen.
              </p>
            </div>

            <button
              onClick={handleStartPractice}
              className="px-6 py-3 rounded-2xl bg-canvas-surface text-teal-brand text-xs font-bold hover:bg-canvas-light transition shadow-md shrink-0 flex items-center gap-2"
              data-testid="launch-practice-btn"
            >
              <span>Start Live Practice Call</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
