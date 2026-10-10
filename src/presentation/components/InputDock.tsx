/**
 * InputDock.tsx — Presentation Component
 *
 * Dual-Modality Input Dock: Push-to-Talk microphone streaming + silent text toggle (FR-02)
 * with Non-Destructive Undo/Rewind triggers (FR-06).
 */

import React, { useState } from 'react';
import type { ProsodyMetrics } from '../../domain/value-objects/ProsodyMetrics';

export interface InputDockProps {
  onSubmit: (input: { text: string; mode: 'voice' | 'text'; prosody?: ProsodyMetrics }) => void;
  onRewind?: () => void;
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  canRewind?: boolean;
  disabled?: boolean;
}

export const InputDock: React.FC<InputDockProps> = ({
  onSubmit,
  onRewind,
  isListening,
  onStartListening,
  onStopListening,
  canRewind = false,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text');

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSubmit({ text: text.trim(), mode: 'text' });
    setText('');
  };

  return (
    <div
      className="flex flex-col gap-3 p-4 bg-[#1A2232] rounded-2xl border border-slate-800 text-slate-100 shadow-2xl"
      data-testid="input-dock-container"
    >
      {/* Top Bar: Mode Toggle & Rewind */}
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              inputMode === 'text' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            data-testid="mode-text-btn"
          >
            Silent Text Mode
          </button>
          <button
            type="button"
            onClick={() => setInputMode('voice')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              inputMode === 'voice' ? 'bg-[#8B5CF6] text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            data-testid="mode-voice-btn"
          >
            Push-To-Talk Voice
          </button>
        </div>

        {canRewind && onRewind && (
          <button
            type="button"
            onClick={onRewind}
            disabled={disabled}
            className="px-3 py-1.5 text-xs rounded-lg font-medium bg-slate-800 border border-slate-700 text-amber-300 hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            data-testid="rewind-btn"
          >
            <span>↺ Undo Turn</span>
          </button>
        )}
      </div>

      {/* Input Action Surface */}
      {inputMode === 'text' ? (
        <form onSubmit={handleSubmitText} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your boundary or request here..."
            disabled={disabled}
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] disabled:opacity-50"
            data-testid="text-input"
          />
          <button
            type="submit"
            disabled={disabled || !text.trim()}
            className="px-5 py-2.5 bg-[#8B5CF6] text-white rounded-xl text-sm font-semibold hover:bg-[#7C3AED] disabled:opacity-50 transition-colors"
            data-testid="send-btn"
          >
            Send
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400">
            {isListening ? 'Streaming live audio...' : 'Click mic to stream audio'}
          </span>
          <button
            type="button"
            onClick={isListening ? onStopListening : onStartListening}
            disabled={disabled}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
            data-testid="mic-btn"
          >
            {isListening ? 'Stop Recording' : 'Hold / Click to Talk'}
          </button>
        </div>
      )}
    </div>
  );
};
