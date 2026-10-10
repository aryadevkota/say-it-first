'use client';

/**
 * TopicDashboard.tsx — Personalized Topic Dashboard & Discovery Hub
 *
 * Implements:
 * - Top navigation: Home, Explore, My progress, Preferences
 * - "What would you like to explore today?" personalized greeting
 * - Dynamic "Topics for you" recommendations driven by onboarding preferences
 * - "Continue exploring" section for in-progress topics
 * - "A small place to start" gentle low-stakes on-ramp
 * - Categorized browse with clean, uncluttered topic cards
 * - Honest status distinction (ready vs preview)
 */

import React, { useState } from 'react';
import {
  TOPICS,
  type ScenarioDefinition,
  type InterestCategory,
  type TopicProgressStatus,
} from '../../domain/scenarios/topics';
import type { UserPreferences } from './WelcomeOnboarding';
import { TopicDetailModal } from './TopicDetailModal';
import { MyProgress, type SavedTakeaway } from './MyProgress';
import { MyScenarios } from './MyScenarios';
import { playCozySound } from '../utils/cozyAudio';

interface TopicDashboardProps {
  preferences: UserPreferences;
  progressMap: Record<string, TopicProgressStatus>;
  savedTakeaways: SavedTakeaway[];
  activeTopicId?: string;
  customScenarios?: ScenarioDefinition[];
  onStartPractice: (topic: ScenarioDefinition) => void;
  onOpenPreferences: () => void;  onMarkExplored: (topicId: string) => void;
  onDeleteTakeaway?: (id: string) => void;
  onCreateCustomScenario?: () => void;
  onDeleteCustomScenario?: (id: string) => void;
}

