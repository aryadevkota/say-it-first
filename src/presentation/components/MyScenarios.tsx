'use client';

/**
 * MyScenarios.tsx — User Custom Scenarios Hub
 *
 * Implements:
 * - "My Scenarios" listing of user-created practice scenarios
 * - "+ Create a scenario" entry point
 * - Direct practice launch for custom scenarios
 * - Explicit delete actions and local privacy transparency
 */

import React from 'react';
import type { ScenarioDefinition } from '../../domain/scenarios/topics';

interface MyScenariosProps {
  customScenarios: ScenarioDefinition[];
  onCreateNew: () => void;
  onPracticeScenario: (scenario: ScenarioDefinition) => void;
  onDeleteScenario: (scenarioId: string) => void;
}

export const MyScenarios: React.FC<MyScenariosProps> = ({
  customScenarios,
  onCreateNew,
  onPracticeScenario,
  onDeleteScenario,
}) => {
  return (
    <div className="max-w-5xl mx-auto w-full py-8 px-4 sm:px-6 space-y-8 animate-fadeIn text-ink-primary">
      {/* Header & New Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-primary">
            My Scenarios
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Personalized situations you’ve created to practice conversations that matter to you.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="px-5 py-2.5 rounded-xl bg-teal-brand hover:bg-teal-hover text-canvas-surface text-xs font-medium transition shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <span>+ Create a scenario</span>
        </button>
      </div>

      {/* Empty State */}
      {customScenarios.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-canvas-surface border border-canvas-border text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-subtle text-teal-brand flex items-center justify-center mx-auto text-2xl shadow-xs">
            💬
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink-primary">No personal scenarios yet</h2>
            <p className="text-xs text-ink-muted max-w-md mx-auto mt-1 leading-relaxed">
              Have an upcoming conversation with a roommate, manager, friend, or service provider?
              Describe the situation and we’ll prepare an adaptive 3D practice partner.
            </p>
          </div>
          <button
            onClick={onCreateNew}
            className="px-5 py-2.5 rounded-xl bg-teal-brand hover:bg-teal-hover text-canvas-surface text-xs font-medium transition shadow-xs inline-flex items-center gap-1.5"
          >
            <span>Create your first scenario</span>
          </button>
        </div>
      ) : (
        /* Scenarios Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {customScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="p-5 rounded-2xl bg-canvas-surface border border-canvas-border flex flex-col justify-between shadow-xs hover:border-teal-border transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-teal-brand uppercase tracking-wider">
                    Personal Scenario
                  </span>
                  <span className="text-xs text-ink-muted">~{scenario.estimatedMinutes}m</span>
                </div>

                <div>
                  <h3 className="font-semibold text-ink-primary text-base leading-snug">
                    {scenario.title}
                  </h3>
                  <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                    {scenario.subtitle}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-canvas-subtle text-xs space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-ink-primary">Partner:</span>
                    <span className="text-ink-secondary">
                      {scenario.partner.name} ({scenario.partner.role})
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-semibold text-ink-primary shrink-0">Your goal:</span>
                    <span className="text-ink-secondary line-clamp-2">{scenario.userGoal}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 mt-4 border-t border-canvas-borderSubtle flex items-center justify-between">
                <button
                  onClick={() => onDeleteScenario(scenario.id)}
                  className="text-xs text-ink-muted hover:text-topic-apricot transition px-1 py-1"
                >
                  Delete
                </button>

                <button
                  onClick={() => onPracticeScenario(scenario)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-teal-brand hover:bg-teal-hover text-canvas-surface transition shadow-2xs"
                >
                  Practice scenario →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Storage & Privacy Note */}
      <div className="p-4 rounded-2xl bg-canvas-subtle/50 border border-canvas-borderSubtle text-xs text-ink-muted flex items-center justify-between">
        <span>🔒 Your personal scenarios are stored strictly in your local browser session.</span>
        <span>Zero external data retention</span>
      </div>
    </div>
  );
};
