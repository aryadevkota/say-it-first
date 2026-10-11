'use client';

/**
 * AppSidebar.tsx — Production Left-Sidebar Navigation for Say It First (SiF)
 *
 * Implements the 7 core navigation tabs aligned with LinkedIn Learning layout:
 * 1. Home (Dashboard snapshot & learning rails)
 * 2. Practice (Dedicated simulation launcher)
 * 3. Scenarios (Categorized scenario catalog)
 * 4. Reports (Full coaching transcripts & insights)
 * 5. Progress (Strengths, habits & growth trends)
 * 6. Saved (Bookmarked personal scenario library)
 * 7. Settings (Comfort, voice, avatar, accessibility)
 *
 * Design:
 * - Persistent, calm, uncluttered layout with solid opaque periwinkle active states
 * - High-contrast text labels (no washed-out glass)
 * - Brand logo & soft speech bubble identity (no third-party/Gemini star motifs)
 * - Accessible keyboard navigation and responsive mobile bottom-sheet/drawer
 */

import React from 'react';
import { playCozySound } from '../utils/cozyAudio';

export type SidebarTab =
  | 'home'
  | 'practice'
  | 'scenarios'
  | 'reports'
  | 'progress'
  | 'favorites'
  | 'settings';

interface AppSidebarProps {
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  savedCount?: number;
  reportsCount?: number;
  onOpenTutorial: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  onSelectTab,
  savedCount = 0,
  reportsCount = 0,
  onOpenTutorial,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems: {
    id: SidebarTab;
    label: string;
    description: string;
    icon: (isActive: boolean) => React.ReactNode;
    badge?: number | string;
  }[] = [
    {
      id: 'home',
      label: 'Home',
      description: 'Overview & snapshot',
      icon: (active) => (
        <svg
          className={`w-5 h-5 transition-colors ${active ? 'text-sif-primary' : 'text-ink-muted'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 2.2 : 1.8}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      id: 'practice',
      label: 'Practice',
      description: 'Start live partner call',
      icon: (active) => (
        <svg
          className={`w-5 h-5 transition-colors ${active ? 'text-sif-primary' : 'text-ink-muted'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 2.2 : 1.8}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 2.2 : 1.8}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: 'scenarios',
      label: 'Scenarios',
      description: 'Contextual categories',
      icon: (active) => (
        <svg
          className={`w-5 h-5 transition-colors ${active ? 'text-sif-primary' : 'text-ink-muted'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 2.2 : 1.8}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
    {
      id: 'reports',
      label: 'Reports',
      description: 'Coaching & transcripts',
      badge: reportsCount > 0 ? reportsCount : undefined,
      icon: (active) => (
        <svg
          className={`w-5 h-5 transition-colors ${active ? 'text-sif-primary' : 'text-ink-muted'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 2.2 : 1.8}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: 'progress',
      label: 'Progress',
      description: 'Habits & skill growth',
      icon: (active) => (
        <svg
          className={`w-5 h-5 transition-colors ${active ? 'text-sif-primary' : 'text-ink-muted'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 2.2 : 1.8}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: 'favorites',
      label: 'Saved',
      description: 'Personal bookmark library',
      badge: savedCount > 0 ? savedCount : undefined,
      icon: (active) => (
        <svg
          className={`w-5 h-5 transition-colors ${active ? 'text-sif-primary' : 'text-ink-muted'}`}
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Comfort & accessibility',
      icon: (active) => (
        <svg
          className={`w-5 h-5 transition-colors ${active ? 'text-sif-primary' : 'text-ink-muted'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 2.2 : 1.8}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 2.2 : 1.8}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-ink-primary/30 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Main Persistent Sidebar (Desktop) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 md:w-72 bg-canvas-surface border-r border-canvas-border flex flex-col justify-between transition-transform duration-250 ease-out select-none shadow-card md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="app-sidebar"
      >
        {/* Brand Header */}
        <div className="p-5 sm:p-6 border-b border-canvas-border bg-canvas-surface">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                playCozySound('tap');
                onSelectTab('home');
              }}
              className="flex items-center gap-3 text-left group"
            >
              <div className="relative w-10 h-8 flex items-center justify-center shrink-0">
                <img
                  src="/logo-mark.png"
                  alt="Say It First"
                  className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="flex flex-col">
                <span className="font-display font-bold text-lg text-ink-primary tracking-tight leading-none group-hover:text-sif-primary transition-colors">
                  Say It First
                </span>
                <span className="text-[11px] text-ink-muted tracking-wide font-medium block mt-1">
                  Conversational Practice
                </span>
              </div>
            </button>

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden text-ink-muted hover:text-ink-primary p-1.5 rounded-lg"
                aria-label="Close sidebar"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 sm:px-4 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            Platform Navigation
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  playCozySound('tap');
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full px-3.5 py-2.5 rounded-card flex items-center justify-between text-left transition-all duration-180 group ${
                  isActive
                    ? 'bg-sif-primarySubtle text-sif-primaryDeep font-semibold border border-sif-border shadow-2xs'
                    : 'text-ink-secondary hover:bg-canvas-subtle hover:text-ink-primary'
                }`}
                data-testid={`sidebar-tab-${item.id}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-white shadow-2xs text-sif-primary'
                        : 'bg-transparent text-ink-muted group-hover:text-ink-primary'
                    }`}
                  >
                    {item.icon(isActive)}
                  </div>

                  <div className="truncate">
                    <span className="text-sm block leading-tight truncate">{item.label}</span>
                    <span
                      className={`text-[11px] block truncate transition-colors ${
                        isActive ? 'text-sif-primary font-normal' : 'text-ink-muted'
                      }`}
                    >
                      {item.description}
                    </span>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-pill font-semibold shrink-0 ml-2 ${
                      isActive
                        ? 'bg-sif-primary text-white shadow-2xs'
                        : 'bg-canvas-subtle text-ink-secondary border border-canvas-border'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer: Tutorial & Comfort Callout */}
        <div className="p-4 border-t border-canvas-border bg-canvas-subtle/50 space-y-2">
          <button
            onClick={() => {
              playCozySound('pop');
              onOpenTutorial();
            }}
            className="w-full px-3.5 py-2.5 rounded-card bg-canvas-surface border border-canvas-border text-ink-primary text-xs font-medium hover:border-sif-border hover:bg-canvas-subtle transition-all flex items-center justify-between shadow-2xs group"
            data-testid="tutorial-trigger-btn"
          >
            <span className="flex items-center gap-2">
              <span className="text-sif-primary text-sm group-hover:scale-110 transition-transform">💡</span>
              <span className="font-semibold text-ink-primary">How SiF Works</span>
            </span>
            <span className="text-[11px] text-sif-primary font-semibold">Guide →</span>
          </button>

          <div className="px-2 pt-1 flex items-center justify-between text-[11px] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sif-primary" />
              <span>Safe & Private</span>
            </span>
            <span>v1.3</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-canvas-surface border-t border-canvas-border px-2 py-1.5 flex items-center justify-around shadow-modal">
        {[
          { id: 'home', label: 'Home', icon: '🏠' },
          { id: 'practice', label: 'Practice', icon: '▶' },
          { id: 'scenarios', label: 'Scenarios', icon: '📚' },
          { id: 'reports', label: 'Reports', icon: '📋' },
          { id: 'progress', label: 'Progress', icon: '📈' },
          { id: 'favorites', label: 'Saved', icon: '🔖' },
        ].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                playCozySound('tap');
                onSelectTab(item.id as SidebarTab);
              }}
              className={`flex flex-col items-center justify-center min-w-[48px] py-1 px-1.5 rounded-lg transition ${
                isActive ? 'text-sif-primary font-bold' : 'text-ink-muted'
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