export const TopicDashboard: React.FC<TopicDashboardProps> = ({
  preferences,
  progressMap,
  savedTakeaways,
  activeTopicId,
  customScenarios = [],
  onStartPractice,
  onOpenPreferences,  onMarkExplored,
  onDeleteTakeaway,
  onCreateCustomScenario,
  onDeleteCustomScenario,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'scenarios' | 'progress'>('home');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [modalTopic, setModalTopic] = useState<ScenarioDefinition | null>(null);

  // Derive "Continue Exploring" topic
  const activeTopic = activeTopicId ? TOPICS.find((t) => t.id === activeTopicId) : undefined;

  // Derive "Topics for you" based on onboarding interests
  const recommendedTopics = TOPICS.filter((topic) => {
    // Match against user interests if set
    const matchesInterest = preferences.interests.some(
      (interest) =>
        (interest === 'Work or school' && topic.category === 'work-school') ||
        (interest === 'Friendships' && topic.category === 'friendships') ||
        (interest === 'Everyday conversations' && topic.category === 'everyday') ||
        (interest === 'Difficult conversations' && topic.category === 'boundaries') ||
        (interest === 'Meeting new people' && topic.category === 'meeting-people') ||
        (interest === 'Appointments' && topic.category === 'appointments'),
    );
    return matchesInterest;
  });

  // Fallback if no specific recommendations match
  const displayRecommendations =
    recommendedTopics.length > 0 ? recommendedTopics.slice(0, 3) : TOPICS.slice(0, 3);

  // Low-stakes starter topic
  const starterTopic = TOPICS.find((t) => t.id === 'everyday-smalltalk') || TOPICS[0];

  // Filtered topics for the Explore tab
  const filteredTopics =
    selectedCategoryFilter === 'all'
      ? TOPICS
      : TOPICS.filter((t) => t.category === selectedCategoryFilter);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Topics' },
    { id: 'work-school', label: 'Work & School' },
    { id: 'friendships', label: 'Friendships' },
    { id: 'boundaries', label: 'Setting Boundaries' },
    { id: 'everyday', label: 'Everyday Conversations' },
    { id: 'meeting-people', label: 'Meeting People' },
    { id: 'appointments', label: 'Appointments' },
  ];

  return (
    <div className="min-h-screen bg-canvas-light text-ink-primary flex flex-col">
      {/* Top Navigation */}
      <nav className="border-b border-canvas-borderSubtle bg-canvas-surface/80 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-brand text-canvas-surface flex items-center justify-center font-bold text-base shadow-sm">
              S
            </div>
            <span className="font-semibold text-lg text-ink-primary tracking-tight">Say It First</span>
          </div>

          {/* Center Tabs */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'home'
                  ? 'bg-teal-subtle text-teal-brand font-semibold'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'explore'
                  ? 'bg-teal-subtle text-teal-brand font-semibold'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'scenarios'
                  ? 'bg-teal-subtle text-teal-brand font-semibold'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              My scenarios
              {customScenarios.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-teal-brand text-canvas-surface">
                  {customScenarios.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'progress'
                  ? 'bg-teal-subtle text-teal-brand font-semibold'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              My progress
            </button>
          </div>

          {/* Right Action: Preferences */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                playCozySound('tap');
                onOpenPreferences();
              }}
              className="p-2 rounded-xl text-ink-muted hover:text-ink-primary hover:bg-canvas-subtle transition focus:outline-none focus:ring-2 focus:ring-teal-brand"
              aria-label="Preferences and comfort settings"
              title="Preferences"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-12 animate-fadeIn">
            {/* Welcoming Greeting */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-ink-primary">
                What would you like to explore today?
              </h1>
              <p className="text-sm text-ink-secondary mt-1 max-w-2xl">
                Choose a conversation to practice or learn the ideas behind them. Everything is self-paced with non-destructive retries.
              </p>
            </div>

            {/* Section: Continue Exploring (if available) */}
            {activeTopic && (
              <div className="p-6 rounded-3xl bg-teal-subtle/50 border border-teal-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-brand">
                    Continue Exploring
                  </span>
                  <span className="text-xs text-ink-muted">In Progress</span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-ink-primary">{activeTopic.title}</h2>
                    <p className="text-xs text-ink-secondary mt-0.5">{activeTopic.subtitle}</p>
                  </div>
                  <button
                    onClick={() => onStartPractice(activeTopic)}
                    className="px-5 py-2.5 rounded-xl bg-teal-brand text-canvas-surface font-medium hover:bg-teal-hover transition text-sm shadow-xs shrink-0"
                  >
                    Resume practice
                  </button>
                </div>
              </div>
            )}

            {/* Section: Create Custom Scenario Callout */}
            <div className="p-6 rounded-3xl bg-teal-subtle/40 border border-teal-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-brand">
                    Personal Practice
                  </span>
                  <span className="text-canvas-border">•</span>
                  <span className="text-xs text-ink-muted">Tailored to your real conversations</span>
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-ink-primary">
                  Have a specific conversation in mind?
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5 max-w-xl">
                  Paste a situation or upload notes (.txt, .md, .json) to prepare an adaptive practice partner with customized boundaries and goals.
                </p>
              </div>
              <button
                onClick={onCreateCustomScenario || (() => setActiveTab('scenarios'))}
                className="px-5 py-2.5 rounded-xl bg-teal-brand text-canvas-surface font-medium hover:bg-teal-hover transition text-xs shadow-xs shrink-0 flex items-center gap-1.5"
              >
                <span>+ Create a scenario</span>
              </button>
            </div>

            {/* Section: Topics for You */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-ink-primary">Topics for you</h2>
                  <p className="text-xs text-ink-muted">
                    Recommended based on your chosen comfort areas.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="text-xs font-medium text-teal-brand hover:underline"
                >
                  View all topics →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {displayRecommendations.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    progress={progressMap[topic.id] || 'not-started'}
                    onOpen={() => setModalTopic(topic)}
                    onPractice={() => onStartPractice(topic)}
                  />
                ))}
              </div>
            </div>

            {/* Section: A Small Place to Start */}
            <div className="p-6 rounded-3xl bg-canvas-surface border border-canvas-border shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-topic-amber">
                  A small place to start
                </span>
                <span className="text-canvas-border">•</span>
                <span className="text-xs text-ink-muted">Low pressure warm-up</span>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-ink-primary">{starterTopic.title}</h3>
                  <p className="text-xs text-ink-secondary mt-1 max-w-xl">{starterTopic.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setModalTopic(starterTopic)}
                    className="px-4 py-2 rounded-xl bg-canvas-subtle hover:bg-canvas-border text-ink-primary text-xs font-medium transition"
                  >
                    Understand idea
                  </button>
                  <button
                    onClick={() => onStartPractice(starterTopic)}
                    className="px-4 py-2 rounded-xl bg-teal-brand hover:bg-teal-hover text-canvas-surface text-xs font-medium transition shadow-xs"
                  >
                    Try it now
                  </button>
                </div>
              </div>
            </div>

            {/* Section: Browse by Interest */}
            <div>
              <h2 className="text-lg font-semibold text-ink-primary mb-4">Browse by interest</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {categories
                  .filter((c) => c.id !== 'all')
                  .map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryFilter(cat.id);
                        setActiveTab('explore');
                      }}
                      className="p-3.5 rounded-2xl bg-canvas-surface border border-canvas-border text-center hover:border-teal-border hover:bg-canvas-subtle transition flex flex-col items-center justify-center gap-1.5"
                    >
                      <span className="text-xs font-medium text-ink-primary">{cat.label}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXPLORE (FULL TOPIC CATALOG) */}
        {activeTab === 'explore' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-primary">
                Explore All Topics
              </h1>
              <p className="text-sm text-ink-secondary mt-1">
                Browse our full library of conversation scenarios and communication ideas.
              </p>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                    selectedCategoryFilter === cat.id
                      ? 'bg-teal-brand text-canvas-surface'
                      : 'bg-canvas-surface border border-canvas-border text-ink-secondary hover:bg-canvas-subtle'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {filteredTopics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  progress={progressMap[topic.id] || 'not-started'}
                  onOpen={() => setModalTopic(topic)}
                  onPractice={() => onStartPractice(topic)}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MY SCENARIOS */}
        {activeTab === 'scenarios' && (
          <MyScenarios
            customScenarios={customScenarios}
            onCreateNew={onCreateCustomScenario || (() => {})}
            onPracticeScenario={onStartPractice}
            onDeleteScenario={onDeleteCustomScenario || (() => {})}
          />
        )}

        {/* TAB 4: MY PROGRESS */}
        {activeTab === 'progress' && (
          <MyProgress
            progressMap={progressMap}
            savedTakeaways={savedTakeaways}
            onSelectTopic={(topic) => setModalTopic(topic)}
            onDeleteTakeaway={onDeleteTakeaway}
          />
        )}
      </main>

      {/* Topic Detail Modal */}
      {modalTopic && (
        <TopicDetailModal
          topic={modalTopic}
          onClose={() => setModalTopic(null)}
          onStartPractice={(t) => {
            setModalTopic(null);
            onStartPractice(t);
          }}
          onMarkExplored={onMarkExplored}
        />
      )}
    </div>
  );
};

// ── Individual Topic Card Component ──────────────────────────────────────────

interface TopicCardProps {
  topic: ScenarioDefinition;
  progress: TopicProgressStatus;
  onOpen: () => void;
  onPractice: () => void;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, progress, onOpen, onPractice }) => {
  const isPreview = topic.status === 'preview';

  return (
    <div className="bg-canvas-surface border border-canvas-border rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-teal-border hover:shadow-sm transition text-ink-primary">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-brand">
            {topic.categoryLabel}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-ink-muted">~{topic.estimatedMinutes}m</span>
            {isPreview && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-canvas-subtle border border-canvas-border text-ink-muted">
                Upcoming
              </span>
            )}
          </div>
        </div>

        {/* Title & Subtitle */}
        <h3 className="font-semibold text-ink-primary text-base mb-1.5 leading-snug">{topic.title}</h3>
        <p className="text-xs text-ink-secondary leading-relaxed line-clamp-2">{topic.subtitle}</p>
      </div>

      {/* Bottom Actions */}
      <div className="pt-5 mt-4 border-t border-canvas-borderSubtle flex items-center justify-between">
        <button
          onClick={onOpen}
          className="text-xs font-medium text-ink-muted hover:text-ink-primary transition"
        >
          Understand idea
        </button>

        {isPreview ? (
          <button
            onClick={onOpen}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-canvas-subtle text-ink-muted hover:text-ink-primary"
          >
            Preview
          </button>
        ) : (
          <button
            onClick={onPractice}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-teal-brand hover:bg-teal-hover text-canvas-surface transition shadow-2xs"
          >
            Practice
          </button>
        )}
      </div>
    </div>
  );
};
