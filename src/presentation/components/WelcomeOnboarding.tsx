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
      <div className="min-h-screen bg-canvas-light text-ink-primary flex flex-col justify-between p-6 sm:p-10 md:p-12 relative overflow-hidden transition-all duration-700">
        {/* Subtle, serene ambient lighting glows */}
        <div
          aria-hidden="true"
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sif-primary/10 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] rounded-full bg-sif-accent/10 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 left-1/4 w-[32rem] h-[32rem] rounded-full bg-sif-secondary/15 blur-3xl pointer-events-none"
        />

        {/* Top minimal header */}
        <header className="max-w-6xl mx-auto w-full flex items-center justify-between pt-2 relative z-10 animate-page-enter">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-8 sm:w-11 sm:h-9 flex items-center justify-center shrink-0">
              <img
                src="/logo-mark.png"
                alt="Say It First logo"
                className="w-full h-full object-contain filter drop-shadow-xs"
              />
            </div>
            <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-ink-primary">
              Say It First
            </span>
          </div>

          <button
            onClick={() => {
              playCozySound('tap');
              onExploreDirectly();
            }}
            className="text-xs sm:text-sm font-medium text-ink-secondary hover:text-ink-primary px-4 py-2 rounded-full border border-canvas-border hover:border-sif-border bg-white/70 hover:bg-white backdrop-blur-xs transition-all shadow-2xs hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-sif-primary cursor-pointer"
          >
            Explore first
          </button>
        </header>

        {/* Main hero composition */}
        <main className="max-w-6xl mx-auto w-full my-auto py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10 animate-page-enter">
          {/* Left: Clear, elegant editorial copy */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-sif-primarySubtle text-sif-primaryDeep border border-sif-border mb-6 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-sif-primary animate-pulse" />
              <span>{isReturningUser ? 'Welcome back • Settings & progress saved' : 'Conversational Sandbox'}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-tight text-ink-primary leading-[1.12] mb-6">
              Find more room to <span className="text-sif-primary">say what you mean</span>.
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-ink-secondary leading-relaxed mb-8 sm:mb-10 max-w-xl font-normal">
              Explore conversations, practice at your own pace, and discover approaches that work for you.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
              {isReturningUser ? (
                <>
                  <button
                    onClick={() => {
                      playCozySound('tap');
                      onExploreDirectly();
                    }}
                    className="px-7 py-3.5 rounded-2xl bg-sif-primary text-white font-medium hover:bg-sif-primaryHover transition-all shadow-card hover:shadow-card-hover text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sif-primary flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Continue</span>
                    <svg className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => {
                      playCozySound('tap');
                      setStage('step1');
                    }}
                    className="px-6 py-3.5 rounded-2xl bg-white/80 border border-canvas-border hover:border-sif-border text-ink-primary font-medium hover:bg-white transition-all shadow-2xs hover:shadow-card text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sif-primary cursor-pointer"
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
                    className="px-7 py-3.5 rounded-2xl bg-sif-primary text-white font-medium hover:bg-sif-primaryHover transition-all shadow-card hover:shadow-card-hover text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sif-primary flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Make it yours</span>
                    <svg className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => {
                      playCozySound('tap');
                      onExploreDirectly();
                    }}
                    className="px-6 py-3.5 rounded-2xl bg-white/80 border border-canvas-border hover:border-sif-border text-ink-primary font-medium hover:bg-white transition-all shadow-2xs hover:shadow-card text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sif-primary cursor-pointer"
                  >
                    Explore first
                  </button>
                </>
              )}
            </div>

            <div className="pt-8 mt-2 border-t border-canvas-borderSubtle flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Low-pressure, non-judgmental practice.
              </span>
              <span className="text-canvas-border hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sif-primary" />
                No communication scores or grading.
              </span>
            </div>
          </div>

          {/* Right: Atmospheric, Branded Conversation Scene */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="w-full max-w-md rounded-3xl bg-white/70 backdrop-blur-md border border-white/80 p-6 sm:p-7 shadow-featured-glass relative overflow-hidden flex flex-col gap-4">
              {/* Subtle ambient lighting inner aura */}
              <div
                aria-hidden="true"
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-sif-primary/10 blur-2xl pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-sif-accent/15 blur-2xl pointer-events-none"
              />

              {/* Top Scene Label */}
              <div className="flex items-center justify-between relative z-10">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-ink-primary">
                  <div className="w-2 h-2 rounded-full bg-sif-primary animate-pulse" />
                  <span>Double Empathy Practice</span>
                </div>
                <span className="text-[11px] text-ink-muted font-medium">Safe Space</span>
              </div>

              {/* Bubble 1: What you need (authentic expression) */}
              <div className="relative z-10 self-start max-w-[85%] rounded-2xl rounded-bl-xs bg-white border border-canvas-border/80 p-4 shadow-card hover:shadow-card-hover transition-all duration-300">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-sif-primary" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-muted">
                    Your Need • Clear & Direct
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-ink-primary font-medium leading-relaxed">
                  “Would it work if I send a quick 2-bullet summary in writing so we’re both aligned on deliverables?”
                </p>
              </div>

              {/* Reassuring Bridge Pill */}
              <div className="relative z-10 self-center inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sif-primarySubtle/90 border border-sif-border text-[11px] font-medium text-sif-primaryDeep shadow-2xs backdrop-blur-xs">
                <svg className="w-3.5 h-3.5 text-sif-primary shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Understood without masking</span>
              </div>

              {/* Bubble 2: Partner response (warm, aligned) */}
              <div className="relative z-10 self-end max-w-[85%] rounded-2xl rounded-br-xs bg-[#F5F7FF] border border-sif-border p-4 shadow-card hover:shadow-card-hover transition-all duration-300">
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-muted">
                      Sophia • Project Lead
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">Receptive</span>
                </div>
                <p className="text-xs sm:text-sm text-ink-primary font-medium leading-relaxed">
                  “That helps a lot! A quick thumbs-up is all we need so nothing gets lost.”
                </p>
              </div>

              {/* Quiet brand reassurance caption */}
              <div className="text-center pt-1 relative z-10">
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Express needs comfortably • Retries without scoring
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="max-w-6xl mx-auto w-full pt-4 pb-2 border-t border-canvas-borderSubtle flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted gap-2 relative z-10">
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
                  ? 'bg-sif-primary'
                  : 'bg-canvas-border'
              }`}
            />
            <span
              className={`h-1.5 w-8 rounded-full ${
                stage === 'step2' || stage === 'step3' ? 'bg-sif-primary' : 'bg-canvas-border'
              }`}
            />
            <span
              className={`h-1.5 w-8 rounded-full ${
                stage === 'step3' ? 'bg-sif-primary' : 'bg-canvas-border'
              }`}
            />
          </div>
          <span className="text-xs text-ink-muted ml-2">
            {stage === 'step1' ? '1 of 3' : stage === 'step2' ? '2 of 3' : '3 of 3'}
          </span>
        </div>

        <button
          onClick={handleFinishOnboarding}
          className="text-xs font-medium text-ink-muted hover:text-ink-primary px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-sif-primary"
        >
          Skip to dashboard
        </button>
      </header>

      {/* Stepper Content */}
      <main className="max-w-2xl mx-auto w-full my-auto py-8">
        {/* STEP 1: INTERESTS */}
        {stage === 'step1' && (
          <div className="animate-fadeIn">
            <span className="text-xs font-semibold tracking-wider uppercase text-sif-primary mb-2 block">
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
                        ? 'bg-sif-primarySubtle border-sif-primary text-ink-primary font-medium'
                        : 'bg-canvas-surface border-canvas-border text-ink-secondary hover:bg-canvas-subtle'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        isSelected
                          ? 'bg-sif-primary text-canvas-surface font-bold'
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
                className="px-6 py-2.5 rounded-xl bg-sif-primary text-canvas-surface font-medium hover:bg-sif-primaryHover transition text-sm focus:outline-none focus:ring-2 focus:ring-sif-primary"
              >
                Continue to Goals
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GOALS */}
        {stage === 'step2' && (
          <div className="animate-fadeIn">
            <span className="text-xs font-semibold tracking-wider uppercase text-sif-primary mb-2 block">
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
                        ? 'bg-sif-primarySubtle border-sif-primary text-ink-primary font-medium'
                        : 'bg-canvas-surface border-canvas-border text-ink-secondary hover:bg-canvas-subtle'
                    }`}
                  >
                    <span>{goal}</span>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        isSelected
                          ? 'bg-sif-primary text-canvas-surface font-bold'
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
                className="px-6 py-2.5 rounded-xl bg-sif-primary text-canvas-surface font-medium hover:bg-sif-primaryHover transition text-sm focus:outline-none focus:ring-2 focus:ring-sif-primary"
              >
                Continue to Guidance
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GUIDANCE & PREFERENCES */}
        {stage === 'step3' && (
          <div className="animate-fadeIn">
            <span className="text-xs font-semibold tracking-wider uppercase text-sif-primary mb-2 block">
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
                      ? 'bg-sif-primarySubtle border-sif-primary shadow-sm'
                      : 'bg-canvas-surface border-canvas-border hover:bg-canvas-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-ink-primary text-base">{opt.title}</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        guidanceLevel === opt.id ? 'border-sif-primary bg-sif-primary' : 'border-canvas-border'
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
                    spokenAudio ? 'bg-sif-primary' : 'bg-canvas-border'
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
                    reducedMotionSetting ? 'bg-sif-primary' : 'bg-canvas-border'
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
                className="px-6 py-2.5 rounded-xl bg-sif-primary text-canvas-surface font-medium hover:bg-sif-primaryHover transition text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sif-primary"
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
