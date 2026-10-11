'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { SophiaScenarioPresentation } from '../../domain/entities/SophiaScenarioPresentation';
import { useLiveAvatarSession } from '../hooks/useLiveAvatarSession';

export interface SophiaLiveAvatarProps {
  presentation: SophiaScenarioPresentation;
  partnerState: 'listening' | 'speaking' | 'thinking' | 'neutral' | 'receptive';
  isSpeakingAudio: boolean;
  isMuted: boolean;
  onToggleMute?: () => void;
  onToggleTextMode?: () => void;
  className?: string;
  sessionToken?: string;
  wsUrl?: string;
  conversationUrl?: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
  audioRef?: React.RefObject<HTMLAudioElement>;
}

export const SophiaLiveAvatar: React.FC<SophiaLiveAvatarProps> = ({
  presentation,
  partnerState,
  isSpeakingAudio,
  isMuted,
  onToggleMute,
  onToggleTextMode,
  className = '',
  sessionToken,
  wsUrl,
  conversationUrl,
  videoRef,
  audioRef,
}) => {
  const [showSceneDetails, setShowSceneDetails] = useState<boolean>(false);

  const badgeText = presentation.badgeText || presentation.visualSummary || `Sophia • ${presentation.outfitLabel} • ${presentation.backgroundLabel}`;

  return (
    <section
      aria-label="Sophia Live Avatar Stage"
      data-testid="sophia-live-avatar"
      className={`w-full max-w-2xl aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden relative shadow-lg border border-canvas-border flex flex-col justify-between transition-all select-none bg-canvas-dark ${className}`}
    >
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950 flex items-center justify-center">
        {conversationUrl ? (
          <iframe
            src={conversationUrl}
            title="Sophia Tavus Live Avatar"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0 absolute inset-0 z-10"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted={isMuted}
              className="w-full h-full object-cover relative z-10"
            />
            <audio ref={audioRef} autoPlay muted={isMuted} className="hidden" />
          </>
        )}
      </div>

      <header className="relative z-20 p-3 sm:p-4 flex items-center justify-between gap-2 pointer-events-auto flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          {partnerState === 'speaking' && (
            <span className="inline-flex items-center gap-1.5 bg-teal-600/90 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              Speaking
            </span>
          )}
          {partnerState === 'listening' && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-700/85 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              Listening
            </span>
          )}
        </div>
      </header>

      <footer className="relative z-20 p-3 sm:p-4 flex flex-col gap-2 pointer-events-auto">
        <div className="px-3.5 py-2 rounded-2xl bg-black/75 backdrop-blur-md border border-white/20 text-white shadow-lg flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="font-semibold text-white tracking-wide drop-shadow-xs">{badgeText}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
          <div className="flex items-center gap-2">
            {onToggleMute && (
              <button
                type="button"
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
                onClick={onToggleTextMode}
                className="px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-medium border border-white/25 backdrop-blur-md transition flex items-center gap-1.5"
              >
                <span>💬</span>
                <span>Text Mode</span>
              </button>
            )}
          </div>
        </div>
      </footer>
    </section>
  );
};
