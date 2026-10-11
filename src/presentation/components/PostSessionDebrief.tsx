/**
 * PostSessionDebrief.tsx — Presentation Component
 *
 * Post-session synthesis screen displaying clinical debrief and
 * a one-click copyable 2-sentence DBT DEAR MAN Pocket Script (FR-08).
 */

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { PocketScriptResult } from '../../application/use-cases/GeneratePocketScriptUseCase';

export interface PostSessionDebriefProps {
  pocketScript: PocketScriptResult;
  onRestart: () => void;
}

export const PostSessionDebrief: React.FC<PostSessionDebriefProps> = ({
  pocketScript,
  onRestart,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(pocketScript.actionableScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className="flex flex-col gap-6 p-8 bg-[#1A2232] rounded-3xl border border-slate-700/80 text-slate-100 max-w-2xl mx-auto shadow-2xl"
      data-testid="post-session-debrief-container"
    >
      {/* Header */}
      <div>
        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
          Practice Complete • Pocket Script Blueprint
        </span>
        <h2 className="text-2xl font-bold mt-3 text-slate-100">
          Your Actionable Script for the Real World
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Synthesized using the {pocketScript.clinicalFramework}.
        </p>
      </div>

      {/* Main Copyable Script Card */}
      <div className="p-5 bg-gradient-to-br from-slate-900 to-[#1e1e38] border border-[#8B5CF6]/40 rounded-2xl relative shadow-lg">
        <div className="text-xs font-semibold text-[#8B5CF6] mb-2 uppercase tracking-wide">
          2-Sentence Actionable Pocket Script
        </div>
        <p
          className="text-base text-purple-100 font-medium leading-relaxed"
          data-testid="actionable-script-text"
        >
          "{pocketScript.actionableScript}"
        </p>

        <button
          type="button"
          onClick={handleCopy}
          className="mt-4 px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          data-testid="copy-script-btn"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-300" />
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy to Clipboard</span>
            </>
          )}
        </button>
      </div>

      {/* Debrief Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
          <div className="text-xs font-semibold text-emerald-400 mb-1 uppercase tracking-wide">
            Your Core Boundary / Intent
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {pocketScript.underlyingIntent}
          </p>
        </div>

        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
          <div className="text-xs font-semibold text-amber-400 mb-1 uppercase tracking-wide">
            Social Friction Neutralized
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {pocketScript.neurotypicalImpactNeutralized}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onRestart}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
          data-testid="restart-btn"
        >
          Practice Another Scenario
        </button>
      </div>
    </div>
  );
};
