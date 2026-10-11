'use client';

/**
 * AppSidebar.tsx — Production Left-Sidebar Navigation for Say It First (SiF)
 *
 * Implements the primary left-sidebar navigation tabs:
 * 1. Home (Discover & browse learning rails)
 * 2. Progress Center (Reports, feedback, reflective learning)
 * 3. Favorites / Saved (Bookmarked personal scenario library)
 * 4. Settings (Comfort, voice, avatar, accessibility)
 * 5. About SiF (What makes SiF different from generic LLM chat)
 *
 * Design:
 * - Persistent, calm, uncluttered LinkedIn Learning / Perplexity layout
 * - Brand logo & soft speech bubble identity
 * - Quick "Help / Tutorial" trigger
 * - Smooth active indicators, accessible keyboard navigation, and responsive collapse
 */

import React from 'react';
import Image from 'next/image';
import { playCozySound } from '../utils/cozyAudio';

export type SidebarTab = 'home' | 'progress' | 'favorites' | 'settings' | 'about';

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
      description: 'Explore & browse scenarios',
      icon: (active) => (
        <svg
          className={`w-5 h-5 transition-colors ${active ? 'text-teal-brand' : 'text-ink-muted'}`}
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
      id: 'progress',
      label: 'Progress Center',
      description: 'Reports, habits & reflection',
      badge: reportsCount > 0 ? reportsCount : undefined,
      icon: (active) => (
        <svg
          className={`w-5 h-5 transition-colors ${active ? 'text-teal-brand' : 'text-ink-muted'}`}
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
      label: 'Favorites / Saved',
      description: 'Bookmarked for practice',
      badge: savedCount > 0 ? savedCount : undefined,
      icon: (active) => (
        <svg
          className={`w-5 h-5 transition-colors ${active ? 'text-teal-brand' : 'text-ink-muted'}`}
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
      description: 'Comfort, voice & accessibility',
      icon: (active) => (
        <svg
          className={`w-5 h-5 transition-colors ${active ? 'text-teal-brand' : 'text-ink-muted'}`}
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
    {
      id: 'about',
      label: 'About SiF',
      description: 'Why SiF is different',
      icon: (active) => (
        <svg
          className={`w-5 h-5 transition-colors ${active ? 'text-teal-brand' : 'text-ink-muted'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 2.2 : 1.8}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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

      {/* Main Persistent Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 md:w-72 bg-canvas-surface/85 backdrop-blur-md border-r border-canvas-border flex flex-col justify-between transition-transform duration-300 ease-out select-none shadow-glass-card md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="app-sidebar"
      >
        {/* Brand Header */}
        <div className="p-5 sm:p-6 border-b border-canvas-borderSubtle bg-gradient-to-b from-white/40 to-transparent">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                playCozySound('tap');
                onSelectTab('home');
              }}
              className="flex items-center gap-3 text-left group"
            >
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white/90 p-1 border border-sif-border shadow-glass-card group-hover:scale-105 group-hover:shadow-glass-glow transition-all flex items-center justify-center shrink-0">
                <img
                  src="/logo.png"
                  alt="Say It First"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-lg text-ink-primary tracking-tight leading-none group-hover:text-sif-primary transition-colors">
                    Say It First
                  </span>
                </div>
                <span className="text-[11px] text-ink-muted tracking-wide font-medium block mt-0.5">
                  Conversational Learning
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
        <nav className="flex-1 px-3 sm:px-4 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            Menu
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
                className={`w-full px-3.5 py-3 rounded-2xl flex items-center justify-between text-left transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-sif-primary/15 to-sif-secondary/20 text-sif-primaryDeep font-semibold border border-sif-primary/30 shadow-glass-card'
                    : 'text-ink-secondary hover:bg-white/60 hover:text-ink-primary hover:border hover:border-canvas-borderSubtle'
                }`}
                data-testid={`sidebar-tab-${item.id}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-white shadow-2xs text-sif-primary'
                        : 'bg-transparent text-ink-muted group-hover:bg-white/70 group-hover:text-ink-primary'
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
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ml-2 ${
                      isActive
                        ? 'bg-sif-primary text-white shadow-2xs'
                        : 'bg-white/80 text-ink-secondary border border-canvas-border'
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
        <div className="p-4 border-t border-canvas-borderSubtle bg-white/40 space-y-2.5">
          <button
            onClick={() => {
              playCozySound('pop');
              onOpenTutorial();
            }}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white/90 border border-sif-border text-ink-primary text-xs font-medium hover:border-sif-primary hover:bg-white transition-all flex items-center justify-between shadow-glass-card group"
            data-testid="tutorial-trigger-btn"
          >
            <span className="flex items-center gap-2">
              <span className="text-sif-primary text-sm group-hover:scale-110 transition-transform">💡</span>
              <span className="font-semibold text-ink-primary">How SiF works</span>
            </span>
            <span className="text-[11px] text-sif-primary font-semibold">Guide →</span>
          </button>

          <div className="px-2 pt-1 flex items-center justify-between text-[11px] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sif-secondary" />
              <span>Safe & Private</span>
            </span>
            <span>v1.2</span>
          </div>
        </div>
      </aside>
    </>
  );
};
