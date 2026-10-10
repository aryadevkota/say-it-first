import { describe, it, expect } from 'vitest';
import {
  ScaffoldingLevel,
  isValidScaffoldingLevel,
  shouldShowSubtext,
  shouldShowNonverbalBadges,
  getScaffoldingLabel,
} from '../../src/domain/value-objects/ScaffoldingLevel';

describe('ScaffoldingLevel', () => {
  it('defines correct levels per §2.1 FR-05', () => {
    expect(ScaffoldingLevel.LEVEL_0_REALITY).toBe(0);
    expect(ScaffoldingLevel.LEVEL_1_HINTS).toBe(50);
    expect(ScaffoldingLevel.LEVEL_2_XRAY).toBe(100);
  });

  it('validates scaffolding levels accurately', () => {
    expect(isValidScaffoldingLevel(0)).toBe(true);
    expect(isValidScaffoldingLevel(50)).toBe(true);
    expect(isValidScaffoldingLevel(100)).toBe(true);
    expect(isValidScaffoldingLevel(25)).toBe(false);
    expect(isValidScaffoldingLevel(-1)).toBe(false);
  });

  it('enforces UI visibility gates without leakage', () => {
    // Level 0: zero subtext, zero badges
    expect(shouldShowSubtext(ScaffoldingLevel.LEVEL_0_REALITY)).toBe(false);
    expect(shouldShowNonverbalBadges(ScaffoldingLevel.LEVEL_0_REALITY)).toBe(false);

    // Level 1: hints/badges visible, subtext hidden
    expect(shouldShowSubtext(ScaffoldingLevel.LEVEL_1_HINTS)).toBe(false);
    expect(shouldShowNonverbalBadges(ScaffoldingLevel.LEVEL_1_HINTS)).toBe(true);

    // Level 2: full x-ray (both visible)
    expect(shouldShowSubtext(ScaffoldingLevel.LEVEL_2_XRAY)).toBe(true);
    expect(shouldShowNonverbalBadges(ScaffoldingLevel.LEVEL_2_XRAY)).toBe(true);
  });

  it('returns human-readable labels', () => {
    expect(getScaffoldingLabel(ScaffoldingLevel.LEVEL_0_REALITY)).toBe('Reality Mode');
    expect(getScaffoldingLabel(ScaffoldingLevel.LEVEL_1_HINTS)).toBe('Cue Highlights');
    expect(getScaffoldingLabel(ScaffoldingLevel.LEVEL_2_XRAY)).toBe('Full X-Ray');
  });
});
