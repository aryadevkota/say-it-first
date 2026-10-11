'use client';

/**
 * ScenarioCard.tsx — Media-Style Scenario Thumbnail / Card
 *
 * Implements:
 * - Rounded conversational card geometry with subtle scale, brightness, and shadow on hover
 * - Displays category, duration, partner, difficulty, and bookmark state
 * - Clean micro-details on hover without noisy distracting autoplay
 * - 1-click favorite bookmarking toggle
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

  // Topic accent styling
  const accentBorderColor =
    scenario.accentColor === 'apricot'
      ? 'hover:border-topic-apricotBorder'
      : scenario.accentColor === 'lavender'
      ? 'hover:border-topic-lavenderBorder'
      : scenario.accentColor === 'sage'
      ? 'hover:border-topic-sageBorder'
      : 'hover:border-teal-border';

  return (
    <div
      onClick={() => onSelect(scenario)}
      className={`group relative shrink-0 w-72 sm:w-80 rounded-3xl bg-canvas-surface border border-canvas-border p-5 flex flex-col justify-between cursor-pointer select-none transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md hover:bg-canvas-subtle/40 ${accentBorderColor}`}
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
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-brand px-2.5 py-0.5 rounded-full bg-teal-subtle/80 border border-teal-border/40">
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
              className={`p-1.5 rounded-xl transition-colors ${
                isSaved
                  ? 'text-teal-brand bg-teal-subtle'
                  : 'text-ink-muted hover:text-ink-primary hover:bg-canvas-light'
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
        <div className="w-full h-24 rounded-2xl bg-gradient-to-br from-canvas-subtle via-teal-subtle/20 to-canvas-light border border-canvas-borderSubtle p-3.5 mb-3.5 flex flex-col justify-between relative overflow-hidden group-hover:brightness-105 transition-all">
          <div className="flex items-center justify-between text-[11px] text-ink-muted">
            <span className="font-medium text-ink-secondary">Partner: {scenario.partner.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-canvas-surface border border-canvas-border">
              {scenario.partner.role}
            </span>
          </div>

          <p className="text-xs text-ink-secondary italic line-clamp-1">
            "{scenario.partner.initialDialogue}"
          </p>
        </div>

        {/* Title & Subtitle */}
        <h3 className="font-semibold text-ink-primary text-base leading-snug mb-1 group-hover:text-teal-brand transition-colors">
          {scenario.title}
        </h3>
        <p className="text-xs text-ink-secondary leading-relaxed line-clamp-2">
          {scenario.subtitle}
        </p>
      </div>

      {/* Card Footer: Progress Pill & Action Indicator */}
      <div className="pt-4 mt-3 border-t border-canvas-borderSubtle flex items-center justify-between text-xs">
        <div>
          {progress === 'practiced' || progress === 'revisited' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Practiced
            </span>
          ) : progress === 'in-progress' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-topic-amber bg-topic-amberBg px-2 py-0.5 rounded-full border border-topic-amberBorder">
              <span className="w-1.5 h-1.5 rounded-full bg-topic-amber" />
              In Progress
            </span>
          ) : isPreview ? (
            <span className="text-[11px] text-ink-muted">Upcoming</span>
          ) : (
            <span className="text-[11px] text-ink-muted">Ready to practice</span>
          )}
        </div>

        <span className="font-semibold text-teal-brand group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-xs">
          <span>Overview</span>
          <span>→</span>
        </span>
      </div>
    </div>
  );
};
