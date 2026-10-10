/**
 * SubtextHud.tsx — Presentation Component
 *
 * Renders the Two-Way Bridge, Unspoken Thought Bubble, and Tactile Scaffolding Dial.
 * Strict DOM Visibility Guard: Guarantees zero subtext leakage when Level 0 is active (FR-05).
 */

import React from 'react';
import type { TwoWayBridge } from '../../domain/entities/TwoWayBridge';
import {
  type ScaffoldingLevel,
  ScaffoldingLevel as ScaffoldingLevelEnum,
  shouldShowSubtext,
  shouldShowNonverbalBadges,
} from '../../domain/value-objects/ScaffoldingLevel';

export interface SubtextHudProps {
  twoWayBridge?: TwoWayBridge;
  unspokenSubtext?: string;
  postureCue?: string;
  scaffoldingLevel: ScaffoldingLevel;
  onScaffoldingChange: (level: ScaffoldingLevel) => void;
}

export const SubtextHud: React.FC<SubtextHudProps> = ({
  twoWayBridge,
  unspokenSubtext,
  postureCue = 'Neutral grounded posture',
  scaffoldingLevel,
  onScaffoldingChange,
}) => {
  const showSubtext = shouldShowSubtext(scaffoldingLevel);
  const showBadges = shouldShowNonverbalBadges(scaffoldingLevel);

  return (
    <div
      className="flex flex-col gap-4 p-5 bg-[#1A2232] rounded-2xl border border-slate-800 text-slate-100 shadow-xl"
      data-testid="subtext-hud-container"
    >
      {/* Header & Scaffolding Dial Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-200">Subtext & Perspective Lab</h3>

        {/* Tactile Scaffolding Dial */}
        <div
          className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-700/60"
          data-testid="scaffolding-dial"
        >
          <button
            type="button"
            onClick={() => onScaffoldingChange(ScaffoldingLevelEnum.LEVEL_0_REALITY)}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              scaffoldingLevel === ScaffoldingLevelEnum.LEVEL_0_REALITY
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            data-testid="dial-level-0"
          >
            0% Reality
          </button>
          <button
            type="button"
            onClick={() => onScaffoldingChange(ScaffoldingLevelEnum.LEVEL_1_HINTS)}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              scaffoldingLevel === ScaffoldingLevelEnum.LEVEL_1_HINTS
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            data-testid="dial-level-1"
          >
            50% Hints
          </button>
          <button
            type="button"
            onClick={() => onScaffoldingChange(ScaffoldingLevelEnum.LEVEL_2_XRAY)}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              scaffoldingLevel === ScaffoldingLevelEnum.LEVEL_2_XRAY
                ? 'bg-[#8B5CF6] text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            data-testid="dial-level-2"
          >
            100% X-Ray
          </button>
        </div>
      </div>

      {/* Nonverbal Badges (Shown at Level 1 and Level 2) */}
      {showBadges && (
        <div className="flex items-center gap-2" data-testid="nonverbal-badge-container">
          <span className="text-xs bg-slate-800 text-indigo-300 px-3 py-1 rounded-full border border-slate-700/60 font-medium">
            Visual Cue: {postureCue}
          </span>
        </div>
      )}

      {/* Full Subtext & Two-Way Bridge (STRICTLY SHOWN ONLY AT LEVEL 2) */}
      {showSubtext ? (
        <div className="flex flex-col gap-3" data-testid="full-subtext-section">
          {/* Unspoken Thought Bubble */}
          {unspokenSubtext && (
            <div
              className="p-3.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-xl"
              data-testid="thought-bubble"
            >
              <div className="text-xs font-semibold text-[#8B5CF6] mb-1 uppercase tracking-wide">
                Unspoken Thought Bubble
              </div>
              <p className="text-sm text-purple-100 italic">"{unspokenSubtext}"</p>
            </div>
          )}

          {/* Two-Way Bridge */}
          {twoWayBridge && (
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
              data-testid="two-way-bridge-section"
            >
              {/* User Stated Intent */}
              <div className="p-3 bg-slate-900/80 border border-slate-700/70 rounded-xl">
                <div className="text-xs font-semibold text-emerald-400 mb-1 uppercase tracking-wide">
                  Your Stated Intent
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {twoWayBridge.userIntent}
                </p>
              </div>

              {/* Received Pragmatic Impact */}
              <div className="p-3 bg-slate-900/80 border border-slate-700/70 rounded-xl">
                <div className="text-xs font-semibold text-amber-400 mb-1 uppercase tracking-wide">
                  Received As (Neurotypical)
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {twoWayBridge.receivedImpact}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Zero Subtext Leakage in DOM when not Level 2 (FR-05) */
        <div
          className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-800"
          data-testid="subtext-hidden-placeholder"
        >
          {scaffoldingLevel === ScaffoldingLevelEnum.LEVEL_0_REALITY
            ? 'Reality Mode Active — Subtext is fully hidden.'
            : 'Hint Mode Active — Subtext hidden, physical cues enabled.'}
        </div>
      )}
    </div>
  );
};
