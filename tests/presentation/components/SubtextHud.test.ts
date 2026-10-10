import { describe, it, expect } from 'vitest';
import {
  ScaffoldingLevel,
  shouldShowSubtext,
  shouldShowNonverbalBadges,
} from '../../../src/domain/value-objects/ScaffoldingLevel';

describe('SubtextHud visibility gates (FR-05 zero leakage invariant)', () => {
  it('guarantees zero subtext and zero nonverbal badges at Level 0 (Reality Mode)', () => {
    const level = ScaffoldingLevel.LEVEL_0_REALITY;
    expect(shouldShowSubtext(level)).toBe(false);
    expect(shouldShowNonverbalBadges(level)).toBe(false);
  });

  it('permits nonverbal badges but suppresses full subtext at Level 1 (Hints Mode)', () => {
    const level = ScaffoldingLevel.LEVEL_1_HINTS;
    expect(shouldShowSubtext(level)).toBe(false);
    expect(shouldShowNonverbalBadges(level)).toBe(true);
  });

  it('permits full subtext and nonverbal badges at Level 2 (100% X-Ray Mode)', () => {
    const level = ScaffoldingLevel.LEVEL_2_XRAY;
    expect(shouldShowSubtext(level)).toBe(true);
    expect(shouldShowNonverbalBadges(level)).toBe(true);
  });
});
