/**
 * AvatarSvgRig.tsx — Presentation Component
 *
 * Parametric 2D Vector/SVG Avatar Rig modulated via deterministic VAD kinematics.
 * Specification: say_it_first_system_architecture_manual.md §3.4, ADR-004
 */

import React, { useMemo } from 'react';
import type { AffectVector } from '../../domain/entities/AffectVector';
import { computeAvatarKinematics } from '../../domain/services/AvatarKinematicsService';

export interface AvatarSvgRigProps {
  currentVad: AffectVector;
  postureCue?: string;
  spokenCaption?: string;
  reducedMotion?: boolean;
}

export const AvatarSvgRig: React.FC<AvatarSvgRigProps> = ({
  currentVad,
  postureCue = 'Neutral grounded posture',
  spokenCaption,
  reducedMotion = false,
}) => {
  const kinematics = useMemo(
    () => computeAvatarKinematics(currentVad, postureCue),
    [currentVad, postureCue],
  );

  // Bezier curve mouth: Start (60, 140), Control Point (100, 140 + curvature), End (140, 140)
  const mouthPath = useMemo(() => {
    const cpY = 140 + kinematics.mouthCurvature;
    return `M 70 140 Q 100 ${cpY} 130 140`;
  }, [kinematics.mouthCurvature]);

  // Breathing animation style
  const breathingDuration = reducedMotion ? '0s' : `${kinematics.breathingCycleSec}s`;

  return (
    <div
      className="flex flex-col items-center justify-center p-6 bg-[#1A2232] rounded-2xl border border-slate-800 text-slate-100 shadow-xl"
      data-testid="avatar-rig-container"
    >
      <div
        className="relative w-64 h-64 flex items-center justify-center"
        style={{
          transform: `rotate(${kinematics.posturalRotationDeg}deg)`,
          transition: reducedMotion ? 'none' : 'transform 200ms linear',
        }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          data-testid="avatar-svg"
          aria-label="Interactive Parametric Avatar"
        >
          {/* Breathing Torso Anchor */}
          <g
            style={{
              animation: reducedMotion ? 'none' : `breathe ${breathingDuration} infinite ease-in-out`,
            }}
          >
            {/* Torso */}
            <path
              d="M 50 190 Q 100 160 150 190 L 160 200 L 40 200 Z"
              fill="#243048"
              stroke="#334155"
              strokeWidth="2"
            />

            {/* Head */}
            <circle
              cx="100"
              cy="100"
              r="55"
              fill="#1E293B"
              stroke="#475569"
              strokeWidth="3"
            />

            {/* Left Eyebrow */}
            <line
              x1="65"
              y1="75"
              x2="90"
              y2="75"
              stroke="#94A3B8"
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${kinematics.browAngle}, 77.5, 75)`}
              data-testid="left-brow"
            />

            {/* Right Eyebrow */}
            <line
              x1="110"
              y1="75"
              x2="135"
              y2="75"
              stroke="#94A3B8"
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${-kinematics.browAngle}, 122.5, 75)`}
              data-testid="right-brow"
            />

            {/* Eyes */}
            <ellipse cx="78" cy="95" rx="5" ry="6" fill="#F8FAFC" />
            <ellipse cx="122" cy="95" rx="5" ry="6" fill="#F8FAFC" />
            <circle cx="78" cy="95" r="3" fill="#0F172A" />
            <circle cx="122" cy="95" r="3" fill="#0F172A" />

            {/* Parametric Mouth Bezier Curve */}
            <path
              d={mouthPath}
              fill="none"
              stroke="#F43F5E"
              strokeWidth="4"
              strokeLinecap="round"
              data-testid="mouth-path"
            />
          </g>
        </svg>
      </div>

      {/* Live Nonverbal Cue Pill */}
      <div
        className="mt-4 px-3 py-1.5 bg-slate-900/80 border border-slate-700/60 rounded-full text-xs font-medium text-slate-300"
        data-testid="posture-cue-pill"
      >
        <span>Posture: {kinematics.postureCue}</span>
      </div>

      {/* Spoken Dialogue Caption */}
      {spokenCaption && (
        <div
          className="mt-4 p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 max-w-sm text-center"
          data-testid="spoken-caption"
        >
          <p className="italic">"{spokenCaption}"</p>
        </div>
      )}
    </div>
  );
};
