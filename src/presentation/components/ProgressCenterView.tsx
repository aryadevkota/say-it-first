'use client';

/**
 * ProgressCenterView.tsx — Main Reflective Learning Surface
 *
 * Implements:
 * - Strengths-based summary: Topics explored, interactive practices, saved pocket scripts
 * - Latest guided coaching report (if available) with quick revisit
 * - "What to keep doing": repeatable communication habits
 * - Saved wording library ("Words to take with you") with 1-click clipboard copy
 * - Zero scores, clinical ratings, or streak pressure
 * - Opaque, high-contrast canvas surfaces (WCAG AA compliant)
 */

import React, { useState } from 'react';
import { TOPICS, type ScenarioDefinition, type TopicProgressStatus } from '../../domain/scenarios/topics';
import type { SavedTakeaway } from './MyProgress';
import type { SessionReport } from '../../domain/entities/SessionReport';
import { ConversationReportPage } from './ConversationReportPage';
import { playCozySound } from '../utils/cozyAudio';

interface ProgressCenterViewProps {
  progressMap: Record<string, TopicProgressStatus>;
  savedTakeaways: SavedTakeaway[];
  latestReport?: SessionReport | null;
  onSelectTopic: (topic: ScenarioDefinition) => void;
  onDeleteTakeaway?: (id: string) => void;
  onOpenPreferences: () => void;
}

