'use client';

/**
 * AppShell.tsx — Production Application Shell for Say It First (SiF)
 *
 * Implements the 7 core navigation tabs:
 * 1. Home (Resume practice, suggested next, latest report, rails)
 * 2. Practice (Interactive studio launcher)
 * 3. Scenarios (Categorized catalog & search)
 * 4. Reports (Guided coaching feedback, transcripts, insights)
 * 5. Progress (Reflective strengths, repeatable habits & growth)
 * 6. Saved (Bookmarked personal scenario library)
 * 7. Settings (Comfort, voice, avatar, accessibility)
 *
 * 3-Layer Scenario Flow:
 * - Layer 1 & 2: ScenarioDetailView (Overview $\rightarrow$ Preparation Advice)
 * - Layer 3: PracticeStage (Centered, immersive SophiaLiveAvatar call)
 */

import React, { useState } from 'react';
import type { ScenarioDefinition, TopicProgressStatus } from '../../domain/scenarios/topics';
import { TOPICS } from '../../domain/scenarios/topics';
import type { UserPreferences } from './WelcomeOnboarding';
import type { SavedTakeaway } from './MyProgress';
import type { SessionReport } from '../../domain/entities/SessionReport';
import { AppSidebar, type SidebarTab } from './AppSidebar';
import { HomeView } from './HomeView';
import { PracticeView } from './PracticeView';
import { ScenariosView } from './ScenariosView';
import { ScenarioDetailView } from './ScenarioDetailView';
import { ProgressCenterView } from './ProgressCenterView';
import { FavoritesView } from './FavoritesView';
import { SettingsView } from './SettingsView';
import { ConversationReportPage } from './ConversationReportPage';
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

  // Handle switching tabs
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
      <div className="flex-1 md:pl-72 flex flex-col min-w-0 min-h-screen pb-14 md:pb-0">
        {/* Mobile Top Header */}
        <header className="md:hidden border-b border-canvas-border bg-canvas-surface px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-lg text-ink-secondary hover:bg-canvas-subtle"
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
            className="p-1.5 rounded-lg text-sif-primary bg-sif-primarySubtle text-xs font-semibold"
            aria-label="Open tutorial"
          >
            💡
          </button>
        </header>

        {/* Content Body with Perplexity-style animation container */}
        <main className="flex-1 w-full pb-12">
          {/* SUB-FLOW A: SCENARIO DETAIL (LAYER 1 & LAYER 2) */}
          {selectedScenarioForDetail ? (
            <div className="animate-page-enter">
              <ScenarioDetailView
                scenario={selectedScenarioForDetail}
                isSaved={savedScenarioIds.includes(selectedScenarioForDetail.id)}
                onBack={() => setSelectedScenarioForDetail(null)}
                onToggleSave={onToggleSaveScenario}
                onLaunchLivePractice={handleLaunchPractice}
              />
            </div>
          ) : isCreatingScenario ? (
            /* SUB-FLOW B: CREATE CUSTOM SCENARIO */
            <div className="max-w-4xl mx-auto w-full py-6 px-4 sm:px-6 animate-page-enter">
              <div className="mb-4">
                <button
                  onClick={() => setIsCreatingScenario(false)}
                  className="text-xs font-semibold text-ink-muted hover:text-ink-primary px-3 py-1.5 rounded-pill hover:bg-canvas-subtle transition"
                >
                  ← Back to Scenarios
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
            /* 7 TAB SURFACES WITH SMOOTH ENTRANCE TRANSITION */
            <div key={activeTab} className="animate-page-enter">
              {/* TAB 1: HOME */}
              {activeTab === 'home' && (
                <HomeView
                  preferences={preferences}
                  progressMap={progressMap}
                  savedScenarioIds={savedScenarioIds}
                  activeTopicId={activePracticeTopicId}
                  customScenarios={customScenarios}
                  latestReport={latestReport}
                  onSelectScenario={(scenario) => {
                    playCozySound('tap');
                    setSelectedScenarioForDetail(scenario);
                  }}
                  onLaunchPracticeDirect={handleLaunchPractice}
                  onToggleSave={onToggleSaveScenario}
                  onCreateCustomScenario={() => {
                    playCozySound('tap');
                    setIsCreatingScenario(true);
                  }}
                  onOpenTutorial={() => setIsTutorialOpen(true)}
                  onNavigateTab={(tab) => handleSelectTab(tab)}
                />
              )}

              {/* TAB 2: PRACTICE */}
              {activeTab === 'practice' && (
                <PracticeView
                  progressMap={progressMap}
                  savedScenarioIds={savedScenarioIds}
                  customScenarios={customScenarios}
                  onSelectScenarioForDetail={(scenario) => {
                    setSelectedScenarioForDetail(scenario);
                  }}
                  onLaunchPractice={handleLaunchPractice}
                  onToggleSave={onToggleSaveScenario}
                  onCreateCustomScenario={() => {
                    setIsCreatingScenario(true);
                  }}
                />
              )}

              {/* TAB 3: SCENARIOS */}
              {activeTab === 'scenarios' && (
                <ScenariosView
                  progressMap={progressMap}
                  savedScenarioIds={savedScenarioIds}
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
                />
              )}

              {/* TAB 4: REPORTS */}
              {activeTab === 'reports' && (
                latestReport ? (
                  <ConversationReportPage
                    report={latestReport}
                    onRestartPractice={() => {
                      const t = TOPICS.find((top) => top.id === latestReport.scenarioId) || TOPICS[0];
                      handleLaunchPractice(t);
                    }}
                    onReturnDashboard={() => handleSelectTab('home')}
                  />
                ) : (
                  <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
                    <div className="p-8 rounded-card bg-canvas-surface border border-canvas-border shadow-card space-y-3">
                      <span className="text-2xl">📋</span>
                      <h2 className="text-lg font-semibold text-ink-primary">No Guided Reports Yet</h2>
                      <p className="text-xs text-ink-secondary max-w-md mx-auto">
                        Complete your first interactive conversation practice session with Sophia to generate a 9-part coaching report, transcript, and strengths review.
                      </p>
                      <button
                        onClick={() => handleSelectTab('practice')}
                        className="px-5 py-2.5 rounded-pill bg-sif-primary text-white text-xs font-semibold hover:bg-sif-primaryHover transition"
                      >
                        Start Practice Session
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* TAB 5: PROGRESS */}
              {activeTab === 'progress' && (
                <ProgressCenterView
                  progressMap={progressMap}
                  savedTakeaways={savedTakeaways}
                  latestReport={latestReport}
                  onSelectTopic={(scenario) => {
                    setSelectedScenarioForDetail(scenario);
                  }}
                  onDeleteTakeaway={onDeleteTakeaway}
                  onOpenPreferences={() => handleSelectTab('settings')}
                />
              )}

              {/* TAB 6: SAVED */}
              {activeTab === 'favorites' && (
                <FavoritesView
                  savedScenarios={savedScenarios}
                  progressMap={progressMap}
                  onSelectScenario={(scenario) => {
                    playCozySound('tap');
                    setSelectedScenarioForDetail(scenario);
                  }}
                  onToggleSave={onToggleSaveScenario}
                  onBrowseMore={() => handleSelectTab('scenarios')}
                />
              )}

              {/* TAB 7: SETTINGS */}
              {activeTab === 'settings' && (
                <SettingsView
                  preferences={preferences}
                  onUpdatePreferences={onUpdatePreferences}
                  onClearSavedWording={onClearSavedWording}
                />
              )}
            </div>
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
