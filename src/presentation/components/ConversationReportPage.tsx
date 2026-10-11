'use client';

/**
 * ConversationReportPage.tsx — Coached Social Learning Report Page
 *
 * Implements the 9-part structured report:
 * 1. Session Snapshot (Duration, turns, tone, plain-language summary)
 * 2. What You Did Well (Strengths-first, 3-5 concrete behavioral strengths)
 * 3. What to Keep Doing (Repeatable communication habits & why they helped)
 * 4. Exchange-by-Exchange Coaching (With multi-path alternatives: empathetic, curious, direct)
 * 5. Social and Emotional Cues (Broader patterns, recognized vs missed)
 * 6. Skill Tags & Learning Patterns (Turn-level & aggregated scaffold)
 * 7. Missed Opportunities (Supportive, growth-oriented reflection)
 * 8. Practice Goals for Next Time (1-3 concrete, actionable goals)
 * 9. Collapsible Full Transcript
 *
 * Design & Tone:
 * - Strengths-based, supportive, neurodiversity-affirming, non-judgmental
 * - Progressive section reveal for calm readability
 * - Zero scores, normality percentages, or red-alarm styling
 */

import React, { useState } from 'react';
import {
  SessionReport,
  ExchangeAnalysis,
  AlternativeResponseOption,
  SkillTag,
} from '../../domain/entities/SessionReport';
import { playCozySound } from '../utils/cozyAudio';

interface ConversationReportPageProps {
  report: SessionReport;
  onRestartPractice: () => void;
  onReturnDashboard: () => void;
  onSavePracticeGoals?: (goals: string[]) => void;
}

