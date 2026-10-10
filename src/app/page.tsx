'use client';

/**
 * page.tsx — Say It First Primary Product Experience
 *
 * Implements the complete end-to-end user-facing journey:
 * 1. Welcome ("Find more room to say what you mean.")
 * 2. Skippable Onboarding (Interests, Goals, Guidance & Comfort)
 * 3. Personalized Topic Dashboard (Home, Explore, My progress)
 * 4. "Understand the idea" bite-sized learning & Double Empathy perspectives
 * 5. Focused Practice Stage with warm 3D conversation partner
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
import { TopicDashboard } from '../presentation/components/TopicDashboard';
import { PracticeStage } from '../presentation/components/PracticeStage';
import { PreferencesModal } from '../presentation/components/PreferencesModal';
import { ScenarioCreator } from '../presentation/components/ScenarioCreator';
import { AvatarStudioModal } from '../presentation/components/AvatarStudioModal';
import {
  type AvatarCustomization,
  DEFAULT_USER_AVATAR,
} from '../domain/entities/AvatarCustomization';
import {
  TOPICS,
  type ScenarioDefinition,
  type TopicProgressStatus,
} from '../domain/scenarios/topics';
import type { SavedTakeaway } from '../presentation/components/MyProgress';

const STORAGE_KEY_PREFS = 'say_it_first_user_prefs';
const STORAGE_KEY_PROGRESS = 'say_it_first_progress';
const STORAGE_KEY_TAKEAWAYS = 'say_it_first_takeaways';
const STORAGE_KEY_CUSTOM_SCENARIOS = 'say_it_first_custom_scenarios';
const STORAGE_KEY_USER_AVATAR = 'say_it_first_user_avatar';

export default function SayItFirstRoot() {
  const [currentView, setCurrentView] = useState<'welcome' | 'dashboard' | 'practice' | 'create-scenario'>('welcome');
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [progressMap, setProgressMap] = useState<Record<string, TopicProgressStatus>>({});
  const [savedTakeaways, setSavedTakeaways] = useState<SavedTakeaway[]>([]);
  const [customScenarios, setCustomScenarios] = useState<ScenarioDefinition[]>([]);
  const [activePracticeTopic, setActivePracticeTopic] = useState<ScenarioDefinition | null>(null);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
  const [isAvatarStudioOpen, setIsAvatarStudioOpen] = useState<boolean>(false);
  const [userAvatar, setUserAvatar] = useState<AvatarCustomization>(DEFAULT_USER_AVATAR);
  const [isReturningUser, setIsReturningUser] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Hydrate user settings from local browser storage on mount
  useEffect(() => {
    try {
      const storedPrefs = localStorage.getItem(STORAGE_KEY_PREFS);
      if (storedPrefs) {
        setPreferences(JSON.parse(storedPrefs));
        setIsReturningUser(true);
        // Note: Per Section 10 requirements, app freshly mounts on welcome screen.
        // Returning users see "Continue" which takes them right into their saved dashboard.
      }

      const storedAvatar = localStorage.getItem(STORAGE_KEY_USER_AVATAR);
      if (storedAvatar) {
        setUserAvatar(JSON.parse(storedAvatar));
      }

      const storedProgress = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (storedProgress) {
        setProgressMap(JSON.parse(storedProgress));
      }

      const storedTakeaways = localStorage.getItem(STORAGE_KEY_TAKEAWAYS);
      if (storedTakeaways) {
        setSavedTakeaways(JSON.parse(storedTakeaways));
      }

      const storedScenarios = localStorage.getItem(STORAGE_KEY_CUSTOM_SCENARIOS);
      if (storedScenarios) {
        setCustomScenarios(JSON.parse(storedScenarios));
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

  // Onboarding completion
  const handleCompleteOnboarding = (prefs: UserPreferences) => {
    handleUpdatePreferences(prefs);
    setCurrentView('dashboard');
  };

  // Direct explore from welcome
  const handleExploreDirectly = () => {
    setCurrentView('dashboard');
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
    setCurrentView('practice');
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

      {/* VIEW 2: PERSONALIZED DASHBOARD */}
      {currentView === 'dashboard' && (
        <TopicDashboard
          preferences={preferences}
          progressMap={progressMap}
          savedTakeaways={savedTakeaways}
          activeTopicId={activePracticeTopic?.id}
          customScenarios={customScenarios}
          onStartPractice={handleStartPractice}
          onOpenPreferences={() => setIsPreferencesOpen(true)}
          onOpenAvatarStudio={() => setIsAvatarStudioOpen(true)}
          onMarkExplored={handleMarkExplored}
          onDeleteTakeaway={handleDeleteTakeaway}
          onCreateCustomScenario={() => setCurrentView('create-scenario')}
          onDeleteCustomScenario={handleDeleteCustomScenario}
        />
      )}

      {/* VIEW 3: PRACTICE STAGE */}
      {currentView === 'practice' && activePracticeTopic && (
        <PracticeStage
          topic={activePracticeTopic}
          preferences={preferences}
          userAvatar={userAvatar}
          onUpdateUserAvatar={(customization) => {
            setUserAvatar(customization);
            try {
              localStorage.setItem(STORAGE_KEY_USER_AVATAR, JSON.stringify(customization));
            } catch {}
          }}
          onExit={() => setCurrentView('dashboard')}
          onSaveTakeaway={handleSaveTakeaway}
          onCompleteTopic={handleCompleteTopic}
        />
      )}

      {/* VIEW 4: CUSTOM SCENARIO CREATOR */}
      {currentView === 'create-scenario' && (
        <div className="min-h-screen bg-canvas-light text-ink-primary flex flex-col">
          <nav className="border-b border-canvas-borderSubtle bg-canvas-surface/80 backdrop-blur-xs sticky top-0 z-30">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink-primary transition"
              >
                <span>← Back to Dashboard</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-teal-brand text-canvas-surface flex items-center justify-center font-bold text-xs">
                  S
                </div>
                <span className="font-semibold text-sm text-ink-primary">New Scenario</span>
              </div>
              <div className="w-16" />
            </div>
          </nav>
          <main className="flex-1">
            <ScenarioCreator
              onStartPractice={(scenario) => {
                handleSaveCustomScenario(scenario);
                handleStartPractice(scenario);
              }}
              onSaveScenario={(scenario) => {
                handleSaveCustomScenario(scenario);
                setCurrentView('dashboard');
              }}
              onCancel={() => setCurrentView('dashboard')}
            />
          </main>
        </div>
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

      {/* GLOBAL AVATAR STUDIO MODAL */}
      {isAvatarStudioOpen && (
        <AvatarStudioModal
          initialCustomization={userAvatar}
          onSave={(customization) => {
            setUserAvatar(customization);
            try {
              localStorage.setItem(STORAGE_KEY_USER_AVATAR, JSON.stringify(customization));
            } catch {}
          }}
          onClose={() => setIsAvatarStudioOpen(false)}
        />
      )}
    </>
  );
}
