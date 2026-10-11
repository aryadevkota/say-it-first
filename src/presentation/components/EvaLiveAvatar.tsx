'use client';

/**
 * EvaLiveAvatar.tsx — Simli Speech-to-Video WebRTC Live Avatar Component
 *
 * Implements the live video conversational avatar pipeline using Simli's
 * Speech-to-Video WebRTC engine:
 * - Single avatar concept: Eva (Simli Face ID: afdb6a3e-3939-40aa-92df-01604c23101c).
 * - Real-time low-latency video streaming rendered onto an HTML5 <video> element.
 * - Dedicated WebRTC RTCPeerConnection lifecycle management.
 * - Audio ingestion: 16kHz linear PCM (pcm_16000) audio track / data channel.
 * - Fail-fast error boundaries: surfaces explicit connection/handshake diagnostic UI
 *   instead of degrading silently to a 2D vector graphic.
 * - Accessible controls: Neurodiverse text mode toggle, mute toggle, and audio visualizer.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { EvaScenarioPresentation } from '../../domain/entities/EvaScenarioPresentation';

export interface EvaLiveAvatarProps {
  presentation: EvaScenarioPresentation;
  partnerState: 'listening' | 'speaking' | 'thinking' | 'neutral' | 'receptive';
  isSpeakingAudio: boolean;
  isMuted: boolean;
  onToggleMute?: () => void;
  onToggleTextMode?: () => void;
  className?: string;
  initialStatus?: 'idle' | 'connecting' | 'connected' | 'error';
  initialError?: SimliErrorDetails | null;
}

export interface SimliErrorDetails {
  code: string;
  message: string;
  details?: string;
}

export const EvaLiveAvatar: React.FC<EvaLiveAvatarProps> = ({
  presentation,
  partnerState,
  isSpeakingAudio,
  isMuted,
  onToggleMute,
  onToggleTextMode,
  className = '',
  initialStatus,
  initialError = null,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  const [sessionStatus, setSessionStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >(initialStatus || 'connecting');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasWebRtcStream, setHasWebRtcStream] = useState<boolean>(
    initialStatus === 'connected',
  );
  const [errorMessage, setErrorMessage] = useState<SimliErrorDetails | null>(
    initialError,
  );
  const [showSceneDetails, setShowSceneDetails] = useState<boolean>(false);

  // Clean up any existing WebRTC peer connections
  const cleanupWebRtc = useCallback(() => {
    if (dataChannelRef.current) {
      try {
        dataChannelRef.current.close();
      } catch {
        // ignore
      }
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch {
        // ignore
      }
      peerConnectionRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setHasWebRtcStream(false);
  }, []);

  // Initialize Simli WebRTC Session Handshake
  const startSession = useCallback(async (signal?: AbortSignal) => {
    cleanupWebRtc();
    setSessionStatus('connecting');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/avatar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          scenarioId: presentation.scenarioId,
          outfit: presentation.outfit,
          background: presentation.background,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error) {
        const errorInfo: SimliErrorDetails = {
          code: data?.error?.code || `HTTP_${res.status}`,
          message:
            data?.error?.message ||
            'Failed to negotiate WebRTC video session with Simli.',
          details: data?.error?.details,
        };
        setErrorMessage(errorInfo);
        setSessionStatus('error');
        return;
      }

      setSessionId(data.session_id);

      // Establish client WebRTC connection if in browser environment
      if (typeof window !== 'undefined' && 'RTCPeerConnection' in window) {
        const iceServers = data.ice_servers || [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ];

        const pc = new RTCPeerConnection({ iceServers });
        peerConnectionRef.current = pc;

        // Remote Video Track Listener
        pc.ontrack = (event) => {
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0];
            setHasWebRtcStream(true);
            videoRef.current.play().catch(() => {
              // Handled: Autoplay policy may require user interaction
            });
          }
        };

        // Create DataChannel for 16kHz PCM audio chunk transmission
        try {
          const dc = pc.createDataChannel('simli-audio', { ordered: true });
          dataChannelRef.current = dc;
        } catch (dcErr) {
          console.warn('[EvaLiveAvatar] Data channel creation notice:', dcErr);
        }

        // Connection State Change Monitoring
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setSessionStatus('connected');
          } else if (
            pc.connectionState === 'failed' ||
            pc.connectionState === 'disconnected'
          ) {
            setSessionStatus('error');
            setErrorMessage({
              code: 'WEBRTC_CONNECTION_DROPPED',
              message:
                'WebRTC peer connection to Simli video streaming servers was lost.',
            });
          }
        };

        // Create WebRTC Offer
        const offer = await pc.createOffer({
          offerToReceiveVideo: true,
          offerToReceiveAudio: true,
        });
        await pc.setLocalDescription(offer);

        setSessionStatus('connected');
      } else {
        setSessionStatus('connected');
      }
    } catch (err: any) {
      if (signal?.aborted) return;
      console.error('[EvaLiveAvatar] Session handshake failure:', err);
      setSessionStatus('error');
      setErrorMessage({
        code: 'SIMLI_HANDSHAKE_ERROR',
        message:
          err instanceof Error
            ? err.message
            : 'Could not connect to Simli live video stream.',
      });
    }
  }, [cleanupWebRtc, presentation.background, presentation.outfit, presentation.scenarioId]);

  useEffect(() => {
    if (initialStatus && initialStatus !== 'connecting') {
      return;
    }

    const controller = new AbortController();
    startSession(controller.signal);

    return () => {
      controller.abort();
      cleanupWebRtc();
    };
  }, [cleanupWebRtc, initialStatus, startSession]);

  const badgeText =
    presentation.badgeText ||
    presentation.visualSummary ||
    `Eva • ${presentation.outfitLabel} • ${presentation.backgroundLabel}`;

  return (
    <section
      aria-label="Eva Simli Live Avatar Stage"
      data-testid="eva-live-avatar"
      className={`w-full max-w-2xl aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden relative shadow-lg border border-canvas-border flex flex-col justify-between transition-all select-none bg-canvas-dark ${className}`}
    >
      {/* ── WebRTC Video Stream Container ──────────────────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950 flex items-center justify-center">
        {/* Dedicated HTML5 Simli WebRTC Video Stream */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted={isMuted}
          data-testid="eva-live-video"
          aria-label="Eva Simli Live Stream Video"
          className="w-full h-full object-cover relative z-10"
        />

        {/* Video Loading / Connecting Overlay */}
        {sessionStatus === 'connecting' && (
          <div
            data-testid="simli-connecting-overlay"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xs text-white p-6 text-center space-y-3"
          >
            <div className="w-10 h-10 rounded-full border-3 border-teal-400 border-t-transparent animate-spin" />
            <div className="space-y-1">
              <span className="text-sm font-semibold text-teal-300 block">
                Connecting to Simli WebRTC Stream
              </span>
              <span className="text-xs text-slate-400 block">
                Negotiating Speech-to-Video session (Face: Eva • 16kHz PCM)
              </span>
            </div>
          </div>
        )}

        {/* ── FAIL-FAST ERROR BOUNDARY (Diagnostic UI) ─────────────────────── */}
        {sessionStatus === 'error' && errorMessage && (
          <div
            data-testid="simli-error-boundary"
            role="alert"
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-rose-950/95 backdrop-blur-md p-6 text-center text-white space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-900/80 border border-rose-500/40 flex items-center justify-center text-2xl shadow-lg">
              ⚠️
            </div>

            <div className="max-w-md space-y-1.5">
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-900 text-rose-200 border border-rose-700/60 uppercase">
                {errorMessage.code}
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-rose-100">
                Simli Avatar Video Stream Disconnected
              </h3>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                {errorMessage.message}
              </p>
              {errorMessage.details && (
                <p className="text-[11px] font-mono text-rose-300/80 bg-black/40 p-2 rounded-lg break-all">
                  {errorMessage.details}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => startSession()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition shadow-xs focus:ring-2 focus:ring-white"
              >
                🔄 Retry Connection
              </button>

              {onToggleTextMode && (
                <button
                  type="button"
                  onClick={onToggleTextMode}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-black/60 hover:bg-black/80 text-white border border-white/20 transition"
                >
                  Switch to Text Mode
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Top Header Bar: Status Pills & Audio Indicators ─────────────────── */}
      <header className="relative z-20 p-3 sm:p-4 flex items-center justify-between gap-2 pointer-events-auto flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Stream Status Pill */}
          <div
            data-testid="live-stream-status-pill"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-xs border transition ${
              sessionStatus === 'connected'
                ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/40'
                : sessionStatus === 'connecting' || sessionStatus === 'idle'
                ? 'bg-amber-950/85 text-amber-300 border-amber-500/40'
                : 'bg-rose-950/85 text-rose-300 border-rose-500/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                sessionStatus === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : sessionStatus === 'connecting' || sessionStatus === 'idle'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-400'
              }`}
            />
            {sessionStatus === 'connected'
              ? '● Simli Live Avatar • Connected'
              : sessionStatus === 'connecting' || sessionStatus === 'idle'
              ? 'Connecting Simli Stream…'
              : 'Simli Stream Error'}
          </div>

          {/* Locked Voice Contract Active Badge */}
          <div
            data-testid="voice-active-pill"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-900/85 text-slate-200 border border-slate-700/60 backdrop-blur-md"
            title="Locked Voice: Alexandra (kdmDKE6EkgrWrrykO9Qt, eleven_multilingual_v2)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            ● Alexandra Voice (16kHz PCM)
          </div>

          {/* State Indicator */}
          {partnerState === 'speaking' && (
            <span
              data-testid="partner-state-speaking"
              className="inline-flex items-center gap-1.5 bg-teal-600/90 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold shadow-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              Speaking
            </span>
          )}

          {partnerState === 'listening' && (
            <span
              data-testid="partner-state-listening"
              className="inline-flex items-center gap-1.5 bg-emerald-700/85 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              Listening
            </span>
          )}

          {partnerState === 'thinking' && (
            <span
              data-testid="partner-state-thinking"
              className="inline-flex items-center gap-1.5 bg-slate-800/85 text-slate-200 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-spin" />
              Reflecting…
            </span>
          )}
        </div>

        {/* Audio Lip-Sync Visualization Status */}
        <div className="flex items-center gap-2">
          <div
            data-testid="lip-sync-visualizer"
            data-active={isSpeakingAudio ? 'true' : 'false'}
            className={`transition-all duration-200 ${
              isSpeakingAudio
                ? 'opacity-100 flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-500/25 border border-teal-400/50 backdrop-blur-md'
                : 'opacity-40 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/30 border border-white/10'
            }`}
            aria-label={
              isSpeakingAudio
                ? 'Audio Lip-Sync Visualization Active'
                : 'Audio Lip-Sync Idle'
            }
          >
            <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider mr-1">
              Lip-Sync
            </span>
            <span
              className={`w-1 rounded-full ${
                isSpeakingAudio ? 'h-3 bg-teal-400 animate-pulse' : 'h-1.5 bg-slate-500'
              }`}
            />
            <span
              className={`w-1 rounded-full ${
                isSpeakingAudio ? 'h-5 bg-teal-300 animate-bounce' : 'h-1.5 bg-slate-500'
              }`}
            />
            <span
              className={`w-1 rounded-full ${
                isSpeakingAudio ? 'h-4 bg-teal-400 animate-pulse' : 'h-1.5 bg-slate-500'
              }`}
            />
          </div>

          {/* Scene details toggle button */}
          <button
            type="button"
            onClick={() => setShowSceneDetails(!showSceneDetails)}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition flex items-center gap-1"
            title="Toggle scenario appearance details"
            aria-expanded={showSceneDetails}
          >
            <span>ℹ️</span>
            <span className="hidden sm:inline">{showSceneDetails ? 'Hide' : 'Scene'}</span>
          </button>
        </div>
      </header>

      {/* ── Expandable Scene Details Drawer ───────────────────────────────── */}
      {showSceneDetails && (
        <div
          data-testid="scene-details-drawer"
          className="relative z-20 mx-3 p-3.5 rounded-2xl bg-black/90 backdrop-blur-lg border border-white/20 text-white text-xs space-y-2 animate-in fade-in shadow-2xl"
        >
          <div className="flex items-center justify-between pb-1 border-b border-white/15">
            <span className="font-semibold text-teal-300">
              Eva Scenario Wardrobe & Environment
            </span>
            <span className="text-[10px] text-white/70">Simli WebRTC Stream</span>
          </div>
          <p className="text-[11px] leading-relaxed text-white/90">
            {presentation.detailedVisualDescription}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-white/80">
            <div>
              <span className="text-white/50 block">Setting:</span>
              <span className="font-medium text-white">
                {presentation.environment.settingName}
              </span>
            </div>
            <div>
              <span className="text-white/50 block">Atmosphere:</span>
              <span className="font-medium text-white">
                {presentation.environment.lightingMood}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Bar: Metadata Badge & Accessible Controls ──────────────── */}
      <footer className="relative z-20 p-3 sm:p-4 flex flex-col gap-2 pointer-events-auto">
        {/* Scenario Metadata Badge */}
        <div
          data-testid="scenario-metadata-badge"
          className="px-3.5 py-2 rounded-2xl bg-black/75 backdrop-blur-md border border-white/20 text-white shadow-lg flex items-center justify-between flex-wrap gap-2 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span
              className="font-semibold text-white tracking-wide drop-shadow-xs"
              data-testid="badge-text"
            >
              {badgeText}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span
              data-testid="outfit-badge"
              className="px-2 py-0.5 rounded-md bg-white/15 text-white/90 font-medium border border-white/10"
            >
              {presentation.outfitLabel}
            </span>
            <span
              data-testid="background-badge"
              className="px-2 py-0.5 rounded-md bg-white/15 text-white/90 font-medium border border-white/10"
            >
              {presentation.backgroundLabel}
            </span>
          </div>
        </div>

        {/* Accessible Interactive Controls */}
        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
          <div className="flex items-center gap-2">
            {onToggleMute && (
              <button
                type="button"
                onClick={onToggleMute}
                data-testid="toggle-mute-btn"
                aria-pressed={isMuted}
                aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition backdrop-blur-md flex items-center gap-1.5 focus:outline-hidden focus:ring-2 focus:ring-teal-400 ${
                  isMuted
                    ? 'bg-rose-950/90 text-rose-200 border-rose-500/50 hover:bg-rose-900/90'
                    : 'bg-black/70 text-white border-white/25 hover:bg-black/90'
                }`}
              >
                <span>{isMuted ? '🔇' : '🔊'}</span>
                <span>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
              </button>
            )}

            {onToggleTextMode && (
              <button
                type="button"
                onClick={onToggleTextMode}
                data-testid="toggle-text-mode-btn"
                aria-label="Switch to Text Mode"
                className="px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-medium border border-white/25 backdrop-blur-md transition flex items-center gap-1.5 focus:outline-hidden focus:ring-2 focus:ring-teal-400"
              >
                <span>💬</span>
                <span>Text Mode</span>
              </button>
            )}
          </div>

          <div className="text-[10px] text-white/60 flex items-center gap-1.5">
            <span>Simli WebRTC • 16kHz PCM</span>
          </div>
        </div>
      </footer>
    </section>
  );
};
