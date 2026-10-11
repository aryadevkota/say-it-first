'use client';

/**
 * FavoritesView.tsx — Bookmarked Scenarios Library
 *
 * Implements:
 * - Simple, clean personal library of bookmarked scenarios
 * - Quick practice launch
 * - 1-click unbookmarking
 * - Opaque rounded-card surfaces & accessible empty state
 */

import React from 'react';
import type { ScenarioDefinition, TopicProgressStatus } from '../../domain/scenarios/topics';
import { ScenarioCard } from './ScenarioCard';
import { playCozySound } from '../utils/cozyAudio';

interface FavoritesViewProps {
  savedScenarios: ScenarioDefinition[];
  progressMap?: Record<string, TopicProgressStatus>;
  onSelectScenario: (scenario: ScenarioDefinition) => void;
  onToggleSave: (scenarioId: string) => void;
  onBrowseMore: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  savedScenarios,
  progressMap = {},
  onSelectScenario,
  onToggleSave,
  onBrowseMore,
}) => {
  return (
    <div
      className="max-w-6xl mx-auto w-full py-8 px-4 sm:px-6 space-y-8 animate-page-enter text-ink-primary"
      data-testid="favorites-view"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-pill text-xs font-semibold uppercase tracking-wider bg-sif-primarySubtle text-sif-primaryDeep border border-sif-border">
              Personal Library
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-ink-primary mt-2">
            Favorites & Saved Scenarios
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Bookmarked conversations you want to revisit, practice again, or keep top of mind.
          </p>
        </div>

        <button
          onClick={() => {
            playCozySound('tap');
            onBrowseMore();
          }}
          className="px-4 py-2 rounded-pill bg-canvas-surface border border-canvas-border hover:bg-canvas-subtle text-ink-primary text-xs font-semibold transition shadow-xs"
        >
          Browse All Scenarios →
        </button>
      </div>

      {/* Grid of Saved Scenario Cards */}
      {savedScenarios.length === 0 ? (
        <div className="p-10 sm:p-14 rounded-card-lg bg-canvas-surface border border-canvas-border shadow-card text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-sif-primarySubtle text-sif-primary border border-sif-border flex items-center justify-center mx-auto shadow-2xs">
            <svg className="w-6 h-6 text-sif-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink-primary">No saved scenarios yet</h2>
            <p className="text-xs text-ink-muted max-w-md mx-auto mt-1 leading-relaxed">
              When browsing scenarios on Home or Scenarios, click the bookmark icon on any card to save it here for quick access.
            </p>
          </div>
          <button
            onClick={() => {
              playCozySound('tap');
              onBrowseMore();
            }}
            className="px-5 py-2.5 rounded-pill bg-sif-primary text-white text-xs font-semibold hover:bg-sif-primaryHover transition shadow-card"
          >
            Explore Scenarios
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {savedScenarios.map((scenario) => (
            <div key={scenario.id} className="w-full">
              <ScenarioCard
                scenario={scenario}
                isSaved={true}
                progress={progressMap[scenario.id] || 'not-started'}
                onSelect={onSelectScenario}
                onToggleSave={onToggleSave}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
