'use client';

/**
 * AvatarStudioModal.tsx — User Avatar Customization Studio
 *
 * Provides a dedicated personalization space for the user's 3D avatar:
 * - Real-time 3D preview using Avatar3DRig with live parameter reflection
 * - Semi-realistic stylized adult aesthetic (Microsoft Teams reference)
 * - Parametric customization:
 *   - Skin tone (sensory-friendly realistic swatches)
 *   - Hair style & hair color
 *   - Clothing style & clothing color
 *   - Eyewear (none, round frames, rectangular frames)
 * - Local persistence via localStorage ('say_it_first_user_avatar')
 * - Audio-haptic soft clicks via cozyAudio
 * - Non-diagnostic, calming, accessible presentation
 */

import React, { useState } from 'react';
import {
  type AvatarCustomization,
  type SkinToneId,
  type HairStyleId,
  type HairColorId,
  type ClothingStyleId,
  type ClothingColorId,
  type EyewearId,
  DEFAULT_USER_AVATAR,
  SKIN_TONE_PALETTE,
  HAIR_COLOR_PALETTE,
  CLOTHING_COLOR_PALETTE,
} from '../../domain/entities/AvatarCustomization';
import { Avatar3DRig } from './Avatar3DRig';
import { playCozySound } from '../utils/cozyAudio';

interface AvatarStudioModalProps {
  initialCustomization?: AvatarCustomization;
  onSave: (customization: AvatarCustomization) => void;
  onClose: () => void;
}

