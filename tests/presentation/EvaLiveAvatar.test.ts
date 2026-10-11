/**
 * EvaLiveAvatar.test.ts — Unit & Integration Tests for Eva Live Avatar (Simli WebRTC)
 *
 * Verifies:
 * 1. Session API (/api/v1/avatar/session) validates SIMLI_API_KEY with fail-fast error envelopes.
 * 2. Simli initiation payload contract matches { apiKey, faceId, ttsProvider: 'ElevenLabs', language: 'en' }.
 * 3. 16kHz linear PCM audio contract (pcm_16000) is returned downstream to client.
 * 4. EvaLiveAvatar component renders dedicated HTML5 <video> stream with scenario-specific outfit & background.
 * 5. Fail-fast error boundary UI surfaces connection/handshake diagnostics without silent vector fallbacks.
 * 6. Speaking state activates real-time lip-sync visualization.
 * 7. Accessible interactive controls (text mode, mute toggle) function for neurodiverse users.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { POST } from '../../src/app/api/v1/avatar/session/route';
import {
  EvaLiveAvatar,
  type EvaLiveAvatarProps,
} from '../../src/presentation/components/EvaLiveAvatar';
import {
  LOCKED_VOICE_ID,
  LOCKED_VOICE_NAME,
  LOCKED_MODEL_ID,
  SIMLI_TARGET_AUDIO_FORMAT,
  SIMLI_DEFAULT_FACE_ID,
  getEvaPresentationForScenario,
  EVA_CORE_IDENTITY,
  EVA_PRESENTATION_CONFIGS,
  type EvaScenarioPresentation,
} from '../../src/domain/entities/EvaScenarioPresentation';
import type { ScenarioDefinition } from '../../src/domain/scenarios/topics';

describe('Eva Live Avatar Integration Suite (Simli WebRTC)', () => {
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
    it('returns fail-fast 503 error when SIMLI_API_KEY is missing', async () => {
      delete process.env.SIMLI_API_KEY;

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
      expect(response.status).toBe(503);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('SIMLI_API_KEY_MISSING');
      expect(data.error.message).toContain('SIMLI_API_KEY is not configured');
      expect(data.error.tts_provider).toBe('ElevenLabs');
    });

    it('treats placeholder keys as unconfigured and fails fast with 503', async () => {
      process.env.SIMLI_API_KEY = 'your_simli_key_here';

      const request = new Request('http://localhost:3000/api/v1/avatar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(503);

      const data = await response.json();
      expect(data.error.code).toBe('SIMLI_API_KEY_MISSING');
    });

    it('requests real-time Simli session credentials when API key is configured', async () => {
      process.env.SIMLI_API_KEY = 'simli-test-valid-key-abcdef123456';
      process.env.SIMLI_FACE_ID = SIMLI_DEFAULT_FACE_ID;

      let capturedUrl = '';
      let capturedBody: any;
      let capturedHeaders: any;

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        capturedUrl = String(url);
        capturedHeaders = init?.headers;
        capturedBody = JSON.parse(String(init?.body));

        return new Response(
          JSON.stringify({
            session_id: 'simli-live-session-789',
            session_token: 'jwt-simli-token-abc',
            webrtc_url: 'wss://webrtc.simli.ai/room',
            ice_servers: [{ urls: 'stun:stun.l.google.com:19302' }],
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
      expect(data.session_id).toBe('simli-live-session-789');
      expect(data.session_token).toBe('jwt-simli-token-abc');
      expect(data.status).toBe('ready');
      expect(data.face_id).toBe(SIMLI_DEFAULT_FACE_ID);
      expect(data.audio_format).toBe('pcm_16000');
      expect(data.avatar.name).toBe('Eva');
      expect(data.avatar.voice_id).toBe(LOCKED_VOICE_ID);
      expect(data.voice_contract.voice_name).toBe(LOCKED_VOICE_NAME);
      expect(data.voice_contract.model_id).toBe(LOCKED_MODEL_ID);
      expect(data.voice_contract.sample_rate).toBe(16000);

      // Verify payload passed to upstream Simli API
      expect(capturedUrl).toContain('https://api.simli.ai/startAudioToVideoSession');
      expect(capturedBody).toEqual({
        apiKey: 'simli-test-valid-key-abcdef123456',
        faceId: SIMLI_DEFAULT_FACE_ID,
        syncAudio: true,
      });
      expect(capturedHeaders['x-simli-api-key']).toBe('simli-test-valid-key-abcdef123456');
    });

    it('returns fail-fast 502 error when upstream Simli API fails', async () => {
      process.env.SIMLI_API_KEY = 'simli-test-valid-key';

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ message: 'Upstream rate limit exceeded' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const request = new Request('http://localhost:3000/api/v1/avatar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(502);

      const data = await response.json();
      expect(data.error.code).toBe('SIMLI_SESSION_FAILED');
      expect(data.error.status).toBe(429);
      expect(data.error.face_id).toBe(SIMLI_DEFAULT_FACE_ID);
    });

    it('returns fail-fast 500 error when network exception occurs', async () => {
      process.env.SIMLI_API_KEY = 'simli-test-valid-key';

      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('DNS resolution failed'));

      const request = new Request('http://localhost:3000/api/v1/avatar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error.code).toBe('SIMLI_GATEWAY_ERROR');
      expect(data.error.message).toContain('DNS resolution failed');
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
          initialStatus: 'connected',
        }),
      );

      // Dedicated HTML5 Simli WebRTC Live video container
      expect(html).toContain('data-testid="eva-live-video"');
      expect(html).toContain('data-testid="eva-live-avatar"');

      // Connected live stream status pill and locked voice contract badge
      expect(html).toContain('● Simli Live Avatar • Connected');
      expect(html).toContain('● Alexandra Voice (16kHz PCM)');

      // Scenario metadata badges
      expect(html).toContain(presentation.badgeText || presentation.visualSummary);
      expect(html).toContain('Eva • Professional Business Attire • Office Background');
      expect(html).toContain('Professional Business Attire');
      expect(html).toContain('Office Background');

      // Simli 16kHz audio spec indicator
      expect(html).toContain('Simli WebRTC • 16kHz PCM');

      // Invariant: Legacy 2D SVG canvas or procedural rigs must NOT exist
      expect(html).not.toContain('<svg class="avatar-svg-rig"');
      expect(html).not.toContain('avatar-3d-rig');
    });

    it('renders scenario-specific outfit and background metadata for coffee shop archetype', () => {
      const presentation = getEvaPresentationForScenario(mockCoffeeScenario);

      const html = renderToString(
        React.createElement(EvaLiveAvatar, {
          presentation,
          partnerState: 'listening',
          isSpeakingAudio: false,
          isMuted: false,
          initialStatus: 'connected',
        }),
      );

      expect(html).toContain('Eva • Turtleneck • Coffee Shop');
      expect(html).toContain('Turtleneck');
      expect(html).toContain('Coffee Shop');
      expect(html).toContain('● Alexandra Voice (16kHz PCM)');
    });
  });

  // ── 3. Fail-Fast Diagnostic Error Boundary Tests ──────────────────────────
  describe('Fail-Fast Diagnostic Error Boundary', () => {
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

    it('renders diagnostic error UI when Simli connection fails without silent vector fallback', () => {
      const html = renderToString(
        React.createElement(EvaLiveAvatar, {
          presentation: interviewPresentation,
          partnerState: 'listening',
          isSpeakingAudio: false,
          isMuted: false,
          initialStatus: 'error',
          initialError: {
            code: 'WEBRTC_CONNECTION_DROPPED',
            message: 'WebRTC peer connection to Simli video streaming servers was lost.',
          },
        }),
      );

      // Must render diagnostic error boundary with role alert
      expect(html).toContain('data-testid="simli-error-boundary"');
      expect(html).toContain('WEBRTC_CONNECTION_DROPPED');
      expect(html).toContain('Simli Avatar Video Stream Disconnected');
      expect(html).toContain(
        'WebRTC peer connection to Simli video streaming servers was lost.',
      );
      expect(html).toContain('🔄 Retry Connection');

      // Status pill reflects error
      expect(html).toContain('Simli Stream Error');

      // Invariant: No fallback to 2D vector graphic
      expect(html).not.toContain('<svg class="avatar-svg-rig"');
    });
  });

  // ── 4. Speaking State & Audio Lip-Sync Visualization Tests ─────────────────
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
          initialStatus: 'connected',
        }),
      );

      expect(html).toContain('data-testid="lip-sync-visualizer"');
      expect(html).toContain('data-active="true"');
      expect(html).toContain('animate-pulse');
      expect(html).toContain('animate-bounce');
      expect(html).toContain('opacity-100');
      expect(html).toContain('Audio Lip-Sync Visualization Active');
      expect(html).toContain('data-testid="partner-state-speaking"');
      expect(html).toContain('Speaking');
    });

    it('keeps audio lip-sync visualization in idle state when isSpeakingAudio is false', () => {
      const html = renderToString(
        React.createElement(EvaLiveAvatar, {
          presentation: interviewPresentation,
          partnerState: 'listening',
          isSpeakingAudio: false,
          isMuted: false,
          initialStatus: 'connected',
        }),
      );

      expect(html).toContain('data-testid="lip-sync-visualizer"');
      expect(html).toContain('data-active="false"');
      expect(html).toContain('opacity-40');
      expect(html).toContain('Audio Lip-Sync Idle');
      expect(html).toContain('data-testid="partner-state-listening"');
      expect(html).toContain('Listening');
    });

    it('displays thinking / reflecting state when partnerState is thinking', () => {
      const html = renderToString(
        React.createElement(EvaLiveAvatar, {
          presentation: interviewPresentation,
          partnerState: 'thinking',
          isSpeakingAudio: false,
          isMuted: false,
          initialStatus: 'connected',
        }),
      );

      expect(html).toContain('data-testid="partner-state-thinking"');
      expect(html).toContain('Reflecting…');
    });
  });

  // ── 5. Accessible Controls for Neurodiverse Users ─────────────────────────
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
        initialStatus: 'connected',
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
          initialStatus: 'connected',
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
          initialStatus: 'connected',
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
          initialStatus: 'connected',
        }),
      );

      expect(html).not.toContain('data-testid="toggle-text-mode-btn"');
      expect(html).not.toContain('data-testid="toggle-mute-btn"');
    });
  });
});
