'use client';

/**
 * MyProgress.tsx — Personal Exploration History & Saved Wording
 *
 * Implements:
 * - Activity exploration tracking (Explored, Practiced, Revisited)
 * - Saved takeaway wording ("Words to take with you")
 * - 1-click clipboard copy for useful phrasing
 * - Zero clinical scores, normality ratings, streak pressures, or social grades
 */

import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { TOPICS, type ScenarioDefinition, type TopicProgressStatus } from '../../domain/scenarios/topics';

export interface SavedTakeaway {
  id: string;
  topicId: string;
  topicTitle: string;
  script: string;
  savedAt: string;
}

interface MyProgressProps {
  progressMap: Record<string, TopicProgressStatus>;
  savedTakeaways: SavedTakeaway[];
  onSelectTopic: (topic: ScenarioDefinition) => void;
  onDeleteTakeaway?: (id: string) => void;
}

export const MyProgress: React.FC<MyProgressProps> = ({
  progressMap,
  savedTakeaways,
  onSelectTopic,
  onDeleteTakeaway,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exploredCount = Object.values(progressMap).filter(
    (s) => s === 'explored' || s === 'practiced' || s === 'revisited',
  ).length;

  const practicedCount = Object.values(progressMap).filter(
    (s) => s === 'practiced' || s === 'revisited',
  ).length;

  return (
    <div className="max-w-5xl mx-auto w-full py-8 px-4 sm:px-6 space-y-10 animate-fadeIn text-ink-primary">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-ink-primary">My Progress</h1>
        <p className="text-sm text-ink-secondary mt-1">
          A calm record of conversations you’ve explored and phrasing you’ve kept.
        </p>
      </div>

      {/* Gentle Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-canvas-surface border border-canvas-border shadow-xs">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
            Topics Explored
          </span>
          <span className="text-2xl font-semibold text-ink-primary">{exploredCount}</span>
          <span className="text-xs text-ink-muted block mt-1">of {TOPICS.length} available topics</span>
        </div>

        <div className="p-5 rounded-2xl bg-canvas-surface border border-canvas-border shadow-xs">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
            Conversations Practiced
          </span>
          <span className="text-2xl font-semibold text-teal-brand">{practicedCount}</span>
          <span className="text-xs text-ink-muted block mt-1">interactive simulations completed</span>
        </div>

        <div className="p-5 rounded-2xl bg-canvas-surface border border-canvas-border shadow-xs">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
            Saved Phrases
          </span>
          <span className="text-2xl font-semibold text-topic-apricot">{savedTakeaways.length}</span>
          <span className="text-xs text-ink-muted block mt-1">scripts ready to use</span>
        </div>
      </div>

      {/* Saved Wording ("Words to take with you") */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-primary">Words to take with you</h2>
            <p className="text-xs text-ink-muted">Phrasing and scripts you customized to make your own.</p>
          </div>
        </div>

        {savedTakeaways.length === 0 ? (
          <div className="p-8 rounded-2xl bg-canvas-surface border border-canvas-border text-center">
            <div className="w-12 h-12 rounded-full bg-canvas-subtle text-ink-muted flex items-center justify-center mx-auto mb-3">
              <Pencil className="w-5 h-5 text-ink-muted" />
            </div>
            <p className="text-sm font-medium text-ink-primary mb-1">No saved scripts yet</p>
            <p className="text-xs text-ink-muted max-w-sm mx-auto mb-4">
              When you finish a practice conversation, you can adjust your pocket script and keep it here for quick reference.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedTakeaways.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-canvas-surface border border-canvas-border flex flex-col justify-between shadow-xs hover:border-teal-border transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-teal-brand uppercase tracking-wider">
                      {item.topicTitle}
                    </span>
                    <span className="text-[11px] text-ink-muted">{item.savedAt}</span>
                  </div>
                  <p className="text-sm text-ink-primary font-medium leading-relaxed italic mb-4">
                    “{item.script}”
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-canvas-borderSubtle">
                  <button
                    onClick={() => handleCopy(item.id, item.script)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-canvas-subtle hover:bg-teal-subtle hover:text-teal-brand transition text-ink-secondary"
                  >
                    <span>{copiedId === item.id ? '✓ Copied' : 'Copy wording'}</span>
                  </button>

                  {onDeleteTakeaway && (
                    <button
                      onClick={() => onDeleteTakeaway(item.id)}
                      className="text-xs text-ink-muted hover:text-topic-apricot transition px-2 py-1 rounded"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Topic Status Breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-ink-primary mb-4">Activity Overview</h2>
        <div className="bg-canvas-surface border border-canvas-border rounded-2xl divide-y divide-canvas-borderSubtle overflow-hidden">
          {TOPICS.map((topic) => {
            const status = progressMap[topic.id] || 'not-started';
            const statusLabels: Record<TopicProgressStatus, { label: string; badge: string }> = {
              'not-started': { label: 'Not started', badge: 'bg-canvas-subtle text-ink-muted' },
              'in-progress': { label: 'In progress', badge: 'bg-topic-amberBg text-topic-amber' },
              explored: { label: 'Explored', badge: 'bg-topic-lavenderBg text-topic-lavender' },
              practiced: { label: 'Practiced', badge: 'bg-teal-subtle text-teal-brand' },
              revisited: { label: 'Revisited', badge: 'bg-teal-subtle text-teal-brand' },
            };
            const currentBadge = statusLabels[status];

            return (
              <div
                key={topic.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-canvas-subtle/50 transition"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-ink-muted">{topic.categoryLabel}</span>
                    <span className="text-canvas-border">•</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${currentBadge.badge}`}>
                      {currentBadge.label}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-ink-primary">{topic.title}</h3>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onSelectTopic(topic)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-canvas-surface border border-canvas-border text-ink-secondary hover:bg-canvas-subtle transition"
                  >
                    View topic
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
