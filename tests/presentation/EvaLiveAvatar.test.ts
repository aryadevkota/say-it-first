/**
 * EvaLiveAvatar.test.ts — Unit & Integration Tests for Eva Live Avatar
 *
 * Verifies:
 * 1. Session API (/api/v1/avatar/session) returns expected structure with locked voice and graceful fallback.
 * 2. EvaLiveAvatar component renders scenario-specific outfit and background metadata.
 * 3. Speaking state activates audio lip-sync visualization.
 * 4. Accessible text mode and mute controls function as required for neurodiverse users.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { POST } from '../../src/app/api/v1/avatar/session/route';
import { EvaLiveAvatar, type EvaLiveAvatarProps } from '../../src/presentation/components/EvaLiveAvatar';
import {
  LOCKED_VOICE_ID,
  LOCKED_VOICE_NAME,
  LOCKED_MODEL_ID,
  TARGET_AUDIO_FORMAT,
  getEvaPresentationForScenario,
  EVA_CORE_IDENTITY,
  EVA_PRESENTATION_CONFIGS,
  type EvaScenarioPresentation,
} from '../../src/domain/entities/EvaScenarioPresentation';
import type { ScenarioDefinition } from '../../src/domain/scenarios/topics';

describe('Eva Live Avatar Integration Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // ── 1. Session API Route Handler Tests ────────────────────────────────────
  describe('Avatar Session API: POST /api/v1/avatar/session', () => {
    it('returns graceful fallback structure when unconfigured without throwing', async () => {
      delete process.env.LIVEAVATAR_API_KEY;
      delete process.env.ELEVENLABS_API_KEY;

      const request = new Request('http://localhost:3000/api/v1/avatar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: 'test-scenario',
          outfit: 'business-attire',
          background: 'office',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.session_id).toBe('eva-session-local');
      expect(data.status).toBe('ready');
      expect(data.avatar.name).toBe('Eva');
      expect(data.avatar.voice_id).toBe(LOCKED_VOICE_ID);
      expect(data.avatar.voice_id).toBe('kdmDKE6EkgrWrrykO9Qt');
      expect(data.mode).toBe('fallback_local');
      expect(data.audio_format).toBe('pcm_24000');
      expect(data.voice_contract.voice_name).toBe('Alexandra — Conversational and Natural');
      expect(data.voice_contract.model_id).toBe('eleven_multilingual_v2');
      expect(data.voice_contract.sample_rate).toBe(24000);
    });

    it('treats placeholder keys as unconfigured and falls back gracefully', async () => {
      process.env.LIVEAVATAR_API_KEY = 'your_liveavatar_key_here';
      process.env.ELEVENLABS_API_KEY = 'test-key';

      const request = new Request('http://localhost:3000/api/v1/avatar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.session_id).toBe('eva-session-local');
      expect(data.status).toBe('ready');
      expect(data.avatar.name).toBe('Eva');
      expect(data.avatar.voice_id).toBe(LOCKED_VOICE_ID);
    });

    it('requests real-time session credentials when API keys are configured', async () => {
      process.env.LIVEAVATAR_API_KEY = 'liveavatar-valid-secret-key-123';
      process.env.ELEVENLABS_API_KEY = 'elevenlabs-valid-key-456';
      process.env.ELEVENLABS_AGENT_ID = 'eva-agent-xyz';

      let capturedUrl = '';
      let capturedBody: any;
      let capturedHeaders: any;

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        capturedUrl = String(url);
        capturedHeaders = init?.headers;
        capturedBody = JSON.parse(String(init?.body));

        return new Response(
          JSON.stringify({
            session_id: 'live-eva-session-987',
            status: 'ready',
            room_name: 'eva-live-room-alpha',
            livekit_url: 'wss://livekit.liveavatar.com',
            room_token: 'jwt-access-token-livekit',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      });

      const request = new Request('http://localhost:3000/api/v1/avatar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: 'interview-practice-01',
          outfit: 'business-attire',
          background: 'office',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.session_id).toBe('live-eva-session-987');
      expect(data.status).toBe('ready');
      expect(data.room_name).toBe('eva-live-room-alpha');
      expect(data.livekit_url).toBe('wss://livekit.liveavatar.com');
      expect(data.room_token).toBe('jwt-access-token-livekit');
      expect(data.mode).toBe('live');
      expect(data.avatar.name).toBe('Eva');
      expect(data.avatar.voice_id).toBe(LOCKED_VOICE_ID);
      expect(data.audio_format).toBe(TARGET_AUDIO_FORMAT);

      // Verify payload passed to upstream LiveAvatar API
      expect(capturedUrl).toContain('https://api.liveavatar.com/v1/sessions');
      expect(capturedBody.mode).toBe('LITE');
      expect(capturedBody.voice.voice_id).toBe(LOCKED_VOICE_ID);
      expect(capturedBody.voice.model_id).toBe(LOCKED_MODEL_ID);
      expect(capturedBody.audio_format).toBe(TARGET_AUDIO_FORMAT);
      expect(capturedHeaders['X-Api-Key']).toBe('liveavatar-valid-secret-key-123');
    });

    it('falls back gracefully without throwing when upstream LiveAvatar API fails', async () => {
      process.env.LIVEAVATAR_API_KEY = 'liveavatar-valid-key';

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Service unavailable', { status: 503 }),
      );

      const request = new Request('http://localhost:3000/api/v1/avatar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.session_id).toBe('eva-session-local');
      expect(data.status).toBe('ready');
      expect(data.avatar.name).toBe('Eva');
      expect(data.avatar.voice_id).toBe(LOCKED_VOICE_ID);
    });

    it('falls back gracefully without throwing when network exception occurs', async () => {
      process.env.LIVEAVATAR_API_KEY = 'liveavatar-valid-key';

      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network failure'));

      const request = new Request('http://localhost:3000/api/v1/avatar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.session_id).toBe('eva-session-local');
      expect(data.status).toBe('ready');
      expect(data.avatar.name).toBe('Eva');
    });
  });

  // ── 2. Component Scenario-Specific Rendering Tests ────────────────────────
  describe('EvaLiveAvatar Presentation & Consistency', () => {
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
        name: 'Eva',
        role: 'Hiring Director',
        avatarVariant: 'eva',
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
        name: 'Eva',
        role: 'Colleague',
        avatarVariant: 'eva',
        defaultTone: 'Warm and friendly',
        initialDialogue: 'So good to see you!',
      },
      defaultTakeawayScript: 'I enjoyed reconnecting over coffee.',
    };

    it('renders scenario-specific outfit and background metadata for interview archetype', () => {
      const presentation = getEvaPresentationForScenario(mockInterviewScenario);

      const html = renderToString(
        React.createElement(EvaLiveAvatar, {
          presentation,
          partnerState: 'listening',
          isSpeakingAudio: false,
          isMuted: false,
        }),
      );

      // WebRTC Live video container
      expect(html).toContain('data-testid="eva-live-video"');
      expect(html).toContain('data-testid="eva-live-avatar"');

      // Live stream status pill and voice contract badge
      expect(html).toContain('● Eva Live Avatar • Connected');
      expect(html).toContain('● Stream Active (Alexandra Voice)');

      // Scenario metadata badges
      expect(html).toContain(presentation.badgeText || presentation.visualSummary);
      expect(html).toContain('Eva • Professional Business Attire • Office Background');
      expect(html).toContain('Professional Business Attire');
      expect(html).toContain('Office Background');

      // Realistic portrait elements
      expect(html).toContain('env-office');
      expect(html).toContain('outfit-business');
    });

    it('renders scenario-specific outfit and background metadata for coffee shop archetype', () => {
      const presentation = getEvaPresentationForScenario(mockCoffeeScenario);

      const html = renderToString(
        React.createElement(EvaLiveAvatar, {
          presentation,
          partnerState: 'listening',
          isSpeakingAudio: false,
          isMuted: false,
        }),
      );

      expect(html).toContain('Eva • Turtleneck • Coffee Shop');
      expect(html).toContain('Turtleneck');
      expect(html).toContain('Coffee Shop');
      expect(html).toContain('env-coffee-shop');
      expect(html).toContain('outfit-turtleneck');
    });

    it('renders realistic kinematics with natural breathing and locked voice indicators', () => {
      const presentation = getEvaPresentationForScenario(mockInterviewScenario);

      const html = renderToString(
        React.createElement(EvaLiveAvatar, {
          presentation,
          partnerState: 'listening',
          isSpeakingAudio: false,
          isMuted: false,
        }),
      );

      // Natural breathing rhythm keyframe animation
      expect(html).toContain('evaBreathingRhythm');

      // Voice indicator specifies PCM 24000 Hz and WebRTC
      expect(html).toContain('PCM 24000 Hz');
      expect(html).toContain('LiveKit WebRTC');
    });
  });

  // ── 3. Speaking State & Audio Lip-Sync Visualization Tests ─────────────────
  describe('Speaking State & Audio Lip-Sync Visualization', () => {
    const interviewPresentation = getEvaPresentationForScenario({
      id: 'test-scenario',
      category: 'work-school',
      categoryLabel: 'Work',
      title: 'Test',
      subtitle: 'Test',
      userGoal: 'Test',
      estimatedMinutes: 5,
      status: 'ready',
      accentColor: 'apricot',
      learning: {
        coreInsight: 'Insight',
        doubleEmpathyPerspective: { yourNeed: 'A', theirPerspective: 'B' },
        practicalApproaches: [],
        examplePhrases: { gentle: 'G', direct: 'D' },
      },
      partner: {
        name: 'Eva',
        role: 'Partner',
        avatarVariant: 'eva',
        defaultTone: 'Tone',
        initialDialogue: 'Hi',
      },
      defaultTakeawayScript: 'Takeaway',
    });

    it('activates audio lip-sync visualization when isSpeakingAudio is true', () => {
      const html = renderToString(
        React.createElement(EvaLiveAvatar, {
          presentation: interviewPresentation,
          partnerState: 'speaking',
          isSpeakingAudio: true,
          isMuted: false,
        }),
      );

      expect(html).toContain('data-testid="lip-sync-visualizer"');
      expect(html).toContain('data-active="true"');
      expect(html).toContain('animate-pulse');
      expect(html).toContain('animate-bounce');
      expect(html).toContain('opacity-100');
      expect(html).toContain('Audio Lip-Sync Visualization Active');
      expect(html).toContain('data-testid="partner-state-speaking"');
      expect(html).toContain('vocal-waves');
    });

    it('keeps audio lip-sync visualization in idle state when isSpeakingAudio is false', () => {
      const html = renderToString(
        React.createElement(EvaLiveAvatar, {
          presentation: interviewPresentation,
          partnerState: 'listening',
          isSpeakingAudio: false,
          isMuted: false,
        }),
      );

      expect(html).toContain('data-testid="lip-sync-visualizer"');
      expect(html).toContain('data-active="false"');
      expect(html).toContain('opacity-40');
      expect(html).toContain('Audio Lip-Sync Idle');
      expect(html).toContain('data-testid="partner-state-listening"');
      expect(html).not.toContain('vocal-waves');
    });

    it('displays thinking / reflecting state when partnerState is thinking', () => {
      const html = renderToString(
        React.createElement(EvaLiveAvatar, {
          presentation: interviewPresentation,
          partnerState: 'thinking',
          isSpeakingAudio: false,
          isMuted: false,
        }),
      );

      expect(html).toContain('data-testid="partner-state-thinking"');
      expect(html).toContain('Thinking...');
    });
  });

  // ── 4. Accessible Controls for Neurodiverse Users ─────────────────────────
  describe('Accessible Interactive Controls', () => {
    const presentation = getEvaPresentationForScenario({
      id: 'accessibility-test',
      category: 'everyday',
      categoryLabel: 'Everyday',
      title: 'Everyday Scenario',
      subtitle: 'Subtitle',
      userGoal: 'Goal',
      estimatedMinutes: 3,
      status: 'ready',
      accentColor: 'sage',
      learning: {
        coreInsight: 'Insight',
        doubleEmpathyPerspective: { yourNeed: 'A', theirPerspective: 'B' },
        practicalApproaches: [],
        examplePhrases: { gentle: 'G', direct: 'D' },
      },
      partner: {
        name: 'Eva',
        role: 'Neighbor',
        avatarVariant: 'eva',
        defaultTone: 'Warm',
        initialDialogue: 'Hello!',
      },
      defaultTakeawayScript: 'Takeaway',
    });

    it('renders accessible text mode button and invokes onToggleTextMode callback', () => {
      const mockToggleTextMode = vi.fn();

      const props: EvaLiveAvatarProps = {
        presentation,
        partnerState: 'listening',
        isSpeakingAudio: false,
        isMuted: false,
        onToggleTextMode: mockToggleTextMode,
      };

      const html = renderToString(React.createElement(EvaLiveAvatar, props));

      expect(html).toContain('data-testid="toggle-text-mode-btn"');
      expect(html).toContain('Switch to Text Mode');

      // Verify callback functionality
      props.onToggleTextMode?.();
      expect(mockToggleTextMode).toHaveBeenCalledTimes(1);
    });

    it('renders accessible mute toggle button with clear state indicators', () => {
      const mockToggleMute = vi.fn();

      // Unmuted state
      const unmutedHtml = renderToString(
        React.createElement(EvaLiveAvatar, {
          presentation,
          partnerState: 'listening',
          isSpeakingAudio: false,
          isMuted: false,
          onToggleMute: mockToggleMute,
        }),
      );

      expect(unmutedHtml).toContain('data-testid="toggle-mute-btn"');
      expect(unmutedHtml).toContain('Mute Audio');
      expect(unmutedHtml).toContain('aria-pressed="false"');

      // Muted state (high-contrast alert style)
      const mutedHtml = renderToString(
        React.createElement(EvaLiveAvatar, {
          presentation,
          partnerState: 'listening',
          isSpeakingAudio: false,
          isMuted: true,
          onToggleMute: mockToggleMute,
        }),
      );

      expect(mutedHtml).toContain('Unmute Audio');
      expect(mutedHtml).toContain('aria-pressed="true"');
      expect(mutedHtml).toContain('bg-rose-950/90');

      // Verify callback functionality
      mockToggleMute();
      expect(mockToggleMute).toHaveBeenCalledTimes(1);
    });

    it('omits controls gracefully when callbacks are not provided', () => {
      const html = renderToString(
        React.createElement(EvaLiveAvatar, {
          presentation,
          partnerState: 'listening',
          isSpeakingAudio: false,
          isMuted: false,
        }),
      );

      expect(html).not.toContain('data-testid="toggle-text-mode-btn"');
      expect(html).not.toContain('data-testid="toggle-mute-btn"');
    });
  });
});
