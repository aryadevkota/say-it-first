'use client';

/**
 * EvaPresentationView.tsx — Scenario-Aware Visual Presentation Component
 *
 * Renders Eva with scenario-specific wardrobe and environment while maintaining
 * strict identity consistency (facial features, hair color, eye color, and presence).
 *
 * Scenarios:
 * - Professional / Interview: Tailored business blazer with modern office background.
 * - Coffee Chat / Social: Comfortable knit turtleneck with warm coffee shop background.
 * - Boundaries / Difficult: Smart-casual blazer with calm library/study background.
 * - Healthcare / Appointment: Clinical professional attire with consultation room.
 * - Everyday / Casual: Comfortable warm knitwear with airy ambient lounge.
 */

import React, { useState } from 'react';
import type { EvaScenarioPresentation } from '../../domain/entities/EvaScenarioPresentation';

export interface EvaPresentationViewProps {
  presentation: EvaScenarioPresentation;
  partnerState: 'listening' | 'speaking' | 'thinking' | 'neutral' | 'receptive';
  partnerName: string;
  partnerRole: string;
  isSpeakingAudio?: boolean;
  className?: string;
}

export const EvaPresentationView: React.FC<EvaPresentationViewProps> = ({
  presentation,
  partnerState,
  partnerName,
  partnerRole,
  isSpeakingAudio = false,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const isSpeaking = partnerState === 'speaking' || isSpeakingAudio;
  const isThinking = partnerState === 'thinking';

  // State-driven mouth and eye offsets
  const mouthOpen = isSpeaking;
  const eyeOffset = isThinking ? -2 : 0; // slight upward gaze when reflecting

  return (
    <div
      className={`w-full max-w-lg aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden relative shadow-md border border-canvas-border flex flex-col justify-between transition-all select-none ${className}`}
      aria-label={presentation.visualSummary}
    >
      {/* ── Environment Backdrop (SVG + Gradients) ─────────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <svg
          className="w-full h-full object-cover"
          viewBox="0 0 600 450"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Background Gradients */}
            <linearGradient id="office-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="60%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            <linearGradient id="coffee-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2A1B12" />
              <stop offset="60%" stopColor="#3D2619" />
              <stop offset="100%" stopColor="#1C120C" />
            </linearGradient>

            <linearGradient id="study-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#12221A" />
              <stop offset="60%" stopColor="#1B3327" />
              <stop offset="100%" stopColor="#0E1A14" />
            </linearGradient>

            <linearGradient id="consultation-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#091E1D" />
              <stop offset="60%" stopColor="#133633" />
              <stop offset="100%" stopColor="#0B1C1B" />
            </linearGradient>

            <linearGradient id="lounge-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E242B" />
              <stop offset="60%" stopColor="#2F3842" />
              <stop offset="100%" stopColor="#191F26" />
            </linearGradient>

            {/* Ambient Lighting Gradients */}
            <radialGradient id="warm-lamp-glow" cx="50%" cy="30%" r="50%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="diffused-daylight" cx="30%" cy="20%" r="60%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </radialGradient>

            {/* Eva Skin & Hair Gradients */}
            <radialGradient id="eva-skin" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#FCE3D0" />
              <stop offset="70%" stopColor="#F5CEB2" />
              <stop offset="100%" stopColor="#E2AC8D" />
            </radialGradient>

            <linearGradient id="eva-hair" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#874324" />
              <stop offset="45%" stopColor="#6C331B" />
              <stop offset="85%" stopColor="#4F2312" />
              <stop offset="100%" stopColor="#3B180A" />
            </linearGradient>

            <linearGradient id="eva-hair-highlight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A85732" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#C46E44" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#874324" stopOpacity="0.7" />
            </linearGradient>

            {/* Wardrobe Gradients */}
            <linearGradient id="suit-navy" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            <linearGradient id="turtleneck-knit" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F5EFE6" />
              <stop offset="50%" stopColor="#E8DDCD" />
              <stop offset="100%" stopColor="#D4C5B0" />
            </linearGradient>

            <linearGradient id="smart-blazer" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#44553E" />
              <stop offset="100%" stopColor="#2E3C29" />
            </linearGradient>

            <linearGradient id="clinical-coat" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#195450" />
              <stop offset="100%" stopColor="#0F3835" />
            </linearGradient>

            <linearGradient id="casual-knit" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#607264" />
              <stop offset="100%" stopColor="#465449" />
            </linearGradient>
          </defs>

          {/* Background Layer by Archetype */}
          {presentation.background === 'office' && (
            <g id="bg-office">
              <rect width="600" height="450" fill="url(#office-bg)" />
              <rect width="600" height="450" fill="url(#diffused-daylight)" />
              {/* Modern architectural glass and timber panels */}
              <line x1="120" y1="0" x2="120" y2="450" stroke="#475569" strokeWidth="1.5" strokeOpacity="0.4" />
              <line x1="280" y1="0" x2="280" y2="450" stroke="#475569" strokeWidth="1" strokeOpacity="0.3" />
              <line x1="440" y1="0" x2="440" y2="450" stroke="#475569" strokeWidth="1.5" strokeOpacity="0.4" />
              {/* Subtle architectural horizontal transom */}
              <line x1="0" y1="120" x2="600" y2="120" stroke="#475569" strokeWidth="1" strokeOpacity="0.25" />
              {/* Oak wood slat accent on right */}
              <rect x="490" y="0" width="110" height="450" fill="#2E2319" opacity="0.4" />
              <line x1="510" y1="0" x2="510" y2="450" stroke="#78553E" strokeWidth="2" strokeOpacity="0.3" />
              <line x1="540" y1="0" x2="540" y2="450" stroke="#78553E" strokeWidth="2" strokeOpacity="0.3" />
              <line x1="570" y1="0" x2="570" y2="450" stroke="#78553E" strokeWidth="2" strokeOpacity="0.3" />
            </g>
          )}

          {presentation.background === 'coffee-shop' && (
            <g id="bg-coffee-shop">
              <rect width="600" height="450" fill="url(#coffee-bg)" />
              <rect width="600" height="450" fill="url(#warm-lamp-glow)" />
              {/* Hanging warm pendant lamps */}
              <line x1="100" y1="0" x2="100" y2="90" stroke="#78553E" strokeWidth="2" />
              <circle cx="100" cy="95" r="16" fill="#F59E0B" opacity="0.85" />
              <circle cx="100" cy="95" r="28" fill="#F59E0B" opacity="0.25" />

              <line x1="500" y1="0" x2="500" y2="70" stroke="#78553E" strokeWidth="2" />
              <circle cx="500" cy="75" r="14" fill="#F59E0B" opacity="0.8" />
              <circle cx="500" cy="75" r="24" fill="#F59E0B" opacity="0.2" />

              {/* Timber cafe shelving */}
              <rect x="0" y="160" width="160" height="10" rx="3" fill="#452718" opacity="0.6" />
              <rect x="0" y="240" width="160" height="10" rx="3" fill="#452718" opacity="0.6" />
              <rect x="25" y="140" width="20" height="20" rx="2" fill="#8C5C3D" opacity="0.5" />
              <rect x="55" y="135" width="15" height="25" rx="2" fill="#6B442A" opacity="0.5" />
            </g>
          )}

          {presentation.background === 'quiet-study' && (
            <g id="bg-quiet-study">
              <rect width="600" height="450" fill="url(#study-bg)" />
              {/* Warm library shelves */}
              <rect x="0" y="0" width="140" height="450" fill="#1C150F" opacity="0.75" />
              <rect x="460" y="0" width="140" height="450" fill="#1C150F" opacity="0.75" />
              {/* Book spine silhouettes */}
              {[40, 70, 100, 130, 180, 210, 240, 270, 320, 350, 380].map((y, i) => (
                <React.Fragment key={i}>
                  <rect x="15" y={y} width="110" height="22" rx="2" fill={i % 2 === 0 ? '#2E4738' : '#734E2E'} opacity="0.45" />
                  <rect x="475" y={y} width="110" height="22" rx="2" fill={i % 3 === 0 ? '#3F5B4B' : '#6A4A32'} opacity="0.45" />
                </React.Fragment>
              ))}
              {/* Study reading light halo */}
              <circle cx="300" cy="120" r="180" fill="#10B981" opacity="0.08" />
            </g>
          )}

          {presentation.background === 'consultation-room' && (
            <g id="bg-consultation-room">
              <rect width="600" height="450" fill="url(#consultation-bg)" />
              <rect width="600" height="450" fill="url(#diffused-daylight)" />
              {/* Soft vertical window blind slats */}
              {[60, 90, 120, 150, 180, 210].map((x, i) => (
                <line key={i} x1={x} y1="0" x2={x} y2="450" stroke="#1E4745" strokeWidth="12" strokeOpacity="0.45" />
              ))}
              {/* Minimalist peace lily silhouette on right */}
              <ellipse cx="520" cy="380" rx="35" ry="50" fill="#0E2D2A" opacity="0.8" />
              <path d="M 520 340 Q 535 280 545 260" stroke="#14B8A6" strokeWidth="2" strokeOpacity="0.5" fill="none" />
              <ellipse cx="545" cy="255" rx="10" ry="16" fill="#F0FDF4" opacity="0.2" />
            </g>
          )}

          {presentation.background === 'warm-lounge' && (
            <g id="bg-warm-lounge">
              <rect width="600" height="450" fill="url(#lounge-bg)" />
              <circle cx="200" cy="180" r="220" fill="#F59E0B" opacity="0.12" />
              {/* Sheer daylight curtains on left */}
              <path d="M 0 0 C 40 100, 20 250, 60 450 L 0 450 Z" fill="#4B5563" opacity="0.3" />
              <path d="M 50 0 C 80 120, 65 280, 100 450 L 0 450 Z" fill="#9CA3AF" opacity="0.15" />
              {/* Potted monstera foliage right */}
              <circle cx="530" cy="380" r="60" fill="#1C2D22" opacity="0.7" />
              <circle cx="560" cy="330" r="45" fill="#2A4333" opacity="0.6" />
            </g>
          )}

          {/* ── Eva's Consistent Identity & Portrait ─────────────────────── */}
          <g id="eva-avatar" transform="translate(0, 10)">
            {/* Vocal Aura Rings (When Speaking) */}
            {isSpeaking && (
              <g id="speaking-pulse">
                <circle cx="300" cy="200" r="140" fill="none" stroke="#2DD4BF" strokeWidth="2" opacity="0.3" className="animate-ping" />
                <circle cx="300" cy="200" r="170" fill="none" stroke="#2DD4BF" strokeWidth="1.5" opacity="0.2" />
              </g>
            )}

            {/* Back Hair Volume (Auburn-Brown, Shoulder Length) */}
            <path
              d="M 205 160 C 190 230, 175 320, 220 370 C 235 385, 260 380, 270 340 L 330 340 C 340 380, 365 385, 380 370 C 425 320, 410 230, 395 160 C 380 90, 220 90, 205 160 Z"
              fill="url(#eva-hair)"
            />

            {/* Neck & Chest Underlay */}
            <path d="M 270 230 L 270 290 C 270 300, 330 300, 330 290 L 330 230 Z" fill="url(#eva-skin)" />
            {/* Neck Shadow */}
            <path d="M 270 230 C 290 250, 310 250, 330 230 L 330 248 C 310 262, 290 262, 270 248 Z" fill="#D4A385" opacity="0.5" />

            {/* Wardrobe Base & Shoulders */}
            {/* 1. Professional Business Attire */}
            {presentation.outfit === 'business-attire' && (
              <g id="wardrobe-business">
                {/* Inner Silk Blouse */}
                <path d="M 275 270 L 300 320 L 325 270 Z" fill="#F8FAFC" />
                {/* Silver Pendant */}
                <path d="M 285 275 Q 300 298 315 275" stroke="#CBD5E1" strokeWidth="1.2" fill="none" />
                <circle cx="300" cy="298" r="3" fill="#E2E8F0" />
                {/* Tailored Navy Blazer Body */}
                <path
                  d="M 180 440 L 195 310 C 215 285, 255 280, 275 275 L 300 360 L 325 275 C 345 280, 385 285, 405 310 L 420 440 Z"
                  fill="url(#suit-navy)"
                />
                {/* Blazer Lapels */}
                <path d="M 255 280 L 285 350 L 300 350 L 275 275 Z" fill="#0F172A" />
                <path d="M 345 280 L 315 350 L 300 350 L 325 275 Z" fill="#0F172A" />
                <line x1="300" y1="360" x2="300" y2="440" stroke="#334155" strokeWidth="1.5" />
              </g>
            )}

            {/* 2. Knit Turtleneck */}
            {presentation.outfit === 'turtleneck' && (
              <g id="wardrobe-turtleneck">
                {/* Shoulders */}
                <path
                  d="M 180 440 L 195 320 C 215 295, 250 285, 270 280 L 330 280 C 350 285, 385 295, 405 320 L 420 440 Z"
                  fill="url(#turtleneck-knit)"
                />
                {/* Ribbed Collar Fold */}
                <rect x="268" y="242" width="64" height="42" rx="10" fill="url(#turtleneck-knit)" stroke="#C8BAA5" strokeWidth="1.5" />
                {/* Ribbing texture lines */}
                {[276, 284, 292, 300, 308, 316, 324].map((rx, idx) => (
                  <line key={idx} x1={rx} y1="244" x2={rx} y2="282" stroke="#B8A994" strokeWidth="1.2" strokeOpacity="0.7" />
                ))}
              </g>
            )}

            {/* 3. Smart-Casual Blazer */}
            {presentation.outfit === 'smart-casual' && (
              <g id="wardrobe-smart-casual">
                {/* Sand Inner Top */}
                <path d="M 270 270 C 285 295, 315 295, 330 270 L 330 330 L 270 330 Z" fill="#EAE0D3" />
                {/* Earthy Olive Blazer */}
                <path
                  d="M 180 440 L 195 315 C 215 290, 250 282, 270 275 L 300 355 L 330 275 C 350 282, 385 290, 405 315 L 420 440 Z"
                  fill="url(#smart-blazer)"
                />
                {/* Soft unstructured lapels */}
                <path d="M 255 285 L 285 348 L 300 348 L 270 275 Z" fill="#253221" />
                <path d="M 345 285 L 315 348 L 300 348 L 330 275 Z" fill="#253221" />
              </g>
            )}

            {/* 4. Clinical Professional Attire */}
            {presentation.outfit === 'clinical-professional' && (
              <g id="wardrobe-clinical">
                {/* Inner Clean Blouse */}
                <path d="M 275 270 L 300 310 L 325 270 Z" fill="#E0F2FE" />
                {/* Tailored Eucalyptus Consultation Coat */}
                <path
                  d="M 180 440 L 195 310 C 215 285, 255 280, 275 270 L 300 360 L 325 270 C 345 280, 385 285, 405 310 L 420 440 Z"
                  fill="url(#clinical-coat)"
                />
                {/* Structured Lapels */}
                <path d="M 255 280 L 288 352 L 300 352 L 275 270 Z" fill="#0C2C2A" />
                <path d="M 345 280 L 312 352 L 300 352 L 325 270 Z" fill="#0C2C2A" />
                {/* ID badge contour on pocket */}
                <rect x="220" y="340" width="28" height="38" rx="3" fill="#0B2422" stroke="#14B8A6" strokeWidth="1" />
                <rect x="226" y="348" width="16" height="5" rx="1" fill="#14B8A6" opacity="0.8" />
              </g>
            )}

            {/* 5. Casual Knitwear */}
            {presentation.outfit === 'casual-knitwear' && (
              <g id="wardrobe-knitwear">
                {/* Relaxed Sage Knit Body */}
                <path
                  d="M 180 440 L 195 320 C 215 290, 255 280, 270 278 C 285 292, 315 292, 330 278 C 345 280, 385 290, 405 320 L 420 440 Z"
                  fill="url(#casual-knit)"
                />
                {/* Soft Crew Neck Rib */}
                <path
                  d="M 270 276 C 285 294, 315 294, 330 276"
                  stroke="#3A463D"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            )}

            {/* Eva Face (Oval, Realistic Soft Contours) */}
            <path
              d="M 240 160 C 238 215, 255 255, 300 255 C 345 255, 362 215, 360 160 C 358 115, 242 115, 240 160 Z"
              fill="url(#eva-skin)"
            />
            {/* Cheekbone and blush warmth */}
            <circle cx="262" cy="188" r="16" fill="#F49E86" opacity="0.32" />
            <circle cx="338" cy="188" r="16" fill="#F49E86" opacity="0.32" />

            {/* Realistic Hazel-Brown Eyes */}
            <g id="eva-eyes" transform={`translate(0, ${eyeOffset})`}>
              {/* Left Eye */}
              <ellipse cx="272" cy="170" rx="11" ry="7.5" fill="#FFFFFF" />
              <circle cx="273" cy="170" r="5" fill="#6B4628" />
              <circle cx="273" cy="170" r="2.8" fill="#1C140D" />
              <circle cx="271.5" cy="168" r="1.5" fill="#FFFFFF" />
              <circle cx="274.5" cy="171.5" r="0.8" fill="#FFFFFF" opacity="0.8" />
              <path d="M 260 170 Q 272 161 284 170" stroke="#3A2114" strokeWidth="1.8" fill="none" />

              {/* Right Eye */}
              <ellipse cx="328" cy="170" rx="11" ry="7.5" fill="#FFFFFF" />
              <circle cx="327" cy="170" r="5" fill="#6B4628" />
              <circle cx="327" cy="170" r="2.8" fill="#1C140D" />
              <circle cx="325.5" cy="168" r="1.5" fill="#FFFFFF" />
              <circle cx="328.5" cy="171.5" r="0.8" fill="#FFFFFF" opacity="0.8" />
              <path d="M 316 170 Q 328 161 340 170" stroke="#3A2114" strokeWidth="1.8" fill="none" />

              {/* Defined Natural Eyebrows */}
              <path d="M 258 158 Q 272 151 286 156" stroke="#4F2615" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 314 156 Q 328 151 342 158" stroke="#4F2615" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </g>

            {/* Natural Nose */}
            <path d="M 299 168 L 297 195 Q 300 200 304 195" stroke="#D19A78" strokeWidth="1.5" fill="none" />
            <circle cx="295" cy="196" r="1.2" fill="#BA8262" opacity="0.6" />
            <circle cx="305" cy="196" r="1.2" fill="#BA8262" opacity="0.6" />

            {/* Natural Rose Lips with Dynamic Expression */}
            <g id="eva-mouth">
              {mouthOpen ? (
                // Speaking expression
                <g>
                  <path d="M 284 218 Q 300 213 316 218 Q 300 230 284 218 Z" fill="#993844" />
                  <path d="M 288 218 Q 300 216 312 218" stroke="#FFF" strokeWidth="1.5" fill="none" opacity="0.9" />
                </g>
              ) : (
                // Calm, grounded gentle smile
                <g>
                  <path d="M 284 218 Q 300 214 316 218" stroke="#BA535D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M 288 219 Q 300 226 312 219" stroke="#A8444E" strokeWidth="2" strokeLinecap="round" fill="none" />
                </g>
              )}
            </g>

            {/* Front Hair Strands & Natural Auburn Waves Framing Face */}
            <path
              d="M 240 140 C 235 110, 270 95, 305 102 C 345 100, 365 120, 362 150 C 358 175, 345 220, 355 260 C 362 290, 350 330, 335 340 C 330 330, 342 270, 338 240 C 332 200, 348 140, 315 125 C 285 115, 255 130, 245 160 C 240 185, 245 235, 238 270 C 230 310, 225 330, 218 310 C 215 270, 222 200, 240 140 Z"
              fill="url(#eva-hair)"
            />
            {/* Soft hair highlight strand */}
            <path
              d="M 265 108 Q 310 112 340 135"
              stroke="url(#eva-hair-highlight)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              opacity="0.85"
            />
          </g>
        </svg>
      </div>

      {/* ── Top Header: Scenario Presentation Badges ──────────────────────── */}
      <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between gap-2 pointer-events-auto">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Avatar Name Tag */}
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-canvas-surface/90 backdrop-blur-md border border-canvas-border text-ink-primary shadow-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-brand" />
            {partnerName || presentation.consistency.avatarName}
            <span className="text-[11px] font-normal text-ink-muted hidden sm:inline">({partnerRole})</span>
          </span>

          {/* Dynamic State Indicator */}
          {isSpeaking && (
            <span className="flex items-center gap-1.5 bg-teal-brand/90 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-xs animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              Speaking
            </span>
          )}
          {isThinking && (
            <span className="flex items-center gap-1.5 bg-amber-600/90 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Reflecting...
            </span>
          )}
          {!isSpeaking && !isThinking && (
            <span className="hidden sm:inline-flex items-center gap-1 bg-black/40 text-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-medium border border-white/10">
              Attentive
            </span>
          )}
        </div>

        {/* Scene Info Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/50 hover:bg-black/70 text-white/90 backdrop-blur-md border border-white/15 transition flex items-center gap-1 shadow-xs"
          title="Scene and wardrobe details"
        >
          <span>ℹ️</span>
          <span className="hidden sm:inline">{showDetails ? 'Hide Details' : 'Scene Info'}</span>
        </button>
      </div>

      {/* ── Expandable Scene Details Drawer ───────────────────────────────── */}
      {showDetails && (
        <div className="relative z-20 mx-3 p-3.5 rounded-2xl bg-black/85 backdrop-blur-lg border border-white/20 text-white text-xs space-y-2 animate-in fade-in slide-in-from-top-2 shadow-xl">
          <div className="flex items-center justify-between pb-1 border-b border-white/15">
            <span className="font-semibold text-teal-300">Eva Scenario Presentation</span>
            <span className="text-[10px] text-white/70">Consistent Identity Concept</span>
          </div>
          <p className="text-[11px] leading-relaxed text-white/90">
            {presentation.detailedVisualDescription}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-white/80">
            <div>
              <span className="text-white/50 block">Setting:</span>
              <span className="font-medium text-white">{presentation.environment.settingName}</span>
            </div>
            <div>
              <span className="text-white/50 block">Atmosphere:</span>
              <span className="font-medium text-white">{presentation.environment.lightingMood}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Prominent Presentation Metadata Tag ────────────────────── */}
      <div className="relative z-10 p-3 sm:p-4">
        <div className="px-3.5 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 text-white shadow-lg flex items-center justify-between flex-wrap gap-2">
          {/* Prominent Visual Summary Tag */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="font-medium text-xs tracking-wide text-white drop-shadow-xs">
              {presentation.visualSummary}
            </span>
          </div>

          {/* Quick Badges */}
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="px-2 py-0.5 rounded-md bg-white/15 text-white/90 font-medium border border-white/10">
              {presentation.outfitLabel}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/15 text-white/90 font-medium border border-white/10">
              {presentation.backgroundLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
