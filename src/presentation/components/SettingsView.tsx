'use client';

/**
 * SettingsView.tsx — Reorganized & Polished Settings Surface
 *
 * Implements:
 * - Grouped card layout (avoiding enterprise form energy)
 * - Comfort & guidance levels (Independent / Cues / Subtext)
 * - Voice & Avatar preferences (Show/Hide avatar, spoken audio, microphone)
 * - Accessibility (Reduced motion, cozy UI audio sounds)
 * - Data management & privacy explanations (Local-only storage)
 */

import React, { useState } from 'react';
import type { UserPreferences } from './WelcomeOnboarding';
import { isUiSoundEnabled, setUiSoundEnabled, playCozySound } from '../utils/cozyAudio';

interface SettingsViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updated: UserPreferences) => void;
  onClearSavedWording?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences,
  onClearSavedWording,
}) => {
  const [uiSoundsEnabled, setUiSoundsEnabled] = useState<boolean>(() => isUiSoundEnabled());
  const [clearNotice, setClearNotice] = useState<string | null>(null);

  const handleToggleSound = (enabled: boolean) => {
    setUiSoundsEnabled(enabled);
    setUiSoundEnabled(enabled);
    if (enabled) {
      playCozySound('tap');
    }
  };

  return (
    <div
      className="max-w-4xl mx-auto w-full py-8 px-4 sm:px-6 space-y-8 animate-fadeIn text-ink-primary"
      data-testid="settings-view"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-teal-subtle text-teal-brand border border-teal-border">
            Environment & Preferences
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-ink-primary mt-2">
          Settings & Comfort
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Customize your sensory comfort, guidance depth, and conversational environment.
        </p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Guidance Depth */}
        <div className="p-6 rounded-3xl bg-canvas-surface border border-canvas-border shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-semibold text-ink-primary">Guidance Level</h2>
            <p className="text-xs text-ink-muted mt-0.5">Choose how much real-time subtext and cue support is visible during practice.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'independent', label: 'Explore independently', desc: 'No cues, pure conversation' },
              { id: 'cues', label: 'Occasional cues', desc: 'Helpful hints & alternative phrases' },
              { id: 'subtext', label: 'Explain as I go', desc: 'Full Two-Way Bridge subtext analysis' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  playCozySound('tap');
                  onUpdatePreferences({
                    ...preferences,
                    guidanceLevel: lvl.id as 'independent' | 'cues' | 'subtext',
                  });
                }}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition ${
                  preferences.guidanceLevel === lvl.id
                    ? 'bg-teal-subtle border-teal-brand font-medium shadow-2xs'
                    : 'bg-canvas-surface border-canvas-border hover:bg-canvas-subtle'
                }`}
              >
                <div>
                  <span className="text-sm font-semibold text-ink-primary block mb-1">{lvl.label}</span>
                  <span className="text-xs text-ink-secondary">{lvl.desc}</span>
                </div>
                <div className="pt-3 flex justify-end">
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      preferences.guidanceLevel === lvl.id ? 'border-teal-brand bg-teal-brand' : 'border-canvas-border'
                    }`}
                  >
                    {preferences.guidanceLevel === lvl.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Avatar & Audio Experience */}
        <div className="p-6 rounded-3xl bg-canvas-surface border border-canvas-border shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-semibold text-ink-primary">Avatar & Voice Presentation</h2>
            <p className="text-xs text-ink-muted mt-0.5">Control visual avatar presence and audio playback options.</p>
          </div>

          <div className="space-y-3">
            {/* Show / Hide Avatar Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-canvas-subtle border border-canvas-borderSubtle">
              <div>
                <span className="text-sm font-semibold text-ink-primary block">Sophia Live Video Avatar</span>
                <span className="text-xs text-ink-muted">Display the live video partner stage during practice calls.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playCozySound('toggle');
                  onUpdatePreferences({ ...preferences, hideAvatar: !preferences.hideAvatar });
                }}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  !preferences.hideAvatar ? 'bg-teal-brand' : 'bg-canvas-border'
                }`}
                aria-pressed={!preferences.hideAvatar}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                    !preferences.hideAvatar ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Cozy Tactile Audio Sounds Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-canvas-subtle border border-canvas-borderSubtle">
              <div>
                <span className="text-sm font-semibold text-ink-primary block">Subtle UI Sounds</span>
                <span className="text-xs text-ink-muted">Gentle synthesized tactile audio clicks on button taps and version branches.</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSound(!uiSoundsEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  uiSoundsEnabled ? 'bg-teal-brand' : 'bg-canvas-border'
                }`}
                aria-pressed={uiSoundsEnabled}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                    uiSoundsEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Accessibility & Motion */}
        <div className="p-6 rounded-3xl bg-canvas-surface border border-canvas-border shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-semibold text-ink-primary">Accessibility & Motion</h2>
            <p className="text-xs text-ink-muted mt-0.5">Adapt visual pacing to your sensory comfort.</p>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-canvas-subtle border border-canvas-borderSubtle">
            <div>
              <span className="text-sm font-semibold text-ink-primary block">Reduced Motion Mode</span>
              <span className="text-xs text-ink-muted">Minimizes animated screen transitions, pulses, and scaling effects.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                playCozySound('toggle');
                onUpdatePreferences({ ...preferences, reducedMotion: !preferences.reducedMotion });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                preferences.reducedMotion ? 'bg-teal-brand' : 'bg-canvas-border'
              }`}
              aria-pressed={preferences.reducedMotion}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                  preferences.reducedMotion ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Section 4: Data & Local Storage */}
        <div className="p-6 rounded-3xl bg-canvas-surface border border-canvas-border shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-semibold text-ink-primary">Data & Local Storage</h2>
            <p className="text-xs text-ink-muted mt-0.5">Your progress, wording, and custom scenarios remain in your browser storage.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-canvas-subtle border border-canvas-borderSubtle">
            <div>
              <span className="text-xs font-semibold text-ink-primary block">Clear Saved Wording</span>
              <span className="text-xs text-ink-muted">Removes locally saved takeaway scripts from this browser.</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onClearSavedWording) {
                  onClearSavedWording();
                  setClearNotice('Saved wording cleared from local storage.');
                  setTimeout(() => setClearNotice(null), 3000);
                }
              }}
              className="px-4 py-2 rounded-xl border border-topic-apricot text-topic-apricot hover:bg-topic-apricotBg text-xs font-medium transition shrink-0"
            >
              Clear Wording
            </button>
          </div>

          {clearNotice && (
            <p className="text-xs text-teal-brand font-medium animate-fadeIn">{clearNotice}</p>
          )}
        </div>
      </div>
    </div>
  );
};
