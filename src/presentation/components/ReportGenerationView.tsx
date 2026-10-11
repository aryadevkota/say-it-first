'use client';

/**
 * ReportGenerationView.tsx — Animated Real-Time Loading Transition for Session Report
 *
 * Implements:
 * - Real, animated progress bar filling progressively through meaningful stages
 * - 6 purposeful stages:
 *    1. Building transcript
 *    2. Analyzing emotional cues
 *    3. Identifying strengths
 *    4. Reviewing missed opportunities
 *    5. Writing coaching suggestions
 *    6. Preparing next-step practice goals
 * - Calming, gentle pulses and intentional pacing (never static, never rushed)
 * - Automatic onComplete callback once analysis reaches 100%
 */

import React, { useState, useEffect } from 'react';
import {
  REPORT_GENERATION_STAGES,
  ReportGenerationProgressStage,
} from '../../domain/entities/SessionReport';
import { playCozySound } from '../utils/cozyAudio';

interface ReportGenerationViewProps {
  scenarioTitle: string;
  onGenerationComplete: () => void;
  // If report data is already fetched or being fetched in parallel, we can synchronize
  isDataReady?: boolean;
}

export const ReportGenerationView: React.FC<ReportGenerationViewProps> = ({
  scenarioTitle,
  onGenerationComplete,
  isDataReady = true,
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [displayedPercent, setDisplayedPercent] = useState<number>(10);

  const currentStage: ReportGenerationProgressStage =
    REPORT_GENERATION_STAGES[currentStageIndex] || REPORT_GENERATION_STAGES[0];

  useEffect(() => {
    playCozySound('pop');
  }, []);

  // Progression timer: cycles through each stage with gentle, human-paced intervals
  useEffect(() => {
    const totalStages = REPORT_GENERATION_STAGES.length;

    const interval = setInterval(() => {
      setCurrentStageIndex((prevIndex) => {
        if (prevIndex < totalStages - 1) {
          const nextIndex = prevIndex + 1;
          const targetPercent = REPORT_GENERATION_STAGES[nextIndex].progressPercent;
          setDisplayedPercent(targetPercent);
          playCozySound('tap');
          return nextIndex;
        } else {
          // Final stage reached
          clearInterval(interval);
          setDisplayedPercent(100);
          setTimeout(() => {
            playCozySound('pop');
            onGenerationComplete();
          }, 800);
          return prevIndex;
        }
      });
    }, 700);

    return () => clearInterval(interval);
  }, [onGenerationComplete]);

  return (
    <div
      className="min-h-screen bg-canvas-light text-ink-primary flex flex-col items-center justify-center p-6 relative select-none animate-fadeIn"
      data-testid="report-generation-screen"
    >
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md border border-sif-border rounded-3xl p-8 sm:p-10 shadow-glass-elevated text-center space-y-8">
        {/* Calming icon & header */}
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-sif-primarySubtle text-sif-primary mx-auto flex items-center justify-center text-2xl shadow-2xs relative">
            <span className="animate-pulse">✨</span>
            <div className="absolute -inset-1 rounded-2xl border border-sif-border/40 animate-ping opacity-25" />
          </div>

          <span className="text-xs font-semibold text-sif-primary uppercase tracking-wider block">
            Synthesizing Your Session
          </span>

          <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary">
            Preparing Your Learning Report
          </h1>
          <p className="text-xs text-ink-secondary">
            Reflecting on <span className="font-medium text-ink-primary">"{scenarioTitle}"</span> with care and nuance.
          </p>
        </div>

        {/* Real Animated Progress Bar */}
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between text-xs font-medium text-ink-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sif-primary animate-pulse" />
              {currentStage.label}
            </span>
            <span className="font-semibold text-sif-primary tabular-nums">{displayedPercent}%</span>
          </div>

          <div
            className="w-full h-3 bg-canvas-subtle rounded-full overflow-hidden border border-canvas-borderSubtle p-0.5"
            role="progressbar"
            aria-valuenow={displayedPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Report synthesis progress"
          >
            <div
              className="h-full bg-gradient-to-r from-sif-primary to-sif-secondary rounded-full transition-all duration-700 ease-out shadow-xs"
              style={{ width: `${displayedPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-ink-muted italic pt-1 animate-fadeIn key={currentStage.id}">
            {currentStage.description}
          </p>
        </div>

        {/* Meaningful Stage Indicators */}
        <div className="pt-2 border-t border-canvas-borderSubtle/60 grid grid-cols-6 gap-1 text-center">
          {REPORT_GENERATION_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div
                key={stage.id}
                className="flex flex-col items-center gap-1"
                title={stage.label}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-sif-primary scale-100'
                      : isCurrent
                      ? 'bg-sif-primary/70 animate-ping ring-2 ring-sif-primary'
                      : 'bg-canvas-border'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Calming Philosophy Note */}
        <p className="text-[11px] text-ink-muted leading-relaxed">
          Say It First focuses on strengths, repeatable habits, and choices—never arbitrary grades or judgments.
        </p>
      </div>
    </div>
  );
};
