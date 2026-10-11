'use client';

/**
 * ScenarioRail.tsx — Horizontal Scrollable Rail of Scenario Cards
 *
 * Inspired by LinkedIn Learning / streaming discovery rails:
 * - Horizontal smooth scrolling with clean drag/scroll buttons
 * - Section header with title, subtitle, and optional count
 * - Supports scroll left/right controls
 */

import React, { useRef } from 'react';
import type { ScenarioDefinition, TopicProgressStatus } from '../../domain/scenarios/topics';
import { ScenarioCard } from './ScenarioCard';
import { playCozySound } from '../utils/cozyAudio';

interface ScenarioRailProps {
  title: string;
  subtitle?: string;
  icon?: string;
  scenarios: ScenarioDefinition[];
  savedMap?: Record<string, boolean>;
  progressMap?: Record<string, TopicProgressStatus>;
  onSelectScenario: (scenario: ScenarioDefinition) => void;
  onToggleSave?: (scenarioId: string) => void;
}

export const ScenarioRail: React.FC<ScenarioRailProps> = ({
  title,
  subtitle,
  icon,
  scenarios,
  savedMap = {},
  progressMap = {},
  onSelectScenario,
  onToggleSave,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    playCozySound('tap');
    if (scrollContainerRef.current) {
      const scrollAmount = 340;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (scenarios.length === 0) return null;

  return (
    <div className="space-y-4" data-testid={`scenario-rail-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      {/* Rail Header & Arrow Controls */}
      <div className="flex items-end justify-between px-1">
        <div>
          <div className="flex items-center gap-2">
            {icon && <span className="text-base">{icon}</span>}
            <h2 className="text-lg sm:text-xl font-semibold text-ink-primary tracking-tight">
              {title}
            </h2>
            <span className="text-xs text-ink-muted">({scenarios.length})</span>
          </div>
          {subtitle && <p className="text-xs text-ink-secondary mt-0.5">{subtitle}</p>}
        </div>

        {/* Scroll Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="w-8 h-8 rounded-full border border-canvas-border bg-canvas-surface hover:bg-canvas-subtle text-ink-secondary hover:text-ink-primary flex items-center justify-center transition shadow-2xs"
            aria-label={`Scroll ${title} left`}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="w-8 h-8 rounded-full border border-canvas-border bg-canvas-surface hover:bg-canvas-subtle text-ink-secondary hover:text-ink-primary flex items-center justify-center transition shadow-2xs"
            aria-label={`Scroll ${title} right`}
          >
            →
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none scroll-smooth snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="snap-start shrink-0">
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
    </div>
  );
};
