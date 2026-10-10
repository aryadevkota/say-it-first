/**
 * CoRegulationModal.tsx — Presentation Component
 *
 * Tier 3 Curtain Drop safety overlay triggered automatically when Tension Index T >= 9.0.
 * Halts simulation and guides a 4-count visual box breathing cycle (FR-07).
 */

import React, { useState, useEffect } from 'react';

export interface CoRegulationModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onExitScenario: () => void;
}

type BreathPhase = 'Inhale' | 'Hold (Full)' | 'Exhale' | 'Hold (Empty)';

export const CoRegulationModal: React.FC<CoRegulationModalProps> = ({
  isOpen,
  onComplete,
  onExitScenario,
}) => {
  const [phase, setPhase] = useState<BreathPhase>('Inhale');
  const [countdown, setCountdown] = useState<number>(4);
  const [totalSecondsLeft, setTotalSecondsLeft] = useState<number>(30);

  useEffect(() => {
    if (!isOpen) {
      setTotalSecondsLeft(30);
      setCountdown(4);
      setPhase('Inhale');
      return;
    }

    const interval = setInterval(() => {
      setTotalSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });

      setCountdown((prevCount) => {
        if (prevCount <= 1) {
          setPhase((currentPhase) => {
            switch (currentPhase) {
              case 'Inhale':
                return 'Hold (Full)';
              case 'Hold (Full)':
                return 'Exhale';
              case 'Exhale':
                return 'Hold (Empty)';
              case 'Hold (Empty)':
                return 'Inhale';
            }
          });
          return 4;
        }
        return prevCount - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-slate-100"
      data-testid="co-regulation-modal"
    >
      <div className="flex flex-col items-center max-w-md w-full bg-[#1A2232] border border-slate-700 p-8 rounded-3xl shadow-2xl text-center">
        {/* Break-Character Notice */}
        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
          Safety Soft-Brake • Curtain Drop
        </span>

        <h2 className="text-xl font-bold mb-2 text-slate-100">
          Let's Step Out for a Breath Reset
        </h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          The interaction reached a high-friction threshold. We've stepped out of the scenario
          for a 30-second guided 4-count box breath.
        </p>

        {/* 4-Count Box Breathing Ring */}
        <div className="relative w-44 h-44 flex items-center justify-center my-4">
          <div
            className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-1000 ${
              phase === 'Inhale'
                ? 'scale-110 border-emerald-400 bg-emerald-500/10'
                : phase === 'Exhale'
                ? 'scale-90 border-blue-400 bg-blue-500/10'
                : 'scale-100 border-purple-400 bg-purple-500/10'
            }`}
            data-testid="breathing-ring"
          >
            <span className="text-sm font-semibold text-slate-200">{phase}</span>
            <span className="text-3xl font-extrabold text-emerald-400 mt-1">{countdown}s</span>
          </div>
        </div>

        <div className="text-xs text-slate-400 mt-4 mb-6">
          Reset completes in: <span className="font-semibold text-slate-200">{totalSecondsLeft}s</span>
        </div>

        {/* Action Controls */}
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onExitScenario}
            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
            data-testid="exit-scenario-btn"
          >
            Exit Scenario
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors"
            data-testid="resume-btn"
          >
            Resume Practice
          </button>
        </div>
      </div>
    </div>
  );
};
