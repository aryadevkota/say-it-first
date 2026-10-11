'use client';

/**
 * page.tsx — Say It First Primary Product Experience
 *
 * Implements the complete end-to-end user-facing journey:
 * 1. Welcome ("Find more room to say what you mean.")
 * 2. Skippable Onboarding (Interests, Goals, Guidance & Comfort)
 * 3. Personalized Topic Dashboard (Home, Explore, My progress)
 * 4. "Understand the idea" bite-sized learning & Double Empathy perspectives
 * 5. Focused Practice Stage with realistic conversation partner (Sophia)
 * 6. Non-destructive "Try another version" retries
 * 7. "Words to take with you" editable pocket script takeaways
 *
 * Completely eliminates:
 * - AffectRadarCanvas, VAD charts, and tension meters from the user UI
 * - Clinical scoring, normality grades, and streak pressure
 */

import React, { useState, useEffect } from 'react';
import {
  WelcomeOnboarding,
  DEFAULT_PREFERENCES,
  type UserPreferences,
} from '../presentation/components/WelcomeOnboarding';
import { AppShell } from '../presentation/components/AppShell';
import { PreferencesModal } from '../presentation/components/PreferencesModal';
import {
  TOPICS,
  type ScenarioDefinition,
  type TopicProgressStatus,
} from '../domain/scenarios/topics';
import type { SavedTakeaway } from '../presentation/components/MyProgress';
import type { SessionReport } from '../domain/entities/SessionReport';

const STORAGE_KEY_PREFS = 'say_it_first_user_prefs';
const STORAGE_KEY_PROGRESS = 'say_it_first_progress';
const STORAGE_KEY_TAKEAWAYS = 'say_it_first_takeaways';
const STORAGE_KEY_CUSTOM_SCENARIOS = 'say_it_first_custom_scenarios';
const STORAGE_KEY_FAVORITES = 'say_it_first_favorite_scenarios';
const STORAGE_KEY_LATEST_REPORT = 'say_it_first_latest_report';

