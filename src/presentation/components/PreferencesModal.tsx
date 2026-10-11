'use client';

/**
 * PreferencesModal.tsx — User Preferences & Comfort Settings Modal
 *
 * Lets users review and adjust:
 * - Guidance levels (Independent / Cues / Subtext)
 * - Input method (Typing vs Voice)
 * - Partner spoken audio (Browser synthesis)
 * - Motion settings (Full animation vs Reduced motion)
 * - Partner Avatar visibility (Show vs Hide partner avatar)
 * - Data management (Clear locally saved wording)
 */

import React, { useState } from 'react';
import type { UserPreferences } from './WelcomeOnboarding';
import { isUiSoundEnabled, setUiSoundEnabled, playCozySound } from '../utils/cozyAudio';

interface PreferencesModalProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updated: UserPreferences) => void;
  onClose: () => void;
  onClearSavedWording?: () => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  preferences,
  onUpdatePreferences,
  onClose,
  onClearSavedWording,
}) => {
  const [uiSoundsEnabled, setUiSoundsEnabled] = useState<boolean>(() => isUiSoundEnabled());
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/30 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preferences-modal-title"
    >
      <div className="bg-canvas-surface border border-canvas-border rounded-3xl shadow-xl max-w-lg w-full overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-canvas-borderSubtle flex items-center justify-between">
          <div>
            <h2 id="preferences-modal-title" className="text-xl font-semibold text-ink-primary">
              Preferences & Comfort
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">Customize your conversational environment</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-canvas-subtle transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Guidance Level */}
          <div>
            <span className="text-xs font-semibold uppercase text-ink-muted block mb-2">
              Default Guidance Level
            </span>
            <div className="space-y-2">
              {[
                { id: 'independent', label: 'Explore independently', desc: 'No cues, pure conversation' },
                { id: 'cues', label: 'Occasional cues', desc: 'Helpful hints & alternative phrases' },
                { id: 'subtext', label: 'Explain as I go', desc: 'Full Two-Way Bridge subtext analysis' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() =>
                    onUpdatePreferences({
                      ...preferences,
                      guidanceLevel: lvl.id as 'independent' | 'cues' | 'subtext',
                    })
                  }
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                    preferences.guidanceLevel === lvl.id
                      ? 'bg-teal-subtle border-teal-brand font-medium'
                      : 'bg-canvas-surface border-canvas-border text-ink-secondary hover:bg-canvas-subtle'
                  }`}
                >
                  <div>
                    <span className="text-sm text-ink-primary block">{lvl.label}</span>
                    <span className="text-xs text-ink-muted">{lvl.desc}</span>
                  </div>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      preferences.guidanceLevel === lvl.id ? 'border-teal-brand bg-teal-brand' : 'border-canvas-border'
                    }`}
                  >
                    {preferences.guidanceLevel === lvl.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Preferences */}
          <div className="space-y-4 pt-2 border-t border-canvas-borderSubtle">
            <span className="text-xs font-semibold uppercase text-ink-muted block">
              Display & Sensory Options
            </span>

            {/* Hide Avatar Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-ink-primary block">Partner Avatar</span>
                <span className="text-xs text-ink-muted">Display realistic conversational practice partner (Sophia)</span>
              </div>
              <button
                onClick={() =>
                  onUpdatePreferences({
                    ...preferences,
                    hideAvatar: !preferences.hideAvatar,
                  })
                }
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  !preferences.hideAvatar ? 'bg-teal-brand' : 'bg-canvas-border'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    !preferences.hideAvatar ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-ink-primary block">Reduced Motion</span>
                <span className="text-xs text-ink-muted">Minimize avatar movements and transitions</span>
              </div>
              <button
                onClick={() =>
                  onUpdatePreferences({
                    ...preferences,
                    reducedMotion: !preferences.reducedMotion,
                  })
                }
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  preferences.reducedMotion ? 'bg-teal-brand' : 'bg-canvas-border'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    preferences.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Audio Synthesis Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-ink-primary block">Partner Spoken Audio</span>
                <span className="text-xs text-ink-muted">Read partner turns aloud via speech synthesis</span>
              </div>
              <button
                onClick={() =>
                  onUpdatePreferences({
                    ...preferences,
                    spokenPartnerAudio: !preferences.spokenPartnerAudio,
                  })
                }
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  preferences.spokenPartnerAudio ? 'bg-teal-brand' : 'bg-canvas-border'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    preferences.spokenPartnerAudio ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Tactile Interaction Sounds Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-ink-primary block">Tactile Interaction Sounds</span>
                <span className="text-xs text-ink-muted">Play subtle, soft clicks on buttons & branches</span>
              </div>
              <button
                onClick={() => {
                  const next = !uiSoundsEnabled;
                  setUiSoundsEnabled(next);
                  setUiSoundEnabled(next);
                  if (next) playCozySound('toggle');
                }}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  uiSoundsEnabled ? 'bg-teal-brand' : 'bg-canvas-border'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    uiSoundsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Local Data Privacy */}
          {onClearSavedWording && (
            <div className="pt-4 border-t border-canvas-borderSubtle">
              <span className="text-xs font-semibold uppercase text-ink-muted block mb-2">
                Local Storage & Privacy
              </span>
              <div className="flex items-center justify-between p-3 rounded-xl bg-canvas-subtle border border-canvas-border">
                <div>
                  <span className="text-xs font-medium text-ink-primary block">Saved takeaways</span>
                  <span className="text-[11px] text-ink-muted">Stored only in your local browser</span>
                </div>
                <button
                  onClick={onClearSavedWording}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-canvas-surface border border-canvas-border text-ink-muted hover:text-topic-apricot hover:border-topic-apricot transition"
                >
                  Clear saved wording
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-canvas-borderSubtle bg-canvas-light flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-brand text-canvas-surface font-medium hover:bg-teal-hover transition text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
