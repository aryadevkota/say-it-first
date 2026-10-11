'use client';

/**
 * AppShell.tsx — Production Application Shell for Say It First (SiF)
 *
 * Implements the complete media-learning platform IA:
 * - Persistent desktop left sidebar + responsive mobile drawer
 * - 5 primary tabs:
 *    1. Home (Media discovery rails)
 *    2. Progress Center (Reports, habits, saved phrasing)
 *    3. Favorites / Saved Scenarios (Bookmarked library)
 *    4. Settings (Comfort, voice, avatar, accessibility)
 *    5. About SiF (Differentiation & educational philosophy)
 * - 3-Layer Scenario Flow:
 *    - Layer 1 & 2: ScenarioDetailView (Overview $\rightarrow$ Preparation Advice)
 *    - Layer 3: PracticeStage (Centered, immersive, enlarged SophiaLiveAvatar call)
 * - Static, dismissible tutorial guide modal
 * - Custom scenario creator integration
 */

import React, { useState } from 'react';
import type { ScenarioDefinition, TopicProgressStatus } from '../../domain/scenarios/topics';
import { TOPICS } from '../../domain/scenarios/topics';
import type { UserPreferences } from './WelcomeOnboarding';
import type { SavedTakeaway } from './MyProgress';
import type { SessionReport } from '../../domain/entities/SessionReport';
import { AppSidebar, type SidebarTab } from './AppSidebar';
import { HomeView } from './HomeView';
import { ScenarioDetailView } from './ScenarioDetailView';
import { ProgressCenterView } from './ProgressCenterView';
import { FavoritesView } from './FavoritesView';
import { SettingsView } from './SettingsView';
import { AboutSiFView } from './AboutSiFView';
import { TutorialGuideModal } from './TutorialGuideModal';
import { ScenarioCreator } from './ScenarioCreator';
import { PracticeStage } from './PracticeStage';
import { playCozySound } from '../utils/cozyAudio';