export default function SayItFirstRoot() {
  const [currentView, setCurrentView] = useState<'welcome' | 'app'>('welcome');
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [progressMap, setProgressMap] = useState<Record<string, TopicProgressStatus>>({});
  const [savedTakeaways, setSavedTakeaways] = useState<SavedTakeaway[]>([]);
  const [savedScenarioIds, setSavedScenarioIds] = useState<string[]>([]);
  const [customScenarios, setCustomScenarios] = useState<ScenarioDefinition[]>([]);
  const [activePracticeTopic, setActivePracticeTopic] = useState<ScenarioDefinition | null>(null);
  const [latestReport, setLatestReport] = useState<SessionReport | null>(null);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
  const [isReturningUser, setIsReturningUser] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Hydrate user settings from local browser storage on mount
  useEffect(() => {
    try {
      const storedPrefs = localStorage.getItem(STORAGE_KEY_PREFS);
      if (storedPrefs) {
        setPreferences(JSON.parse(storedPrefs));
        setIsReturningUser(true);
      }

      const storedProgress = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (storedProgress) {
        setProgressMap(JSON.parse(storedProgress));
      }

      const storedTakeaways = localStorage.getItem(STORAGE_KEY_TAKEAWAYS);
      if (storedTakeaways) {
        setSavedTakeaways(JSON.parse(storedTakeaways));
      }

      const storedFavorites = localStorage.getItem(STORAGE_KEY_FAVORITES);
      if (storedFavorites) {
        setSavedScenarioIds(JSON.parse(storedFavorites));
      }

      const storedScenarios = localStorage.getItem(STORAGE_KEY_CUSTOM_SCENARIOS);
      if (storedScenarios) {
        setCustomScenarios(JSON.parse(storedScenarios));
      }

      const storedReport = localStorage.getItem(STORAGE_KEY_LATEST_REPORT);
      if (storedReport) {
        setLatestReport(JSON.parse(storedReport));
      }
    } catch {
      // Local storage fallback
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Update preferences and persist locally
  const handleUpdatePreferences = (updated: UserPreferences) => {
    setPreferences(updated);
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(updated));
    } catch {
      // Fallback
    }
  };

  // Toggle favorite bookmark for a scenario
  const handleToggleSaveScenario = (scenarioId: string) => {
    setSavedScenarioIds((prev) => {
      const updated = prev.includes(scenarioId)
        ? prev.filter((id) => id !== scenarioId)
        : [...prev, scenarioId];
      try {
        localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Onboarding completion
  const handleCompleteOnboarding = (prefs: UserPreferences) => {
    handleUpdatePreferences(prefs);
    setCurrentView('app');
  };

  // Direct explore from welcome
  const handleExploreDirectly = () => {
    setCurrentView('app');
  };

  // Mark topic explored
  const handleMarkExplored = (topicId: string) => {
    setProgressMap((prev) => {
      const current = prev[topicId];
      if (current === 'practiced' || current === 'revisited') return prev;
      const updated = { ...prev, [topicId]: 'explored' as TopicProgressStatus };
      try {
        localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Launch practice stage
  const handleStartPractice = (topic: ScenarioDefinition) => {
    setActivePracticeTopic(topic);
    setProgressMap((prev) => {
      const updated = {
        ...prev,
        [topic.id]: (prev[topic.id] === 'practiced' ? 'revisited' : 'in-progress') as TopicProgressStatus,
      };
      try {
        localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Complete practice session
  const handleCompleteTopic = (topicId: string) => {
    setProgressMap((prev) => {
      const updated = {
        ...prev,
        [topicId]: (prev[topicId] === 'practiced' ? 'revisited' : 'practiced') as TopicProgressStatus,
      };
      try {
        localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Persist latest generated report
  const handleReportGenerated = (report: SessionReport) => {
    setLatestReport(report);
    try {
      localStorage.setItem(STORAGE_KEY_LATEST_REPORT, JSON.stringify(report));
    } catch {}
  };

  // Save takeaway script
  const handleSaveTakeaway = (takeaway: SavedTakeaway) => {
    setSavedTakeaways((prev) => {
      const updated = [takeaway, ...prev.filter((t) => t.topicId !== takeaway.topicId)];
      try {
        localStorage.setItem(STORAGE_KEY_TAKEAWAYS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Delete takeaway script
  const handleDeleteTakeaway = (id: string) => {
    setSavedTakeaways((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_TAKEAWAYS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Clear all saved wording
  const handleClearSavedWording = () => {
    setSavedTakeaways([]);
    try {
      localStorage.removeItem(STORAGE_KEY_TAKEAWAYS);
    } catch {}
  };

  // Save custom scenario
  const handleSaveCustomScenario = (scenario: ScenarioDefinition) => {
    setCustomScenarios((prev) => {
      const updated = [scenario, ...prev.filter((s) => s.id !== scenario.id)];
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_SCENARIOS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Delete custom scenario
  const handleDeleteCustomScenario = (id: string) => {
    setCustomScenarios((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_SCENARIOS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Avoid hydration mismatch flicker
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-canvas-light flex items-center justify-center text-ink-muted text-sm">
        Opening Say It First…
      </div>
    );
  }

  return (
    <>
      {/* VIEW 1: WELCOME & ONBOARDING */}
      {currentView === 'welcome' && (
        <WelcomeOnboarding
          onComplete={handleCompleteOnboarding}
          onExploreDirectly={handleExploreDirectly}
          isReturningUser={isReturningUser}
        />
      )}

      {/* VIEW 2: APP SHELL (MEDIA-LEARNING PLATFORM) */}
      {currentView === 'app' && (
        <AppShell
          preferences={preferences}
          progressMap={progressMap}
          savedTakeaways={savedTakeaways}
          savedScenarioIds={savedScenarioIds}
          customScenarios={customScenarios}
          activePracticeTopicId={activePracticeTopic?.id}
          latestReport={latestReport}
          onUpdatePreferences={handleUpdatePreferences}
          onToggleSaveScenario={handleToggleSaveScenario}
          onStartPractice={handleStartPractice}
          onSaveTakeaway={handleSaveTakeaway}
          onCompleteTopic={handleCompleteTopic}
          onReportGenerated={handleReportGenerated}
          onDeleteTakeaway={handleDeleteTakeaway}
          onClearSavedWording={handleClearSavedWording}
          onSaveCustomScenario={handleSaveCustomScenario}
          onDeleteCustomScenario={handleDeleteCustomScenario}
        />
      )}

      {/* GLOBAL PREFERENCES MODAL */}
      {isPreferencesOpen && (
        <PreferencesModal
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          onClose={() => setIsPreferencesOpen(false)}
          onClearSavedWording={handleClearSavedWording}
        />
      )}
    </>
  );
}
