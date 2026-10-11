'use client';

/**
 * ScenarioCard.tsx — Structured Opaque Scenario Card
 *
 * Implements:
 * - Opaque canvas-surface background (WCAG AA contrast, no washed-out glass)
 * - Clear 16px rounded-card geometry
 * - Distinct metadata pills (category, duration, partner, difficulty)
 * - 1-click favorite bookmarking toggle
 * - Crisp hover state with subtle Perplexity-inspired elevation
 */

import React from 'react';
import type { ScenarioDefinition, TopicProgressStatus } from '../../domain/scenarios/topics';
import { playCozySound } from '../utils/cozyAudio';

interface ScenarioCardProps {
  scenario: ScenarioDefinition;
  isSaved?: boolean;
  progress?: TopicProgressStatus;
  onSelect: (scenario: ScenarioDefinition) => void;
  onToggleSave?: (scenarioId: string) => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  isSaved = false,
  progress = 'not-started',
  onSelect,
  onToggleSave,
}) => {
  const isPreview = scenario.status === 'preview';

  return (
    <div
      onClick={() => onSelect(scenario)}
      className="group relative shrink-0 w-72 sm:w-80 rounded-card bg-canvas-surface border border-canvas-border hover:border-sif-border p-5 flex flex-col justify-between cursor-pointer select-none transition-all duration-200 ease-out hover:-translate-y-1 shadow-card hover:shadow-card-hover"
      data-testid={`scenario-card-${scenario.id}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(scenario);
        }
      }}
    >
      {/* Top Meta & Bookmark Button */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sif-primaryDeep px-2.5 py-0.5 rounded-pill bg-sif-primarySubtle border border-sif-border">
              {scenario.categoryLabel}
            </span>
            <span className="text-[11px] text-ink-muted">~{scenario.estimatedMinutes}m</span>
          </div>

          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playCozySound('toggle');
                onToggleSave(scenario.id);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                isSaved
                  ? 'text-sif-primary bg-sif-primarySubtle border border-sif-border'
                  : 'text-ink-muted hover:text-sif-primary hover:bg-canvas-subtle'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save for later'}
              aria-label={isSaved ? 'Remove from saved' : 'Save for later'}
            >
              <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Thumbnail Preview Banner */}
        <div className="w-full h-22 rounded-card bg-canvas-subtle border border-canvas-borderSubtle p-3 mb-3.5 flex flex-col justify-between relative overflow-hidden group-hover:border-sif-border/40 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-ink-muted">
            <span className="font-semibold text-ink-primary">Partner: {scenario.partner.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-pill bg-canvas-surface border border-canvas-border font-medium text-ink-secondary">
              {scenario.partner.role}
            </span>
          </div>

          <p className="text-xs text-ink-secondary italic line-clamp-1">
            "{scenario.partner.initialDialogue}"
          </p>
        </div>

        {/* Title & Subtitle */}
        <h3 className="font-semibold text-ink-primary text-base leading-snug mb-1 group-hover:text-sif-primary transition-colors">
          {scenario.title}
        </h3>
        <p className="text-xs text-ink-secondary leading-relaxed line-clamp-2">
          {scenario.subtitle}
        </p>
      </div>

      {/* Card Footer: Progress Pill & Action Indicator */}
      <div className="pt-3.5 mt-3 border-t border-canvas-borderSubtle flex items-center justify-between text-xs">
        <div>
          {progress === 'practiced' || progress === 'revisited' ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-pill border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Practiced
            </span>
          ) : progress === 'in-progress' ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sif-primaryDeep bg-sif-primarySubtle px-2.5 py-0.5 rounded-pill border border-sif-border">
              <span className="w-1.5 h-1.5 rounded-full bg-sif-primary" />
              In Progress
            </span>
          ) : isPreview ? (
            <span className="text-[11px] text-ink-muted">Upcoming</span>
          ) : (
            <span className="text-[11px] text-ink-muted">Ready to practice</span>
          )}
        </div>

        <span className="font-semibold text-sif-primary group-hover:translate-x-1 transition-transform flex items-center gap-1 text-xs">
          <span>Overview</span>
          <span>→</span>
        </span>
      </div>
    </div>
  );
};
