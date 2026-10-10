import { describe, it, expect } from 'vitest';
import {
  DEFAULT_USER_AVATAR,
  PARTNER_AVATAR_PRESETS,
  SKIN_TONE_PALETTE,
  HAIR_COLOR_PALETTE,
  CLOTHING_COLOR_PALETTE,
  type AvatarCustomization,
} from '../../src/domain/entities/AvatarCustomization';
import { isUiSoundEnabled, setUiSoundEnabled } from '../../src/presentation/utils/cozyAudio';

describe('AvatarCustomization Entity & Palettes', () => {
  it('provides sensible default user avatar attributes', () => {
    expect(DEFAULT_USER_AVATAR.version).toBe(1);
    expect(DEFAULT_USER_AVATAR.skinTone).toBe('fair');
    expect(DEFAULT_USER_AVATAR.hairStyle).toBe('textured-crop');
    expect(DEFAULT_USER_AVATAR.clothingStyle).toBe('cardigan');
    expect(DEFAULT_USER_AVATAR.eyewear).toBe('none');
  });

  it('defines palettes with valid hex colors and accessible labels', () => {
    expect(SKIN_TONE_PALETTE['warm-tan'].hex).toBeGreaterThan(0);
    expect(SKIN_TONE_PALETTE['warm-tan'].label).toBe('Warm Tan');

    expect(HAIR_COLOR_PALETTE['espresso'].label).toBe('Espresso Brown');
    expect(CLOTHING_COLOR_PALETTE['teal'].hex).toBe(0x1c6e72);
  });

  it('contains pre-configured partner presets for Alex, Maya, Jordan, and Sam', () => {
    expect(PARTNER_AVATAR_PRESETS.alex).toBeDefined();
    expect(PARTNER_AVATAR_PRESETS.maya).toBeDefined();
    expect(PARTNER_AVATAR_PRESETS.jordan).toBeDefined();
    expect(PARTNER_AVATAR_PRESETS.sam).toBeDefined();
  });
});

describe('cozyAudio Utility', () => {
  it('toggles and persists sound preference state', () => {
    setUiSoundEnabled(true);
    expect(isUiSoundEnabled()).toBe(true);

    setUiSoundEnabled(false);
    expect(isUiSoundEnabled()).toBe(false);

    setUiSoundEnabled(true);
    expect(isUiSoundEnabled()).toBe(true);
  });
});

describe('POST /api/v1/voice/synthesize Route Handler', () => {
  it('returns 400 for empty or invalid input payload', async () => {
    const { POST } = await import('../../src/app/api/v1/voice/synthesize/route');
    const req = new Request('http://localhost/api/v1/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_REQUEST');
  });

  it('returns structured 503 when ELEVENLABS_API_KEY is unconfigured', async () => {
    const originalKey = process.env.ELEVENLABS_API_KEY;
    delete process.env.ELEVENLABS_API_KEY;

    try {
      const { POST } = await import('../../src/app/api/v1/voice/synthesize/route');
      const req = new Request('http://localhost/api/v1/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello, I am testing voice synthesis.' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error.code).toBe('ELEVENLABS_NOT_CONFIGURED');
      expect(json.error.target_voice).toContain('Alexandra');
    } finally {
      if (originalKey) {
        process.env.ELEVENLABS_API_KEY = originalKey;
      }
    }
  });
});

