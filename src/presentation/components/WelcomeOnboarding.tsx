'use client';

/**
 * WelcomeOnboarding.tsx — Welcoming Entry & Personalization Flow
 *
 * Implements the approved introductory experience:
 * - Exact approved welcome copy:
 *     Headline: "Find more room to say what you mean."
 *     Supporting: "Explore conversations, practice at your own pace, and discover approaches that work for you."
 *     Primary Action: "Make it yours"
 *     Secondary Action: "Explore first"
 * - Step 1: Interests ("Where would you like to feel more comfortable?")
 * - Step 2: Goals ("What would you like to practice?")
 * - Step 3: Guidance ("What kind of support would you like?")
 * - Reassurance: "You can change all of this later."
 * - Respects reduced motion, non-diagnostic, calm, adult aesthetic.
 */

import React, { useState } from 'react';
import { Avatar3DRig } from './Avatar3DRig';
import { playCozySound } from '../utils/cozyAudio';

export interface UserPreferences {
  interests: string[];
  goals: string[];
  guidanceLevel: 'independent' | 'cues' | 'subtext';
  inputPreference: 'text' | 'voice';
  spokenPartnerAudio: boolean;
  reducedMotion: boolean;
  hideAvatar: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  interests: ['work-school', 'friendships'],
  goals: ['Expressing what I need', 'Understanding possible misunderstandings'],
  guidanceLevel: 'cues',
  inputPreference: 'text',
  spokenPartnerAudio: false,
  reducedMotion: false,
  hideAvatar: false,
};

interface WelcomeOnboardingProps {
  onComplete: (prefs: UserPreferences) => void;
  onExploreDirectly: () => void;
  isReturningUser?: boolean;
}

