'use client';

/**
 * TutorialGuideModal.tsx — Lightweight, Dismissible Onboarding / Tutorial Guide
 *
 * Inspired by modern AI web apps (Perplexity, Claude, Gemini, ChatGPT):
 * - Simple, dismissible modal overlay (never traps user)
 * - Quick breakdown of the 5 primary tabs: Home, Progress Center, Favorites, Settings, About SiF
 * - Explains how Say It First differs from generic chatbot products
 * - Keyboard accessible (Esc to close)
 */

import React, { useEffect } from 'react';
import { playCozySound } from '../utils/cozyAudio';

interface TutorialGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialGuideModal: React.FC<TutorialGuideModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/30 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      data-testid="tutorial-guide-modal"
    >
      <div className="bg-canvas-surface border border-canvas-border rounded-3xl shadow-xl max-w-xl w-full p-6 sm:p-8 space-y-6 text-ink-primary max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-subtle text-teal-brand flex items-center justify-center text-xl shadow-2xs">
              ✨
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-brand block">
                Quick Guide
              </span>
              <h2 id="tutorial-title" className="text-xl sm:text-2xl font-semibold text-ink-primary">
                How Say It First Works
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              playCozySound('tap');
              onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-canvas-subtle transition"
            aria-label="Close guide"
          >
            ✕
          </button>
        </div>

        {/* Core Distinction Callout */}
        <div className="p-4 rounded-2xl bg-teal-subtle/40 border border-teal-border/70 text-xs sm:text-sm text-ink-secondary leading-relaxed">
          <span className="font-semibold text-teal-brand block mb-1">
            Not a generic chatbot. A guided conversational gym.
          </span>
          Say It First uses scenario-adaptive partners and structured social feedback to help you build repeatable communication habits, explore two-way perspectives, and practice at your own pace without scoring or judgment.
        </div>

        {/* Feature Cards Grid */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-canvas-subtle border border-canvas-borderSubtle flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-canvas-surface text-teal-brand flex items-center justify-center text-sm shrink-0 font-bold">
              1
            </div>
            <div className="text-xs">
              <span className="font-semibold text-ink-primary block mb-0.5">
                Home (Media-Style Rails)
              </span>
              <p className="text-ink-secondary leading-relaxed">
                Browse curated scenarios horizontally by context—workplace check-ins, social boundaries, friendships, and interviews.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-canvas-subtle border border-canvas-borderSubtle flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-canvas-surface text-teal-brand flex items-center justify-center text-sm shrink-0 font-bold">
              2
            </div>
            <div className="text-xs">
              <span className="font-semibold text-ink-primary block mb-0.5">
                3-Layer Scenario Practice
              </span>
              <p className="text-ink-secondary leading-relaxed">
                Review the social idea $\rightarrow$ get brief preparation advice $\rightarrow$ step into a spacious, centered live call with Sophia.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-canvas-subtle border border-canvas-borderSubtle flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-canvas-surface text-teal-brand flex items-center justify-center text-sm shrink-0 font-bold">
              3
            </div>
            <div className="text-xs">
              <span className="font-semibold text-ink-primary block mb-0.5">
                Progress Center & Guided Reports
              </span>
              <p className="text-ink-secondary leading-relaxed">
                Review strengths first, identify subtle cues, explore alternative response paths, and take 1–3 concrete practice goals with you.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-canvas-subtle border border-canvas-borderSubtle flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-canvas-surface text-teal-brand flex items-center justify-center text-sm shrink-0 font-bold">
              4
            </div>
            <div className="text-xs">
              <span className="font-semibold text-ink-primary block mb-0.5">
                Favorites & Custom Scenarios
              </span>
              <p className="text-ink-secondary leading-relaxed">
                Bookmark scenarios to revisit anytime, or create your own custom practice situation from a note or document.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-2 border-t border-canvas-border flex items-center justify-between">
          <span className="text-xs text-ink-muted">You can reopen this guide anytime from the sidebar.</span>
          <button
            onClick={() => {
              playCozySound('tap');
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-teal-brand text-canvas-surface text-xs font-semibold hover:bg-teal-hover transition shadow-2xs"
          >
            Got it, let's explore
          </button>
        </div>
      </div>
    </div>
  );
};
