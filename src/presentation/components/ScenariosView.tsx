'use client';

/**
 * ScenariosView.tsx — Comprehensive Scenario Directory
 *
 * Implements:
 * - Structured catalog layout (Workplace, Friendships, Boundaries, Everyday, Meeting People)
 * - Category filter chips with active counts
 * - Clean search / keyword filtering
 * - Opaque rounded-card grid with high contrast
 * - Direct practice trigger or detail overview
 */

import React, { useState, useMemo } from 'react';
import { TOPICS, type ScenarioDefinition, type TopicProgressStatus } from '../../domain/scenarios/topics';
import { ScenarioCard } from './ScenarioCard';
import { playCozySound } from '../utils/cozyAudio';

interface ScenariosViewProps {
  progressMap: Record<string, TopicProgressStatus>;
  savedScenarioIds: string[];
  customScenarios?: ScenarioDefinition[];
  onSelectScenario: (scenario: ScenarioDefinition) => void;
  onToggleSave: (scenarioId: string) => void;
  onCreateCustomScenario: () => void;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({
  progressMap,
  savedScenarioIds,
  customScenarios = [],
  onSelectScenario,
  onToggleSave,
  onCreateCustomScenario,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const savedMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    savedScenarioIds.forEach((id) => (map[id] = true));
    return map;
  }, [savedScenarioIds]);

  const allScenarios = useMemo(() => {
    return [...customScenarios, ...TOPICS];
  }, [customScenarios]);

  const categories = [
    { id: 'all', label: 'All Scenarios' },
    { id: 'work-school', label: 'Workplace & School' },
    { id: 'friendships', label: 'Friendships & Social' },
    { id: 'boundaries', label: 'Setting Boundaries' },
    { id: 'everyday', label: 'Everyday Conversations' },
    { id: 'meeting-people', label: 'Meeting People' },
  ];

  const filteredScenarios = useMemo(() => {
    return allScenarios.filter((scenario) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        scenario.category === selectedCategory ||
        (selectedCategory === 'meeting-people' && scenario.category === 'appointments');

      const matchesSearch =
        searchQuery.trim() === '' ||
        scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scenario.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scenario.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scenario.partner.name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [allScenarios, selectedCategory, searchQuery]);

  return (
    <div
      className="max-w-6xl mx-auto w-full py-8 px-4 sm:px-6 space-y-8 animate-page-enter text-ink-primary"
      data-testid="scenarios-catalog-view"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-pill text-xs font-semibold uppercase tracking-wider bg-sif-primarySubtle text-sif-primaryDeep border border-sif-border">
              Scenario Directory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-ink-primary mt-2">
            Explore All Scenarios
          </h1>
          <p className="text-sm text-ink-secondary mt-1 max-w-2xl">
            Browse structured conversational situations across workplace boundaries, personal friendships, and everyday social bids.
          </p>
        </div>

        <button
          onClick={() => {
            playCozySound('tap');
            onCreateCustomScenario();
          }}
          className="px-4 py-2.5 rounded-pill bg-canvas-surface hover:bg-canvas-subtle border border-canvas-border hover:border-sif-border text-ink-primary text-xs font-semibold transition shadow-xs shrink-0"
        >
          + Create Custom Scenario
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const count =
              cat.id === 'all'
                ? allScenarios.length
                : allScenarios.filter(
                    (s) => s.category === cat.id || (cat.id === 'meeting-people' && s.category === 'appointments'),
                  ).length;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  playCozySound('tap');
                  setSelectedCategory(cat.id);
                }}
                className={`px-3.5 py-1.5 rounded-pill text-xs font-medium transition flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-sif-primary text-white font-semibold shadow-xs'
                    : 'bg-canvas-surface border border-canvas-border text-ink-secondary hover:text-ink-primary hover:border-sif-border'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-canvas-subtle text-ink-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Search scenarios or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 pl-9 rounded-pill bg-canvas-surface border border-canvas-border text-xs text-ink-primary placeholder-ink-muted focus:outline-hidden focus:border-sif-primary focus:ring-1 focus:ring-sif-primary"
          />
          <svg
            className="w-4 h-4 text-ink-muted absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Grid of Scenario Cards */}
      {filteredScenarios.length === 0 ? (
        <div className="p-12 rounded-card bg-canvas-surface border border-canvas-border text-center space-y-3">
          <p className="text-sm font-semibold text-ink-primary">No matching scenarios found</p>
          <p className="text-xs text-ink-muted">Try clearing your search query or selecting another category.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 rounded-pill bg-sif-primary text-white text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredScenarios.map((scenario) => (
            <div key={scenario.id} className="w-full flex justify-center">
              <ScenarioCard
                scenario={scenario}
                isSaved={savedMap[scenario.id]}
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