export const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({
  onComplete,
  onExploreDirectly,
  isReturningUser = false,
}) => {
  const [stage, setStage] = useState<'welcome' | 'step1' | 'step2' | 'step3'>('welcome');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Work or school',
    'Friendships',
  ]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Expressing what I need',
    'Understanding possible misunderstandings',
  ]);
  const [guidanceLevel, setGuidanceLevel] = useState<'independent' | 'cues' | 'subtext'>('cues');
  const [inputPref, setInputPref] = useState<'text' | 'voice'>('text');
  const [spokenAudio, setSpokenAudio] = useState<boolean>(false);
  const [reducedMotionSetting, setReducedMotionSetting] = useState<boolean>(false);

  // Interest options
  const interestOptions = [
    { id: 'work-school', label: 'Work or school' },
    { id: 'friendships', label: 'Friendships' },
    { id: 'everyday', label: 'Everyday conversations' },
    { id: 'boundaries', label: 'Difficult conversations' },
    { id: 'meeting-people', label: 'Meeting new people' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'dating', label: 'Dating and relationships' },
    { id: 'exploring', label: 'I’m just exploring' },
  ];

  // Goal options
  const goalOptions = [
    'Starting a conversation',
    'Keeping a conversation going',
    'Expressing what I need',
    'Understanding possible misunderstandings',
    'Setting boundaries',
    'Handling disagreement',
    'Finding words when I’m unsure',
  ];

  const toggleInterest = (label: string) => {
    setSelectedInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label],
    );
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  };

  const handleFinishOnboarding = () => {
    const prefs: UserPreferences = {
      interests: selectedInterests.length > 0 ? selectedInterests : ['Work or school'],
      goals: selectedGoals.length > 0 ? selectedGoals : ['Expressing what I need'],
      guidanceLevel,
      inputPreference: inputPref,
      spokenPartnerAudio: spokenAudio,
      reducedMotion: reducedMotionSetting,
      hideAvatar: false,
    };
    onComplete(prefs);
  };

  // 1. WELCOME VIEW
  if (stage === 'welcome') {
    return (
      <div className="min-h-screen bg-canvas-light text-ink-primary flex flex-col justify-between p-6 md:p-12 transition-colors">
        {/* Top minimal header */}
        <header className="max-w-5xl mx-auto w-full flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-brand text-canvas-surface flex items-center justify-center font-bold text-base shadow-sm">
              S
            </div>
            <span className="font-semibold text-lg tracking-tight text-ink-primary">Say It First</span>
          </div>

          <button
            onClick={onExploreDirectly}
            className="text-sm font-medium text-ink-muted hover:text-ink-primary px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-brand"
          >
            Explore first
          </button>
        </header>

        {/* Main hero composition */}
        <main className="max-w-5xl mx-auto w-full my-auto py-10 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          {/* Left: Warm, clear copy */}
          <div className="md:col-span-7 flex flex-col items-start text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-teal-subtle text-teal-brand border border-teal-border mb-4">
              <span className="w-2 h-2 rounded-full bg-teal-brand" />
              {isReturningUser ? 'Welcome back • Settings & progress saved' : 'Conversational Sandbox'}
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-semibold tracking-tight text-ink-primary leading-tight mb-5">
              Find more room to say what you mean.
            </h1>

            <p className="text-lg md:text-xl text-ink-secondary leading-relaxed mb-8 max-w-xl">
              Explore conversations, practice at your own pace, and discover approaches that work for you.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              {isReturningUser ? (
                <>
                  <button
                    onClick={() => {
                      playCozySound('tap');
                      onExploreDirectly();
                    }}
                    className="px-6 py-3.5 rounded-xl bg-teal-brand text-canvas-surface font-medium hover:bg-teal-hover active:bg-teal-active transition shadow-sm text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-brand"
                  >
                    Continue
                  </button>

                  <button
                    onClick={() => {
                      playCozySound('tap');
                      setStage('step1');
                    }}
                    className="px-6 py-3.5 rounded-xl bg-canvas-surface border border-canvas-border text-ink-primary font-medium hover:bg-canvas-subtle transition text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-brand"
                  >
                    Adjust preferences
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      playCozySound('tap');
                      setStage('step1');
                    }}
                    className="px-6 py-3.5 rounded-xl bg-teal-brand text-canvas-surface font-medium hover:bg-teal-hover active:bg-teal-active transition shadow-sm text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-brand"
                  >
                    Make it yours
                  </button>

                  <button
                    onClick={() => {
                      playCozySound('tap');
                      onExploreDirectly();
                    }}
                    className="px-6 py-3.5 rounded-xl bg-canvas-surface border border-canvas-border text-ink-primary font-medium hover:bg-canvas-subtle transition text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-brand"
                  >
                    Explore first
                  </button>
                </>
              )}
            </div>

            <p className="text-xs text-ink-muted mt-6 flex items-center gap-1.5">
              <span>Low-pressure, non-judgmental practice.</span>
              <span className="text-canvas-border">•</span>
              <span>No communication scores or grading.</span>
            </p>
          </div>

          {/* Right: Tasteful 3D Partner Preview */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="w-full max-w-sm rounded-3xl bg-canvas-surface border border-canvas-border p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-4 left-4 z-10">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-canvas-subtle border border-canvas-border text-ink-secondary">
                  Interactive 3D Partner
                </span>
              </div>
              <Avatar3DRig
                state="listening"
                partnerVariant="maya"
                partnerName="Maya"
                partnerRole="Friend & Practice Partner"
              />
              <div className="text-center pt-2 pb-1">
                <p className="text-xs text-ink-muted">
                  Warm, expressive partner with visible nonverbal cues
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="max-w-5xl mx-auto w-full pt-4 pb-2 border-t border-canvas-borderSubtle flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted gap-2">
          <span>Say It First • Double Empathy Conversational Sandbox</span>
          <span>Accessible • Neurodiversity-Affirming • Sensory-Friendly</span>
        </footer>
      </div>
    );
  }

  // 2. ONBOARDING STEPPER
  return (
    <div className="min-h-screen bg-canvas-light text-ink-primary flex flex-col justify-between p-6 md:p-12">
      {/* Top Progress & Skip */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span
              className={`h-1.5 w-8 rounded-full ${
                stage === 'step1' || stage === 'step2' || stage === 'step3'
                  ? 'bg-teal-brand'
                  : 'bg-canvas-border'
              }`}
            />
            <span
              className={`h-1.5 w-8 rounded-full ${
                stage === 'step2' || stage === 'step3' ? 'bg-teal-brand' : 'bg-canvas-border'
              }`}
            />
            <span
              className={`h-1.5 w-8 rounded-full ${
                stage === 'step3' ? 'bg-teal-brand' : 'bg-canvas-border'
              }`}
            />
          </div>
          <span className="text-xs text-ink-muted ml-2">
            {stage === 'step1' ? '1 of 3' : stage === 'step2' ? '2 of 3' : '3 of 3'}
          </span>
        </div>

        <button
          onClick={handleFinishOnboarding}
          className="text-xs font-medium text-ink-muted hover:text-ink-primary px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-teal-brand"
        >
          Skip to dashboard
        </button>
      </header>

      {/* Stepper Content */}
      <main className="max-w-2xl mx-auto w-full my-auto py-8">
        {/* STEP 1: INTERESTS */}
        {stage === 'step1' && (
          <div className="animate-fadeIn">
            <span className="text-xs font-semibold tracking-wider uppercase text-teal-brand mb-2 block">
              Step 1 • Interests
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-primary mb-3">
              Where would you like to feel more comfortable?
            </h2>
            <p className="text-sm text-ink-muted mb-8">
              Choose as many as you like. We’ll organize your topic dashboard around what matters to you.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
              {interestOptions.map((opt) => {
                const isSelected = selectedInterests.includes(opt.label);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleInterest(opt.label)}
                    className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-subtle border-teal-brand text-ink-primary font-medium'
                        : 'bg-canvas-surface border-canvas-border text-ink-secondary hover:bg-canvas-subtle'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        isSelected
                          ? 'bg-teal-brand text-canvas-surface font-bold'
                          : 'border border-canvas-border'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-canvas-borderSubtle">
              <span className="text-xs text-ink-muted">You can change all of this later.</span>
              <button
                onClick={() => setStage('step2')}
                className="px-6 py-2.5 rounded-xl bg-teal-brand text-canvas-surface font-medium hover:bg-teal-hover transition text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand"
              >
                Continue to Goals
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GOALS */}
        {stage === 'step2' && (
          <div className="animate-fadeIn">
            <span className="text-xs font-semibold tracking-wider uppercase text-teal-brand mb-2 block">
              Step 2 • Goals
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-primary mb-3">
              What would you like to practice?
            </h2>
            <p className="text-sm text-ink-muted mb-8">
              Pick the conversational moments you’d like to explore and find words for.
            </p>

            <div className="space-y-2.5 mb-10">
              {goalOptions.map((goal) => {
                const isSelected = selectedGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-subtle border-teal-brand text-ink-primary font-medium'
                        : 'bg-canvas-surface border-canvas-border text-ink-secondary hover:bg-canvas-subtle'
                    }`}
                  >
                    <span>{goal}</span>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        isSelected
                          ? 'bg-teal-brand text-canvas-surface font-bold'
                          : 'border border-canvas-border'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-canvas-borderSubtle">
              <button
                onClick={() => setStage('step1')}
                className="text-sm font-medium text-ink-muted hover:text-ink-primary transition"
              >
                Back
              </button>
              <button
                onClick={() => setStage('step3')}
                className="px-6 py-2.5 rounded-xl bg-teal-brand text-canvas-surface font-medium hover:bg-teal-hover transition text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand"
              >
                Continue to Guidance
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GUIDANCE & PREFERENCES */}
        {stage === 'step3' && (
          <div className="animate-fadeIn">
            <span className="text-xs font-semibold tracking-wider uppercase text-teal-brand mb-2 block">
              Step 3 • Guidance & Comfort
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-primary mb-3">
              What kind of support would you like?
            </h2>
            <p className="text-sm text-ink-muted mb-8">
              Adjust how much coaching and subtext insight appears during practice.
            </p>

            {/* Guidance Levels */}
            <div className="space-y-3 mb-8">
              {[
                {
                  id: 'independent',
                  title: 'Let me explore independently',
                  desc: 'A clean stage focused solely on the conversation partner and your words.',
                },
                {
                  id: 'cues',
                  title: 'Give me occasional cues',
                  desc: 'Gentle hints, posture cues, and helpful phrasing options when you want them.',
                },
                {
                  id: 'subtext',
                  title: 'Explain the conversation as I go',
                  desc: 'Full Two-Way Bridge showing what you meant alongside how words may land.',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setGuidanceLevel(opt.id as 'independent' | 'cues' | 'subtext')}
                  className={`w-full p-4 rounded-xl border text-left transition ${
                    guidanceLevel === opt.id
                      ? 'bg-teal-subtle border-teal-brand shadow-sm'
                      : 'bg-canvas-surface border-canvas-border hover:bg-canvas-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-ink-primary text-base">{opt.title}</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        guidanceLevel === opt.id ? 'border-teal-brand bg-teal-brand' : 'border-canvas-border'
                      }`}
                    >
                      {guidanceLevel === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted">{opt.desc}</p>
                </button>
              ))}
            </div>

            {/* Comfort Settings */}
            <div className="p-4 rounded-xl bg-canvas-surface border border-canvas-border space-y-4 mb-8">
              <span className="text-xs font-semibold uppercase text-ink-muted block">
                Comfort Preferences
              </span>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-ink-primary block">Input method</span>
                  <span className="text-xs text-ink-muted">How you prefer entering your turns</span>
                </div>
                <div className="flex items-center gap-1 bg-canvas-subtle p-1 rounded-lg border border-canvas-border">
                  <button
                    onClick={() => setInputPref('text')}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      inputPref === 'text' ? 'bg-canvas-surface text-ink-primary shadow-xs' : 'text-ink-muted'
                    }`}
                  >
                    Typing
                  </button>
                  <button
                    onClick={() => setInputPref('voice')}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      inputPref === 'voice' ? 'bg-canvas-surface text-ink-primary shadow-xs' : 'text-ink-muted'
                    }`}
                  >
                    Speaking
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-canvas-borderSubtle">
                <div>
                  <span className="text-sm font-medium text-ink-primary block">Spoken partner responses</span>
                  <span className="text-xs text-ink-muted">Allow browser speech synthesis</span>
                </div>
                <button
                  onClick={() => setSpokenAudio(!spokenAudio)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                    spokenAudio ? 'bg-teal-brand' : 'bg-canvas-border'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      spokenAudio ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-canvas-borderSubtle">
                <div>
                  <span className="text-sm font-medium text-ink-primary block">Reduced motion</span>
                  <span className="text-xs text-ink-muted">Keep avatars still with calm breathing only</span>
                </div>
                <button
                  onClick={() => setReducedMotionSetting(!reducedMotionSetting)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                    reducedMotionSetting ? 'bg-teal-brand' : 'bg-canvas-border'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      reducedMotionSetting ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-canvas-borderSubtle">
              <button
                onClick={() => setStage('step2')}
                className="text-sm font-medium text-ink-muted hover:text-ink-primary transition"
              >
                Back
              </button>
              <button
                onClick={handleFinishOnboarding}
                className="px-6 py-2.5 rounded-xl bg-teal-brand text-canvas-surface font-medium hover:bg-teal-hover transition text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-brand"
              >
                Finish & Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Reassurance */}
      <footer className="max-w-2xl mx-auto w-full pt-4 pb-2 text-center text-xs text-ink-muted">
        <span>“You can change all of this later.”</span>
      </footer>
    </div>
  );
};