export const ConversationReportPage: React.FC<ConversationReportPageProps> = ({
  report,
  onRestartPractice,
  onReturnDashboard,
  onSavePracticeGoals,
}) => {
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState<boolean>(false);
  const [selectedAlternativeIndexByExchange, setSelectedAlternativeIndexByExchange] = useState<
    Record<number, number>
  >({});
  const [copiedGoal, setCopiedGoal] = useState<string | null>(null);

  const handleCopyGoal = (text: string) => {
    playCozySound('tap');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedGoal(text);
      setTimeout(() => setCopiedGoal(null), 2000);
    }
  };

  return (
    <div
      className="min-h-screen bg-canvas-light text-ink-primary py-8 sm:py-12 px-4 sm:px-6 animate-fadeIn"
      data-testid="conversation-report-page"
    >
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Navigation & Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-canvas-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-sif-primarySubtle text-sif-primary border border-sif-border">
                {report.snapshot.categoryLabel} • Guided Coaching Report
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-ink-primary mt-2">
              Social Learning Report: {report.snapshot.scenarioTitle}
            </h1>
            <p className="text-xs text-ink-secondary mt-1">
              Personalized reflection designed to build self-awareness, communication comfort, and repeatable strengths.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                playCozySound('tap');
                onReturnDashboard();
              }}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-canvas-surface border border-canvas-border hover:bg-canvas-subtle text-ink-primary transition"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => {
                playCozySound('pop');
                onRestartPractice();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sif-primary text-canvas-surface hover:bg-sif-primaryHover transition shadow-2xs"
            >
              Practice Again
            </button>
          </div>
        </header>

        {/* ── SECTION 1: SESSION SNAPSHOT ────────────────────────────────────── */}
        <section
          className="bg-canvas-surface border border-canvas-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-4"
          data-testid="section-session-snapshot"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sif-primary">
              1. Session Snapshot
            </span>
            <div className="flex items-center gap-4 text-xs text-ink-muted">
              <span>Duration: ~{Math.max(1, Math.round(report.snapshot.conversationDurationSeconds / 60))} min</span>
              <span>User turns: {report.snapshot.userTurnsCount}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-canvas-subtle/80 border border-canvas-borderSubtle space-y-2">
            <div className="text-xs font-semibold text-ink-secondary">Overall Tone:</div>
            <p className="text-sm font-medium text-ink-primary italic">
              "{report.snapshot.overallToneSummary}"
            </p>
          </div>

          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            {report.snapshot.plainLanguageSummary}
          </p>
        </section>

        {/* ── SECTION 2: WHAT YOU DID WELL (STRENGTHS FIRST) ─────────────────── */}
        <section
          className="bg-canvas-surface border border-canvas-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-4"
          data-testid="section-what-you-did-well"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              2. What You Did Well
            </span>
          </div>

          <h2 className="text-lg font-semibold text-ink-primary">
            Key Strengths Observed in this Conversation
          </h2>
          <p className="text-xs text-ink-secondary">
            These are observable behaviors that supported clarity and connection:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {report.whatYouDidWell.map((strength, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 flex items-start gap-3"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs shrink-0 font-bold">
                  ✓
                </span>
                <p className="text-xs text-ink-primary leading-relaxed font-medium">
                  {strength}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 3: WHAT TO KEEP DOING (REPEATABLE HABITS) ──────────────── */}
        <section
          className="bg-canvas-surface border border-canvas-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-5"
          data-testid="section-what-to-keep-doing"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sif-primary">
              3. What to Keep Doing
            </span>
            <h2 className="text-lg font-semibold text-ink-primary mt-1">
              Repeatable Communication Habits to Take Forward
            </h2>
            <p className="text-xs text-ink-secondary">
              Habits you can intentionally reuse across work, friendship, or everyday conversations:
            </p>
          </div>

          <div className="space-y-3">
            {report.whatToKeepDoing.map((habitItem, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-canvas-subtle border border-canvas-borderSubtle space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sif-primary flex-shrink-0"></span>
                  <h3 className="text-xs sm:text-sm font-semibold text-ink-primary">
                    {habitItem.habit}
                  </h3>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed pl-5">
                  <span className="font-medium text-ink-primary">Why it helps:</span> {habitItem.whyItHelped}
                </p>
                {habitItem.conversationMomentExample && (
                  <p className="text-[11px] text-ink-muted italic pl-5">
                    Example from session: "{habitItem.conversationMomentExample}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 4: EXCHANGE-BY-EXCHANGE COACHING ────────────────────────── */}
        <section
          className="bg-canvas-surface border border-canvas-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
          data-testid="section-exchange-by-exchange"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-canvas-borderSubtle pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-sif-primary">
                4. Exchange-by-Exchange Coaching
              </span>
              <h2 className="text-lg font-semibold text-ink-primary mt-1">
                Nuanced Breakdown of Every Turn
              </h2>
            </div>
            <span className="text-xs text-ink-muted">
              {report.exchangeBreakdown.length} {report.exchangeBreakdown.length === 1 ? 'exchange' : 'exchanges'} analyzed
            </span>
          </div>

          <div className="space-y-6">
            {report.exchangeBreakdown.map((exchange) => {
              const activeAltIdx =
                selectedAlternativeIndexByExchange[exchange.exchangeIndex] ?? 0;
              const activeAlternative: AlternativeResponseOption =
                exchange.alternativeResponses[activeAltIdx] || exchange.alternativeResponses[0];

              return (
                <div
                  key={exchange.exchangeIndex}
                  className="rounded-2xl border border-canvas-border bg-canvas-subtle/50 p-5 sm:p-6 space-y-4"
                  data-testid={`exchange-card-${exchange.exchangeIndex}`}
                >
                  {/* Exchange Header & Skill Tags */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-semibold text-ink-muted">
                      Exchange #{exchange.exchangeIndex}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {exchange.skillTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-canvas-surface border border-canvas-border text-sif-primary shadow-2xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Spoken Dialogue Volley */}
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-canvas-surface border border-canvas-borderSubtle">
                      <span className="font-semibold text-ink-secondary block mb-0.5">
                        {exchange.partnerSpeaker}:
                      </span>
                      <p className="text-ink-primary">{exchange.partnerMessage}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-sif-primarySubtle/60 border border-sif-border/40 ml-4">
                      <span className="font-semibold text-sif-primary block mb-0.5">You said:</span>
                      <p className="text-ink-primary">{exchange.userMessage}</p>
                    </div>
                  </div>

                  {/* Social Dynamics & Cues Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="p-3.5 rounded-xl bg-canvas-surface border border-canvas-borderSubtle space-y-1">
                      <span className="text-[11px] font-semibold uppercase text-ink-muted block">
                        What the other person may have signaled
                      </span>
                      <p className="text-ink-secondary leading-relaxed">
                        {exchange.partnerPotentialFeeling}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-canvas-surface border border-canvas-borderSubtle space-y-1">
                      <span className="text-[11px] font-semibold uppercase text-ink-muted block">
                        Social or Emotional Cue Present
                      </span>
                      <p className="text-ink-secondary leading-relaxed">
                        {exchange.socialOrEmotionalCue}
                      </p>
                      <span className="inline-block text-[10px] text-sif-primary font-medium italic mt-1">
                        Confidence: {exchange.cueConfidence}
                      </span>
                    </div>
                  </div>

                  {/* What you did well in this exchange */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-xs text-ink-primary">
                    <span className="font-semibold text-emerald-800 block mb-0.5">
                      ✓ What you did well here:
                    </span>
                    <p className="text-emerald-950 leading-relaxed">{exchange.whatUserDidWell}</p>
                  </div>

                  {/* Coaching Note / Gentle Opportunity */}
                  {exchange.whatMayHaveBeenMissed && (
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-ink-primary">
                      <span className="font-semibold text-amber-800 block mb-0.5">
                        💡 Opportunity to explore:
                      </span>
                      <p className="text-amber-950 leading-relaxed">
                        {exchange.whatMayHaveBeenMissed}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-ink-secondary leading-relaxed italic border-l-2 border-sif-primary pl-3">
                    <span className="font-semibold not-italic text-ink-primary">Coaching note:</span>{' '}
                    {exchange.coachingNote}
                  </p>

                  {/* Multi-Path Alternative Responses */}
                  {exchange.alternativeResponses.length > 0 && (
                    <div className="pt-2 border-t border-canvas-borderSubtle space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                          Stronger Alternative Paths:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {exchange.alternativeResponses.map((alt, altIdx) => (
                            <button
                              key={alt.type}
                              onClick={() => {
                                playCozySound('tap');
                                setSelectedAlternativeIndexByExchange((prev) => ({
                                  ...prev,
                                  [exchange.exchangeIndex]: altIdx,
                                }));
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                                activeAltIdx === altIdx
                                  ? 'bg-sif-primary text-canvas-surface shadow-2xs'
                                  : 'bg-canvas-surface text-ink-secondary hover:bg-canvas-subtle border border-canvas-borderSubtle'
                              }`}
                            >
                              {alt.type === 'empathetic'
                                ? 'Empathetic'
                                : alt.type === 'curious'
                                ? 'Curious'
                                : 'Direct'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Active Alternative Card */}
                      <div className="p-4 rounded-xl bg-canvas-surface border border-sif-border/50 text-xs space-y-2">
                        <div className="font-semibold text-sif-primary">
                          {activeAlternative.label}:
                        </div>
                        <p className="text-ink-primary font-medium italic">
                          "{activeAlternative.response}"
                        </p>
                        <p className="text-ink-muted text-[11px] leading-relaxed pt-1 border-t border-canvas-borderSubtle">
                          <span className="font-semibold text-ink-secondary">Why this works:</span>{' '}
                          {activeAlternative.whyItWorks}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── SECTION 5: SOCIAL AND EMOTIONAL CUES (BROADER PATTERNS) ─────────── */}
        <section
          className="bg-canvas-surface border border-canvas-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-5"
          data-testid="section-social-emotional-cues"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sif-primary">
              5. Social and Emotional Cues
            </span>
            <h2 className="text-lg font-semibold text-ink-primary mt-1">
              Broader Conversational Patterns Across the Session
            </h2>
            <p className="text-xs text-ink-secondary">
              Translating implicit social dynamics into explicit, understandable observations:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Cues Partner Showed */}
            <div className="p-4 rounded-2xl bg-canvas-subtle border border-canvas-borderSubtle space-y-2">
              <span className="font-semibold text-ink-primary block">
                Cues the Partner Showed:
              </span>
              <ul className="space-y-1.5 text-ink-secondary list-disc pl-4">
                {report.socialEmotionalCues.partnerEmotionalCues.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            {/* Cues Recognized Well */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
              <span className="font-semibold text-emerald-900 block">
                Cues You Recognized Well:
              </span>
              <ul className="space-y-1.5 text-ink-primary list-disc pl-4">
                {report.socialEmotionalCues.cuesUserRecognizedWell.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            {/* Recurring Patterns */}
            <div className="sm:col-span-2 p-4 rounded-2xl bg-canvas-subtle border border-canvas-borderSubtle space-y-2">
              <span className="font-semibold text-ink-primary block">
                Recurring Dynamic Patterns:
              </span>
              <ul className="space-y-1.5 text-ink-secondary list-disc pl-4">
                {report.socialEmotionalCues.recurringPatterns.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── SECTION 6: SKILL TAGS AND LEARNING PATTERNS ─────────────────────── */}
        <section
          className="bg-canvas-surface border border-canvas-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-5"
          data-testid="section-skill-tags"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sif-primary">
              6. Skill Tags & Learning Patterns
            </span>
            <h2 className="text-lg font-semibold text-ink-primary mt-1">
              Communication Capabilities Observed
            </h2>
            <p className="text-xs text-ink-secondary">
              Skill tags help you see recurring communication patterns over time, rather than isolated turns.
            </p>
          </div>

          {/* Aggregated Tag Badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            {report.skillTagSummary.skills.map((skill) => (
              <div
                key={skill.tag}
                className="px-3 py-1.5 rounded-xl bg-canvas-subtle border border-canvas-border text-xs flex items-center gap-2"
              >
                <span className="font-semibold text-sif-primary capitalize">#{skill.tag}</span>
                <span className="text-ink-muted text-[11px]">({skill.count}x)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-4 rounded-2xl bg-canvas-subtle border border-canvas-borderSubtle">
              <span className="font-semibold text-emerald-800 block mb-1">
                Strongest Skill Areas:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-ink-secondary">
                {report.skillTagSummary.strongestAreas.map((area, i) => (
                  <li key={i}>{area}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-canvas-subtle border border-canvas-borderSubtle">
              <span className="font-semibold text-sif-primary block mb-1">
                Growth Areas to Practice:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-ink-secondary">
                {report.skillTagSummary.growthAreas.map((area, i) => (
                  <li key={i}>{area}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── SECTION 7: MISSED OPPORTUNITIES (SUPPORTIVE) ────────────────────── */}
        <section
          className="bg-canvas-surface border border-canvas-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-5"
          data-testid="section-missed-opportunities"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sif-primary">
              7. Missed Opportunities for Connection
            </span>
            <h2 className="text-lg font-semibold text-ink-primary mt-1">
              Moments That Could Become Even Stronger
            </h2>
            <p className="text-xs text-ink-secondary">
              Never a punishment list—simply moments where an alternative response could have deepened connection or ease:
            </p>
          </div>

          <div className="space-y-3">
            {report.missedOpportunities.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-canvas-subtle border border-canvas-borderSubtle space-y-2 text-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-semibold text-ink-primary">{item.moment}</span>
                  <span className="px-2 py-0.5 rounded-full bg-sif-primarySubtle text-sif-primary text-[10px] font-semibold uppercase">
                    Principle: {item.demonstratedPrinciple}
                  </span>
                </div>
                <p className="text-ink-secondary">
                  <span className="font-medium text-ink-primary">Why it mattered:</span> {item.whyItMattered}
                </p>
                <div className="p-3 rounded-xl bg-canvas-surface border border-canvas-borderSubtle italic text-ink-primary">
                  {item.strongerReplyExample}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 8: PRACTICE GOALS FOR NEXT TIME ───────────────────────── */}
        <section
          className="bg-canvas-surface border-2 border-sif-border/70 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5"
          data-testid="section-practice-goals"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-sif-primary">
                8. Practice Goals for Next Time
              </span>
              <h2 className="text-lg sm:text-xl font-semibold text-ink-primary mt-1">
                Small, Actionable Goals for Your Next Conversation
              </h2>
            </div>
            <span className="text-xs text-ink-muted">Turn reflection into concrete habits</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {report.practiceGoals.map((goal, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-canvas-subtle border border-canvas-border flex flex-col justify-between gap-4 text-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sif-primary text-canvas-surface font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <h3 className="font-semibold text-ink-primary text-sm">{goal.goal}</h3>
                  </div>

                  <p className="text-ink-secondary leading-relaxed">
                    <span className="font-medium text-ink-primary">Why it helps:</span> {goal.whyItHelped}
                  </p>

                  <div className="p-3 rounded-xl bg-canvas-surface border border-canvas-borderSubtle text-[11px] text-ink-primary">
                    <span className="font-semibold block mb-0.5 text-sif-primary">Response template:</span>
                    "{goal.exampleTemplate}"
                  </div>

                  <p className="text-[11px] text-ink-muted italic">
                    <span className="font-semibold not-italic text-ink-secondary">Challenge:</span>{' '}
                    {goal.nextConversationChallenge}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyGoal(goal.exampleTemplate)}
                  className="w-full py-2 rounded-xl bg-canvas-surface hover:bg-canvas-borderSubtle border border-canvas-border text-ink-primary text-xs font-medium transition text-center"
                >
                  {copiedGoal === goal.exampleTemplate ? '✓ Copied Template!' : '📋 Copy Template'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 9: FULL TRANSCRIPT (COLLAPSIBLE BY DEFAULT) ─────────────── */}
        <section
          className="bg-canvas-surface border border-canvas-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-4"
          data-testid="section-full-transcript"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                9. Original Dialogue
              </span>
              <h2 className="text-base font-semibold text-ink-primary mt-0.5">
                Full Conversation Transcript
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                playCozySound('toggle');
                setIsTranscriptExpanded(!isTranscriptExpanded);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-canvas-subtle hover:bg-canvas-border text-ink-primary border border-canvas-borderSubtle transition"
            >
              {isTranscriptExpanded ? 'Hide Transcript' : `Show Full Transcript (${report.fullTranscript.length} turns)`}
            </button>
          </div>

          {isTranscriptExpanded && (
            <div className="pt-3 border-t border-canvas-borderSubtle space-y-2.5 max-h-96 overflow-y-auto pr-1 animate-fadeIn">
              {report.fullTranscript.map((turn, i) => (
                <div
                  key={turn.id || i}
                  className={`p-3 rounded-xl text-xs ${
                    turn.role === 'partner'
                      ? 'bg-canvas-subtle text-ink-primary'
                      : 'bg-sif-primarySubtle text-ink-primary ml-4'
                  }`}
                >
                  <span className="font-semibold block mb-0.5 text-ink-secondary">
                    {turn.speakerName} ({turn.role === 'partner' ? 'Partner' : 'You'}):
                  </span>
                  <p className="leading-relaxed">{turn.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-canvas-border">
          <button
            onClick={() => {
              playCozySound('tap');
              onReturnDashboard();
            }}
            className="px-5 py-2.5 rounded-xl bg-canvas-surface border border-canvas-border text-ink-primary text-xs font-medium hover:bg-canvas-subtle transition"
          >
            ← Return to Dashboard
          </button>

          <button
            onClick={() => {
              playCozySound('pop');
              onRestartPractice();
            }}
            className="px-6 py-2.5 rounded-xl bg-sif-primary text-canvas-surface text-xs font-semibold hover:bg-sif-primaryHover transition shadow-2xs"
          >
            Practice Another Scenario
          </button>
        </div>
      </div>
    </div>
  );
};
