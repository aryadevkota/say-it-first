'use client';

/**
 * AboutSiFView.tsx — What Makes Say It First Different
 *
 * Explains clearly, confidently, and non-defensively:
 * - Why SiF is built for structured conversational learning, not generic answers
 * - The double-empathy framework and neurodiversity-affirming coaching
 * - Scenario-driven deliberate practice with repeatable habits
 * - Safe, non-judgmental environment (no performance grades)
 */

import React from 'react';
import { playCozySound } from '../utils/cozyAudio';

interface AboutSiFViewProps {
  onStartExplore: () => void;
  onOpenTutorial: () => void;
}

export const AboutSiFView: React.FC<AboutSiFViewProps> = ({ onStartExplore, onOpenTutorial }) => {
  return (
    <div className="max-w-4xl mx-auto w-full py-8 px-4 sm:px-6 space-y-10 animate-fadeIn text-ink-primary">
      {/* Hero */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-sif-primarySubtle text-sif-primary border border-sif-border shadow-2xs">
          <span>Philosophy & Design</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight text-ink-primary">
          What makes Say It First different.
        </h1>

        <p className="text-base sm:text-lg text-ink-secondary leading-relaxed max-w-2xl">
          Most AI chat products are designed to generate answers for you. Say It First is built to help you find your own words and practice real human conversations with confidence.
        </p>
      </div>

      {/* Comparison Grid: Generic LLMs vs Say It First */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Generic LLM Column */}
        <div className="p-6 rounded-3xl bg-white/60 backdrop-blur-md border border-canvas-border space-y-4 shadow-glass-card">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
              Standard AI Chatbots
            </h2>
          </div>

          <ul className="space-y-3 text-xs text-ink-secondary">
            <li className="flex items-start gap-2.5">
              <span className="text-ink-muted font-bold">✕</span>
              <span>Open-ended text boxes with no clear conversational context or goal.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-ink-muted font-bold">✕</span>
              <span>Answers questions directly rather than letting you practice the interaction yourself.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-ink-muted font-bold">✕</span>
              <span>Evaluates you with artificial scores, pass/fail rubrics, or clinical normality ratings.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-ink-muted font-bold">✕</span>
              <span>Treats social communication as having one single "correct" script.</span>
            </li>
          </ul>
        </div>

        {/* Say It First Column */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-white/90 via-canvas-subtle/80 to-sif-secondarySubtle/50 border border-sif-border space-y-4 shadow-glass-card backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sif-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-sif-primary">
              Say It First Learning Model
            </h2>
          </div>

          <ul className="space-y-3 text-xs text-ink-primary">
            <li className="flex items-start gap-2.5">
              <span className="text-sif-primary font-bold">✓</span>
              <span><strong>Scenario-driven deliberate practice:</strong> Centered simulation rooms tailored to workplace, friendship, and personal boundaries.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-sif-primary font-bold">✓</span>
              <span><strong>Two-Way Bridge & Double Empathy:</strong> Explains what the other person may have signaled, translating implicit subtext into explicit insights.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-sif-primary font-bold">✓</span>
              <span><strong>Strengths-first guided reports:</strong> Identifies repeatable communication habits and offers multiple valid paths (empathetic, curious, direct).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-sif-primary font-bold">✓</span>
              <span><strong>Zero grading pressure:</strong> Non-destructive branch retries where you can try multiple versions without penalization.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 3 Pillars of Learning */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ink-primary">Built for Real-World Transfer</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-canvas-surface border border-canvas-border space-y-2">
            <div className="w-8 h-8 rounded-xl bg-canvas-subtle text-teal-brand flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="text-sm font-semibold text-ink-primary">Understand the Idea</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Before jumping into words, learn the perspective of both parties so the goal makes sense intuitively.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-canvas-surface border border-canvas-border space-y-2">
            <div className="w-8 h-8 rounded-xl bg-canvas-subtle text-teal-brand flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="text-sm font-semibold text-ink-primary">Low-Stakes Practice</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Step into an immersive, centered video call with Sophia. Speak aloud or type—take as much time as you need.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-canvas-surface border border-canvas-border space-y-2">
            <div className="w-8 h-8 rounded-xl bg-canvas-subtle text-teal-brand flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="text-sm font-semibold text-ink-primary">Actionable Takeaways</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Review what worked well, save a 2-sentence pocket script, and take 1–3 concrete goals into your next real-life chat.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-6 rounded-3xl bg-canvas-surface border border-canvas-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink-primary">Ready to practice a conversation?</h2>
          <p className="text-xs text-ink-secondary mt-0.5">Explore our library of curated scenarios or create your own.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playCozySound('pop');
              onOpenTutorial();
            }}
            className="px-4 py-2 rounded-xl bg-canvas-subtle hover:bg-canvas-border text-ink-primary text-xs font-medium transition"
          >
            Review Tutorial
          </button>
          <button
            onClick={() => {
              playCozySound('tap');
              onStartExplore();
            }}
            className="px-5 py-2 rounded-xl bg-teal-brand text-canvas-surface text-xs font-semibold hover:bg-teal-hover transition shadow-2xs"
          >
            Browse Scenarios →
          </button>
        </div>
      </div>
    </div>
  );
};