interface AppShellProps {
  preferences: UserPreferences;
  progressMap: Record<string, TopicProgressStatus>;
  savedTakeaways: SavedTakeaway[];
  savedScenarioIds: string[];
  customScenarios: ScenarioDefinition[];
  activePracticeTopicId?: string;
  latestReport?: SessionReport | null;
  onUpdatePreferences: (updated: UserPreferences) => void;
  onToggleSaveScenario: (scenarioId: string) => void;
  onStartPractice: (scenario: ScenarioDefinition) => void;
  onSaveTakeaway: (takeaway: SavedTakeaway) => void;
  onCompleteTopic: (topicId: string) => void;
  onReportGenerated?: (report: SessionReport) => void;
  onDeleteTakeaway: (id: string) => void;
  onClearSavedWording: () => void;
  onSaveCustomScenario: (scenario: ScenarioDefinition) => void;
  onDeleteCustomScenario: (id: string) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  preferences,
  progressMap,
  savedTakeaways,
  savedScenarioIds,
  customScenarios,
  activePracticeTopicId,
  latestReport,
  onUpdatePreferences,
  onToggleSaveScenario,
  onStartPractice,
  onSaveTakeaway,
  onCompleteTopic,
  onReportGenerated,
  onDeleteTakeaway,
  onClearSavedWording,
  onSaveCustomScenario,
  onDeleteCustomScenario,
}) => {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<SidebarTab>('home');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

  // Sub-flows: Scenario Detail (Layer 1/2), Live Practice (Layer 3), or Create Scenario
  const [selectedScenarioForDetail, setSelectedScenarioForDetail] = useState<ScenarioDefinition | null>(null);
  const [activeCallScenario, setActiveCallScenario] = useState<ScenarioDefinition | null>(null);
  const [isCreatingScenario, setIsCreatingScenario] = useState<boolean>(false);

  // Calculate bookmarked scenarios list
  const savedScenarios = React.useMemo(() => {
    const all = [...customScenarios, ...TOPICS];
    return all.filter((s) => savedScenarioIds.includes(s.id));
  }, [customScenarios, savedScenarioIds]);

  // Handle switching tabs (resets sub-flows so user lands cleanly in that tab)
  const handleSelectTab = (tab: SidebarTab) => {
    setActiveTab(tab);
    setSelectedScenarioForDetail(null);
    setIsCreatingScenario(false);
    setIsMobileSidebarOpen(false);
  };

  // Launch live practice call (Layer 3)
  const handleLaunchPractice = (scenario: ScenarioDefinition) => {
    setSelectedScenarioForDetail(null);
    setActiveCallScenario(scenario);
    onStartPractice(scenario);
  };

  // Exit practice call back to shell
  const handleExitPractice = () => {
    setActiveCallScenario(null);
  };

  // If in live practice call (Layer 3), render PracticeStage with prominent avatar
  if (activeCallScenario) {
    return (
      <PracticeStage
        key={activeCallScenario.id}
        topic={activeCallScenario}
        preferences={preferences}
        onExit={handleExitPractice}
        onSaveTakeaway={onSaveTakeaway}
        onCompleteTopic={onCompleteTopic}
        onReportGenerated={onReportGenerated}
      />
    );
  }

  return (
    <div className="min-h-screen bg-canvas-light text-ink-primary flex">
      {/* ── LEFT SIDEBAR NAVIGATION ────────────────────────────────────────── */}
      <AppSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        savedCount={savedScenarioIds.length}
        reportsCount={latestReport ? 1 : 0}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* ── MAIN CONTENT CANVAS ────────────────────────────────────────────── */}
      <div className="flex-1 md:pl-72 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Top Header */}
        <header className="md:hidden border-b border-canvas-border bg-canvas-surface/90 backdrop-blur-xs px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-xl text-ink-secondary hover:bg-canvas-subtle"
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-base text-ink-primary">Say It First</span>
          </div>

          <button
            onClick={() => setIsTutorialOpen(true)}
            className="p-1.5 rounded-xl text-sif-primary bg-sif-primarySubtle text-xs font-semibold"
            aria-label="Open tutorial"
          >
            💡
          </button>
        </header>

        {/* Content Body */}
        <main className="flex-1 w-full pb-16">
          {/* SUB-FLOW A: SCENARIO DETAIL (LAYER 1 & LAYER 2) */}
          {selectedScenarioForDetail ? (
            <ScenarioDetailView
              scenario={selectedScenarioForDetail}
              isSaved={savedScenarioIds.includes(selectedScenarioForDetail.id)}
              onBack={() => setSelectedScenarioForDetail(null)}
              onToggleSave={onToggleSaveScenario}
              onLaunchLivePractice={handleLaunchPractice}
            />
          ) : isCreatingScenario ? (
            /* SUB-FLOW B: CREATE CUSTOM SCENARIO */
            <div className="max-w-4xl mx-auto w-full py-6 px-4 sm:px-6">
              <div className="mb-4">
                <button
                  onClick={() => setIsCreatingScenario(false)}
                  className="text-xs font-medium text-ink-muted hover:text-ink-primary px-3 py-1.5 rounded-xl hover:bg-canvas-subtle transition"
                >
                  ← Back to Home
                </button>
              </div>
              <ScenarioCreator
                onStartPractice={(scenario) => {
                  onSaveCustomScenario(scenario);
                  setIsCreatingScenario(false);
                  handleLaunchPractice(scenario);
                }}
                onSaveScenario={(scenario) => {
                  onSaveCustomScenario(scenario);
                  setIsCreatingScenario(false);
                  playCozySound('pop');
                }}
                onCancel={() => setIsCreatingScenario(false)}
              />
            </div>
          ) : (
            /* TAB SURFACES */
            <>
              {/* TAB 1: HOME (MEDIA LEARNING RAILS) */}
              {activeTab === 'home' && (
                <HomeView
                  preferences={preferences}
                  progressMap={progressMap}
                  savedScenarioIds={savedScenarioIds}
                  activeTopicId={activePracticeTopicId}
                  customScenarios={customScenarios}
                  onSelectScenario={(scenario) => {
                    playCozySound('tap');
                    setSelectedScenarioForDetail(scenario);
                  }}
                  onToggleSave={onToggleSaveScenario}
                  onCreateCustomScenario={() => {
                    playCozySound('tap');
                    setIsCreatingScenario(true);
                  }}
                  onOpenTutorial={() => setIsTutorialOpen(true)}
                />
              )}

              {/* TAB 2: PROGRESS CENTER */}
              {activeTab === 'progress' && (
                <ProgressCenterView
                  progressMap={progressMap}
                  savedTakeaways={savedTakeaways}
                  latestReport={latestReport}
                  onSelectTopic={(scenario) => {
                    setSelectedScenarioForDetail(scenario);
                  }}
                  onDeleteTakeaway={onDeleteTakeaway}
                  onOpenPreferences={() => setActiveTab('settings')}
                />
              )}

              {/* TAB 3: FAVORITES & SAVED SCENARIOS */}
              {activeTab === 'favorites' && (
                <FavoritesView
                  savedScenarios={savedScenarios}
                  progressMap={progressMap}
                  onSelectScenario={(scenario) => {
                    playCozySound('tap');
                    setSelectedScenarioForDetail(scenario);
                  }}
                  onToggleSave={onToggleSaveScenario}
                  onBrowseMore={() => setActiveTab('home')}
                />
              )}

              {/* TAB 4: SETTINGS */}
              {activeTab === 'settings' && (
                <SettingsView
                  preferences={preferences}
                  onUpdatePreferences={onUpdatePreferences}
                  onClearSavedWording={onClearSavedWording}
                />
              )}

              {/* TAB 5: ABOUT SIF */}
              {activeTab === 'about' && (
                <AboutSiFView
                  onStartExplore={() => setActiveTab('home')}
                  onOpenTutorial={() => setIsTutorialOpen(true)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* ── TUTORIAL GUIDE POPUP / MODAL ───────────────────────────────────── */}
      <TutorialGuideModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </div>
  );
};