export const AvatarStudioModal: React.FC<AvatarStudioModalProps> = ({
  initialCustomization = DEFAULT_USER_AVATAR,
  onSave,
  onClose,
}) => {
  const [draft, setDraft] = useState<AvatarCustomization>(initialCustomization);
  const [activeTab, setActiveTab] = useState<'appearance' | 'clothing' | 'accessories'>('appearance');

  const handleUpdate = <K extends keyof AvatarCustomization>(key: K, value: AvatarCustomization[K]) => {
    playCozySound('toggle');
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    playCozySound('tap');
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('say_it_first_user_avatar', JSON.stringify(draft));
      } catch {
        // Local storage fallback
      }
    }
    onSave(draft);
    onClose();
  };

  const handleReset = () => {
    playCozySound('toggle');
    setDraft(DEFAULT_USER_AVATAR);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/30 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-studio-title"
    >
      <div className="bg-canvas-surface border border-canvas-border rounded-3xl shadow-xl max-w-3xl w-full overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-canvas-borderSubtle flex items-center justify-between shrink-0">
          <div>
            <h2 id="avatar-studio-title" className="text-xl font-display font-semibold text-ink-primary">
              My Avatar Studio
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Customize how your avatar appears on the Two-Person Stage
            </p>
          </div>
          <button
            onClick={() => {
              playCozySound('tap');
              onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-canvas-subtle transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Studio Body: Live Preview (Left) + Customizer Options (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 overflow-y-auto flex-1 items-start">
          {/* Left Column: 3D Preview */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="w-full rounded-2xl bg-canvas-subtle border border-canvas-border p-3 shadow-inner relative overflow-hidden flex flex-col items-center">
              <span className="text-[11px] font-medium text-teal-brand bg-teal-subtle px-2.5 py-0.5 rounded-full mb-2">
                Live 3D Preview
              </span>
              <Avatar3DRig
                state="listening"
                customization={draft}
                partnerName="You"
                partnerRole="User Avatar"
                className="w-full max-w-[240px]"
              />
              <p className="text-[11px] text-ink-muted text-center mt-2">
                Facing inward across the practice stage
              </p>
            </div>

            <button
              onClick={handleReset}
              className="mt-3 text-xs text-ink-muted hover:text-ink-primary underline transition"
            >
              Reset to default appearance
            </button>
          </div>

          {/* Right Column: Customizer Controls */}
          <div className="md:col-span-7 flex flex-col space-y-5">
            {/* Tab navigation */}
            <div className="flex border-b border-canvas-borderSubtle gap-4 pb-2">
              {[
                { id: 'appearance', label: 'Face & Hair' },
                { id: 'clothing', label: 'Wardrobe' },
                { id: 'accessories', label: 'Eyewear' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    playCozySound('pop');
                    setActiveTab(tab.id as typeof activeTab);
                  }}
                  className={`text-xs font-medium pb-1.5 transition border-b-2 ${
                    activeTab === tab.id
                      ? 'border-teal-brand text-teal-brand font-semibold'
                      : 'border-transparent text-ink-muted hover:text-ink-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB: APPEARANCE (Skin & Hair) */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                {/* Skin Tone Swatches */}
                <div>
                  <label className="text-xs font-semibold text-ink-secondary block mb-2">
                    Skin Tone
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {(Object.keys(SKIN_TONE_PALETTE) as SkinToneId[]).map((st) => {
                      const opt = SKIN_TONE_PALETTE[st];
                      const hexStr = `#${opt.hex.toString(16).padStart(6, '0')}`;
                      const isSelected = draft.skinTone === st;
                      return (
                        <button
                          key={st}
                          onClick={() => handleUpdate('skinTone', st)}
                          title={opt.label}
                          aria-label={opt.label}
                          className={`w-9 h-9 rounded-full border-2 transition transform active:scale-95 flex items-center justify-center ${
                            isSelected
                              ? 'border-teal-brand ring-2 ring-teal-brand/30 scale-105'
                              : 'border-canvas-border hover:border-ink-muted'
                          }`}
                          style={{ backgroundColor: hexStr }}
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hair Style Options */}
                <div>
                  <label className="text-xs font-semibold text-ink-secondary block mb-2">
                    Hair Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'short-part', label: 'Short Side-Part' },
                      { id: 'textured-crop', label: 'Textured Crop' },
                      { id: 'shoulder-waves', label: 'Shoulder Waves' },
                      { id: 'curls', label: 'Natural Curls' },
                      { id: 'top-knot', label: 'Top Knot Bun' },
                    ].map((hs) => (
                      <button
                        key={hs.id}
                        onClick={() => handleUpdate('hairStyle', hs.id as HairStyleId)}
                        className={`p-2.5 rounded-xl border text-xs text-left transition ${
                          draft.hairStyle === hs.id
                            ? 'bg-teal-subtle border-teal-brand text-teal-brand font-semibold'
                            : 'bg-canvas-surface border-canvas-border text-ink-secondary hover:bg-canvas-subtle'
                        }`}
                      >
                        {hs.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hair Color Swatches */}
                <div>
                  <label className="text-xs font-semibold text-ink-secondary block mb-2">
                    Hair Color
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {(Object.keys(HAIR_COLOR_PALETTE) as HairColorId[]).map((hc) => {
                      const opt = HAIR_COLOR_PALETTE[hc];
                      const hexStr = `#${opt.hex.toString(16).padStart(6, '0')}`;
                      const isSelected = draft.hairColor === hc;
                      return (
                        <button
                          key={hc}
                          onClick={() => handleUpdate('hairColor', hc)}
                          title={opt.label}
                          aria-label={opt.label}
                          className={`w-9 h-9 rounded-full border-2 transition transform active:scale-95 flex items-center justify-center ${
                            isSelected
                              ? 'border-teal-brand ring-2 ring-teal-brand/30 scale-105'
                              : 'border-canvas-border hover:border-ink-muted'
                          }`}
                          style={{ backgroundColor: hexStr }}
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CLOTHING */}
            {activeTab === 'clothing' && (
              <div className="space-y-4">
                {/* Clothing Style */}
                <div>
                  <label className="text-xs font-semibold text-ink-secondary block mb-2">
                    Outfit Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'cardigan', label: 'Cozy Cardigan & Tee' },
                      { id: 'crewneck', label: 'Relaxed Crewneck Knit' },
                      { id: 'polo', label: 'Smart Collared Polo' },
                      { id: 'blazer', label: 'Tailored Blazer' },
                    ].map((cs) => (
                      <button
                        key={cs.id}
                        onClick={() => handleUpdate('clothingStyle', cs.id as ClothingStyleId)}
                        className={`p-2.5 rounded-xl border text-xs text-left transition ${
                          draft.clothingStyle === cs.id
                            ? 'bg-teal-subtle border-teal-brand text-teal-brand font-semibold'
                            : 'bg-canvas-surface border-canvas-border text-ink-secondary hover:bg-canvas-subtle'
                        }`}
                      >
                        {cs.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clothing Color Palette */}
                <div>
                  <label className="text-xs font-semibold text-ink-secondary block mb-2">
                    Fabric Color
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {(Object.keys(CLOTHING_COLOR_PALETTE) as ClothingColorId[]).map((cc) => {
                      const opt = CLOTHING_COLOR_PALETTE[cc];
                      const hexStr = `#${opt.hex.toString(16).padStart(6, '0')}`;
                      const isSelected = draft.clothingColor === cc;
                      return (
                        <button
                          key={cc}
                          onClick={() => handleUpdate('clothingColor', cc)}
                          title={opt.label}
                          aria-label={opt.label}
                          className={`w-9 h-9 rounded-full border-2 transition transform active:scale-95 flex items-center justify-center ${
                            isSelected
                              ? 'border-teal-brand ring-2 ring-teal-brand/30 scale-105'
                              : 'border-canvas-border hover:border-ink-muted'
                          }`}
                          style={{ backgroundColor: hexStr }}
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ACCESSORIES & EYEWEAR */}
            {activeTab === 'accessories' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-ink-secondary block mb-2">
                    Eyewear Frame
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'none', label: 'None' },
                      { id: 'round', label: 'Round Frames' },
                      { id: 'rectangular', label: 'Rectangular Frames' },
                    ].map((ew) => (
                      <button
                        key={ew.id}
                        onClick={() => handleUpdate('eyewear', ew.id as EyewearId)}
                        className={`p-3 rounded-xl border text-xs text-center transition ${
                          draft.eyewear === ew.id
                            ? 'bg-teal-subtle border-teal-brand text-teal-brand font-semibold'
                            : 'bg-canvas-surface border-canvas-border text-ink-secondary hover:bg-canvas-subtle'
                        }`}
                      >
                        {ew.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-canvas-subtle border border-canvas-border rounded-xl">
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Eyewear features subtle matte wireframes crafted to keep facial expressions and almond eye gaze clear during conversation.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-canvas-borderSubtle bg-canvas-light flex items-center justify-between shrink-0">
          <span className="text-xs text-ink-muted">Saved locally on this device</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playCozySound('tap');
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-medium text-ink-secondary hover:bg-canvas-subtle transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-brand text-canvas-surface hover:bg-teal-hover transition shadow-sm"
            >
              Save Avatar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
