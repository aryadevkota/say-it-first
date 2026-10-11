'use client';

/**
 * SophiaLiveAvatar.tsx — Anam Real-Time Video Avatar Presentation Component
 *
 * Renders:
 * - Real-time lip-synced Anam avatar WebRTC video stream in HTML5 <video>
 * - Audio-muted video playback (audio is delivered via ElevenLabs audio player, zero duplicate sound)
 * - Partner conversational state indicators (speaking, listening, thinking/reflecting)
 * - Accessible neurodiversity-affirming controls (mute toggle, text mode switch)
 * - Transparent fail-fast diagnostics when avatar stream is disconnected
 */

import React from 'react';
import type { SophiaScenarioPresentation } from '../../domain/entities/SophiaScenarioPresentation';

export interface SophiaLiveAvatarProps {
  presentation: SophiaScenarioPresentation;
  partnerState: 'listening' | 'speaking' | 'thinking' | 'neutral' | 'receptive';
  isSpeakingAudio: boolean;
  isMuted: boolean;
  onToggleMute?: () => void;
  onToggleTextMode?: () => void;
  className?: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
  sessionState?: 'idle' | 'creating' | 'active' | 'terminating' | 'terminated' | 'failed';
  errorMessage?: string | null;
  onRetry?: () => void;
}

export const SophiaLiveAvatar: React.FC<SophiaLiveAvatarProps> = ({
  presentation,
  partnerState,
  isSpeakingAudio,
  isMuted,
  onToggleMute,
  onToggleTextMode,
  className = '',
  videoRef,
  sessionState = 'active',
  errorMessage,
  onRetry,
}) => {
  const badgeText =
    presentation.badgeText ||
    presentation.visualSummary ||
    `Sophia • ${presentation.outfitLabel} • ${presentation.backgroundLabel}`;

  const isConnected = sessionState === 'active';
  const isConnecting = sessionState === 'creating' || sessionState === 'idle';
  const isFailed = sessionState === 'failed';

  return (
    <section
      aria-label="Sophia Live Avatar Stage"
      data-testid="sophia-live-avatar"
      className={`w-full max-w-4xl aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden relative shadow-xl border border-canvas-border flex flex-col justify-between transition-all select-none bg-canvas-dark ${className}`}
    >
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950 flex items-center justify-center">
        {isFailed ? (
          <div
            data-testid="anam-error-boundary"
            className="flex flex-col items-center justify-center gap-3 text-center p-6 z-30 max-w-sm"
          >
            <p className="text-sm font-semibold text-rose-300">Partner Connection Paused</p>
            <p className="text-xs text-white/70 leading-relaxed">
              {errorMessage || 'The avatar session is settling. You can retry or continue in text mode.'}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 px-4 py-2 rounded-xl bg-sif-primary hover:bg-sif-primaryHover text-white text-xs font-semibold shadow-xs transition"
              >
                Reconnect Partner
              </button>
            )}
          </div>
        ) : (
          <>
            <video
              id="anam-avatar-video"
              ref={videoRef}
              playsInline
              autoPlay
              muted
              data-testid="anam-avatar-video"
              className="w-full h-full object-cover relative z-10"
            />
            {isConnecting && (
              <div className="flex flex-col items-center justify-center gap-3 text-center p-6 z-20 absolute inset-0 bg-slate-950/80 backdrop-blur-xs">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center animate-pulse">
                  <span className="w-3 h-3 rounded-full bg-sif-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white tracking-wide">Connecting with Sophia...</p>
                  <p className="text-xs text-white/60">Starting Anam live avatar stream</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dynamic Conversational State Indicators */}
      <header className="relative z-20 p-3 sm:p-4 flex items-center justify-between gap-2 pointer-events-auto flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          {isConnected && (partnerState === 'speaking' || isSpeakingAudio) && (
            <span
              data-testid="partner-state-speaking"
              className="inline-flex items-center gap-1.5 bg-teal-600/90 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold shadow-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              Speaking
            </span>
          )}
          {isConnected && partnerState === 'listening' && !isSpeakingAudio && (
            <span
              data-testid="partner-state-listening"
              className="inline-flex items-center gap-1.5 bg-emerald-700/85 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              Listening
            </span>
          )}
          {isConnected && partnerState === 'thinking' && !isSpeakingAudio && (
            <span
              data-testid="partner-state-thinking"
              className="inline-flex items-center gap-1.5 bg-violet-700/85 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-300 animate-pulse" />
              Reflecting…
            </span>
          )}
        </div>
      </header>

      {/* Footer Controls & Status Card */}
      <footer className="relative z-20 p-3 sm:p-4 flex flex-col gap-2 pointer-events-auto">
        <div className="px-3.5 py-2 rounded-2xl bg-black/75 backdrop-blur-md border border-white/20 text-white shadow-lg flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                <span className="font-semibold text-white tracking-wide drop-shadow-xs">{badgeText}</span>
                <span className="text-[10px] text-emerald-300 font-medium px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">Active</span>
              </>
            ) : isFailed ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <span className="font-semibold text-white tracking-wide drop-shadow-xs">{badgeText}</span>
                <span className="text-[10px] text-rose-300 font-medium px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-500/30">Disconnected</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                <span className="font-semibold text-white tracking-wide drop-shadow-xs">{badgeText}</span>
                <span className="text-[10px] text-amber-300 font-medium px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/30">Connecting...</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
          <div className="flex items-center gap-2">
            {onToggleMute && (
              <button
                type="button"
                data-testid="toggle-mute-btn"
                aria-pressed={isMuted}
                onClick={onToggleMute}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition backdrop-blur-md flex items-center gap-1.5 bg-black/70 text-white border-white/25 hover:bg-black/90"
              >
                <span>{isMuted ? '🔇' : '🔊'}</span>
                <span>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
              </button>
            )}
            {onToggleTextMode && (
              <button
                type="button"
                data-testid="toggle-text-mode-btn"
                onClick={onToggleTextMode}
                className="px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-medium border border-white/25 backdrop-blur-md transition flex items-center gap-1.5"
              >
                <span>💬</span>
                <span>Switch to Text Mode</span>
              </button>
            )}
          </div>
        </div>
      </footer>
    </section>
  );
};
