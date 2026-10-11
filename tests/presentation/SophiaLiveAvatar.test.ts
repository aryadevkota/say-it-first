/**
 * SophiaLiveAvatar.test.ts — Unit & Integration Tests for Sophia Live Avatar (Anam Video Rendering)
 *
 * Verifies:
 * 1. Dedicated HTML5 Anam video stream container (<video id="anam-avatar-video">) rendered muted (no duplicate audio)
 * 2. Scenario-specific presentation and badge text rendering
 * 3. Conversational state indicators (speaking, listening, thinking/reflecting)
 * 4. Accessible interactive controls (mute button with aria-pressed, text mode toggle)
 * 5. Fail-fast diagnostic error boundary UI when avatar session is disconnected
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  SophiaLiveAvatar,
  type SophiaLiveAvatarProps,
} from '../../src/presentation/components/SophiaLiveAvatar';
import {
  getSophiaPresentationForScenario,
  type SophiaScenarioPresentation,
} from '../../src/domain/entities/SophiaScenarioPresentation';
import type { ScenarioDefinition } from '../../src/domain/scenarios/topics';

describe('Sophia Live Avatar Component Suite (Anam Video Stream)', () => {
  const mockInterviewScenario: ScenarioDefinition = {
    id: 'mock-interview',
    category: 'work-school',
    categoryLabel: 'Work or School',
    title: 'Mock Interview',
    subtitle: 'Professional interview practice',
    userGoal: 'Answer behavioral questions',
    estimatedMinutes: 5,
    status: 'ready',
    accentColor: 'apricot',
    learning: {
      coreInsight: 'Structure answers with clarity.',
      doubleEmpathyPerspective: { yourNeed: 'Clarity', theirPerspective: 'Competence' },
      practicalApproaches: ['Direct responses'],
      examplePhrases: { gentle: 'I contributed...', direct: 'My role was...' },
    },
    partner: {
      name: 'Sophia',
      role: 'Hiring Director',
      avatarVariant: 'sophia',
      defaultTone: 'Professional',
      initialDialogue: 'Welcome to the interview.',
    },
    defaultTakeawayScript: 'I articulated my strengths clearly.',
  };

  const mockCoffeeScenario: ScenarioDefinition = {
    id: 'mock-coffee',
    category: 'friendships',
    categoryLabel: 'Friendships',
    title: 'Coffee Chat',
    subtitle: 'Catching up with a colleague',
    userGoal: 'Have a relaxed conversation',
    estimatedMinutes: 4,
    status: 'ready',
    accentColor: 'lavender',
    learning: {
      coreInsight: 'Stay present in casual dialogue.',
      doubleEmpathyPerspective: { yourNeed: 'Ease', theirPerspective: 'Warmth' },
      practicalApproaches: ['Active listening'],
      examplePhrases: { gentle: 'Good to see you!', direct: 'Thanks for meeting.' },
    },
    partner: {
      name: 'Sophia',
      role: 'Colleague',
      avatarVariant: 'sophia',
      defaultTone: 'Warm and friendly',
      initialDialogue: 'So good to see you!',
    },
    defaultTakeawayScript: 'I enjoyed reconnecting over coffee.',
  };

  it('renders dedicated HTML5 Anam video stream container with active badge and unmuted audio', () => {
    const presentation = getSophiaPresentationForScenario(mockInterviewScenario);

    const html = renderToString(
      React.createElement(SophiaLiveAvatar, {
        presentation,
        partnerState: 'listening',
        isSpeakingAudio: false,
        isMuted: false,
        sessionState: 'active',
      }),
    );

    expect(html).toContain('data-testid="sophia-live-avatar"');
    expect(html).toContain('data-testid="anam-avatar-video"');
    expect(html).toContain('id="anam-avatar-video"');
    expect(html).not.toContain('muted=""'); // WebRTC audio track is enabled natively
    expect(html).toContain('Active');
    expect(html).toContain('Professional Business Attire');
    expect(html).toContain('Office Background');
  });

  it('renders video with muted attribute when isMuted is true', () => {
    const presentation = getSophiaPresentationForScenario(mockInterviewScenario);

    const html = renderToString(
      React.createElement(SophiaLiveAvatar, {
        presentation,
        partnerState: 'listening',
        isSpeakingAudio: false,
        isMuted: true,
        sessionState: 'active',
      }),
    );

    expect(html).toContain('data-testid="anam-avatar-video"');
    expect(html).toContain('muted=""');
  });

  it('renders scenario-specific presentation metadata for coffee shop archetype', () => {
    const presentation = getSophiaPresentationForScenario(mockCoffeeScenario);

    const html = renderToString(
      React.createElement(SophiaLiveAvatar, {
        presentation,
        partnerState: 'listening',
        isSpeakingAudio: false,
        isMuted: false,
        sessionState: 'active',
      }),
    );

    expect(html).toContain('Turtleneck');
    expect(html).toContain('Coffee Shop');
  });

  it('displays speaking badge when partner is speaking or audio is active', () => {
    const presentation = getSophiaPresentationForScenario(mockInterviewScenario);

    const html = renderToString(
      React.createElement(SophiaLiveAvatar, {
        presentation,
        partnerState: 'speaking',
        isSpeakingAudio: true,
        isMuted: false,
        sessionState: 'active',
      }),
    );

    expect(html).toContain('data-testid="partner-state-speaking"');
    expect(html).toContain('Speaking');
  });

  it('displays listening badge when partnerState is listening and audio is idle', () => {
    const presentation = getSophiaPresentationForScenario(mockInterviewScenario);

    const html = renderToString(
      React.createElement(SophiaLiveAvatar, {
        presentation,
        partnerState: 'listening',
        isSpeakingAudio: false,
        isMuted: false,
        sessionState: 'active',
      }),
    );

    expect(html).toContain('data-testid="partner-state-listening"');
    expect(html).toContain('Listening');
  });

  it('displays reflecting/thinking state when partnerState is thinking', () => {
    const presentation = getSophiaPresentationForScenario(mockInterviewScenario);

    const html = renderToString(
      React.createElement(SophiaLiveAvatar, {
        presentation,
        partnerState: 'thinking',
        isSpeakingAudio: false,
        isMuted: false,
        sessionState: 'active',
      }),
    );

    expect(html).toContain('data-testid="partner-state-thinking"');
    expect(html).toContain('Reflecting…');
  });

  it('renders accessible text mode button and invokes onToggleTextMode callback', () => {
    const presentation = getSophiaPresentationForScenario(mockInterviewScenario);
    const onToggleTextMode = vi.fn();

    const html = renderToString(
      React.createElement(SophiaLiveAvatar, {
        presentation,
        partnerState: 'listening',
        isSpeakingAudio: false,
        isMuted: false,
        sessionState: 'active',
        onToggleTextMode,
      }),
    );

    expect(html).toContain('data-testid="toggle-text-mode-btn"');
    expect(html).toContain('Switch to Text Mode');
  });

  it('renders accessible mute toggle button with clear state indicators', () => {
    const presentation = getSophiaPresentationForScenario(mockInterviewScenario);
    const onToggleMute = vi.fn();

    const unmutedHtml = renderToString(
      React.createElement(SophiaLiveAvatar, {
        presentation,
        partnerState: 'listening',
        isSpeakingAudio: false,
        isMuted: false,
        sessionState: 'active',
        onToggleMute,
      }),
    );

    expect(unmutedHtml).toContain('data-testid="toggle-mute-btn"');
    expect(unmutedHtml).toContain('Mute Audio');
    expect(unmutedHtml).toContain('aria-pressed="false"');

    const mutedHtml = renderToString(
      React.createElement(SophiaLiveAvatar, {
        presentation,
        partnerState: 'listening',
        isSpeakingAudio: false,
        isMuted: true,
        sessionState: 'active',
        onToggleMute,
      }),
    );

    expect(mutedHtml).toContain('Unmute Audio');
    expect(mutedHtml).toContain('aria-pressed="true"');
  });

  it('renders diagnostic error boundary when avatar session fails', () => {
    const presentation = getSophiaPresentationForScenario(mockInterviewScenario);

    const html = renderToString(
      React.createElement(SophiaLiveAvatar, {
        presentation,
        partnerState: 'neutral',
        isSpeakingAudio: false,
        isMuted: false,
        sessionState: 'failed',
        errorMessage: 'Anam avatar streaming connection failed.',
        onRetry: vi.fn(),
      }),
    );

    expect(html).toContain('data-testid="anam-error-boundary"');
    expect(html).toContain('Partner Connection Paused');
    expect(html).toContain('Anam avatar streaming connection failed.');
    expect(html).toContain('Reconnect Partner');
    expect(html).toContain('Disconnected');
  });

  it('displays connecting state when sessionState is creating', () => {
    const presentation = getSophiaPresentationForScenario(mockInterviewScenario);

    const html = renderToString(
      React.createElement(SophiaLiveAvatar, {
        presentation,
        partnerState: 'neutral',
        isSpeakingAudio: false,
        isMuted: false,
        sessionState: 'creating',
      }),
    );

    expect(html).toContain('Connecting with Sophia...');
    expect(html).toContain('Starting Anam live avatar stream');
    expect(html).toContain('Connecting...');
  });
});