export const ProgressCenterView: React.FC<ProgressCenterViewProps> = ({
  progressMap,
  savedTakeaways,
  latestReport,
  onSelectTopic,
  onDeleteTakeaway,
  onOpenPreferences,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFullLatestReport, setShowFullLatestReport] = useState<boolean>(false);

  const handleCopy = (id: string, text: string) => {
    playCozySound('tap');
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

  // If user opened full view of latest report
  if (showFullLatestReport && latestReport) {
    return (
      <ConversationReportPage
        report={latestReport}
        onRestartPractice={() => {
          const t = TOPICS.find((top) => top.id === latestReport.scenarioId) || TOPICS[0];
          onSelectTopic(t);
        }}
        onReturnDashboard={() => setShowFullLatestReport(false)}
      />
    );
  }

  return (
    <div
      className="max-w-5xl mx-auto w-full py-8 px-4 sm:px-6 space-y-10 animate-page-enter text-ink-primary"
      data-testid="progress-center-view"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-pill text-xs font-semibold uppercase tracking-wider bg-sif-primarySubtle text-sif-primaryDeep border border-sif-border">
            Reflective Learning
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-ink-primary mt-2">
          Progress Center
        </h1>
        <p className="text-sm text-ink-secondary mt-1 max-w-2xl">
          A calm record of conversations you’ve explored, repeatable communication habits, and wording you’ve customized for the real world.
        </p>
      </div>

      {/* Overview Stat Tiles (No judgment, purely milestones) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-card bg-canvas-surface border border-canvas-border shadow-card">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
            Topics Explored
          </span>
          <span className="text-2xl font-semibold text-ink-primary">{exploredCount}</span>
          <span className="text-xs text-ink-muted block mt-1">of {TOPICS.length} available scenarios</span>
        </div>

        <div className="p-5 rounded-card bg-canvas-surface border border-canvas-border shadow-card">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
            Conversations Completed
          </span>
          <span className="text-2xl font-semibold text-sif-primary">{practicedCount}</span>
          <span className="text-xs text-ink-muted block mt-1">interactive simulations finished</span>
        </div>

        <div className="p-5 rounded-card bg-canvas-surface border border-canvas-border shadow-card">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
            Saved Pocket Scripts
          </span>
          <span className="text-2xl font-semibold text-sif-primaryDeep">{savedTakeaways.length}</span>
          <span className="text-xs text-ink-muted block mt-1">ready to reuse anytime</span>
        </div>
      </div>

      {/* Latest Guided Report Banner (if one exists) */}
      {latestReport && (
        <div className="p-6 sm:p-7 rounded-card-lg bg-canvas-surface border border-sif-border shadow-card space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sif-primary animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-sif-primary">
                Latest Learning Report
              </span>
            </div>
            <span className="text-xs text-ink-muted">
              {new Date(latestReport.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink-primary">
                {latestReport.snapshot.scenarioTitle}
              </h2>
              <p className="text-xs text-ink-secondary mt-1 line-clamp-2 max-w-xl leading-relaxed">
                {latestReport.snapshot.plainLanguageSummary}
              </p>
            </div>

            <button
              onClick={() => {
                playCozySound('tap');
                setShowFullLatestReport(true);
              }}
              className="px-5 py-2.5 rounded-pill bg-sif-primary text-white text-xs font-semibold hover:bg-sif-primaryHover transition shadow-card shrink-0"
            >
              View Full 9-Part Report →
            </button>
          </div>

          {/* Key Strengths Snippet */}
          <div className="pt-3 border-t border-canvas-borderSubtle grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {latestReport.whatYouDidWell.slice(0, 2).map((strength, idx) => (
              <div key={idx} className="flex items-start gap-2 text-ink-primary">
                <span className="text-emerald-700 font-bold shrink-0">✓</span>
                <span className="line-clamp-1">{strength}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What to Keep Doing (Repeatable Habits) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-primary">What to Keep Doing</h2>
          <p className="text-xs text-ink-secondary">Repeatable conversational habits that support mutual comfort and clarity.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-card bg-canvas-surface border border-canvas-border shadow-card space-y-1.5 text-xs">
            <span className="text-sif-primary font-bold text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sif-primary"></span>
              Acknowledge First
            </span>
            <p className="text-ink-secondary leading-relaxed">
              Mirror one detail or feeling word before moving to a new point to confirm you heard them.
            </p>
          </div>
          <div className="p-5 rounded-card bg-canvas-surface border border-canvas-border shadow-card space-y-1.5 text-xs">
            <span className="text-sif-primary font-bold text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sif-primary"></span>
              Tentative Phrasing
            </span>
            <p className="text-ink-secondary leading-relaxed">
              Use "I would prefer" or "Could we try" when asserting sensory or personal boundaries.
            </p>
          </div>
          <div className="p-5 rounded-card bg-canvas-surface border border-canvas-border shadow-card space-y-1.5 text-xs">
            <span className="text-sif-primary font-bold text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sif-primary"></span>
              Conversational Ping-Pong
            </span>
            <p className="text-ink-secondary leading-relaxed">
              Ask a short return question ("How about yours?") to share the speaking load equally.
            </p>
          </div>
        </div>
      </div>

      {/* Words to Take With You (Saved Phrasing Library) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-primary">Words to Take With You</h2>
            <p className="text-xs text-ink-muted">Phrasing and scripts you customized during practice sessions.</p>
          </div>
        </div>

        {savedTakeaways.length === 0 ? (
          <div className="p-8 rounded-card bg-canvas-surface border border-canvas-border text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-canvas-subtle text-ink-muted flex items-center justify-center mx-auto text-lg">
              ✎
            </div>
            <p className="text-sm font-semibold text-ink-primary">No saved wording yet</p>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              After any conversation, adjust your 2-sentence pocket script and save it here for fast real-world reference.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedTakeaways.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-card bg-canvas-surface border border-canvas-border flex flex-col justify-between shadow-card hover:border-sif-border transition text-xs space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sif-primary uppercase tracking-wider text-[11px]">
                      {item.topicTitle}
                    </span>
                    <span className="text-[11px] text-ink-muted">{item.savedAt}</span>
                  </div>
                  <p className="text-sm text-ink-primary font-medium leading-relaxed italic">
                    “{item.script}”
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-canvas-borderSubtle">
                  <button
                    onClick={() => handleCopy(item.id, item.script)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold bg-canvas-subtle hover:bg-sif-primarySubtle hover:text-sif-primaryDeep transition text-ink-secondary"
                  >
                    <span>{copiedId === item.id ? '✓ Copied' : 'Copy wording'}</span>
                  </button>

                  {onDeleteTakeaway && (
                    <button
                      onClick={() => {
                        playCozySound('tap');
                        onDeleteTakeaway(item.id);
                      }}
                      className="text-xs text-ink-muted hover:text-rose-600 transition px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
