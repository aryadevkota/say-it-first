'use client';

/**
 * FavoritesView.tsx — Bookmarked Scenarios Library
 *
 * Implements:
 * - Simple, clean personal library of bookmarked scenarios
 * - Quick practice launch
 * - 1-click unbookmarking
 * - Empty state with gentle discovery CTA
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
      className="max-w-5xl mx-auto w-full py-8 px-4 sm:px-6 space-y-8 animate-fadeIn text-ink-primary"
      data-testid="favorites-view"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-sif-primarySubtle text-sif-primary border border-sif-border shadow-2xs">
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
          className="px-4 py-2 rounded-xl bg-white/80 border border-canvas-border hover:bg-white text-ink-primary text-xs font-medium transition shadow-2xs"
        >
          Browse All Scenarios →
        </button>
      </div>

      {/* Grid of Saved Scenario Cards */}
      {savedScenarios.length === 0 ? (
        <div className="p-10 sm:p-14 rounded-3xl bg-white/80 backdrop-blur-md border border-canvas-border shadow-glass-card text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-sif-primarySubtle text-sif-primary border border-sif-border flex items-center justify-center mx-auto text-2xl shadow-glass-card">
            ★
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink-primary">No saved scenarios yet</h2>
            <p className="text-xs text-ink-muted max-w-md mx-auto mt-1 leading-relaxed">
              When browsing scenarios on Home, click the bookmark icon on any card to save it here for quick access.
            </p>
          </div>
          <button
            onClick={() => {
              playCozySound('tap');
              onBrowseMore();
            }}
            className="px-5 py-2.5 rounded-xl bg-sif-primary text-white text-xs font-semibold hover:bg-sif-primaryHover transition shadow-glass-card"
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
