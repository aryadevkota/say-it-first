'use client';

/**
 * TopicDetailModal.tsx — Optional Learning Introduction & Practice Gateway
 *
 * Implements:
 * - "Understand the idea" short, concrete, example-led learning
 * - Double Empathy perspectives (Your Need vs Their Perspective)
 * - Practical approaches & concrete phrases
 * - "Jump into practice" gateway with warm partner overview
 * - Honest preview state for upcoming topics
 */

import React, { useState } from 'react';
import type { ScenarioDefinition } from '../../domain/scenarios/topics';

interface TopicDetailModalProps {
  topic: ScenarioDefinition;
  onClose: () => void;
  onStartPractice: (topic: ScenarioDefinition) => void;
  onMarkExplored?: (topicId: string) => void;
}

export const TopicDetailModal: React.FC<TopicDetailModalProps> = ({
  topic,
  onClose,
  onStartPractice,
  onMarkExplored,
}) => {
  const [activeTab, setActiveTab] = useState<'learn' | 'partner'>('learn');

  const handleStartPractice = () => {
    if (onMarkExplored) {
      onMarkExplored(topic.id);
    }
    onStartPractice(topic);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/30 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="topic-modal-title"
    >
      <div className="bg-canvas-surface border border-canvas-border rounded-3xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-canvas-borderSubtle flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-brand">
                {topic.categoryLabel}
              </span>
              <span className="text-canvas-border">•</span>
              <span className="text-xs text-ink-muted">~{topic.estimatedMinutes} min</span>
              {topic.status === 'preview' && (
                <>
                  <span className="text-canvas-border">•</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-canvas-subtle border border-canvas-border text-ink-secondary">
                    Upcoming Topic
                  </span>
                </>
              )}
            </div>
            <h2 id="topic-modal-title" className="text-xl sm:text-2xl font-semibold text-ink-primary">
              {topic.title}
            </h2>
            <p className="text-sm text-ink-secondary mt-1">{topic.subtitle}</p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-canvas-subtle transition focus:outline-none focus:ring-2 focus:ring-teal-brand"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 pt-3 flex gap-4 border-b border-canvas-borderSubtle">
          <button
            onClick={() => setActiveTab('learn')}
            className={`pb-2.5 text-sm font-medium transition border-b-2 ${
              activeTab === 'learn'
                ? 'border-teal-brand text-teal-brand'
                : 'border-transparent text-ink-muted hover:text-ink-primary'
            }`}
          >
            Understand the idea
          </button>
          <button
            onClick={() => setActiveTab('partner')}
            className={`pb-2.5 text-sm font-medium transition border-b-2 ${
              activeTab === 'partner'
                ? 'border-teal-brand text-teal-brand'
                : 'border-transparent text-ink-muted hover:text-ink-primary'
            }`}
          >
            Meet the partner
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-ink-primary">
          {activeTab === 'learn' ? (
            <>
              {/* Core Insight */}
              <div className="p-4 rounded-2xl bg-canvas-subtle border border-canvas-border">
                <span className="text-xs font-semibold text-teal-brand uppercase tracking-wider block mb-1">
                  Core Idea
                </span>
                <p className="text-sm text-ink-primary leading-relaxed">{topic.learning.coreInsight}</p>
              </div>

              {/* Double Empathy Perspectives */}
              <div>
                <h3 className="text-sm font-semibold text-ink-primary mb-3">Two-Way Perspectives</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-canvas-light border border-canvas-border">
                    <span className="text-xs font-medium text-teal-brand block mb-1">Your need</span>
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      {topic.learning.doubleEmpathyPerspective.yourNeed}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-canvas-light border border-canvas-border">
                    <span className="text-xs font-medium text-topic-apricot block mb-1">Their perspective</span>
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      {topic.learning.doubleEmpathyPerspective.theirPerspective}
                    </p>
                  </div>
                </div>
              </div>

              {/* Practical Approaches */}
              <div>
                <h3 className="text-sm font-semibold text-ink-primary mb-2.5">Helpful approaches</h3>
                <ul className="space-y-2">
                  {topic.learning.practicalApproaches.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-ink-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-brand mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Example Phrasings */}
              <div>
                <h3 className="text-sm font-semibold text-ink-primary mb-2.5">Example phrases to try</h3>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-canvas-surface border border-canvas-border">
                    <span className="text-[11px] font-semibold text-ink-muted uppercase block mb-0.5">
                      Gentle / Collaborative
                    </span>
                    <p className="text-xs text-ink-primary italic">“{topic.learning.examplePhrases.gentle}”</p>
                  </div>
                  <div className="p-3 rounded-xl bg-canvas-surface border border-canvas-border">
                    <span className="text-[11px] font-semibold text-ink-muted uppercase block mb-0.5">
                      Direct / Clear
                    </span>
                    <p className="text-xs text-ink-primary italic">“{topic.learning.examplePhrases.direct}”</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Partner Tab */
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-canvas-subtle border border-canvas-border">
                <div className="w-14 h-14 rounded-2xl bg-teal-subtle text-teal-brand flex items-center justify-center font-bold text-xl shadow-xs">
                  {topic.partner.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-ink-primary text-base">{topic.partner.name}</h3>
                  <p className="text-xs text-ink-muted">{topic.partner.role}</p>
                  <p className="text-xs text-ink-secondary mt-1">{topic.partner.defaultTone}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-ink-muted mb-2">Opening line</h4>
                <div className="p-4 rounded-2xl bg-canvas-surface border border-canvas-border">
                  <p className="text-sm text-ink-primary italic leading-relaxed">
                    “{topic.partner.initialDialogue}”
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-ink-muted mb-2">Your practice goal</h4>
                <div className="p-3.5 rounded-xl bg-teal-subtle/50 border border-teal-border">
                  <p className="text-xs text-ink-primary">{topic.userGoal}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="p-5 border-t border-canvas-borderSubtle bg-canvas-light flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink-primary transition"
          >
            Close
          </button>

          {topic.status === 'ready' ? (
            <button
              onClick={handleStartPractice}
              className="px-6 py-2.5 rounded-xl bg-teal-brand text-canvas-surface font-medium hover:bg-teal-hover transition text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-brand"
            >
              Jump into practice
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted">Interactive simulation coming soon</span>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-canvas-surface border border-canvas-border text-ink-primary font-medium text-xs hover:bg-canvas-subtle"
              >
                Got it
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
