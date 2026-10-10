/**
 * ScaffoldingLevel.ts — Domain Value Object
 *
 * Represents the cognitive support tiers for the Tactile X-Ray
 * Scaffolding Dial (FR-05).
 *
 * Specification: say_it_first_system_architecture_manual.md §2.1 FR-05
 *   - Level 0 (Reality):  Text hidden, zero subtext leakage
 *   - Level 1 (Hints):    Nonverbal badges visible
 *   - Level 2 (X-Ray):    Full subtext, Two-Way Bridge, thought bubble
 *
 * ZERO external dependencies. Pure domain logic only.
 */

// ── Scaffolding Level Constants ──────────────────────────────────────────────

export const ScaffoldingLevel = {
  /** 0% — Reality Mode: No subtext visible. Pure roleplay. */
  LEVEL_0_REALITY: 0,
  /** 50% — Cue Highlights: Nonverbal badges and posture cues shown. */
  LEVEL_1_HINTS: 50,
  /** 100% — Full X-Ray: Complete subtext, Two-Way Bridge, thought bubble. */
  LEVEL_2_XRAY: 100,
} as const;

export type ScaffoldingLevel =
  (typeof ScaffoldingLevel)[keyof typeof ScaffoldingLevel];

// ── Valid Levels Set ─────────────────────────────────────────────────────────

const VALID_LEVELS: ReadonlySet<number> = new Set([
  ScaffoldingLevel.LEVEL_0_REALITY,
  ScaffoldingLevel.LEVEL_1_HINTS,
  ScaffoldingLevel.LEVEL_2_XRAY,
]);

// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Returns true iff the given value is a valid ScaffoldingLevel (0, 50, or 100).
 */
export function isValidScaffoldingLevel(level: number): level is ScaffoldingLevel {
  return VALID_LEVELS.has(level);
}

// ── UI Visibility Guards ─────────────────────────────────────────────────────

/**
 * Returns true when subtext elements (Two-Way Bridge, Thought Bubble)
 * should be rendered. Only at LEVEL_2_XRAY.
 */
export function shouldShowSubtext(level: ScaffoldingLevel): boolean {
  return level === ScaffoldingLevel.LEVEL_2_XRAY;
}

/**
 * Returns true when nonverbal cue badges (posture pills, micro-expression
 * indicators) should be rendered. At LEVEL_1_HINTS and above.
 */
export function shouldShowNonverbalBadges(level: ScaffoldingLevel): boolean {
  return level >= ScaffoldingLevel.LEVEL_1_HINTS;
}

/**
 * Returns the display label for a scaffolding level.
 */
export function getScaffoldingLabel(level: ScaffoldingLevel): string {
  switch (level) {
    case ScaffoldingLevel.LEVEL_0_REALITY:
      return 'Reality Mode';
    case ScaffoldingLevel.LEVEL_1_HINTS:
      return 'Cue Highlights';
    case ScaffoldingLevel.LEVEL_2_XRAY:
      return 'Full X-Ray';
  }
}
